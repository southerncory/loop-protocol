use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint, MintTo, Burn};

declare_id!("LoopCredXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

/// Loop Cred Program
/// 
/// Cred is the stable value token in Loop Protocol.
/// 1 Cred = $1 (backed by USDC)
/// 
/// Users wrap USDC to get Cred, which is used in vaults.
/// Capture modules mint Cred when value is captured.
/// Protocol maintains USDC backing.

#[program]
pub mod loop_cred {
    use super::*;

    /// Initialize the Cred token system
    pub fn initialize(
        ctx: Context<Initialize>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.cred_config;
        config.authority = ctx.accounts.authority.key();
        config.usdc_mint = ctx.accounts.usdc_mint.key();
        config.cred_mint = ctx.accounts.cred_mint.key();
        config.reserve_vault = ctx.accounts.reserve_vault.key();
        config.total_minted = 0;
        config.total_burned = 0;
        config.bump = ctx.bumps.cred_config;
        
        emit!(CredInitialized {
            authority: config.authority,
            usdc_mint: config.usdc_mint,
            cred_mint: config.cred_mint,
        });
        
        Ok(())
    }

    /// Wrap USDC to get Cred (1:1)
    pub fn wrap(
        ctx: Context<Wrap>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, CredError::InvalidAmount);
        
        // Transfer USDC from user to reserve
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_usdc_account.to_account_info(),
            to: ctx.accounts.reserve_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;
        
        // Mint Cred to user (1:1)
        let seeds = &[
            b"cred_config".as_ref(),
            &[ctx.accounts.cred_config.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = MintTo {
            mint: ctx.accounts.cred_mint.to_account_info(),
            to: ctx.accounts.user_cred_account.to_account_info(),
            authority: ctx.accounts.cred_config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::mint_to(cpi_ctx, amount)?;
        
        // Update config
        let config = &mut ctx.accounts.cred_config;
        config.total_minted = config.total_minted.checked_add(amount)
            .ok_or(CredError::Overflow)?;
        
        emit!(Wrapped {
            user: ctx.accounts.user.key(),
            usdc_amount: amount,
            cred_amount: amount,
        });
        
        Ok(())
    }

    /// Unwrap Cred to get USDC (1:1)
    pub fn unwrap(
        ctx: Context<Unwrap>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, CredError::InvalidAmount);
        
        // Burn user's Cred
        let cpi_accounts = Burn {
            mint: ctx.accounts.cred_mint.to_account_info(),
            from: ctx.accounts.user_cred_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::burn(cpi_ctx, amount)?;
        
        // Transfer USDC from reserve to user
        let seeds = &[
            b"cred_config".as_ref(),
            &[ctx.accounts.cred_config.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.reserve_vault.to_account_info(),
            to: ctx.accounts.user_usdc_account.to_account_info(),
            authority: ctx.accounts.cred_config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, amount)?;
        
        // Update config
        let config = &mut ctx.accounts.cred_config;
        config.total_burned = config.total_burned.checked_add(amount)
            .ok_or(CredError::Overflow)?;
        
        emit!(Unwrapped {
            user: ctx.accounts.user.key(),
            cred_amount: amount,
            usdc_amount: amount,
        });
        
        Ok(())
    }

    /// Mint Cred for value capture (authorized capture modules only)
    /// The capture module must fund the backing separately
    pub fn capture_mint(
        ctx: Context<CaptureMint>,
        amount: u64,
        capture_type: CaptureType,
    ) -> Result<()> {
        require!(amount > 0, CredError::InvalidAmount);
        
        // Verify capture module is authorized
        let capture_auth = &ctx.accounts.capture_authority;
        require!(capture_auth.is_active, CredError::UnauthorizedCapture);
        require!(
            capture_auth.capture_type == capture_type,
            CredError::CaptureTypeMismatch
        );
        
        // Transfer USDC backing from capture module to reserve
        let cpi_accounts = Transfer {
            from: ctx.accounts.capture_usdc_account.to_account_info(),
            to: ctx.accounts.reserve_vault.to_account_info(),
            authority: ctx.accounts.capture_signer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;
        
        // Mint Cred to destination vault
        let seeds = &[
            b"cred_config".as_ref(),
            &[ctx.accounts.cred_config.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = MintTo {
            mint: ctx.accounts.cred_mint.to_account_info(),
            to: ctx.accounts.destination_cred_account.to_account_info(),
            authority: ctx.accounts.cred_config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::mint_to(cpi_ctx, amount)?;
        
        // Update stats
        let config = &mut ctx.accounts.cred_config;
        config.total_minted = config.total_minted.checked_add(amount)
            .ok_or(CredError::Overflow)?;
        
        let capture_auth = &mut ctx.accounts.capture_authority;
        capture_auth.total_captured = capture_auth.total_captured.checked_add(amount)
            .ok_or(CredError::Overflow)?;
        
        emit!(CaptureMinted {
            capture_type,
            amount,
            destination: ctx.accounts.destination_cred_account.key(),
        });
        
        Ok(())
    }

    /// Register a new capture module
    pub fn register_capture_module(
        ctx: Context<RegisterCaptureModule>,
        capture_type: CaptureType,
        module_name: String,
    ) -> Result<()> {
        require!(module_name.len() <= 32, CredError::NameTooLong);
        
        let capture_auth = &mut ctx.accounts.capture_authority;
        capture_auth.module_address = ctx.accounts.module_address.key();
        capture_auth.capture_type = capture_type;
        capture_auth.module_name = module_name.clone();
        capture_auth.total_captured = 0;
        capture_auth.is_active = true;
        capture_auth.registered_at = Clock::get()?.unix_timestamp;
        capture_auth.bump = ctx.bumps.capture_authority;
        
        emit!(CaptureModuleRegistered {
            module_address: capture_auth.module_address,
            capture_type,
            module_name,
        });
        
        Ok(())
    }

    /// Get reserve status (for transparency)
    pub fn get_reserve_status(ctx: Context<GetReserveStatus>) -> Result<ReserveStatus> {
        let config = &ctx.accounts.cred_config;
        let reserve_balance = ctx.accounts.reserve_vault.amount;
        let cred_supply = ctx.accounts.cred_mint.supply;
        
        let status = ReserveStatus {
            usdc_reserve: reserve_balance,
            cred_supply,
            backing_ratio: if cred_supply > 0 {
                (reserve_balance * 10000) / cred_supply // basis points
            } else {
                10000
            },
            total_minted: config.total_minted,
            total_burned: config.total_burned,
        };
        
        emit!(ReserveStatusQueried {
            usdc_reserve: status.usdc_reserve,
            cred_supply: status.cred_supply,
            backing_ratio: status.backing_ratio,
        });
        
        Ok(status)
    }
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + CredConfig::INIT_SPACE,
        seeds = [b"cred_config"],
        bump,
    )]
    pub cred_config: Account<'info, CredConfig>,
    
    pub usdc_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub cred_mint: Account<'info, Mint>,
    
    /// CHECK: Reserve vault for USDC backing
    pub reserve_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Wrap<'info> {
    #[account(
        mut,
        seeds = [b"cred_config"],
        bump = cred_config.bump,
    )]
    pub cred_config: Account<'info, CredConfig>,
    
    #[account(mut)]
    pub cred_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub reserve_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_cred_account: Account<'info, TokenAccount>,
    
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unwrap<'info> {
    #[account(
        mut,
        seeds = [b"cred_config"],
        bump = cred_config.bump,
    )]
    pub cred_config: Account<'info, CredConfig>,
    
    #[account(mut)]
    pub cred_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub reserve_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_cred_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,
    
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CaptureMint<'info> {
    #[account(
        mut,
        seeds = [b"cred_config"],
        bump = cred_config.bump,
    )]
    pub cred_config: Account<'info, CredConfig>,
    
    #[account(
        mut,
        constraint = capture_authority.module_address == capture_signer.key(),
    )]
    pub capture_authority: Account<'info, CaptureAuthority>,
    
    #[account(mut)]
    pub cred_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub reserve_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub capture_usdc_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub destination_cred_account: Account<'info, TokenAccount>,
    
    pub capture_signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RegisterCaptureModule<'info> {
    #[account(
        seeds = [b"cred_config"],
        bump = cred_config.bump,
        has_one = authority,
    )]
    pub cred_config: Account<'info, CredConfig>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + CaptureAuthority::INIT_SPACE,
        seeds = [b"capture_auth", module_address.key().as_ref()],
        bump,
    )]
    pub capture_authority: Account<'info, CaptureAuthority>,
    
    /// CHECK: The address of the capture module being registered
    pub module_address: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetReserveStatus<'info> {
    #[account(
        seeds = [b"cred_config"],
        bump = cred_config.bump,
    )]
    pub cred_config: Account<'info, CredConfig>,
    
    pub reserve_vault: Account<'info, TokenAccount>,
    pub cred_mint: Account<'info, Mint>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct CredConfig {
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub cred_mint: Pubkey,
    pub reserve_vault: Pubkey,
    pub total_minted: u64,
    pub total_burned: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CaptureAuthority {
    pub module_address: Pubkey,
    pub capture_type: CaptureType,
    #[max_len(32)]
    pub module_name: String,
    pub total_captured: u64,
    pub is_active: bool,
    pub registered_at: i64,
    pub bump: u8,
}

// ============================================================================
// TYPES
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum CaptureType {
    Shopping,
    Data,
    Presence,
    Attention,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ReserveStatus {
    pub usdc_reserve: u64,
    pub cred_supply: u64,
    pub backing_ratio: u64, // in basis points (10000 = 100%)
    pub total_minted: u64,
    pub total_burned: u64,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct CredInitialized {
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub cred_mint: Pubkey,
}

#[event]
pub struct Wrapped {
    pub user: Pubkey,
    pub usdc_amount: u64,
    pub cred_amount: u64,
}

#[event]
pub struct Unwrapped {
    pub user: Pubkey,
    pub cred_amount: u64,
    pub usdc_amount: u64,
}

#[event]
pub struct CaptureMinted {
    pub capture_type: CaptureType,
    pub amount: u64,
    pub destination: Pubkey,
}

#[event]
pub struct CaptureModuleRegistered {
    pub module_address: Pubkey,
    pub capture_type: CaptureType,
    pub module_name: String,
}

#[event]
pub struct ReserveStatusQueried {
    pub usdc_reserve: u64,
    pub cred_supply: u64,
    pub backing_ratio: u64,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum CredError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Unauthorized capture module")]
    UnauthorizedCapture,
    #[msg("Capture type mismatch")]
    CaptureTypeMismatch,
    #[msg("Name too long (max 32 chars)")]
    NameTooLong,
    #[msg("Insufficient USDC reserve")]
    InsufficientReserve,
}
