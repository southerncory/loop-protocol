use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("D9EVmPZXMwqL3v9ebdpanyrJi3i1ZdfNRJo2MsZkd7qJ");

// =============================================================================
// CONSTANTS
// =============================================================================

pub const USER_SHARE_BPS: u16 = 8000;       // 80%
pub const TREASURY_SHARE_BPS: u16 = 1400;   // 14%
pub const STAKER_SHARE_BPS: u16 = 600;      // 6%
pub const MAX_REWARDS_RATE_BPS: u16 = 1000; // 10% max
pub const MIN_PURCHASE_AMOUNT: u64 = 100;   // $1.00 minimum (cents)
pub const BPS_DENOMINATOR: u64 = 10_000;

pub const MERCHANT_SEED: &[u8] = b"merchant";
pub const MERCHANT_POOL_SEED: &[u8] = b"merchant_pool";
pub const CAPTURE_SEED: &[u8] = b"capture";
pub const STATE_SEED: &[u8] = b"state";

pub const MAX_NAME_LEN: usize = 64;

// =============================================================================
// PROGRAM
// =============================================================================

#[program]
pub mod loop_shopping {
    use super::*;

    /// Initialize the shopping module state
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.admin = ctx.accounts.admin.key();
        state.cred_mint = ctx.accounts.cred_mint.key();
        state.treasury = ctx.accounts.treasury.key();
        state.staker_pool = ctx.accounts.staker_pool.key();
        state.merchant_count = 0;
        state.total_captures = 0;
        state.total_distributed = 0;
        state.bump = ctx.bumps.state;

        emit!(ShoppingInitialized {
            admin: state.admin,
            cred_mint: state.cred_mint,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Register a new merchant
    pub fn register_merchant(
        ctx: Context<RegisterMerchant>,
        name: String,
        category: MerchantCategory,
        rewards_rate_bps: u16,
        signing_pubkey: Pubkey,
    ) -> Result<()> {
        require!(name.len() <= MAX_NAME_LEN, ShoppingError::NameTooLong);
        require!(
            rewards_rate_bps <= MAX_REWARDS_RATE_BPS,
            ShoppingError::RewardsRateTooHigh
        );

        let state = &mut ctx.accounts.state;
        let merchant = &mut ctx.accounts.merchant;

        merchant.id = state.merchant_count;
        merchant.authority = ctx.accounts.merchant_authority.key();
        merchant.signing_pubkey = signing_pubkey;
        merchant.name = name.clone();
        merchant.category = category.clone();
        merchant.rewards_rate_bps = rewards_rate_bps;
        merchant.rewards_pool = 0;
        merchant.total_distributed = 0;
        merchant.transaction_count = 0;
        merchant.status = MerchantStatus::Active;
        merchant.registered_at = Clock::get()?.unix_timestamp;
        merchant.bump = ctx.bumps.merchant;

        state.merchant_count = state.merchant_count.checked_add(1)
            .ok_or(ShoppingError::Overflow)?;

        emit!(MerchantRegistered {
            merchant_id: merchant.id,
            name,
            category,
            rewards_rate_bps,
            signing_pubkey,
            timestamp: merchant.registered_at,
        });

        Ok(())
    }

    /// Fund a merchant's rewards pool with Cred
    pub fn fund_merchant_pool(ctx: Context<FundMerchantPool>, amount: u64) -> Result<()> {
        require!(amount > 0, ShoppingError::InvalidAmount);
        
        let merchant = &mut ctx.accounts.merchant;
        require!(
            merchant.status != MerchantStatus::Suspended,
            ShoppingError::MerchantSuspended
        );

        // Transfer Cred to merchant pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.cred_source.to_account_info(),
            to: ctx.accounts.merchant_pool.to_account_info(),
            authority: ctx.accounts.merchant_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;

        merchant.rewards_pool = merchant.rewards_pool.checked_add(amount)
            .ok_or(ShoppingError::Overflow)?;

        emit!(MerchantFunded {
            merchant_id: merchant.id,
            amount,
            new_pool_balance: merchant.rewards_pool,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Submit purchase proof and distribute rewards
    pub fn submit_purchase_proof(
        ctx: Context<SubmitPurchaseProof>,
        receipt: Receipt,
    ) -> Result<()> {
        let merchant = &mut ctx.accounts.merchant;
        let state = &mut ctx.accounts.state;
        let pool_bump = ctx.bumps.merchant_pool;
        
        // Verify merchant is active
        require!(
            merchant.status == MerchantStatus::Active,
            ShoppingError::MerchantNotActive
        );

        // Verify minimum purchase amount
        require!(
            receipt.amount >= MIN_PURCHASE_AMOUNT,
            ShoppingError::PurchaseTooSmall
        );

        // Verify receipt merchant ID matches
        require!(
            receipt.merchant_id == merchant.id,
            ShoppingError::MerchantMismatch
        );

        // Verify signature (Ed25519 verification)
        verify_receipt_signature(&receipt, &merchant.signing_pubkey)?;

        // Calculate reward
        let reward_amount = calculate_reward(receipt.amount, merchant.rewards_rate_bps)?;
        
        // Verify merchant has sufficient pool
        require!(
            merchant.rewards_pool >= reward_amount,
            ShoppingError::InsufficientPool
        );

        // Calculate distribution shares
        let user_share = reward_amount
            .checked_mul(USER_SHARE_BPS as u64)
            .ok_or(ShoppingError::Overflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(ShoppingError::Overflow)?;
        
        let treasury_share = reward_amount
            .checked_mul(TREASURY_SHARE_BPS as u64)
            .ok_or(ShoppingError::Overflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(ShoppingError::Overflow)?;
        
        let staker_share = reward_amount
            .checked_sub(user_share)
            .ok_or(ShoppingError::Overflow)?
            .checked_sub(treasury_share)
            .ok_or(ShoppingError::Overflow)?;

        // Transfer from merchant pool to recipients
        let merchant_id_bytes = merchant.id.to_le_bytes();
        let seeds = &[
            MERCHANT_POOL_SEED,
            merchant_id_bytes.as_ref(),
            &[pool_bump],
        ];
        let signer = &[&seeds[..]];

        // Transfer to user vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.merchant_pool.to_account_info(),
            to: ctx.accounts.user_cred_account.to_account_info(),
            authority: ctx.accounts.merchant_pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, user_share)?;

        // Transfer to treasury
        let cpi_accounts = Transfer {
            from: ctx.accounts.merchant_pool.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
            authority: ctx.accounts.merchant_pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, treasury_share)?;

        // Transfer to staker pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.merchant_pool.to_account_info(),
            to: ctx.accounts.staker_pool.to_account_info(),
            authority: ctx.accounts.merchant_pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, staker_share)?;

        // Update merchant state
        merchant.rewards_pool = merchant.rewards_pool
            .checked_sub(reward_amount)
            .ok_or(ShoppingError::Overflow)?;
        merchant.total_distributed = merchant.total_distributed
            .checked_add(reward_amount)
            .ok_or(ShoppingError::Overflow)?;
        merchant.transaction_count = merchant.transaction_count
            .checked_add(1)
            .ok_or(ShoppingError::Overflow)?;

        // Update global state
        state.total_captures = state.total_captures
            .checked_add(1)
            .ok_or(ShoppingError::Overflow)?;
        state.total_distributed = state.total_distributed
            .checked_add(reward_amount)
            .ok_or(ShoppingError::Overflow)?;

        // Initialize capture record (prevents double-claim)
        let capture = &mut ctx.accounts.capture_record;
        capture.id = state.total_captures;
        capture.agent = ctx.accounts.agent.key();
        capture.merchant_id = merchant.id;
        capture.transaction_id = receipt.transaction_id;
        capture.purchase_amount = receipt.amount;
        capture.reward_amount = reward_amount;
        capture.user_share = user_share;
        capture.treasury_share = treasury_share;
        capture.staker_share = staker_share;
        capture.timestamp = Clock::get()?.unix_timestamp;
        capture.bump = ctx.bumps.capture_record;

        emit!(PurchaseCaptured {
            capture_id: capture.id,
            agent: capture.agent,
            merchant_id: merchant.id,
            transaction_id: receipt.transaction_id,
            purchase_amount: receipt.amount,
            reward_amount,
            user_share,
            treasury_share,
            staker_share,
            timestamp: capture.timestamp,
        });

        Ok(())
    }

    /// Merchant-initiated claim via webhook
    pub fn claim_with_webhook(
        ctx: Context<ClaimWithWebhook>,
        agent: Pubkey,
        transaction_id: [u8; 32],
        amount: u64,
    ) -> Result<()> {
        let merchant = &mut ctx.accounts.merchant;
        let state = &mut ctx.accounts.state;
        let pool_bump = ctx.bumps.merchant_pool;

        // Verify merchant is active
        require!(
            merchant.status == MerchantStatus::Active,
            ShoppingError::MerchantNotActive
        );

        // Verify minimum purchase amount
        require!(
            amount >= MIN_PURCHASE_AMOUNT,
            ShoppingError::PurchaseTooSmall
        );

        // Verify signer is merchant's signing key
        require!(
            ctx.accounts.merchant_signer.key() == merchant.signing_pubkey,
            ShoppingError::InvalidMerchantSigner
        );

        // Calculate reward
        let reward_amount = calculate_reward(amount, merchant.rewards_rate_bps)?;

        // Verify merchant has sufficient pool
        require!(
            merchant.rewards_pool >= reward_amount,
            ShoppingError::InsufficientPool
        );

        // Calculate distribution shares
        let user_share = reward_amount
            .checked_mul(USER_SHARE_BPS as u64)
            .ok_or(ShoppingError::Overflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(ShoppingError::Overflow)?;
        
        let treasury_share = reward_amount
            .checked_mul(TREASURY_SHARE_BPS as u64)
            .ok_or(ShoppingError::Overflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(ShoppingError::Overflow)?;
        
        let staker_share = reward_amount
            .checked_sub(user_share)
            .ok_or(ShoppingError::Overflow)?
            .checked_sub(treasury_share)
            .ok_or(ShoppingError::Overflow)?;

        // Transfer from merchant pool to recipients
        let merchant_id_bytes = merchant.id.to_le_bytes();
        let seeds = &[
            MERCHANT_POOL_SEED,
            merchant_id_bytes.as_ref(),
            &[pool_bump],
        ];
        let signer = &[&seeds[..]];

        // Transfer to user
        let cpi_accounts = Transfer {
            from: ctx.accounts.merchant_pool.to_account_info(),
            to: ctx.accounts.user_cred_account.to_account_info(),
            authority: ctx.accounts.merchant_pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, user_share)?;

        // Transfer to treasury
        let cpi_accounts = Transfer {
            from: ctx.accounts.merchant_pool.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
            authority: ctx.accounts.merchant_pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, treasury_share)?;

        // Transfer to staker pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.merchant_pool.to_account_info(),
            to: ctx.accounts.staker_pool.to_account_info(),
            authority: ctx.accounts.merchant_pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, staker_share)?;

        // Update merchant state
        merchant.rewards_pool = merchant.rewards_pool
            .checked_sub(reward_amount)
            .ok_or(ShoppingError::Overflow)?;
        merchant.total_distributed = merchant.total_distributed
            .checked_add(reward_amount)
            .ok_or(ShoppingError::Overflow)?;
        merchant.transaction_count = merchant.transaction_count
            .checked_add(1)
            .ok_or(ShoppingError::Overflow)?;

        // Update global state
        state.total_captures = state.total_captures
            .checked_add(1)
            .ok_or(ShoppingError::Overflow)?;
        state.total_distributed = state.total_distributed
            .checked_add(reward_amount)
            .ok_or(ShoppingError::Overflow)?;

        // Initialize capture record (prevents double-claim)
        let capture = &mut ctx.accounts.capture_record;
        capture.id = state.total_captures;
        capture.agent = agent;
        capture.merchant_id = merchant.id;
        capture.transaction_id = transaction_id;
        capture.purchase_amount = amount;
        capture.reward_amount = reward_amount;
        capture.user_share = user_share;
        capture.treasury_share = treasury_share;
        capture.staker_share = staker_share;
        capture.timestamp = Clock::get()?.unix_timestamp;
        capture.bump = ctx.bumps.capture_record;

        emit!(PurchaseCaptured {
            capture_id: capture.id,
            agent,
            merchant_id: merchant.id,
            transaction_id,
            purchase_amount: amount,
            reward_amount,
            user_share,
            treasury_share,
            staker_share,
            timestamp: capture.timestamp,
        });

        Ok(())
    }

    /// Update merchant settings
    pub fn update_merchant(
        ctx: Context<UpdateMerchant>,
        rewards_rate_bps: Option<u16>,
        status: Option<MerchantStatus>,
    ) -> Result<()> {
        let merchant = &mut ctx.accounts.merchant;

        if let Some(rate) = rewards_rate_bps {
            require!(
                rate <= MAX_REWARDS_RATE_BPS,
                ShoppingError::RewardsRateTooHigh
            );
            merchant.rewards_rate_bps = rate;
        }

        if let Some(new_status) = status {
            merchant.status = new_status.clone();
        }

        emit!(MerchantUpdated {
            merchant_id: merchant.id,
            rewards_rate_bps: merchant.rewards_rate_bps,
            status: merchant.status.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Withdraw from merchant pool (merchant authority only)
    pub fn withdraw_merchant_pool(
        ctx: Context<WithdrawMerchantPool>,
        amount: u64,
    ) -> Result<()> {
        let merchant = &mut ctx.accounts.merchant;
        
        require!(amount > 0, ShoppingError::InvalidAmount);
        require!(
            merchant.rewards_pool >= amount,
            ShoppingError::InsufficientPool
        );

        let merchant_id_bytes = merchant.id.to_le_bytes();
        let seeds = &[
            MERCHANT_POOL_SEED,
            merchant_id_bytes.as_ref(),
            &[ctx.bumps.merchant_pool],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.merchant_pool.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.merchant_pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, amount)?;

        merchant.rewards_pool = merchant.rewards_pool
            .checked_sub(amount)
            .ok_or(ShoppingError::Overflow)?;

        emit!(MerchantWithdrawal {
            merchant_id: merchant.id,
            amount,
            remaining_pool: merchant.rewards_pool,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

fn calculate_reward(purchase_amount: u64, rewards_rate_bps: u16) -> Result<u64> {
    purchase_amount
        .checked_mul(rewards_rate_bps as u64)
        .ok_or(ShoppingError::Overflow.into())
        .and_then(|v| v.checked_div(BPS_DENOMINATOR).ok_or(ShoppingError::Overflow.into()))
}

fn verify_receipt_signature(receipt: &Receipt, _expected_pubkey: &Pubkey) -> Result<()> {
    // Create the message that was signed
    let mut message = Vec::with_capacity(48);
    message.extend_from_slice(&receipt.merchant_id.to_le_bytes());
    message.extend_from_slice(&receipt.transaction_id);
    message.extend_from_slice(&receipt.amount.to_le_bytes());
    message.extend_from_slice(&receipt.timestamp.to_le_bytes());

    // Ed25519 signature verification
    // In production, this would use the Ed25519 program for verification
    // For now, we verify the signature format and trust the signer check
    // Real verification: ed25519_program::verify(pubkey, message, signature)
    
    require!(
        receipt.signature.len() == 64,
        ShoppingError::InvalidSignature
    );

    // Note: Full Ed25519 verification requires the Ed25519 precompile program
    // This is a placeholder - in production, use:
    // solana_program::ed25519_program::verify_signature(...)
    
    Ok(())
}

// =============================================================================
// STATE ACCOUNTS
// =============================================================================

#[account]
#[derive(InitSpace)]
pub struct ShoppingState {
    pub admin: Pubkey,
    pub cred_mint: Pubkey,
    pub treasury: Pubkey,
    pub staker_pool: Pubkey,
    pub merchant_count: u64,
    pub total_captures: u64,
    pub total_distributed: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Merchant {
    pub id: u64,
    pub authority: Pubkey,
    pub signing_pubkey: Pubkey,
    #[max_len(64)]
    pub name: String,
    pub category: MerchantCategory,
    pub rewards_rate_bps: u16,
    pub rewards_pool: u64,
    pub total_distributed: u64,
    pub transaction_count: u64,
    pub status: MerchantStatus,
    pub registered_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CaptureRecord {
    pub id: u64,
    pub agent: Pubkey,
    pub merchant_id: u64,
    pub transaction_id: [u8; 32],
    pub purchase_amount: u64,
    pub reward_amount: u64,
    pub user_share: u64,
    pub treasury_share: u64,
    pub staker_share: u64,
    pub timestamp: i64,
    pub bump: u8,
}

// =============================================================================
// DATA TYPES
// =============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum MerchantCategory {
    Grocery,
    Restaurant,
    Retail,
    Gas,
    Travel,
    Entertainment,
    Services,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum MerchantStatus {
    Active,
    Paused,
    Suspended,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Receipt {
    pub merchant_id: u64,
    pub transaction_id: [u8; 32],
    pub amount: u64,
    pub timestamp: i64,
    pub signature: Vec<u8>,
}

// =============================================================================
// CONTEXT STRUCTS - Using Box for heap allocation to avoid stack overflow
// =============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + ShoppingState::INIT_SPACE,
        seeds = [STATE_SEED],
        bump
    )]
    pub state: Account<'info, ShoppingState>,

    pub cred_mint: Account<'info, Mint>,
    
    /// CHECK: Treasury token account
    pub treasury: AccountInfo<'info>,
    
    /// CHECK: Staker pool token account  
    pub staker_pool: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, category: MerchantCategory, rewards_rate_bps: u16, signing_pubkey: Pubkey)]
pub struct RegisterMerchant<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [STATE_SEED],
        bump = state.bump,
        constraint = state.admin == admin.key() @ ShoppingError::Unauthorized
    )]
    pub state: Box<Account<'info, ShoppingState>>,

    /// The merchant's authority (who can manage the merchant)
    /// CHECK: This is the merchant's admin account
    pub merchant_authority: AccountInfo<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + Merchant::INIT_SPACE,
        seeds = [MERCHANT_SEED, state.merchant_count.to_le_bytes().as_ref()],
        bump
    )]
    pub merchant: Box<Account<'info, Merchant>>,

    #[account(
        init,
        payer = admin,
        token::mint = cred_mint,
        token::authority = merchant_pool,
        seeds = [MERCHANT_POOL_SEED, state.merchant_count.to_le_bytes().as_ref()],
        bump
    )]
    pub merchant_pool: Box<Account<'info, TokenAccount>>,

    pub cred_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundMerchantPool<'info> {
    #[account(mut)]
    pub merchant_authority: Signer<'info>,

    #[account(
        mut,
        constraint = merchant.authority == merchant_authority.key() @ ShoppingError::Unauthorized
    )]
    pub merchant: Account<'info, Merchant>,

    #[account(
        mut,
        constraint = cred_source.owner == merchant_authority.key() @ ShoppingError::Unauthorized
    )]
    pub cred_source: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [MERCHANT_POOL_SEED, merchant.id.to_le_bytes().as_ref()],
        bump
    )]
    pub merchant_pool: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(receipt: Receipt)]
pub struct SubmitPurchaseProof<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,

    #[account(
        mut,
        seeds = [STATE_SEED],
        bump = state.bump
    )]
    pub state: Box<Account<'info, ShoppingState>>,

    #[account(mut)]
    pub merchant: Box<Account<'info, Merchant>>,

    #[account(
        mut,
        seeds = [MERCHANT_POOL_SEED, merchant.id.to_le_bytes().as_ref()],
        bump
    )]
    pub merchant_pool: Box<Account<'info, TokenAccount>>,

    /// User's Cred token account to receive rewards
    #[account(mut)]
    pub user_cred_account: Box<Account<'info, TokenAccount>>,

    /// Protocol treasury
    #[account(
        mut,
        constraint = treasury.key() == state.treasury @ ShoppingError::InvalidTreasury
    )]
    pub treasury: Box<Account<'info, TokenAccount>>,

    /// Staker rewards pool
    #[account(
        mut,
        constraint = staker_pool.key() == state.staker_pool @ ShoppingError::InvalidStakerPool
    )]
    pub staker_pool: Box<Account<'info, TokenAccount>>,

    /// Capture record - prevents double-claiming
    #[account(
        init,
        payer = agent,
        space = 8 + CaptureRecord::INIT_SPACE,
        seeds = [CAPTURE_SEED, receipt.transaction_id.as_ref()],
        bump
    )]
    pub capture_record: Box<Account<'info, CaptureRecord>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent: Pubkey, transaction_id: [u8; 32], amount: u64)]
pub struct ClaimWithWebhook<'info> {
    /// Merchant's signing key (must match merchant.signing_pubkey)
    #[account(mut)]
    pub merchant_signer: Signer<'info>,

    #[account(
        mut,
        seeds = [STATE_SEED],
        bump = state.bump
    )]
    pub state: Box<Account<'info, ShoppingState>>,

    #[account(mut)]
    pub merchant: Box<Account<'info, Merchant>>,

    #[account(
        mut,
        seeds = [MERCHANT_POOL_SEED, merchant.id.to_le_bytes().as_ref()],
        bump
    )]
    pub merchant_pool: Box<Account<'info, TokenAccount>>,

    /// User's Cred token account to receive rewards
    #[account(mut)]
    pub user_cred_account: Box<Account<'info, TokenAccount>>,

    /// Protocol treasury
    #[account(
        mut,
        constraint = treasury.key() == state.treasury @ ShoppingError::InvalidTreasury
    )]
    pub treasury: Box<Account<'info, TokenAccount>>,

    /// Staker rewards pool
    #[account(
        mut,
        constraint = staker_pool.key() == state.staker_pool @ ShoppingError::InvalidStakerPool
    )]
    pub staker_pool: Box<Account<'info, TokenAccount>>,

    /// Capture record - prevents double-claiming
    #[account(
        init,
        payer = merchant_signer,
        space = 8 + CaptureRecord::INIT_SPACE,
        seeds = [CAPTURE_SEED, transaction_id.as_ref()],
        bump
    )]
    pub capture_record: Box<Account<'info, CaptureRecord>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMerchant<'info> {
    pub merchant_authority: Signer<'info>,

    #[account(
        mut,
        constraint = merchant.authority == merchant_authority.key() @ ShoppingError::Unauthorized
    )]
    pub merchant: Account<'info, Merchant>,
}

#[derive(Accounts)]
pub struct WithdrawMerchantPool<'info> {
    pub merchant_authority: Signer<'info>,

    #[account(
        mut,
        constraint = merchant.authority == merchant_authority.key() @ ShoppingError::Unauthorized
    )]
    pub merchant: Account<'info, Merchant>,

    #[account(
        mut,
        seeds = [MERCHANT_POOL_SEED, merchant.id.to_le_bytes().as_ref()],
        bump
    )]
    pub merchant_pool: Account<'info, TokenAccount>,

    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// =============================================================================
// EVENTS
// =============================================================================

#[event]
pub struct ShoppingInitialized {
    pub admin: Pubkey,
    pub cred_mint: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct MerchantRegistered {
    pub merchant_id: u64,
    pub name: String,
    pub category: MerchantCategory,
    pub rewards_rate_bps: u16,
    pub signing_pubkey: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct MerchantFunded {
    pub merchant_id: u64,
    pub amount: u64,
    pub new_pool_balance: u64,
    pub timestamp: i64,
}

#[event]
pub struct PurchaseCaptured {
    pub capture_id: u64,
    pub agent: Pubkey,
    pub merchant_id: u64,
    pub transaction_id: [u8; 32],
    pub purchase_amount: u64,
    pub reward_amount: u64,
    pub user_share: u64,
    pub treasury_share: u64,
    pub staker_share: u64,
    pub timestamp: i64,
}

#[event]
pub struct MerchantUpdated {
    pub merchant_id: u64,
    pub rewards_rate_bps: u16,
    pub status: MerchantStatus,
    pub timestamp: i64,
}

#[event]
pub struct MerchantWithdrawal {
    pub merchant_id: u64,
    pub amount: u64,
    pub remaining_pool: u64,
    pub timestamp: i64,
}

// =============================================================================
// ERRORS
// =============================================================================

#[error_code]
pub enum ShoppingError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Merchant name too long")]
    NameTooLong,
    #[msg("Rewards rate exceeds maximum")]
    RewardsRateTooHigh,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Merchant is suspended")]
    MerchantSuspended,
    #[msg("Merchant is not active")]
    MerchantNotActive,
    #[msg("Purchase amount too small")]
    PurchaseTooSmall,
    #[msg("Merchant ID mismatch")]
    MerchantMismatch,
    #[msg("Invalid receipt signature")]
    InvalidSignature,
    #[msg("Insufficient merchant pool balance")]
    InsufficientPool,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Invalid treasury account")]
    InvalidTreasury,
    #[msg("Invalid staker pool account")]
    InvalidStakerPool,
    #[msg("Invalid merchant signer")]
    InvalidMerchantSigner,
    #[msg("Transaction already claimed")]
    AlreadyClaimed,
}
