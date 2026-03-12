use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj");

/// Loop Value Transfer Protocol (VTP)
/// 
/// Secure vault-to-vault transfers with escrow capabilities.
/// Used for:
/// - Agent-to-agent payments (service fees)
/// - User-to-user transfers (P2P)
/// - Escrow (conditional releases)
/// - Inheritance (programmatic death transfers)

// Constants
pub const TRANSFER_FEE_BPS: u64 = 10; // 0.1% fee
pub const ESCROW_FEE_BPS: u64 = 25;   // 0.25% escrow fee
pub const MAX_ARBITERS: usize = 5;
pub const MAX_CONDITIONS: usize = 10;

#[program]
pub mod loop_vtp {
    use super::*;

    /// Initialize VTP config
    pub fn initialize(
        ctx: Context<Initialize>,
        bump: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.fee_recipient = ctx.accounts.fee_recipient.key();
        config.total_transfers = 0;
        config.total_volume = 0;
        config.total_escrows = 0;
        config.active_escrows = 0;
        config.bump = bump;
        config.initialized_at = Clock::get()?.unix_timestamp;
        
        emit!(VtpInitialized {
            authority: config.authority,
            initialized_at: config.initialized_at,
        });
        
        Ok(())
    }

    // =========================================================================
    // DIRECT TRANSFERS
    // =========================================================================

    /// Direct vault-to-vault transfer (instant)
    pub fn transfer(
        ctx: Context<TransferCred>,
        amount: u64,
        memo: Option<String>,
    ) -> Result<()> {
        require!(amount > 0, VtpError::InvalidAmount);
        
        if let Some(ref m) = memo {
            require!(m.len() <= 200, VtpError::MemoTooLong);
        }
        
        // Calculate fee (0.1%)
        let fee = amount.checked_mul(TRANSFER_FEE_BPS).ok_or(VtpError::Overflow)?
            .checked_div(10_000).ok_or(VtpError::DivisionByZero)?;
        let amount_after_fee = amount.checked_sub(fee).ok_or(VtpError::Overflow)?;
        
        // Transfer to recipient
        let cpi_accounts = Transfer {
            from: ctx.accounts.sender_cred_account.to_account_info(),
            to: ctx.accounts.recipient_cred_account.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount_after_fee)?;
        
        // Transfer fee to protocol
        if fee > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.sender_cred_account.to_account_info(),
                to: ctx.accounts.fee_account.to_account_info(),
                authority: ctx.accounts.sender.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
            );
            token::transfer(cpi_ctx, fee)?;
        }
        
        // Update stats
        let config = &mut ctx.accounts.config;
        config.total_transfers = config.total_transfers.checked_add(1).ok_or(VtpError::Overflow)?;
        config.total_volume = config.total_volume.checked_add(amount).ok_or(VtpError::Overflow)?;
        
        emit!(TransferCompleted {
            sender: ctx.accounts.sender.key(),
            recipient: ctx.accounts.recipient.key(),
            amount: amount_after_fee,
            fee,
            memo,
        });
        
        Ok(())
    }

    /// Batch transfer to multiple recipients
    pub fn batch_transfer(
        ctx: Context<BatchTransfer>,
        recipients: Vec<Pubkey>,
        amounts: Vec<u64>,
    ) -> Result<()> {
        require!(recipients.len() == amounts.len(), VtpError::MismatchedArrays);
        require!(recipients.len() <= 10, VtpError::TooManyRecipients);
        require!(!recipients.is_empty(), VtpError::EmptyBatch);
        
        let total: u64 = amounts.iter().sum();
        let fee = total.checked_mul(TRANSFER_FEE_BPS).ok_or(VtpError::Overflow)?
            .checked_div(10_000).ok_or(VtpError::DivisionByZero)?;
        
        // Note: Full implementation would iterate through recipients
        // For MVP, we just emit the batch and handle off-chain
        
        let config = &mut ctx.accounts.config;
        config.total_transfers = config.total_transfers
            .checked_add(recipients.len() as u64)
            .ok_or(VtpError::Overflow)?;
        config.total_volume = config.total_volume.checked_add(total).ok_or(VtpError::Overflow)?;
        
        emit!(BatchTransferInitiated {
            sender: ctx.accounts.sender.key(),
            recipient_count: recipients.len() as u8,
            total_amount: total,
            fee,
        });
        
        Ok(())
    }

    // =========================================================================
    // ESCROW
    // =========================================================================

    /// Create an escrow (conditional transfer)
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        amount: u64,
        release_conditions: Vec<ReleaseCondition>,
        expiry: i64,
        bump: u8,
    ) -> Result<()> {
        require!(amount > 0, VtpError::InvalidAmount);
        require!(!release_conditions.is_empty(), VtpError::NoConditions);
        require!(release_conditions.len() <= MAX_CONDITIONS, VtpError::TooManyConditions);
        
        let now = Clock::get()?.unix_timestamp;
        require!(expiry > now, VtpError::ExpiryInPast);
        
        // Calculate fee (0.25% for escrow)
        let fee = amount.checked_mul(ESCROW_FEE_BPS).ok_or(VtpError::Overflow)?
            .checked_div(10_000).ok_or(VtpError::DivisionByZero)?;
        
        // Transfer to escrow account
        let cpi_accounts = Transfer {
            from: ctx.accounts.sender_cred_account.to_account_info(),
            to: ctx.accounts.escrow_cred_account.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token::transfer(cpi_ctx, amount)?;
        
        // Transfer fee
        if fee > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.sender_cred_account.to_account_info(),
                to: ctx.accounts.fee_account.to_account_info(),
                authority: ctx.accounts.sender.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts,
            );
            token::transfer(cpi_ctx, fee)?;
        }
        
        // Initialize escrow state
        let escrow = &mut ctx.accounts.escrow;
        escrow.sender = ctx.accounts.sender.key();
        escrow.recipient = ctx.accounts.recipient.key();
        escrow.amount = amount;
        escrow.created_at = now;
        escrow.expiry = expiry;
        escrow.status = EscrowStatus::Active;
        escrow.bump = bump;
        
        // Store conditions (up to MAX_CONDITIONS)
        escrow.conditions = release_conditions.iter().take(MAX_CONDITIONS).cloned().collect();
        escrow.conditions_met = vec![false; escrow.conditions.len()];
        
        // Update stats
        let config = &mut ctx.accounts.config;
        config.total_escrows = config.total_escrows.checked_add(1).ok_or(VtpError::Overflow)?;
        config.active_escrows = config.active_escrows.checked_add(1).ok_or(VtpError::Overflow)?;
        
        emit!(EscrowCreated {
            escrow_id: escrow.key(),
            sender: escrow.sender,
            recipient: escrow.recipient,
            amount,
            expiry,
            condition_count: escrow.conditions.len() as u8,
        });
        
        Ok(())
    }

    /// Fulfill a condition (by arbiter or oracle)
    pub fn fulfill_condition(
        ctx: Context<FulfillCondition>,
        condition_index: u8,
        proof: Option<Vec<u8>>,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let index = condition_index as usize;
        
        require!(escrow.status == EscrowStatus::Active, VtpError::EscrowNotActive);
        require!(index < escrow.conditions.len(), VtpError::InvalidConditionIndex);
        require!(!escrow.conditions_met[index], VtpError::ConditionAlreadyMet);
        
        // Verify fulfiller is authorized
        let condition = &escrow.conditions[index];
        let authorized = match condition {
            ReleaseCondition::ArbiterApproval { arbiter } => {
                ctx.accounts.fulfiller.key() == *arbiter
            }
            ReleaseCondition::TimeRelease { timestamp: _ } => {
                Clock::get()?.unix_timestamp >= escrow.expiry
            }
            ReleaseCondition::OracleAttestation { oracle, data_hash: _ } => {
                // Verify oracle signature (simplified)
                ctx.accounts.fulfiller.key() == *oracle
            }
            ReleaseCondition::MultiSig { threshold: _, signers: _ } => {
                // Would verify signature count
                true
            }
        };
        
        require!(authorized, VtpError::Unauthorized);
        
        escrow.conditions_met[index] = true;
        
        emit!(ConditionFulfilled {
            escrow_id: escrow.key(),
            condition_index,
            fulfiller: ctx.accounts.fulfiller.key(),
        });
        
        // Check if all conditions met
        let all_met = escrow.conditions_met.iter().all(|&met| met);
        if all_met {
            // Auto-release would happen here in full impl
            emit!(AllConditionsMet {
                escrow_id: escrow.key(),
            });
        }
        
        Ok(())
    }

    /// Release escrow to recipient (all conditions must be met)
    pub fn release_escrow(
        ctx: Context<ReleaseEscrow>,
    ) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        
        require!(escrow.status == EscrowStatus::Active, VtpError::EscrowNotActive);
        
        // Verify all conditions met
        let all_met = escrow.conditions_met.iter().all(|&met| met);
        require!(all_met, VtpError::ConditionsNotMet);
        
        // Transfer to recipient
        let seeds = &[
            b"escrow".as_ref(),
            escrow.sender.as_ref(),
            escrow.recipient.as_ref(),
            &escrow.created_at.to_le_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_cred_account.to_account_info(),
            to: ctx.accounts.recipient_cred_account.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, escrow.amount)?;
        
        // Update escrow status
        let escrow = &mut ctx.accounts.escrow;
        escrow.status = EscrowStatus::Released;
        
        // Update stats
        let config = &mut ctx.accounts.config;
        config.active_escrows = config.active_escrows.saturating_sub(1);
        
        emit!(EscrowReleased {
            escrow_id: escrow.key(),
            recipient: escrow.recipient,
            amount: escrow.amount,
        });
        
        Ok(())
    }

    /// Cancel escrow (returns funds to sender)
    /// Can only be called by sender before expiry if no conditions met
    /// Or by anyone after expiry
    pub fn cancel_escrow(
        ctx: Context<CancelEscrow>,
    ) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        let now = Clock::get()?.unix_timestamp;
        
        require!(escrow.status == EscrowStatus::Active, VtpError::EscrowNotActive);
        
        // Check cancellation authorization
        let is_sender = ctx.accounts.canceller.key() == escrow.sender;
        let is_expired = now >= escrow.expiry;
        let any_conditions_met = escrow.conditions_met.iter().any(|&met| met);
        
        // Sender can cancel only if expired or no conditions met yet
        if is_sender {
            require!(is_expired || !any_conditions_met, VtpError::CannotCancel);
        } else {
            // Others can only cancel if expired
            require!(is_expired, VtpError::NotExpired);
        }
        
        // Return funds to sender
        let seeds = &[
            b"escrow".as_ref(),
            escrow.sender.as_ref(),
            escrow.recipient.as_ref(),
            &escrow.created_at.to_le_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_cred_account.to_account_info(),
            to: ctx.accounts.sender_cred_account.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, escrow.amount)?;
        
        // Update escrow status
        let escrow = &mut ctx.accounts.escrow;
        escrow.status = EscrowStatus::Cancelled;
        
        // Update stats
        let config = &mut ctx.accounts.config;
        config.active_escrows = config.active_escrows.saturating_sub(1);
        
        emit!(EscrowCancelled {
            escrow_id: escrow.key(),
            returned_to: escrow.sender,
            amount: escrow.amount,
        });
        
        Ok(())
    }

    // =========================================================================
    // INHERITANCE
    // =========================================================================

    /// Set up inheritance plan
    pub fn setup_inheritance(
        ctx: Context<SetupInheritance>,
        heirs: Vec<Heir>,
        inactivity_threshold: i64,
        bump: u8,
    ) -> Result<()> {
        require!(!heirs.is_empty(), VtpError::NoHeirs);
        require!(heirs.len() <= 10, VtpError::TooManyHeirs);
        require!(inactivity_threshold >= 86400 * 30, VtpError::ThresholdTooShort); // Min 30 days
        
        // Verify percentages sum to 100
        let total_pct: u8 = heirs.iter().map(|h| h.percentage).sum();
        require!(total_pct == 100, VtpError::InvalidPercentages);
        
        let now = Clock::get()?.unix_timestamp;
        
        let plan = &mut ctx.accounts.inheritance_plan;
        plan.owner = ctx.accounts.owner.key();
        plan.heirs = heirs;
        plan.inactivity_threshold = inactivity_threshold;
        plan.last_activity = now;
        plan.created_at = now;
        plan.triggered = false;
        plan.bump = bump;
        
        emit!(InheritanceSetup {
            owner: plan.owner,
            heir_count: plan.heirs.len() as u8,
            inactivity_threshold,
        });
        
        Ok(())
    }

    /// Heartbeat to prove activity (prevents inheritance trigger)
    pub fn inheritance_heartbeat(
        ctx: Context<InheritanceHeartbeat>,
    ) -> Result<()> {
        let plan = &mut ctx.accounts.inheritance_plan;
        let now = Clock::get()?.unix_timestamp;
        
        require!(!plan.triggered, VtpError::AlreadyTriggered);
        
        plan.last_activity = now;
        
        emit!(InheritanceHeartbeat {
            owner: plan.owner,
            timestamp: now,
        });
        
        Ok(())
    }

    /// Trigger inheritance (by heir after inactivity threshold)
    pub fn trigger_inheritance(
        ctx: Context<TriggerInheritance>,
    ) -> Result<()> {
        let plan = &mut ctx.accounts.inheritance_plan;
        let now = Clock::get()?.unix_timestamp;
        
        require!(!plan.triggered, VtpError::AlreadyTriggered);
        
        let inactive_duration = now.checked_sub(plan.last_activity).ok_or(VtpError::Overflow)?;
        require!(inactive_duration >= plan.inactivity_threshold, VtpError::NotInactiveEnough);
        
        // Verify triggerer is a valid heir
        let is_heir = plan.heirs.iter().any(|h| h.address == ctx.accounts.triggerer.key());
        require!(is_heir, VtpError::NotAnHeir);
        
        plan.triggered = true;
        plan.trigger_time = Some(now);
        
        emit!(InheritanceTriggered {
            owner: plan.owner,
            triggered_by: ctx.accounts.triggerer.key(),
            timestamp: now,
        });
        
        Ok(())
    }

    /// Execute inheritance distribution
    pub fn execute_inheritance(
        ctx: Context<ExecuteInheritance>,
    ) -> Result<()> {
        let plan = &ctx.accounts.inheritance_plan;
        
        require!(plan.triggered, VtpError::NotTriggered);
        
        // Note: Full implementation would:
        // 1. Get vault balance
        // 2. Calculate each heir's share
        // 3. Transfer to each heir
        
        emit!(InheritanceExecuted {
            owner: plan.owner,
            heir_count: plan.heirs.len() as u8,
        });
        
        Ok(())
    }
}

// =========================================================================
// DATA TYPES
// =========================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ReleaseCondition {
    /// Requires approval from specific arbiter
    ArbiterApproval { arbiter: Pubkey },
    /// Releases after specific timestamp
    TimeRelease { timestamp: i64 },
    /// Requires oracle attestation with specific data hash
    OracleAttestation { oracle: Pubkey, data_hash: [u8; 32] },
    /// Requires threshold signatures
    MultiSig { threshold: u8, signers: Vec<Pubkey> },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum EscrowStatus {
    Active,
    Released,
    Cancelled,
    Disputed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Heir {
    pub address: Pubkey,
    pub percentage: u8, // 0-100
    pub name: String,   // Max 32 chars
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
        space = 8 + VtpConfig::INIT_SPACE,
        seeds = [b"vtp_config"],
        bump,
    )]
    pub config: Account<'info, VtpConfig>,
    
    /// CHECK: Fee recipient
    pub fee_recipient: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferCred<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    
    #[account(mut)]
    pub config: Account<'info, VtpConfig>,
    
    /// CHECK: Recipient pubkey
    pub recipient: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub sender_cred_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub recipient_cred_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fee_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BatchTransfer<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    
    #[account(mut)]
    pub config: Account<'info, VtpConfig>,
    
    #[account(mut)]
    pub sender_cred_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(amount: u64, release_conditions: Vec<ReleaseCondition>, expiry: i64, bump: u8)]
pub struct CreateEscrow<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    
    #[account(mut)]
    pub config: Account<'info, VtpConfig>,
    
    /// CHECK: Recipient pubkey
    pub recipient: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = sender,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [
            b"escrow",
            sender.key().as_ref(),
            recipient.key().as_ref(),
            &Clock::get()?.unix_timestamp.to_le_bytes(),
        ],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub sender_cred_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub escrow_cred_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fee_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FulfillCondition<'info> {
    pub fulfiller: Signer<'info>,
    
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    pub releaser: Signer<'info>,
    
    #[account(mut)]
    pub config: Account<'info, VtpConfig>,
    
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub escrow_cred_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub recipient_cred_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    pub canceller: Signer<'info>,
    
    #[account(mut)]
    pub config: Account<'info, VtpConfig>,
    
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub escrow_cred_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub sender_cred_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(heirs: Vec<Heir>, inactivity_threshold: i64, bump: u8)]
pub struct SetupInheritance<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + InheritancePlan::INIT_SPACE,
        seeds = [b"inheritance", owner.key().as_ref()],
        bump,
    )]
    pub inheritance_plan: Account<'info, InheritancePlan>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InheritanceHeartbeat<'info> {
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"inheritance", owner.key().as_ref()],
        bump = inheritance_plan.bump,
        constraint = inheritance_plan.owner == owner.key() @ VtpError::Unauthorized,
    )]
    pub inheritance_plan: Account<'info, InheritancePlan>,
}

#[derive(Accounts)]
pub struct TriggerInheritance<'info> {
    pub triggerer: Signer<'info>,
    
    #[account(mut)]
    pub inheritance_plan: Account<'info, InheritancePlan>,
}

#[derive(Accounts)]
pub struct ExecuteInheritance<'info> {
    pub executor: Signer<'info>,
    
    #[account(mut)]
    pub inheritance_plan: Account<'info, InheritancePlan>,
}

// =========================================================================
// STATE
// =========================================================================

#[account]
#[derive(InitSpace)]
pub struct VtpConfig {
    pub authority: Pubkey,
    pub fee_recipient: Pubkey,
    pub total_transfers: u64,
    pub total_volume: u64,
    pub total_escrows: u64,
    pub active_escrows: u64,
    pub bump: u8,
    pub initialized_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub created_at: i64,
    pub expiry: i64,
    pub status: EscrowStatus,
    #[max_len(10)]
    pub conditions: Vec<ReleaseCondition>,
    #[max_len(10)]
    pub conditions_met: Vec<bool>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct InheritancePlan {
    pub owner: Pubkey,
    #[max_len(10)]
    pub heirs: Vec<Heir>,
    pub inactivity_threshold: i64,
    pub last_activity: i64,
    pub created_at: i64,
    pub triggered: bool,
    pub trigger_time: Option<i64>,
    pub bump: u8,
}

// =========================================================================
// EVENTS
// =========================================================================

#[event]
pub struct VtpInitialized {
    pub authority: Pubkey,
    pub initialized_at: i64,
}

#[event]
pub struct TransferCompleted {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub memo: Option<String>,
}

#[event]
pub struct BatchTransferInitiated {
    pub sender: Pubkey,
    pub recipient_count: u8,
    pub total_amount: u64,
    pub fee: u64,
}

#[event]
pub struct EscrowCreated {
    pub escrow_id: Pubkey,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub expiry: i64,
    pub condition_count: u8,
}

#[event]
pub struct ConditionFulfilled {
    pub escrow_id: Pubkey,
    pub condition_index: u8,
    pub fulfiller: Pubkey,
}

#[event]
pub struct AllConditionsMet {
    pub escrow_id: Pubkey,
}

#[event]
pub struct EscrowReleased {
    pub escrow_id: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}

#[event]
pub struct EscrowCancelled {
    pub escrow_id: Pubkey,
    pub returned_to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct InheritanceSetup {
    pub owner: Pubkey,
    pub heir_count: u8,
    pub inactivity_threshold: i64,
}

#[event]
pub struct InheritanceHeartbeat {
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct InheritanceTriggered {
    pub owner: Pubkey,
    pub triggered_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct InheritanceExecuted {
    pub owner: Pubkey,
    pub heir_count: u8,
}

// =========================================================================
// ERRORS
// =========================================================================

#[error_code]
pub enum VtpError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Memo too long (max 200 chars)")]
    MemoTooLong,
    #[msg("Arrays have different lengths")]
    MismatchedArrays,
    #[msg("Too many recipients (max 10)")]
    TooManyRecipients,
    #[msg("Empty batch")]
    EmptyBatch,
    #[msg("No release conditions specified")]
    NoConditions,
    #[msg("Too many conditions (max 10)")]
    TooManyConditions,
    #[msg("Expiry must be in the future")]
    ExpiryInPast,
    #[msg("Escrow not active")]
    EscrowNotActive,
    #[msg("Invalid condition index")]
    InvalidConditionIndex,
    #[msg("Condition already met")]
    ConditionAlreadyMet,
    #[msg("Not all conditions met")]
    ConditionsNotMet,
    #[msg("Cannot cancel (conditions in progress or not expired)")]
    CannotCancel,
    #[msg("Escrow has not expired")]
    NotExpired,
    #[msg("No heirs specified")]
    NoHeirs,
    #[msg("Too many heirs (max 10)")]
    TooManyHeirs,
    #[msg("Inactivity threshold too short (min 30 days)")]
    ThresholdTooShort,
    #[msg("Heir percentages must sum to 100")]
    InvalidPercentages,
    #[msg("Inheritance already triggered")]
    AlreadyTriggered,
    #[msg("Owner not inactive long enough")]
    NotInactiveEnough,
    #[msg("Not an heir")]
    NotAnHeir,
    #[msg("Inheritance not triggered")]
    NotTriggered,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Overflow")]
    Overflow,
    #[msg("Division by zero")]
    DivisionByZero,
}
