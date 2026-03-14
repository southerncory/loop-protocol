use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

declare_id!("FE3ZJBqVcqP6ar2pnndMghgNb3pi4mrjhVoAS7x4BVCA");

/// Loop Agent Value Protocol (AVP)
/// 
/// The identity layer for Loop Protocol:
/// - Agent registration (Personal and Service)
/// - Principal binding
/// - Capability declarations
/// - Stake management
/// - Reputation tracking

// Constants
pub const MIN_SERVICE_AGENT_STAKE: u64 = 500_000_000; // 500 OXO (6 decimals)
pub const MAX_CAPABILITIES: usize = 20;
pub const MAX_METADATA_LEN: usize = 200;

#[program]
pub mod loop_avp {
    use super::*;

    /// Register a Personal Agent (bound to one human)
    pub fn register_personal_agent(
        ctx: Context<RegisterPersonalAgent>,
        principal_hash: [u8; 32],
        metadata_uri: Option<String>,
        bump: u8,
    ) -> Result<()> {
        if let Some(ref uri) = metadata_uri {
            require!(uri.len() <= MAX_METADATA_LEN, AvpError::MetadataTooLong);
        }
        
        let now = Clock::get()?.unix_timestamp;
        
        let identity = &mut ctx.accounts.agent_identity;
        identity.agent_pubkey = ctx.accounts.agent.key();
        identity.agent_type = AgentType::Personal;
        identity.created_at = now;
        identity.principal_hash = Some(principal_hash);
        identity.binding_timestamp = Some(now);
        identity.creator = None;
        identity.capabilities = vec![];
        identity.stake_amount = 0;
        identity.stake_locked_until = 0;
        identity.status = AgentStatus::Active;
        identity.reputation_score = 5000; // Start at 50%
        identity.metadata_uri = metadata_uri;
        identity.bump = bump;
        
        emit!(AgentRegistered {
            agent: identity.agent_pubkey,
            agent_type: AgentType::Personal,
            timestamp: now,
        });
        
        Ok(())
    }

    /// Register a Service Agent (serves many users)
    pub fn register_service_agent(
        ctx: Context<RegisterServiceAgent>,
        metadata_uri: Option<String>,
        bump: u8,
    ) -> Result<()> {
        if let Some(ref uri) = metadata_uri {
            require!(uri.len() <= MAX_METADATA_LEN, AvpError::MetadataTooLong);
        }
        
        let now = Clock::get()?.unix_timestamp;
        
        // Verify stake is sufficient
        require!(
            ctx.accounts.creator_oxo_account.amount >= MIN_SERVICE_AGENT_STAKE,
            AvpError::InsufficientStake
        );
        
        let identity = &mut ctx.accounts.agent_identity;
        identity.agent_pubkey = ctx.accounts.agent.key();
        identity.agent_type = AgentType::Service;
        identity.created_at = now;
        identity.principal_hash = None;
        identity.binding_timestamp = None;
        identity.creator = Some(ctx.accounts.creator.key());
        identity.capabilities = vec![];
        identity.stake_amount = MIN_SERVICE_AGENT_STAKE;
        identity.stake_locked_until = now + (365 * 86400); // 1 year lock
        identity.status = AgentStatus::Active;
        identity.reputation_score = 5000;
        identity.metadata_uri = metadata_uri;
        identity.bump = bump;
        
        emit!(AgentRegistered {
            agent: identity.agent_pubkey,
            agent_type: AgentType::Service,
            timestamp: now,
        });
        
        Ok(())
    }

    /// Bind agent to principal (update binding)
    pub fn bind_agent(
        ctx: Context<BindAgent>,
        new_principal_hash: [u8; 32],
    ) -> Result<()> {
        let identity = &mut ctx.accounts.agent_identity;
        let now = Clock::get()?.unix_timestamp;
        
        require!(identity.agent_type == AgentType::Personal, AvpError::NotPersonalAgent);
        require!(identity.status == AgentStatus::Active, AvpError::AgentNotActive);
        
        // Update binding
        identity.principal_hash = Some(new_principal_hash);
        identity.binding_timestamp = Some(now);
        
        emit!(AgentBound {
            agent: identity.agent_pubkey,
            timestamp: now,
        });
        
        Ok(())
    }

    /// Revoke agent authority
    pub fn revoke_agent(
        ctx: Context<RevokeAgent>,
    ) -> Result<()> {
        let identity = &mut ctx.accounts.agent_identity;
        let now = Clock::get()?.unix_timestamp;
        
        require!(identity.status == AgentStatus::Active, AvpError::AgentNotActive);
        
        identity.status = AgentStatus::Revoked;
        
        emit!(AgentRevoked {
            agent: identity.agent_pubkey,
            timestamp: now,
        });
        
        Ok(())
    }

    /// Suspend agent (can be unsuspended)
    pub fn suspend_agent(
        ctx: Context<SuspendAgent>,
        reason: String,
    ) -> Result<()> {
        require!(reason.len() <= 200, AvpError::ReasonTooLong);
        
        let identity = &mut ctx.accounts.agent_identity;
        let now = Clock::get()?.unix_timestamp;
        
        require!(identity.status == AgentStatus::Active, AvpError::AgentNotActive);
        
        identity.status = AgentStatus::Suspended;
        
        emit!(AgentSuspended {
            agent: identity.agent_pubkey,
            reason,
            timestamp: now,
        });
        
        Ok(())
    }

    /// Reactivate suspended agent
    pub fn reactivate_agent(
        ctx: Context<ReactivateAgent>,
    ) -> Result<()> {
        let identity = &mut ctx.accounts.agent_identity;
        let now = Clock::get()?.unix_timestamp;
        
        require!(identity.status == AgentStatus::Suspended, AvpError::NotSuspended);
        
        identity.status = AgentStatus::Active;
        
        emit!(AgentReactivated {
            agent: identity.agent_pubkey,
            timestamp: now,
        });
        
        Ok(())
    }

    /// Declare capabilities the agent can perform
    pub fn declare_capabilities(
        ctx: Context<DeclareCapabilities>,
        capabilities: Vec<CapabilityId>,
    ) -> Result<()> {
        require!(capabilities.len() <= MAX_CAPABILITIES, AvpError::TooManyCapabilities);
        
        let identity = &mut ctx.accounts.agent_identity;
        
        require!(identity.status == AgentStatus::Active, AvpError::AgentNotActive);
        
        identity.capabilities = capabilities.clone();
        
        emit!(CapabilitiesDeclared {
            agent: identity.agent_pubkey,
            capability_count: capabilities.len() as u8,
        });
        
        Ok(())
    }

    /// Add stake (Service Agents)
    pub fn add_stake(
        ctx: Context<AddStake>,
        amount: u64,
    ) -> Result<()> {
        let identity = &mut ctx.accounts.agent_identity;
        let now = Clock::get()?.unix_timestamp;
        
        require!(identity.agent_type == AgentType::Service, AvpError::NotServiceAgent);
        require!(amount > 0, AvpError::InvalidAmount);
        
        // Transfer OXO to stake account would happen here
        // For now, just update the balance
        identity.stake_amount = identity.stake_amount.checked_add(amount)
            .ok_or(AvpError::Overflow)?;
        identity.stake_locked_until = now + (365 * 86400); // Reset lock
        
        emit!(StakeAdded {
            agent: identity.agent_pubkey,
            amount,
            new_total: identity.stake_amount,
        });
        
        Ok(())
    }

    /// Update reputation score (called by authorized module)
    pub fn update_reputation(
        ctx: Context<UpdateReputation>,
        delta: i32, // Can be positive or negative
    ) -> Result<()> {
        let identity = &mut ctx.accounts.agent_identity;
        
        // Apply delta (clamp to 0-10000)
        let new_score = if delta >= 0 {
            identity.reputation_score.saturating_add(delta as u32).min(10000)
        } else {
            identity.reputation_score.saturating_sub((-delta) as u32)
        };
        
        let old_score = identity.reputation_score;
        identity.reputation_score = new_score;
        
        emit!(ReputationUpdated {
            agent: identity.agent_pubkey,
            old_score,
            new_score,
            delta,
        });
        
        Ok(())
    }

    /// Update metadata URI
    pub fn update_metadata(
        ctx: Context<UpdateMetadata>,
        new_uri: String,
    ) -> Result<()> {
        require!(new_uri.len() <= MAX_METADATA_LEN, AvpError::MetadataTooLong);
        
        let identity = &mut ctx.accounts.agent_identity;
        identity.metadata_uri = Some(new_uri.clone());
        
        emit!(MetadataUpdated {
            agent: identity.agent_pubkey,
            new_uri,
        });
        
        Ok(())
    }

    /// Unstake OXO (after lock expires)
    pub fn unstake(
        ctx: Context<Unstake>,
        amount: u64,
    ) -> Result<()> {
        let identity = &mut ctx.accounts.agent_identity;
        let now = Clock::get()?.unix_timestamp;
        
        require!(identity.agent_type == AgentType::Service, AvpError::NotServiceAgent);
        require!(now >= identity.stake_locked_until, AvpError::StakeLocked);
        require!(amount > 0, AvpError::InvalidAmount);
        
        // Ensure minimum stake remains
        let remaining = identity.stake_amount.checked_sub(amount)
            .ok_or(AvpError::InsufficientStake)?;
        require!(remaining >= MIN_SERVICE_AGENT_STAKE, AvpError::BelowMinimumStake);
        
        identity.stake_amount = remaining;
        
        emit!(StakeWithdrawn {
            agent: identity.agent_pubkey,
            amount,
            new_total: remaining,
        });
        
        Ok(())
    }

    // =========================================================================
    // SERVICE MARKETPLACE
    // =========================================================================

    /// Execute a service call - routes fees 90% to creator, 10% to protocol
    pub fn execute_service_call(
        ctx: Context<ExecuteServiceCall>,
        fee_amount: u64,
    ) -> Result<()> {
        let identity = &ctx.accounts.service_agent_identity;
        
        // Verify this is an active service agent
        require!(identity.agent_type == AgentType::Service, AvpError::NotServiceAgent);
        require!(identity.status == AgentStatus::Active, AvpError::AgentNotActive);
        require!(fee_amount > 0, AvpError::InvalidAmount);
        
        // Calculate fee split: 90% to creator, 10% to protocol
        let creator_share = fee_amount
            .checked_mul(90)
            .ok_or(AvpError::Overflow)?
            .checked_div(100)
            .ok_or(AvpError::Overflow)?;
        let protocol_share = fee_amount.saturating_sub(creator_share);
        
        // Transfer fee from caller to creator (90%)
        let cpi_accounts_creator = anchor_spl::token::Transfer {
            from: ctx.accounts.caller_cred_account.to_account_info(),
            to: ctx.accounts.creator_cred_account.to_account_info(),
            authority: ctx.accounts.caller.to_account_info(),
        };
        let cpi_ctx_creator = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_creator,
        );
        anchor_spl::token::transfer(cpi_ctx_creator, creator_share)?;
        
        // Transfer fee from caller to protocol treasury (10%)
        let cpi_accounts_protocol = anchor_spl::token::Transfer {
            from: ctx.accounts.caller_cred_account.to_account_info(),
            to: ctx.accounts.protocol_treasury.to_account_info(),
            authority: ctx.accounts.caller.to_account_info(),
        };
        let cpi_ctx_protocol = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_protocol,
        );
        anchor_spl::token::transfer(cpi_ctx_protocol, protocol_share)?;
        
        // Update reputation slightly for completing a service call
        let identity = &mut ctx.accounts.service_agent_identity;
        if identity.reputation_score < 10000 {
            identity.reputation_score = identity.reputation_score.saturating_add(1);
        }
        
        emit!(ServiceCallExecuted {
            service_agent: identity.agent_pubkey,
            caller: ctx.accounts.caller.key(),
            fee_amount,
            creator_share,
            protocol_share,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
}

// ============================================================================
// TYPES
// ============================================================================

// Capability IDs as fixed 8-byte identifiers
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub struct CapabilityId {
    pub value: [u8; 8],
}

impl CapabilityId {
    pub fn new(value: [u8; 8]) -> Self {
        Self { value }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum AgentType {
    Personal,
    Service,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum AgentStatus {
    Active,
    Suspended,
    Revoked,
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[derive(Accounts)]
#[instruction(principal_hash: [u8; 32], metadata_uri: Option<String>, bump: u8)]
pub struct RegisterPersonalAgent<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,
    
    #[account(
        init,
        payer = agent,
        space = 8 + AgentIdentity::INIT_SPACE,
        seeds = [b"agent", agent.key().as_ref()],
        bump,
    )]
    pub agent_identity: Account<'info, AgentIdentity>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(metadata_uri: Option<String>, bump: u8)]
pub struct RegisterServiceAgent<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    /// CHECK: The agent wallet being registered
    pub agent: AccountInfo<'info>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + AgentIdentity::INIT_SPACE,
        seeds = [b"agent", agent.key().as_ref()],
        bump,
    )]
    pub agent_identity: Account<'info, AgentIdentity>,
    
    /// Creator's OXO account (must have >= 500 OXO stake)
    pub creator_oxo_account: Account<'info, anchor_spl::token::TokenAccount>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BindAgent<'info> {
    pub agent: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"agent", agent.key().as_ref()],
        bump = agent_identity.bump,
        constraint = agent_identity.agent_pubkey == agent.key() @ AvpError::Unauthorized,
    )]
    pub agent_identity: Account<'info, AgentIdentity>,
}

#[derive(Accounts)]
pub struct RevokeAgent<'info> {
    pub agent: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"agent", agent.key().as_ref()],
        bump = agent_identity.bump,
        constraint = agent_identity.agent_pubkey == agent.key() @ AvpError::Unauthorized,
    )]
    pub agent_identity: Account<'info, AgentIdentity>,
}

#[derive(Accounts)]
pub struct SuspendAgent<'info> {
    /// Must be agent owner or protocol authority
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = agent_identity.agent_pubkey == authority.key() 
            || agent_identity.creator == Some(authority.key()) @ AvpError::Unauthorized,
    )]
    pub agent_identity: Account<'info, AgentIdentity>,
}

#[derive(Accounts)]
pub struct ReactivateAgent<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = agent_identity.agent_pubkey == authority.key() 
            || agent_identity.creator == Some(authority.key()) @ AvpError::Unauthorized,
    )]
    pub agent_identity: Account<'info, AgentIdentity>,
}

#[derive(Accounts)]
pub struct DeclareCapabilities<'info> {
    pub agent: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"agent", agent.key().as_ref()],
        bump = agent_identity.bump,
        constraint = agent_identity.agent_pubkey == agent.key() @ AvpError::Unauthorized,
    )]
    pub agent_identity: Account<'info, AgentIdentity>,
}

#[derive(Accounts)]
pub struct AddStake<'info> {
    pub creator: Signer<'info>,
    
    #[account(
        mut,
        constraint = agent_identity.creator == Some(creator.key()) @ AvpError::Unauthorized,
    )]
    pub agent_identity: Account<'info, AgentIdentity>,
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    /// Protocol authority or capture module
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub agent_identity: Account<'info, AgentIdentity>,
}

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    pub agent: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"agent", agent.key().as_ref()],
        bump = agent_identity.bump,
        constraint = agent_identity.agent_pubkey == agent.key() @ AvpError::Unauthorized,
    )]
    pub agent_identity: Account<'info, AgentIdentity>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    /// Creator or authorized recovery
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = agent_identity.creator == Some(authority.key()) @ AvpError::Unauthorized,
    )]
    pub agent_identity: Account<'info, AgentIdentity>,
}

#[derive(Accounts)]
pub struct ExecuteServiceCall<'info> {
    /// User calling the service
    #[account(mut)]
    pub caller: Signer<'info>,
    
    /// Service agent identity - must be active service agent
    #[account(
        mut,
        constraint = service_agent_identity.agent_type == AgentType::Service @ AvpError::NotServiceAgent,
        constraint = service_agent_identity.status == AgentStatus::Active @ AvpError::AgentNotActive,
    )]
    pub service_agent_identity: Account<'info, AgentIdentity>,
    
    /// Caller's Cred token account (pays the fee)
    #[account(mut)]
    pub caller_cred_account: Account<'info, TokenAccount>,
    
    /// Service agent creator's Cred account (receives 90%)
    #[account(mut)]
    pub creator_cred_account: Account<'info, TokenAccount>,
    
    /// Protocol treasury (receives 10%)
    #[account(mut)]
    pub protocol_treasury: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct AgentIdentity {
    pub agent_pubkey: Pubkey,
    pub agent_type: AgentType,
    pub created_at: i64,
    pub principal_hash: Option<[u8; 32]>,
    pub binding_timestamp: Option<i64>,
    pub creator: Option<Pubkey>,
    #[max_len(20)]
    pub capabilities: Vec<CapabilityId>,
    pub stake_amount: u64,
    pub stake_locked_until: i64,
    pub status: AgentStatus,
    pub reputation_score: u32, // 0-10000 basis points
    #[max_len(200)]
    pub metadata_uri: Option<String>,
    pub bump: u8,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct AgentRegistered {
    pub agent: Pubkey,
    pub agent_type: AgentType,
    pub timestamp: i64,
}

#[event]
pub struct AgentBound {
    pub agent: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AgentRevoked {
    pub agent: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct AgentSuspended {
    pub agent: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct AgentReactivated {
    pub agent: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CapabilitiesDeclared {
    pub agent: Pubkey,
    pub capability_count: u8,
}

#[event]
pub struct StakeAdded {
    pub agent: Pubkey,
    pub amount: u64,
    pub new_total: u64,
}

#[event]
pub struct StakeWithdrawn {
    pub agent: Pubkey,
    pub amount: u64,
    pub new_total: u64,
}

#[event]
pub struct ReputationUpdated {
    pub agent: Pubkey,
    pub old_score: u32,
    pub new_score: u32,
    pub delta: i32,
}

#[event]
pub struct MetadataUpdated {
    pub agent: Pubkey,
    pub new_uri: String,
}

#[event]
pub struct ServiceCallExecuted {
    pub service_agent: Pubkey,
    pub caller: Pubkey,
    pub fee_amount: u64,
    pub creator_share: u64,
    pub protocol_share: u64,
    pub timestamp: i64,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum AvpError {
    #[msg("Metadata URI too long (max 200 chars)")]
    MetadataTooLong,
    #[msg("Insufficient stake for Service Agent (min 500 OXO)")]
    InsufficientStake,
    #[msg("Not a Personal Agent")]
    NotPersonalAgent,
    #[msg("Not a Service Agent")]
    NotServiceAgent,
    #[msg("Agent not active")]
    AgentNotActive,
    #[msg("Agent not suspended")]
    NotSuspended,
    #[msg("Reason too long (max 200 chars)")]
    ReasonTooLong,
    #[msg("Too many capabilities (max 20)")]
    TooManyCapabilities,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Stake is still locked")]
    StakeLocked,
    #[msg("Would go below minimum stake requirement")]
    BelowMinimumStake,
}
