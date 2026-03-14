use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint, MintTo, Burn};

declare_id!("5MPdaWr8CJCUvWigHSRy5xkvoTBKa1KfJHYRdKdMZ4t7");

/// Loop OXO Program
/// 
/// Protocol equity token with:
/// - Fixed 1B supply
/// - veOXO vote-escrowed staking (6mo-4yr, 0.25x-2x multiplier)
/// - Bonding curve for agent token launches
/// - Fee distribution to veOXO holders

// Constants
pub const OXO_TOTAL_SUPPLY: u64 = 1_000_000_000 * 1_000_000; // 1B with 6 decimals
pub const MIN_LOCK_SECONDS: i64 = 15_552_000;  // 6 months
pub const MAX_LOCK_SECONDS: i64 = 126_144_000; // 4 years
pub const GRADUATION_THRESHOLD: u64 = 25_000 * 1_000_000; // 25,000 OXO for agent graduation
pub const AGENT_CREATION_FEE: u64 = 500 * 1_000_000; // 500 OXO

#[program]
pub mod loop_oxo {
    use super::*;

    /// Initialize OXO token and protocol state
    pub fn initialize(
        ctx: Context<Initialize>,
        bump: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.oxo_mint = ctx.accounts.oxo_mint.key();
        config.treasury = ctx.accounts.treasury.key();
        config.total_ve_oxo = 0;
        config.total_locked = 0;
        config.fee_pool = 0;
        config.last_fee_distribution = Clock::get()?.unix_timestamp;
        config.bump = bump;
        config.initialized_at = Clock::get()?.unix_timestamp;
        config.agent_count = 0;
        
        emit!(ProtocolInitialized {
            authority: config.authority,
            oxo_mint: config.oxo_mint,
            initialized_at: config.initialized_at,
        });
        
        Ok(())
    }

    // =========================================================================
    // veOXO STAKING
    // =========================================================================

    /// Lock OXO to receive veOXO voting power
    pub fn lock_oxo(
        ctx: Context<LockOxo>,
        amount: u64,
        lock_seconds: i64,
        bump: u8,
    ) -> Result<()> {
        require!(amount > 0, OxoError::InvalidAmount);
        require!(lock_seconds >= MIN_LOCK_SECONDS, OxoError::LockTooShort);
        require!(lock_seconds <= MAX_LOCK_SECONDS, OxoError::LockTooLong);
        
        let now = Clock::get()?.unix_timestamp;
        let unlock_at = now.checked_add(lock_seconds).ok_or(OxoError::Overflow)?;
        
        // Calculate veOXO based on lock duration
        // 6 months = 0.25x, 1 year = 0.5x, 2 years = 1x, 4 years = 2x
        let ve_oxo = calculate_ve_oxo(amount, lock_seconds)?;
        
        // Transfer OXO to protocol
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_oxo_account.to_account_info(),
            to: ctx.accounts.protocol_oxo_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;
        
        // Create or update lock position
        let position = &mut ctx.accounts.ve_position;
        position.owner = ctx.accounts.owner.key();
        position.oxo_locked = position.oxo_locked.checked_add(amount).ok_or(OxoError::Overflow)?;
        position.ve_oxo_balance = position.ve_oxo_balance.checked_add(ve_oxo).ok_or(OxoError::Overflow)?;
        position.lock_start = now;
        position.unlock_at = unlock_at;
        position.last_claim = now;
        position.bump = bump;
        
        // Update global state
        let config = &mut ctx.accounts.config;
        config.total_ve_oxo = config.total_ve_oxo.checked_add(ve_oxo).ok_or(OxoError::Overflow)?;
        config.total_locked = config.total_locked.checked_add(amount).ok_or(OxoError::Overflow)?;
        
        emit!(OxoLocked {
            owner: position.owner,
            amount,
            ve_oxo,
            unlock_at,
        });
        
        Ok(())
    }

    /// Extend lock duration (increases veOXO)
    pub fn extend_lock(
        ctx: Context<ExtendLock>,
        additional_seconds: i64,
    ) -> Result<()> {
        let position = &mut ctx.accounts.ve_position;
        let now = Clock::get()?.unix_timestamp;
        
        require!(position.unlock_at > now, OxoError::AlreadyUnlocked);
        require!(additional_seconds > 0, OxoError::InvalidAmount);
        
        let new_unlock = position.unlock_at.checked_add(additional_seconds).ok_or(OxoError::Overflow)?;
        let total_lock_duration = new_unlock.checked_sub(now).ok_or(OxoError::Overflow)?;
        require!(total_lock_duration <= MAX_LOCK_SECONDS, OxoError::LockTooLong);
        
        // Recalculate veOXO with new duration
        let old_ve_oxo = position.ve_oxo_balance;
        let new_ve_oxo = calculate_ve_oxo(position.oxo_locked, total_lock_duration)?;
        let ve_oxo_increase = new_ve_oxo.saturating_sub(old_ve_oxo);
        
        position.unlock_at = new_unlock;
        position.ve_oxo_balance = new_ve_oxo;
        
        // Update global state
        let config = &mut ctx.accounts.config;
        config.total_ve_oxo = config.total_ve_oxo.checked_add(ve_oxo_increase).ok_or(OxoError::Overflow)?;
        
        emit!(LockExtended {
            owner: position.owner,
            new_unlock: new_unlock,
            new_ve_oxo: new_ve_oxo,
        });
        
        Ok(())
    }

    /// Withdraw OXO after lock expires
    pub fn unlock_oxo(
        ctx: Context<UnlockOxo>,
    ) -> Result<()> {
        let position = &mut ctx.accounts.ve_position;
        let now = Clock::get()?.unix_timestamp;
        
        require!(position.unlock_at <= now, OxoError::StillLocked);
        require!(position.oxo_locked > 0, OxoError::NothingToUnlock);
        
        let amount = position.oxo_locked;
        let ve_oxo = position.ve_oxo_balance;
        
        // Transfer OXO back to user
        let seeds = &[
            b"config".as_ref(),
            &[ctx.accounts.config.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.protocol_oxo_account.to_account_info(),
            to: ctx.accounts.user_oxo_account.to_account_info(),
            authority: ctx.accounts.config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, amount)?;
        
        // Update global state
        let config = &mut ctx.accounts.config;
        config.total_ve_oxo = config.total_ve_oxo.saturating_sub(ve_oxo);
        config.total_locked = config.total_locked.saturating_sub(amount);
        
        // Clear position
        position.oxo_locked = 0;
        position.ve_oxo_balance = 0;
        
        emit!(OxoUnlocked {
            owner: position.owner,
            amount,
        });
        
        Ok(())
    }

    /// Claim fee share for veOXO holders (uses decayed veOXO)
    pub fn claim_fee_share(
        ctx: Context<ClaimFeeShare>,
    ) -> Result<()> {
        let position = &ctx.accounts.ve_position;
        let config = &ctx.accounts.config;
        let now = Clock::get()?.unix_timestamp;
        
        // Calculate current veOXO with linear decay
        let current_ve_oxo = calculate_decayed_ve_oxo(
            position.ve_oxo_balance, // initial veOXO at lock time
            position.lock_start,
            position.unlock_at,
            now
        );
        
        require!(current_ve_oxo > 0, OxoError::NoVeOxo);
        require!(config.fee_pool > 0, OxoError::NoFeesToClaim);
        
        // Calculate share based on decayed veOXO proportion
        // share = (user_decayed_ve_oxo / total_ve_oxo) * fee_pool
        // Note: total_ve_oxo should ideally also be decayed, but for simplicity
        // we use stored value (conservative estimate)
        let share = (current_ve_oxo as u128)
            .checked_mul(config.fee_pool as u128)
            .ok_or(OxoError::Overflow)?
            .checked_div(config.total_ve_oxo as u128)
            .ok_or(OxoError::DivisionByZero)? as u64;
        
        require!(share > 0, OxoError::ShareTooSmall);
        
        // Transfer Cred from fee pool to user
        let seeds = &[
            b"config".as_ref(),
            &[config.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.fee_pool_account.to_account_info(),
            to: ctx.accounts.user_cred_account.to_account_info(),
            authority: ctx.accounts.config.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, share)?;
        
        // Update state
        let config = &mut ctx.accounts.config;
        config.fee_pool = config.fee_pool.saturating_sub(share);
        
        let position = &mut ctx.accounts.ve_position;
        position.last_claim = now;
        
        emit!(FeesClaimed {
            owner: position.owner,
            amount: share,
        });
        
        Ok(())
    }
    
    /// Get current decayed veOXO balance (view function)
    pub fn get_current_ve_oxo(
        ctx: Context<GetCurrentVeOxo>,
    ) -> Result<u64> {
        let position = &ctx.accounts.ve_position;
        let now = Clock::get()?.unix_timestamp;
        
        let current_ve_oxo = calculate_decayed_ve_oxo(
            position.ve_oxo_balance,
            position.lock_start,
            position.unlock_at,
            now
        );
        
        Ok(current_ve_oxo)
    }

    // =========================================================================
    // BONDING CURVE (Agent Token Launches)
    // =========================================================================

    /// Create a new agent token with bonding curve
    pub fn create_agent_token(
        ctx: Context<CreateAgentToken>,
        name: String,
        symbol: String,
        uri: String,
        bump: u8,
    ) -> Result<()> {
        require!(name.len() <= 32, OxoError::NameTooLong);
        require!(symbol.len() <= 10, OxoError::SymbolTooLong);
        require!(uri.len() <= 200, OxoError::UriTooLong);
        
        // Collect creation fee (500 OXO)
        let cpi_accounts = Transfer {
            from: ctx.accounts.creator_oxo_account.to_account_info(),
            to: ctx.accounts.treasury_oxo_account.to_account_info(),
            authority: ctx.accounts.creator.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, AGENT_CREATION_FEE)?;
        
        // Initialize agent bonding curve state
        let curve = &mut ctx.accounts.bonding_curve;
        curve.creator = ctx.accounts.creator.key();
        curve.agent_mint = ctx.accounts.agent_mint.key();
        curve.oxo_reserve = 0;
        curve.token_supply = 0;
        curve.graduated = false;
        curve.created_at = Clock::get()?.unix_timestamp;
        curve.graduated_at = 0;
        curve.lp_lock_until = 0;
        curve.lp_tokens_locked = 0;
        curve.bump = bump;
        
        // Increment agent count
        let config = &mut ctx.accounts.config;
        config.agent_count = config.agent_count.checked_add(1).ok_or(OxoError::Overflow)?;
        
        emit!(AgentTokenCreated {
            creator: curve.creator,
            agent_mint: curve.agent_mint,
            name: name.clone(),
            symbol: symbol.clone(),
        });
        
        Ok(())
    }

    /// Buy agent tokens on bonding curve (pre-graduation)
    pub fn buy_agent_token(
        ctx: Context<BuyAgentToken>,
        oxo_amount: u64,
    ) -> Result<()> {
        // Read values first before mutable borrow
        let graduated = ctx.accounts.bonding_curve.graduated;
        let current_reserve = ctx.accounts.bonding_curve.oxo_reserve;
        let agent_mint_key = ctx.accounts.bonding_curve.agent_mint;
        let curve_bump = ctx.accounts.bonding_curve.bump;
        
        require!(!graduated, OxoError::AlreadyGraduated);
        require!(oxo_amount > 0, OxoError::InvalidAmount);
        
        // Calculate tokens to mint based on bonding curve
        let tokens_to_mint = calculate_bonding_curve_buy(current_reserve, oxo_amount)?;
        
        // Transfer OXO to curve reserve
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_oxo_account.to_account_info(),
            to: ctx.accounts.curve_oxo_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, oxo_amount)?;
        
        // Mint agent tokens to buyer
        let seeds = &[
            b"bonding_curve".as_ref(),
            agent_mint_key.as_ref(),
            &[curve_bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = MintTo {
            mint: ctx.accounts.agent_mint.to_account_info(),
            to: ctx.accounts.buyer_agent_account.to_account_info(),
            authority: ctx.accounts.bonding_curve.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::mint_to(cpi_ctx, tokens_to_mint)?;
        
        // Now do mutable update
        let curve = &mut ctx.accounts.bonding_curve;
        curve.oxo_reserve = curve.oxo_reserve.checked_add(oxo_amount).ok_or(OxoError::Overflow)?;
        curve.token_supply = curve.token_supply.checked_add(tokens_to_mint).ok_or(OxoError::Overflow)?;
        
        // Check for graduation
        if curve.oxo_reserve >= GRADUATION_THRESHOLD {
            curve.graduated = true;
            emit!(AgentGraduated {
                agent_mint: curve.agent_mint,
                final_reserve: curve.oxo_reserve,
                final_supply: curve.token_supply,
            });
        }
        
        emit!(AgentTokenBought {
            buyer: ctx.accounts.buyer.key(),
            agent_mint: curve.agent_mint,
            oxo_spent: oxo_amount,
            tokens_received: tokens_to_mint,
        });
        
        Ok(())
    }

    /// Sell agent tokens back to bonding curve (pre-graduation)
    pub fn sell_agent_token(
        ctx: Context<SellAgentToken>,
        token_amount: u64,
    ) -> Result<()> {
        // Read values first before mutable borrow
        let graduated = ctx.accounts.bonding_curve.graduated;
        let current_reserve = ctx.accounts.bonding_curve.oxo_reserve;
        let current_supply = ctx.accounts.bonding_curve.token_supply;
        let agent_mint_key = ctx.accounts.bonding_curve.agent_mint;
        let curve_bump = ctx.accounts.bonding_curve.bump;
        
        require!(!graduated, OxoError::AlreadyGraduated);
        require!(token_amount > 0, OxoError::InvalidAmount);
        require!(current_supply >= token_amount, OxoError::InsufficientSupply);
        
        // Calculate OXO to return
        let oxo_to_return = calculate_bonding_curve_sell(current_reserve, current_supply, token_amount)?;
        
        // 1% sell fee (to prevent arbitrage)
        let fee = oxo_to_return / 100;
        let oxo_after_fee = oxo_to_return.saturating_sub(fee);
        
        // Burn agent tokens
        let cpi_accounts = Burn {
            mint: ctx.accounts.agent_mint.to_account_info(),
            from: ctx.accounts.seller_agent_account.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::burn(cpi_ctx, token_amount)?;
        
        // Transfer OXO back to seller
        let seeds = &[
            b"bonding_curve".as_ref(),
            agent_mint_key.as_ref(),
            &[curve_bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.curve_oxo_account.to_account_info(),
            to: ctx.accounts.seller_oxo_account.to_account_info(),
            authority: ctx.accounts.bonding_curve.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, oxo_after_fee)?;
        
        // Now do mutable update
        let curve = &mut ctx.accounts.bonding_curve;
        curve.oxo_reserve = curve.oxo_reserve.saturating_sub(oxo_to_return);
        curve.token_supply = curve.token_supply.saturating_sub(token_amount);
        
        emit!(AgentTokenSold {
            seller: ctx.accounts.seller.key(),
            agent_mint: curve.agent_mint,
            tokens_sold: token_amount,
            oxo_received: oxo_after_fee,
        });
        
        Ok(())
    }

    /// Graduate agent token - locks LP for 10 years
    /// Called after bonding curve reaches 25k OXO threshold
    /// Creates liquidity pool and locks the LP tokens
    pub fn graduate_agent_token(
        ctx: Context<GraduateAgentToken>,
    ) -> Result<()> {
        let curve = &ctx.accounts.bonding_curve;
        
        // Verify graduation threshold reached
        require!(curve.oxo_reserve >= GRADUATION_THRESHOLD, OxoError::BelowGraduationThreshold);
        require!(!curve.graduated, OxoError::AlreadyGraduated);
        
        let now = Clock::get()?.unix_timestamp;
        
        // LP lock period: 10 years (in seconds)
        const LP_LOCK_YEARS: i64 = 10;
        const SECONDS_PER_YEAR: i64 = 31_536_000;
        let lp_lock_until = now.checked_add(LP_LOCK_YEARS * SECONDS_PER_YEAR)
            .ok_or(OxoError::Overflow)?;
        
        // Calculate LP tokens to create
        // In production: This would CPI to Raydium to create AMM pool
        // For now: We record the graduation and simulate LP token amount
        // LP tokens = sqrt(oxo_reserve * token_supply) as a simple formula
        let lp_tokens = integer_sqrt(
            (curve.oxo_reserve as u128)
                .checked_mul(curve.token_supply as u128)
                .ok_or(OxoError::Overflow)?
        );
        
        // Update curve state
        let curve = &mut ctx.accounts.bonding_curve;
        curve.graduated = true;
        curve.graduated_at = now;
        curve.lp_lock_until = lp_lock_until;
        curve.lp_tokens_locked = lp_tokens as u64;
        
        emit!(AgentTokenGraduated {
            agent_mint: curve.agent_mint,
            creator: curve.creator,
            oxo_reserve: curve.oxo_reserve,
            token_supply: curve.token_supply,
            lp_tokens_locked: curve.lp_tokens_locked,
            lp_lock_until: curve.lp_lock_until,
            graduated_at: curve.graduated_at,
        });
        
        Ok(())
    }

    /// Claim unlocked LP tokens after 10 year lock period
    pub fn claim_graduated_lp(
        ctx: Context<ClaimGraduatedLp>,
    ) -> Result<()> {
        let curve = &ctx.accounts.bonding_curve;
        let now = Clock::get()?.unix_timestamp;
        
        require!(curve.graduated, OxoError::NotGraduated);
        require!(now >= curve.lp_lock_until, OxoError::LpStillLocked);
        require!(curve.lp_tokens_locked > 0, OxoError::NoLpToClaim);
        require!(curve.creator == ctx.accounts.creator.key(), OxoError::Unauthorized);
        
        let lp_amount = curve.lp_tokens_locked;
        
        // Update state
        let curve = &mut ctx.accounts.bonding_curve;
        curve.lp_tokens_locked = 0;
        
        // In production: Transfer actual LP tokens to creator
        // For now: Just emit event
        
        emit!(LpTokensClaimed {
            agent_mint: curve.agent_mint,
            creator: ctx.accounts.creator.key(),
            lp_amount,
        });
        
        Ok(())
    }

    // =========================================================================
    // TREASURY / FEE MANAGEMENT
    // =========================================================================

    /// Deposit fees into fee pool (called by capture modules)
    pub fn deposit_fees(
        ctx: Context<DepositFees>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, OxoError::InvalidAmount);
        
        // Transfer Cred to fee pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.source_account.to_account_info(),
            to: ctx.accounts.fee_pool_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;
        
        // Update fee pool
        let config = &mut ctx.accounts.config;
        config.fee_pool = config.fee_pool.checked_add(amount).ok_or(OxoError::Overflow)?;
        
        emit!(FeesDeposited {
            amount,
            new_pool_balance: config.fee_pool,
        });
        
        Ok(())
    }
}

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/// Calculate veOXO based on lock duration
/// 6 months = 0.25x, 1 year = 0.5x, 2 years = 1x, 4 years = 2x
fn calculate_ve_oxo(amount: u64, lock_seconds: i64) -> Result<u64> {
    // Linear interpolation between 6mo (0.25x) and 4yr (2x)
    // multiplier = 0.25 + (lock_seconds - 6mo) / (4yr - 6mo) * (2 - 0.25)
    
    let six_months = MIN_LOCK_SECONDS;
    let four_years = MAX_LOCK_SECONDS;
    
    if lock_seconds <= six_months {
        // 0.25x
        return Ok(amount / 4);
    }
    
    if lock_seconds >= four_years {
        // 2x
        return Ok(amount.checked_mul(2).ok_or(OxoError::Overflow)?);
    }
    
    // Linear interpolation
    // Range: 6mo to 4yr = 110,592,000 seconds
    // Multiplier range: 0.25 to 2 = 1.75
    let range = (four_years - six_months) as u128;
    let progress = (lock_seconds - six_months) as u128;
    
    // Base: 0.25x (25%)
    // Additional: up to 1.75x (175%)
    let base_multiplier: u128 = 25;
    let additional = progress
        .checked_mul(175)
        .ok_or(OxoError::Overflow)?
        .checked_div(range)
        .ok_or(OxoError::DivisionByZero)?;
    
    let total_multiplier = base_multiplier + additional;
    
    let ve_oxo = (amount as u128)
        .checked_mul(total_multiplier)
        .ok_or(OxoError::Overflow)?
        .checked_div(100)
        .ok_or(OxoError::DivisionByZero)? as u64;
    
    Ok(ve_oxo)
}

/// Calculate tokens to mint for given OXO on bonding curve
/// Using quadratic curve: price increases with supply
/// P(s) = k * s, where s is supply
/// For simplicity: tokens = OXO_amount / (base_price + k * current_supply)
fn calculate_bonding_curve_buy(reserve: u64, oxo_amount: u64) -> Result<u64> {
    // Simplified: constant price of 1 OXO per 1000 tokens initially
    // Price increases as supply grows
    let base_rate: u64 = 1000; // tokens per OXO at zero supply
    
    // Price factor based on reserve (higher reserve = higher price)
    // Rate decreases as reserve increases
    let price_factor = (reserve / 1_000_000).checked_add(1).unwrap_or(1);
    let adjusted_rate = base_rate.checked_div(price_factor).unwrap_or(1);
    
    let tokens = oxo_amount.checked_mul(adjusted_rate.max(1)).ok_or(OxoError::Overflow)?;
    
    Ok(tokens)
}

/// Calculate OXO to return for selling tokens
fn calculate_bonding_curve_sell(reserve: u64, supply: u64, tokens: u64) -> Result<u64> {
    // OXO = tokens * reserve / supply
    let oxo = (tokens as u128)
        .checked_mul(reserve as u128)
        .ok_or(OxoError::Overflow)?
        .checked_div(supply as u128)
        .ok_or(OxoError::DivisionByZero)? as u64;
    
    Ok(oxo)
}

/// Calculate current veOXO with linear decay
/// veOXO decays linearly from initial amount to 0 at unlock time
fn calculate_decayed_ve_oxo(initial_ve_oxo: u64, lock_start: i64, unlock_at: i64, now: i64) -> u64 {
    if now >= unlock_at {
        return 0;
    }
    if now <= lock_start {
        return initial_ve_oxo;
    }
    
    let total_duration = unlock_at - lock_start;
    let time_remaining = unlock_at - now;
    
    // veOXO = initial * (time_remaining / total_duration)
    ((initial_ve_oxo as u128 * time_remaining as u128) / total_duration as u128) as u64
}

// =========================================================================
// ACCOUNTS
// =========================================================================

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + OxoConfig::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, OxoConfig>,
    
    pub oxo_mint: Account<'info, Mint>,
    
    /// CHECK: Treasury account for protocol fees
    pub treasury: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, lock_seconds: i64, bump: u8)]
pub struct LockOxo<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub config: Account<'info, OxoConfig>,
    
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + VeOxoPosition::INIT_SPACE,
        seeds = [b"ve_position", owner.key().as_ref()],
        bump,
    )]
    pub ve_position: Account<'info, VeOxoPosition>,
    
    #[account(mut)]
    pub user_oxo_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub protocol_oxo_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExtendLock<'info> {
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub config: Account<'info, OxoConfig>,
    
    #[account(
        mut,
        seeds = [b"ve_position", owner.key().as_ref()],
        bump = ve_position.bump,
        constraint = ve_position.owner == owner.key() @ OxoError::Unauthorized,
    )]
    pub ve_position: Account<'info, VeOxoPosition>,
}

#[derive(Accounts)]
pub struct UnlockOxo<'info> {
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub config: Account<'info, OxoConfig>,
    
    #[account(
        mut,
        seeds = [b"ve_position", owner.key().as_ref()],
        bump = ve_position.bump,
        constraint = ve_position.owner == owner.key() @ OxoError::Unauthorized,
    )]
    pub ve_position: Account<'info, VeOxoPosition>,
    
    #[account(mut)]
    pub user_oxo_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub protocol_oxo_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimFeeShare<'info> {
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub config: Account<'info, OxoConfig>,
    
    #[account(
        mut,
        seeds = [b"ve_position", owner.key().as_ref()],
        bump = ve_position.bump,
        constraint = ve_position.owner == owner.key() @ OxoError::Unauthorized,
    )]
    pub ve_position: Account<'info, VeOxoPosition>,
    
    #[account(mut)]
    pub fee_pool_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_cred_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetCurrentVeOxo<'info> {
    #[account(
        seeds = [b"ve_position", owner.key().as_ref()],
        bump = ve_position.bump,
        constraint = ve_position.owner == owner.key() @ OxoError::Unauthorized,
    )]
    pub ve_position: Account<'info, VeOxoPosition>,
    
    /// CHECK: Just reading the owner key
    pub owner: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String, uri: String, bump: u8)]
pub struct CreateAgentToken<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(mut)]
    pub config: Account<'info, OxoConfig>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + BondingCurve::INIT_SPACE,
        seeds = [b"bonding_curve", agent_mint.key().as_ref()],
        bump,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    #[account(mut)]
    pub agent_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub creator_oxo_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub treasury_oxo_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyAgentToken<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"bonding_curve", agent_mint.key().as_ref()],
        bump = bonding_curve.bump,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    #[account(mut)]
    pub agent_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub buyer_oxo_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub buyer_agent_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub curve_oxo_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SellAgentToken<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"bonding_curve", agent_mint.key().as_ref()],
        bump = bonding_curve.bump,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    #[account(mut)]
    pub agent_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub seller_oxo_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub seller_agent_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub curve_oxo_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GraduateAgentToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"bonding_curve", agent_mint.key().as_ref()],
        bump = bonding_curve.bump,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    /// CHECK: Just reading the mint key
    pub agent_mint: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ClaimGraduatedLp<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"bonding_curve", agent_mint.key().as_ref()],
        bump = bonding_curve.bump,
        constraint = bonding_curve.creator == creator.key() @ OxoError::Unauthorized,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    
    /// CHECK: Just reading the mint key
    pub agent_mint: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct DepositFees<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub config: Account<'info, OxoConfig>,
    
    #[account(mut)]
    pub source_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fee_pool_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

// =========================================================================
// STATE
// =========================================================================

#[account]
#[derive(InitSpace)]
pub struct OxoConfig {
    pub authority: Pubkey,
    pub oxo_mint: Pubkey,
    pub treasury: Pubkey,
    pub total_ve_oxo: u64,
    pub total_locked: u64,
    pub fee_pool: u64,
    pub last_fee_distribution: i64,
    pub initialized_at: i64,
    pub agent_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VeOxoPosition {
    pub owner: Pubkey,
    pub oxo_locked: u64,
    pub ve_oxo_balance: u64,
    pub lock_start: i64,
    pub unlock_at: i64,
    pub last_claim: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct BondingCurve {
    pub creator: Pubkey,
    pub agent_mint: Pubkey,
    pub oxo_reserve: u64,
    pub token_supply: u64,
    pub graduated: bool,
    pub created_at: i64,
    pub graduated_at: i64,         // Timestamp when graduated (0 if not graduated)
    pub lp_lock_until: i64,        // LP locked until this time (10 years post-graduation)
    pub lp_tokens_locked: u64,     // Amount of LP tokens locked
    pub bump: u8,
}

// =========================================================================
// EVENTS
// =========================================================================

#[event]
pub struct ProtocolInitialized {
    pub authority: Pubkey,
    pub oxo_mint: Pubkey,
    pub initialized_at: i64,
}

#[event]
pub struct OxoLocked {
    pub owner: Pubkey,
    pub amount: u64,
    pub ve_oxo: u64,
    pub unlock_at: i64,
}

#[event]
pub struct LockExtended {
    pub owner: Pubkey,
    pub new_unlock: i64,
    pub new_ve_oxo: u64,
}

#[event]
pub struct OxoUnlocked {
    pub owner: Pubkey,
    pub amount: u64,
}

#[event]
pub struct FeesClaimed {
    pub owner: Pubkey,
    pub amount: u64,
}

#[event]
pub struct FeesDeposited {
    pub amount: u64,
    pub new_pool_balance: u64,
}

#[event]
pub struct AgentTokenCreated {
    pub creator: Pubkey,
    pub agent_mint: Pubkey,
    pub name: String,
    pub symbol: String,
}

#[event]
pub struct AgentGraduated {
    pub agent_mint: Pubkey,
    pub final_reserve: u64,
    pub final_supply: u64,
}

#[event]
pub struct AgentTokenBought {
    pub buyer: Pubkey,
    pub agent_mint: Pubkey,
    pub oxo_spent: u64,
    pub tokens_received: u64,
}

#[event]
pub struct AgentTokenSold {
    pub seller: Pubkey,
    pub agent_mint: Pubkey,
    pub tokens_sold: u64,
    pub oxo_received: u64,
}

#[event]
pub struct AgentTokenGraduated {
    pub agent_mint: Pubkey,
    pub creator: Pubkey,
    pub oxo_reserve: u64,
    pub token_supply: u64,
    pub lp_tokens_locked: u64,
    pub lp_lock_until: i64,
    pub graduated_at: i64,
}

#[event]
pub struct LpTokensClaimed {
    pub agent_mint: Pubkey,
    pub creator: Pubkey,
    pub lp_amount: u64,
}

// =========================================================================
// ERRORS
// =========================================================================

#[error_code]
pub enum OxoError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Lock duration too short (minimum 6 months)")]
    LockTooShort,
    #[msg("Lock duration too long (maximum 4 years)")]
    LockTooLong,
    #[msg("Position still locked")]
    StillLocked,
    #[msg("Position already unlocked")]
    AlreadyUnlocked,
    #[msg("Nothing to unlock")]
    NothingToUnlock,
    #[msg("No veOXO balance")]
    NoVeOxo,
    #[msg("No fees to claim")]
    NoFeesToClaim,
    #[msg("Fee share too small")]
    ShareTooSmall,
    #[msg("Agent already graduated")]
    AlreadyGraduated,
    #[msg("Insufficient token supply")]
    InsufficientSupply,
    #[msg("Name too long (max 32 chars)")]
    NameTooLong,
    #[msg("Symbol too long (max 10 chars)")]
    SymbolTooLong,
    #[msg("URI too long (max 200 chars)")]
    UriTooLong,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Overflow")]
    Overflow,
    #[msg("Division by zero")]
    DivisionByZero,
    #[msg("Below graduation threshold (25,000 OXO)")]
    BelowGraduationThreshold,
    #[msg("Agent not graduated yet")]
    NotGraduated,
    #[msg("LP tokens still locked")]
    LpStillLocked,
    #[msg("No LP tokens to claim")]
    NoLpToClaim,
}

// =========================================================================
// HELPERS
// =========================================================================

/// Integer square root using Newton's method
fn integer_sqrt(n: u128) -> u128 {
    if n == 0 {
        return 0;
    }
    let mut x = n;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + n / x) / 2;
    }
    x
}
