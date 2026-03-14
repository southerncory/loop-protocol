use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("JQgKVw8JxAfEdNjpNgDuNCJCenF3cKxQHL7Hg7TwLnk");

// Constants
pub const EXTRACTION_FEE_BPS: u16 = 500; // 5%

/// Loop Vault Program
/// 
/// User-owned value storage with stacking (yield) capabilities.
/// Supports agent-directed wealth building strategies.
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
        vault.total_deposited = 0;
        
        emit!(VaultCreated {
            owner: vault.owner,
            created_at: vault.created_at,
        });
        
        Ok(())
    }

    /// Deposit Cred (wrapped USDC) into vault - voluntary savings
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
        vault.total_deposited = vault.total_deposited.checked_add(amount)
            .ok_or(LoopError::Overflow)?;
        
        emit!(Deposited {
            vault: vault.key(),
            amount,
            new_balance: vault.cred_balance,
            deposit_type: DepositType::Voluntary,
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
        stack_nonce: u64,
    ) -> Result<()> {
        require!(amount > 0, LoopError::InvalidAmount);
        require!(duration_days >= 7 && duration_days <= 730, LoopError::InvalidDuration);
        
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
        stack.nonce = stack_nonce;
        
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
        
        let cred_balance = ctx.accounts.vault.cred_balance;
        let owner_key = ctx.accounts.vault.owner;
        let vault_bump = ctx.accounts.vault.bump;
        
        require!(cred_balance >= amount, LoopError::InsufficientBalance);
        
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

    /// Set agent permissions for this vault (creates or updates permission)
    /// If permission_level is None, closes the account and returns rent to owner
    pub fn set_agent_permission(
        ctx: Context<SetAgentPermission>,
        agent: Pubkey,
        permission_level: PermissionLevel,
        daily_limit: u64,
    ) -> Result<()> {
        // If permission level is None, close the account
        if permission_level == PermissionLevel::None {
            // Transfer rent back to owner
            let permission_info = ctx.accounts.agent_permission.to_account_info();
            let owner_info = ctx.accounts.owner.to_account_info();
            
            let rent_lamports = permission_info.lamports();
            **permission_info.try_borrow_mut_lamports()? = 0;
            **owner_info.try_borrow_mut_lamports()? = owner_info
                .lamports()
                .checked_add(rent_lamports)
                .ok_or(LoopError::Overflow)?;
            
            emit!(AgentPermissionRevoked {
                vault: ctx.accounts.vault.key(),
                agent,
            });
            
            return Ok(());
        }
        
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

    /// Revoke agent permission (closes the permission account and returns rent to owner)
    pub fn revoke_agent_permission(
        ctx: Context<RevokeAgentPermission>,
    ) -> Result<()> {
        let agent = ctx.accounts.agent_permission.agent;
        let vault_key = ctx.accounts.vault.key();
        
        emit!(AgentPermissionRevoked {
            vault: vault_key,
            agent,
        });
        
        // Account closure is handled by the close = owner constraint
        Ok(())
    }

    /// Configure auto-stacking preferences
    pub fn set_auto_stack(
        ctx: Context<SetAutoStack>,
        config: AutoStackConfig,
    ) -> Result<()> {
        require!(config.min_duration_days >= 7, LoopError::InvalidDuration);
        require!(config.min_duration_days <= 730, LoopError::InvalidDuration);
        require!(config.target_stack_ratio <= 100, LoopError::InvalidRatio);
        
        let settings = &mut ctx.accounts.auto_stack_settings;
        settings.vault = ctx.accounts.vault.key();
        settings.enabled = config.enabled;
        settings.min_duration_days = config.min_duration_days;
        settings.reinvest_yield = config.reinvest_yield;
        settings.reinvest_captures = config.reinvest_captures;
        settings.target_stack_ratio = config.target_stack_ratio;
        settings.min_stack_amount = config.min_stack_amount;
        settings.bump = ctx.bumps.auto_stack_settings;
        
        emit!(AutoStackConfigured {
            vault: ctx.accounts.vault.key(),
            enabled: config.enabled,
            min_duration_days: config.min_duration_days,
            reinvest_yield: config.reinvest_yield,
            target_stack_ratio: config.target_stack_ratio,
        });
        
        Ok(())
    }

    /// Agent-authorized stack operation (for guided/autonomous agents)
    pub fn agent_stack(
        ctx: Context<AgentStack>,
        amount: u64,
        duration_days: u16,
        stack_nonce: u64,
    ) -> Result<()> {
        require!(amount > 0, LoopError::InvalidAmount);
        require!(duration_days >= 7 && duration_days <= 730, LoopError::InvalidDuration);
        
        let permission = &mut ctx.accounts.agent_permission;
        let vault = &mut ctx.accounts.vault;
        
        require!(
            permission.level == PermissionLevel::Guided || 
            permission.level == PermissionLevel::Autonomous,
            LoopError::UnauthorizedAgent
        );
        
        if permission.level == PermissionLevel::Guided {
            let now = Clock::get()?.unix_timestamp;
            if now - permission.last_reset > 86400 {
                permission.daily_used = 0;
                permission.last_reset = now;
            }
            require!(
                permission.daily_used.checked_add(amount).unwrap_or(u64::MAX) <= permission.daily_limit,
                LoopError::DailyLimitExceeded
            );
            permission.daily_used = permission.daily_used.checked_add(amount)
                .ok_or(LoopError::Overflow)?;
        }
        
        require!(vault.cred_balance >= amount, LoopError::InsufficientBalance);
        
        let apy_basis_points = calculate_apy(duration_days);
        
        let stack = &mut ctx.accounts.stack;
        stack.vault = vault.key();
        stack.amount = amount;
        stack.start_time = Clock::get()?.unix_timestamp;
        stack.end_time = stack.start_time + (duration_days as i64 * 86400);
        stack.apy_basis_points = apy_basis_points;
        stack.claimed_yield = 0;
        stack.is_active = true;
        stack.bump = ctx.bumps.stack;
        stack.nonce = stack_nonce;
        
        vault.cred_balance = vault.cred_balance.checked_sub(amount)
            .ok_or(LoopError::Underflow)?;
        vault.stacked_balance = vault.stacked_balance.checked_add(amount)
            .ok_or(LoopError::Overflow)?;
        
        emit!(AgentStacked {
            vault: vault.key(),
            agent: ctx.accounts.agent.key(),
            stack: stack.key(),
            amount,
            duration_days,
            apy_basis_points,
        });
        
        Ok(())
    }

    /// Agent-authorized unstack operation
    pub fn agent_unstack(
        ctx: Context<AgentUnstack>,
    ) -> Result<()> {
        let permission = &ctx.accounts.agent_permission;
        let stack = &mut ctx.accounts.stack;
        let vault = &mut ctx.accounts.vault;
        
        require!(
            permission.level == PermissionLevel::Guided || 
            permission.level == PermissionLevel::Autonomous,
            LoopError::UnauthorizedAgent
        );
        
        let now = Clock::get()?.unix_timestamp;
        if permission.level == PermissionLevel::Guided {
            require!(now >= stack.end_time, LoopError::StackNotMatured);
        }
        
        require!(stack.is_active, LoopError::StackNotActive);
        
        let is_early = now < stack.end_time;
        let elapsed_seconds = (now - stack.start_time) as u64;
        let total_seconds = (stack.end_time - stack.start_time) as u64;
        let full_yield = calculate_yield(stack.amount, stack.apy_basis_points, total_seconds);
        
        let (payout, penalty) = if is_early {
            let earned = (full_yield * elapsed_seconds) / total_seconds;
            let penalty_amount = earned / 5;
            (stack.amount + earned - penalty_amount, penalty_amount)
        } else {
            (stack.amount + full_yield, 0)
        };
        
        vault.stacked_balance = vault.stacked_balance.checked_sub(stack.amount)
            .ok_or(LoopError::Underflow)?;
        vault.cred_balance = vault.cred_balance.checked_add(payout)
            .ok_or(LoopError::Overflow)?;
        
        stack.is_active = false;
        
        emit!(AgentUnstacked {
            vault: vault.key(),
            agent: ctx.accounts.agent.key(),
            stack: stack.key(),
            principal: stack.amount,
            yield_earned: payout - stack.amount,
            penalty,
            early_withdrawal: is_early,
        });
        
        Ok(())
    }

    /// Agent-authorized rebalance analysis
    pub fn agent_rebalance(
        ctx: Context<AgentRebalance>,
        target_stack_ratio: u8,
    ) -> Result<()> {
        let permission = &ctx.accounts.agent_permission;
        let vault = &ctx.accounts.vault;
        
        require!(
            permission.level == PermissionLevel::Autonomous,
            LoopError::UnauthorizedAgent
        );
        require!(target_stack_ratio <= 100, LoopError::InvalidRatio);
        
        let total_balance = vault.cred_balance.checked_add(vault.stacked_balance)
            .ok_or(LoopError::Overflow)?;
        
        if total_balance == 0 {
            return Ok(());
        }
        
        let target_stacked = (total_balance as u128 * target_stack_ratio as u128 / 100) as u64;
        let current_stacked = vault.stacked_balance;
        
        emit!(RebalanceSuggested {
            vault: vault.key(),
            agent: ctx.accounts.agent.key(),
            current_liquid: vault.cred_balance,
            current_stacked,
            target_stacked,
            suggested_action: if target_stacked > current_stacked {
                RebalanceAction::StackMore
            } else {
                RebalanceAction::KeepCurrent
            },
            suggested_amount: if target_stacked > current_stacked {
                target_stacked - current_stacked
            } else {
                0
            },
        });
        
        Ok(())
    }

    /// Execute auto-restacking on a matured stack (permissionless crank)
    pub fn execute_auto_restack(
        ctx: Context<ExecuteAutoRestack>,
        new_stack_nonce: u64,
    ) -> Result<()> {
        let settings = &ctx.accounts.auto_stack_settings;
        let stack = &mut ctx.accounts.old_stack;
        let vault = &mut ctx.accounts.vault;
        let new_stack = &mut ctx.accounts.new_stack;
        
        require!(settings.enabled, LoopError::AutoStackDisabled);
        require!(stack.is_active, LoopError::StackNotActive);
        
        let now = Clock::get()?.unix_timestamp;
        require!(now >= stack.end_time, LoopError::StackNotMatured);
        
        let total_seconds = (stack.end_time - stack.start_time) as u64;
        let full_yield = calculate_yield(stack.amount, stack.apy_basis_points, total_seconds);
        let matured_amount = stack.amount + full_yield;
        
        let new_stack_amount = if settings.reinvest_yield {
            matured_amount
        } else {
            stack.amount
        };
        
        require!(new_stack_amount >= settings.min_stack_amount, LoopError::BelowMinimum);
        
        stack.is_active = false;
        vault.stacked_balance = vault.stacked_balance.checked_sub(stack.amount)
            .ok_or(LoopError::Underflow)?;
        
        if !settings.reinvest_yield {
            vault.cred_balance = vault.cred_balance.checked_add(full_yield)
                .ok_or(LoopError::Overflow)?;
        }
        
        let apy_basis_points = calculate_apy(settings.min_duration_days);
        new_stack.vault = vault.key();
        new_stack.amount = new_stack_amount;
        new_stack.start_time = now;
        new_stack.end_time = now + (settings.min_duration_days as i64 * 86400);
        new_stack.apy_basis_points = apy_basis_points;
        new_stack.claimed_yield = 0;
        new_stack.is_active = true;
        new_stack.bump = ctx.bumps.new_stack;
        new_stack.nonce = new_stack_nonce;
        
        vault.stacked_balance = vault.stacked_balance.checked_add(new_stack_amount)
            .ok_or(LoopError::Overflow)?;
        
        emit!(AutoRestacked {
            vault: vault.key(),
            old_stack: stack.key(),
            new_stack: new_stack.key(),
            principal: stack.amount,
            yield_earned: full_yield,
            new_amount: new_stack_amount,
            new_duration_days: settings.min_duration_days,
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
        
        let seconds_since_claim = (now - stack.start_time.max(ctx.accounts.vault.last_yield_claim)) as u64;
        let yield_amount = calculate_yield(stack.amount, stack.apy_basis_points, seconds_since_claim);
        
        require!(yield_amount > 0, LoopError::NoYieldToClaim);
        
        let vault = &mut ctx.accounts.vault;
        vault.cred_balance = vault.cred_balance.checked_add(yield_amount)
            .ok_or(LoopError::Overflow)?;
        vault.pending_yield = vault.pending_yield.saturating_sub(yield_amount);
        vault.last_yield_claim = now;
        
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
    pub fn extract(
        ctx: Context<Extract>,
    ) -> Result<()> {
        let vault = &ctx.accounts.vault;
        
        let liquid_balance = vault.cred_balance;
        let stacked_balance = vault.stacked_balance;
        let total = liquid_balance.checked_add(stacked_balance).ok_or(LoopError::Overflow)?;
        
        require!(total > 0, LoopError::NothingToExtract);
        
        let fee = total.checked_mul(EXTRACTION_FEE_BPS as u64).ok_or(LoopError::Overflow)?
            .checked_div(10000).ok_or(LoopError::DivisionByZero)?;
        let amount_after_fee = total.checked_sub(fee).ok_or(LoopError::Underflow)?;
        
        let owner_key = vault.owner;
        let vault_bump = vault.bump;
        
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
        
        require!(vault.cred_balance == 0, LoopError::VaultNotEmpty);
        require!(vault.stacked_balance == 0, LoopError::VaultNotEmpty);
        require!(vault.oxo_balance == 0, LoopError::VaultNotEmpty);
        
        emit!(VaultClosed {
            vault: vault.key(),
            owner: vault.owner,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Set heir for inheritance (optional feature)
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
    match duration_days {
        7..=29 => 300,      // 3% APY
        30..=89 => 500,     // 5% APY
        90..=179 => 800,    // 8% APY
        180..=364 => 1200,  // 12% APY
        365..=730 => 1500,  // 15% APY
        _ => 200,           // 2% base
    }
}

fn calculate_yield(principal: u64, apy_bps: u16, seconds: u64) -> u64 {
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
    
    /// CHECK: PDA used as mint authority for capture operations
    #[account(
        seeds = [b"capture_authority"],
        bump = capture_config.bump,
    )]
    pub capture_authority: UncheckedAccount<'info>,
    
    pub capture_config: Account<'info, CaptureConfig>,
    
    #[account(mut)]
    pub cred_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub vault_cred_account: Account<'info, TokenAccount>,
    
    pub capture_module: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(amount: u64, duration_days: u16, stack_nonce: u64)]
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
        seeds = [b"stack", vault.key().as_ref(), &stack_nonce.to_le_bytes()],
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
#[instruction(agent: Pubkey)]
pub struct SetAgentPermission<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + AgentPermission::INIT_SPACE,
        seeds = [b"agent_perm", vault.key().as_ref(), agent.as_ref()],
        bump,
    )]
    pub agent_permission: Account<'info, AgentPermission>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeAgentPermission<'info> {
    #[account(
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        mut,
        seeds = [b"agent_perm", vault.key().as_ref(), agent_permission.agent.as_ref()],
        bump = agent_permission.bump,
        constraint = agent_permission.vault == vault.key(),
        close = owner,
    )]
    pub agent_permission: Account<'info, AgentPermission>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetAutoStack<'info> {
    #[account(
        seeds = [b"vault", owner.key().as_ref()],
        bump = vault.bump,
        has_one = owner,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + AutoStackSettings::INIT_SPACE,
        seeds = [b"auto_stack", vault.key().as_ref()],
        bump,
    )]
    pub auto_stack_settings: Account<'info, AutoStackSettings>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, duration_days: u16, stack_nonce: u64)]
pub struct AgentStack<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        mut,
        seeds = [b"agent_perm", vault.key().as_ref(), agent.key().as_ref()],
        bump = agent_permission.bump,
        constraint = agent_permission.agent == agent.key(),
    )]
    pub agent_permission: Account<'info, AgentPermission>,
    
    #[account(
        init,
        payer = agent,
        space = 8 + StackRecord::INIT_SPACE,
        seeds = [b"stack", vault.key().as_ref(), &stack_nonce.to_le_bytes()],
        bump,
    )]
    pub stack: Account<'info, StackRecord>,
    
    #[account(mut)]
    pub agent: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AgentUnstack<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        seeds = [b"agent_perm", vault.key().as_ref(), agent.key().as_ref()],
        bump = agent_permission.bump,
        constraint = agent_permission.agent == agent.key(),
    )]
    pub agent_permission: Account<'info, AgentPermission>,
    
    #[account(
        mut,
        constraint = stack.vault == vault.key(),
    )]
    pub stack: Account<'info, StackRecord>,
    
    pub agent: Signer<'info>,
}

#[derive(Accounts)]
pub struct AgentRebalance<'info> {
    #[account(
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        seeds = [b"agent_perm", vault.key().as_ref(), agent.key().as_ref()],
        bump = agent_permission.bump,
        constraint = agent_permission.agent == agent.key(),
    )]
    pub agent_permission: Account<'info, AgentPermission>,
    
    pub agent: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(new_stack_nonce: u64)]
pub struct ExecuteAutoRestack<'info> {
    #[account(
        mut,
        seeds = [b"vault", vault.owner.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        seeds = [b"auto_stack", vault.key().as_ref()],
        bump = auto_stack_settings.bump,
        constraint = auto_stack_settings.vault == vault.key(),
    )]
    pub auto_stack_settings: Account<'info, AutoStackSettings>,
    
    #[account(
        mut,
        constraint = old_stack.vault == vault.key(),
    )]
    pub old_stack: Account<'info, StackRecord>,
    
    #[account(
        init,
        payer = cranker,
        space = 8 + StackRecord::INIT_SPACE,
        seeds = [b"stack", vault.key().as_ref(), &new_stack_nonce.to_le_bytes()],
        bump,
    )]
    pub new_stack: Account<'info, StackRecord>,
    
    #[account(mut)]
    pub cranker: Signer<'info>,
    
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
    pub total_deposited: u64,
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
    pub nonce: u64,
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
pub struct AutoStackSettings {
    pub vault: Pubkey,
    pub enabled: bool,
    pub min_duration_days: u16,
    pub reinvest_yield: bool,
    pub reinvest_captures: bool,
    pub target_stack_ratio: u8,
    pub min_stack_amount: u64,
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
    None,
    Read,
    Capture,
    Guided,
    Autonomous,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum DepositType {
    Voluntary,
    Capture,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum RebalanceAction {
    StackMore,
    UnstackSome,
    KeepCurrent,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AutoStackConfig {
    pub enabled: bool,
    pub min_duration_days: u16,
    pub reinvest_yield: bool,
    pub reinvest_captures: bool,
    pub target_stack_ratio: u8,
    pub min_stack_amount: u64,
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
    pub deposit_type: DepositType,
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
pub struct AgentPermissionRevoked {
    pub vault: Pubkey,
    pub agent: Pubkey,
}

#[event]
pub struct AutoStackConfigured {
    pub vault: Pubkey,
    pub enabled: bool,
    pub min_duration_days: u16,
    pub reinvest_yield: bool,
    pub target_stack_ratio: u8,
}

#[event]
pub struct AgentStacked {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub stack: Pubkey,
    pub amount: u64,
    pub duration_days: u16,
    pub apy_basis_points: u16,
}

#[event]
pub struct AgentUnstacked {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub stack: Pubkey,
    pub principal: u64,
    pub yield_earned: u64,
    pub penalty: u64,
    pub early_withdrawal: bool,
}

#[event]
pub struct RebalanceSuggested {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub current_liquid: u64,
    pub current_stacked: u64,
    pub target_stacked: u64,
    pub suggested_action: RebalanceAction,
    pub suggested_amount: u64,
}

#[event]
pub struct AutoRestacked {
    pub vault: Pubkey,
    pub old_stack: Pubkey,
    pub new_stack: Pubkey,
    pub principal: u64,
    pub yield_earned: u64,
    pub new_amount: u64,
    pub new_duration_days: u16,
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
    #[msg("Invalid duration (must be 7-730 days)")]
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
    #[msg("Invalid ratio (must be 0-100)")]
    InvalidRatio,
    #[msg("Stack not yet matured")]
    StackNotMatured,
    #[msg("Auto-stacking is disabled")]
    AutoStackDisabled,
    #[msg("Amount below minimum")]
    BelowMinimum,
}
