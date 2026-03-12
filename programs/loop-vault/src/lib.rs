use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7");

// Constants
pub const EXTRACTION_FEE_BPS: u16 = 500; // 5%

/// Loop Vault Program
/// 
/// User-owned value storage with stacking (yield) capabilities.
/// Any agent can integrate via SDK to capture value into user vaults.

#[program]
pub mod loop_vault {
    use super::*;

    /// Initialize a new vault for a user
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        bump: u8,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.owner.key();
        vault.cred_balance = 0;
        vault.stacked_balance = 0;
        vault.pending_yield = 0;
        vault.oxo_balance = 0;
        vault.created_at = Clock::get()?.unix_timestamp;
        vault.last_yield_claim = Clock::get()?.unix_timestamp;
        vault.bump = bump;
        vault.total_captured = 0;
        vault.total_withdrawn = 0;
        
        emit!(VaultCreated {
            owner: vault.owner,
            created_at: vault.created_at,
        });
        
        Ok(())
    }

    /// Deposit Cred (wrapped USDC) into vault
    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, LoopError::InvalidAmount);
        
        // Transfer Cred tokens to vault's token account
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_cred_account.to_account_info(),
            to: ctx.accounts.vault_cred_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        // Update vault balance
        let vault = &mut ctx.accounts.vault;
        vault.cred_balance = vault.cred_balance.checked_add(amount)
            .ok_or(LoopError::Overflow)?;
        vault.total_captured = vault.total_captured.checked_add(amount)
            .ok_or(LoopError::Overflow)?;
        
        emit!(Deposited {
            vault: vault.key(),
            amount,
            new_balance: vault.cred_balance,
        });
        
        Ok(())
    }

    /// Capture value from an agent (called by authorized capture modules)
    pub fn capture(
        ctx: Context<Capture>,
        amount: u64,
        capture_type: CaptureType,
        source: String,
    ) -> Result<()> {
        require!(amount > 0, LoopError::InvalidAmount);
        require!(source.len() <= 64, LoopError::SourceTooLong);
        
        let vault = &mut ctx.accounts.vault;
        
        // Mint Cred to vault (capture modules are authorized minters)
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.cred_mint.to_account_info(),
            to: ctx.accounts.vault_cred_account.to_account_info(),
            authority: ctx.accounts.capture_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        
        // Use PDA seeds for authority
        let seeds = &[
            b"capture_authority".as_ref(),
            &[ctx.accounts.capture_config.bump],
        ];
        let signer = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::mint_to(cpi_ctx, amount)?;
        
        // Update vault
        vault.cred_balance = vault.cred_balance.checked_add(amount)
            .ok_or(LoopError::Overflow)?;
        vault.total_captured = vault.total_captured.checked_add(amount)
            .ok_or(LoopError::Overflow)?;
        
        emit!(ValueCaptured {
            vault: vault.key(),
            amount,
            capture_type,
            source,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Stack Cred for yield (lock for duration)
    pub fn stack(
        ctx: Context<Stack>,
        amount: u64,
        duration_days: u16,
    ) -> Result<()> {
        require!(amount > 0, LoopError::InvalidAmount);
        require!(duration_days >= 7 && duration_days <= 365, LoopError::InvalidDuration);
        
        let vault = &mut ctx.accounts.vault;
        require!(vault.cred_balance >= amount, LoopError::InsufficientBalance);
        
        // Calculate APY based on duration
        let apy_basis_points = calculate_apy(duration_days);
        
        // Create stack record
        let stack = &mut ctx.accounts.stack;
        stack.vault = vault.key();
        stack.amount = amount;
        stack.start_time = Clock::get()?.unix_timestamp;
        stack.end_time = stack.start_time + (duration_days as i64 * 86400);
        stack.apy_basis_points = apy_basis_points;
        stack.claimed_yield = 0;
        stack.is_active = true;
        stack.bump = ctx.bumps.stack;
        
        // Move from liquid to stacked
        vault.cred_balance = vault.cred_balance.checked_sub(amount)
            .ok_or(LoopError::Underflow)?;
        vault.stacked_balance = vault.stacked_balance.checked_add(amount)
            .ok_or(LoopError::Overflow)?;
        
        emit!(Stacked {
            vault: vault.key(),
            stack: stack.key(),
            amount,
            duration_days,
            apy_basis_points,
            end_time: stack.end_time,
        });
        
        Ok(())
    }

    /// Unstack (withdraw locked Cred, with penalty if early)
    pub fn unstack(
        ctx: Context<Unstack>,
    ) -> Result<()> {
        let stack = &mut ctx.accounts.stack;
        let vault = &mut ctx.accounts.vault;
        
        require!(stack.is_active, LoopError::StackNotActive);
        
        let now = Clock::get()?.unix_timestamp;
        let is_early = now < stack.end_time;
        
        // Calculate yield earned
        let elapsed_seconds = (now - stack.start_time) as u64;
        let total_seconds = (stack.end_time - stack.start_time) as u64;
        let full_yield = calculate_yield(stack.amount, stack.apy_basis_points, total_seconds);
        
        let (payout, penalty) = if is_early {
            // Early withdrawal: proportional yield minus 20% penalty
            let earned = (full_yield * elapsed_seconds) / total_seconds;
            let penalty_amount = earned / 5; // 20% penalty
            (stack.amount + earned - penalty_amount, penalty_amount)
        } else {
            // Full maturity: full yield
            (stack.amount + full_yield, 0)
        };
        
        // Update vault
        vault.stacked_balance = vault.stacked_balance.checked_sub(stack.amount)
            .ok_or(LoopError::Underflow)?;
        vault.cred_balance = vault.cred_balance.checked_add(payout)
            .ok_or(LoopError::Overflow)?;
        
        // Mark stack as inactive
        stack.is_active = false;
        stack.claimed_yield = payout - stack.amount;
        
        emit!(Unstacked {
            vault: vault.key(),
            stack: stack.key(),
            principal: stack.amount,
            yield_earned: stack.claimed_yield,
            penalty,
            early_withdrawal: is_early,
        });
        
        Ok(())
    }

    /// Withdraw Cred to external address
    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, LoopError::InvalidAmount);
        
        // Read values before mutable borrow
        let cred_balance = ctx.accounts.vault.cred_balance;
        let owner_key = ctx.accounts.vault.owner;
        let vault_bump = ctx.accounts.vault.bump;
        
        require!(cred_balance >= amount, LoopError::InsufficientBalance);
        
        // Transfer Cred from vault to user
        let seeds = &[
            b"vault".as_ref(),
            owner_key.as_ref(),
            &[vault_bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_cred_account.to_account_info(),
            to: ctx.accounts.user_cred_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, amount)?;
        
        // Now mutable update
        let vault = &mut ctx.accounts.vault;
        vault.cred_balance = vault.cred_balance.checked_sub(amount)
            .ok_or(LoopError::Underflow)?;
        vault.total_withdrawn = vault.total_withdrawn.checked_add(amount)
            .ok_or(LoopError::Overflow)?;
        
        emit!(Withdrawn {
            vault: vault.key(),
            amount,
            destination: ctx.accounts.user_cred_account.key(),
        });
        
        Ok(())
    }

    /// Set agent permissions for this vault
    pub fn set_agent_permission(
        ctx: Context<SetAgentPermission>,
        agent: Pubkey,
        permission_level: PermissionLevel,
        daily_limit: u64,
    ) -> Result<()> {
        let permission = &mut ctx.accounts.agent_permission;
        permission.vault = ctx.accounts.vault.key();
        permission.agent = agent;
        permission.level = permission_level;
        permission.daily_limit = daily_limit;
        permission.daily_used = 0;
        permission.last_reset = Clock::get()?.unix_timestamp;
        permission.bump = ctx.bumps.agent_permission;
        
        emit!(AgentPermissionSet {
            vault: permission.vault,
            agent,
            level: permission_level,
            daily_limit,
        });
        
        Ok(())
    }

    /// Claim yield from stacking position without unstacking
    pub fn claim_yield(
        ctx: Context<ClaimYield>,
    ) -> Result<()> {
        let stack = &ctx.accounts.stack;
        let now = Clock::get()?.unix_timestamp;
        
        require!(stack.is_active, LoopError::StackInactive);
        
        // Calculate yield since last claim
        let seconds_since_claim = (now - stack.start_time.max(ctx.accounts.vault.last_yield_claim)) as u64;
        let yield_amount = calculate_yield(stack.amount, stack.apy_basis_points, seconds_since_claim);
        
        require!(yield_amount > 0, LoopError::NoYieldToClaim);
        
        // Update vault
        let vault = &mut ctx.accounts.vault;
        vault.cred_balance = vault.cred_balance.checked_add(yield_amount)
            .ok_or(LoopError::Overflow)?;
        vault.pending_yield = vault.pending_yield.saturating_sub(yield_amount);
        vault.last_yield_claim = now;
        
        // Update stack
        let stack = &mut ctx.accounts.stack;
        stack.claimed_yield = stack.claimed_yield.checked_add(yield_amount)
            .ok_or(LoopError::Overflow)?;
        
        emit!(YieldClaimed {
            vault: vault.key(),
            stack: stack.key(),
            amount: yield_amount,
            timestamp: now,
        });
        
        Ok(())
    }

    /// Extract Cred to external value (exit from Loop)
    /// 5% fee, resets vault Cred balance to zero, liquidates all stacking positions
    pub fn extract(
        ctx: Context<Extract>,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        
        // Calculate total extractable (liquid + stacked principal)
        let liquid_balance = vault.cred_balance;
        let stacked_balance = vault.stacked_balance;
        let total = liquid_balance.checked_add(stacked_balance).ok_or(LoopError::Overflow)?;
        
        require!(total > 0, LoopError::NothingToExtract);
        
        // Calculate 5% fee
        let fee = total.checked_mul(EXTRACTION_FEE_BPS as u64).ok_or(LoopError::Overflow)?
            .checked_div(10000).ok_or(LoopError::DivisionByZero)?;
        let amount_after_fee = total.checked_sub(fee).ok_or(LoopError::Underflow)?;
        
        // Read values for PDA signing
        let owner_key = vault.owner;
        let vault_bump = vault.bump;
        
        // Transfer to user (amount - fee)
        let seeds = &[
            b"vault".as_ref(),
            owner_key.as_ref(),
            &[vault_bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_cred_account.to_account_info(),
            to: ctx.accounts.user_cred_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, amount_after_fee)?;
        
        // Transfer fee to protocol
        if fee > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault_cred_account.to_account_info(),
                to: ctx.accounts.fee_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            };
            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
                signer,
            );
            token::transfer(cpi_ctx, fee)?;
        }
        
        // Reset vault balances to zero
        let vault = &mut ctx.accounts.vault;
        vault.cred_balance = 0;
        vault.stacked_balance = 0;
        vault.pending_yield = 0;
        vault.total_withdrawn = vault.total_withdrawn.checked_add(amount_after_fee)
            .ok_or(LoopError::Overflow)?;
        
        emit!(Extracted {
            vault: vault.key(),
            total_amount: total,
            fee,
            amount_received: amount_after_fee,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Close vault (after extraction, when empty)
    pub fn close_vault(
        ctx: Context<CloseVault>,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        
        // Verify vault is empty
        require!(vault.cred_balance == 0, LoopError::VaultNotEmpty);
        require!(vault.stacked_balance == 0, LoopError::VaultNotEmpty);
        require!(vault.oxo_balance == 0, LoopError::VaultNotEmpty);
        
        emit!(VaultClosed {
            vault: vault.key(),
            owner: vault.owner,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        // Account will be closed and rent returned via close constraint
        Ok(())
    }

    /// Set heir for inheritance
    pub fn set_heir(
        ctx: Context<SetHeir>,
        heir: Pubkey,
        inactivity_threshold_days: u16,
    ) -> Result<()> {
        require!(inactivity_threshold_days >= 30, LoopError::ThresholdTooShort);
        
        let inheritance = &mut ctx.accounts.inheritance_config;
        inheritance.vault = ctx.accounts.vault.key();
        inheritance.heir = heir;
        inheritance.inactivity_threshold = (inactivity_threshold_days as i64) * 86400;
        inheritance.last_activity = Clock::get()?.unix_timestamp;
        inheritance.triggered = false;
        inheritance.bump = ctx.bumps.inheritance_config;
        
        emit!(HeirDesignated {
            vault: inheritance.vault,
            heir,
            inactivity_threshold_days,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn calculate_apy(duration_days: u16) -> u16 {
    // APY in basis points (1% = 100 bps)
    match duration_days {
        7..=13 => 500,    // 5% APY
        14..=29 => 700,   // 7% APY
        30..=89 => 1000,  // 10% APY
        90..=179 => 1500, // 15% APY
        180..=364 => 1800, // 18% APY
        365 => 2000,      // 20% APY
        _ => 200,         // 2% base
    }
}

fn calculate_yield(principal: u64, apy_bps: u16, seconds: u64) -> u64 {
    // yield = principal * (apy_bps / 10000) * (seconds / seconds_per_year)
    let seconds_per_year: u64 = 365 * 24 * 60 * 60;
    ((principal as u128 * apy_bps as u128 * seconds as u128) / 
     (10000 * seconds_per_year) as u128) as u64
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", owner.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(mut)]
    pub user_cred_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub vault_cred_account: Account<'info, TokenAccount>,
    
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Capture<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    
    #[account(
        seeds = [b"capture_authority"],
        bump = capture_config.bump,
    )]
    pub capture_authority: AccountInfo<'info>,
    
    pub capture_config: Account<'info, CaptureConfig>,
    
    #[account(mut)]
    pub cred_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub vault_cred_account: Account<'info, TokenAccount>,
    
    pub capture_module: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Stack<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + StackRecord::INIT_SPACE,
        seeds = [b"stack", vault.key().as_ref(), &vault.stacked_balance.to_le_bytes()],
        bump,
    )]
    pub stack: Account<'info, StackRecord>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstack<'info> {
    #[account(
        mut,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        mut,
        constraint = stack.vault == vault.key(),
    )]
    pub stack: Account<'info, StackRecord>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(mut)]
    pub vault_cred_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_cred_account: Account<'info, TokenAccount>,
    
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetAgentPermission<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + AgentPermission::INIT_SPACE,
        seeds = [b"agent_perm", vault.key().as_ref(), &[0u8; 32]], // agent pubkey
        bump,
    )]
    pub agent_permission: Account<'info, AgentPermission>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimYield<'info> {
    #[account(
        mut,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        mut,
        constraint = stack.vault == vault.key(),
    )]
    pub stack: Account<'info, StackRecord>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct Extract<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(mut)]
    pub vault_cred_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_cred_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fee_account: Account<'info, TokenAccount>,
    
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
        close = owner,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetHeir<'info> {
    #[account(
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + InheritanceConfig::INIT_SPACE,
        seeds = [b"inheritance", vault.key().as_ref()],
        bump,
    )]
    pub inheritance_config: Account<'info, InheritanceConfig>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub owner: Pubkey,
    pub cred_balance: u64,
    pub stacked_balance: u64,
    pub pending_yield: u64,
    pub oxo_balance: u64,
    pub created_at: i64,
    pub last_yield_claim: i64,
    pub bump: u8,
    pub total_captured: u64,
    pub total_withdrawn: u64,
}

#[account]
#[derive(InitSpace)]
pub struct StackRecord {
    pub vault: Pubkey,
    pub amount: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub apy_basis_points: u16,
    pub claimed_yield: u64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CaptureConfig {
    pub authority: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AgentPermission {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub level: PermissionLevel,
    pub daily_limit: u64,
    pub daily_used: u64,
    pub last_reset: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct InheritanceConfig {
    pub vault: Pubkey,
    pub heir: Pubkey,
    pub inactivity_threshold: i64,
    pub last_activity: i64,
    pub triggered: bool,
    pub bump: u8,
}

// ============================================================================
// ENUMS
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum CaptureType {
    Shopping,
    Data,
    Presence,
    Attention,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum PermissionLevel {
    None,       // No access
    Read,       // Query only
    Capture,    // Can trigger captures
    Guided,     // Can stack within limits
    Autonomous, // Full vault management within limits
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct VaultCreated {
    pub owner: Pubkey,
    pub created_at: i64,
}

#[event]
pub struct Deposited {
    pub vault: Pubkey,
    pub amount: u64,
    pub new_balance: u64,
}

#[event]
pub struct ValueCaptured {
    pub vault: Pubkey,
    pub amount: u64,
    pub capture_type: CaptureType,
    pub source: String,
    pub timestamp: i64,
}

#[event]
pub struct Stacked {
    pub vault: Pubkey,
    pub stack: Pubkey,
    pub amount: u64,
    pub duration_days: u16,
    pub apy_basis_points: u16,
    pub end_time: i64,
}

#[event]
pub struct Unstacked {
    pub vault: Pubkey,
    pub stack: Pubkey,
    pub principal: u64,
    pub yield_earned: u64,
    pub penalty: u64,
    pub early_withdrawal: bool,
}

#[event]
pub struct Withdrawn {
    pub vault: Pubkey,
    pub amount: u64,
    pub destination: Pubkey,
}

#[event]
pub struct AgentPermissionSet {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub level: PermissionLevel,
    pub daily_limit: u64,
}

#[event]
pub struct YieldClaimed {
    pub vault: Pubkey,
    pub stack: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct Extracted {
    pub vault: Pubkey,
    pub total_amount: u64,
    pub fee: u64,
    pub amount_received: u64,
    pub timestamp: i64,
}

#[event]
pub struct VaultClosed {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct HeirDesignated {
    pub vault: Pubkey,
    pub heir: Pubkey,
    pub inactivity_threshold_days: u16,
    pub timestamp: i64,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum LoopError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Invalid duration (must be 7-365 days)")]
    InvalidDuration,
    #[msg("Stack not active")]
    StackNotActive,
    #[msg("Stack is inactive")]
    StackInactive,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Arithmetic underflow")]
    Underflow,
    #[msg("Division by zero")]
    DivisionByZero,
    #[msg("Source string too long (max 64 chars)")]
    SourceTooLong,
    #[msg("Unauthorized agent")]
    UnauthorizedAgent,
    #[msg("Daily limit exceeded")]
    DailyLimitExceeded,
    #[msg("No yield to claim")]
    NoYieldToClaim,
    #[msg("Nothing to extract")]
    NothingToExtract,
    #[msg("Vault not empty")]
    VaultNotEmpty,
    #[msg("Inactivity threshold too short (min 30 days)")]
    ThresholdTooShort,
}
