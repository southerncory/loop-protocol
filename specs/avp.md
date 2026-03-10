# Agent Value Protocol (AVP) Specification

## Overview

The Agent Value Protocol (AVP) is the identity layer of Loop Protocol. It defines how agents register, bind to principals, declare capabilities, and manage their participation in the ecosystem.

---

## Concepts

### Agent Identity

Every agent has an on-chain identity consisting of:
- **Wallet**: A Solana keypair (the agent's "address")
- **Identity PDA**: A Program Derived Address storing agent metadata
- **Principal Binding**: Cryptographic proof linking agent to human

### Agent Types

| Type | Purpose | Token | Vault |
|------|---------|-------|-------|
| Personal Agent | Serves one human | None | User's vault |
| Service Agent | Serves many | Optional | Creator's vault |

### Principal

The human who owns and is served by an agent. Principals are identified via biometric proof (specification TBD).

---

## Data Structures

### AgentIdentity

```rust
pub struct AgentIdentity {
    // Core identity
    pub agent_pubkey: Pubkey,          // Agent's wallet address
    pub agent_type: AgentType,          // Personal or Service
    pub created_at: i64,                // Unix timestamp
    
    // Principal binding (Personal Agents only)
    pub principal_hash: Option<[u8; 32]>, // Hash of biometric proof
    pub binding_timestamp: Option<i64>,
    
    // Creator info (Service Agents only)
    pub creator: Option<Pubkey>,
    
    // Capabilities
    pub capabilities: Vec<CapabilityId>,
    
    // Stake
    pub stake_amount: u64,              // OXO staked
    pub stake_locked_until: i64,        // Lock expiry
    
    // Status
    pub status: AgentStatus,            // Active, Suspended, Revoked
    pub reputation_score: u32,          // 0-10000 basis points
    
    // Metadata
    pub metadata_uri: Option<String>,   // Off-chain metadata (IPFS/Arweave)
}

pub enum AgentType {
    Personal,
    Service,
}

pub enum AgentStatus {
    Active,
    Suspended,
    Revoked,
}
```

### Capability

```rust
pub struct Capability {
    pub id: CapabilityId,
    pub name: String,
    pub module_program: Pubkey,         // Program that handles this capability
    pub required_stake: u64,            // Minimum stake to enable
    pub enabled: bool,
}

pub type CapabilityId = [u8; 8];        // Unique identifier
```

---

## Instructions

### register_personal_agent

Registers a new Personal Agent and creates its vault.

**Accounts:**
- `agent` (signer): The agent's wallet
- `principal_proof` (read): Biometric verification proof
- `identity` (init): Agent identity PDA
- `vault` (init): Agent's vault PDA
- `system_program`: System program
- `rent`: Rent sysvar

**Args:**
- `principal_hash: [u8; 32]`: Hash of principal's biometric proof
- `metadata_uri: Option<String>`: Optional metadata link

**Logic:**
1. Verify principal proof is valid
2. Create identity PDA: `[b"agent", agent.key()]`
3. Initialize identity with type = Personal
4. Create vault via Vault program
5. Emit `AgentRegistered` event

**Errors:**
- `InvalidPrincipalProof`: Biometric proof invalid
- `AgentAlreadyExists`: Agent wallet already registered

---

### register_service_agent

Registers a new Service Agent.

**Accounts:**
- `creator` (signer): The creator's wallet
- `agent` (signer): The agent's wallet
- `identity` (init): Agent identity PDA
- `creator_vault`: Creator's vault (for fee payment)
- `treasury`: Protocol treasury
- `oxo_mint`: OXO token mint
- `system_program`: System program

**Args:**
- `stake_amount: u64`: OXO to stake (minimum 500)
- `capabilities: Vec<CapabilityId>`: Initial capabilities
- `metadata_uri: Option<String>`: Agent metadata (name, description, etc.)

**Logic:**
1. Verify stake_amount >= 500 OXO
2. Transfer stake from creator to agent identity
3. Create identity PDA
4. Initialize identity with type = Service
5. Set creator and capabilities
6. Emit `ServiceAgentRegistered` event

**Errors:**
- `InsufficientStake`: Stake below minimum
- `InvalidCapability`: Capability not recognized

---

### bind_agent

Binds a Personal Agent to a principal (or updates binding).

**Accounts:**
- `agent` (signer): Agent's wallet
- `identity` (mut): Agent identity PDA
- `principal_proof` (read): New biometric proof

**Args:**
- `new_principal_hash: [u8; 32]`: New principal's biometric hash

**Logic:**
1. Verify agent is Personal type
2. Verify new principal proof is valid
3. Update principal_hash
4. Update binding_timestamp
5. Emit `AgentBound` event

**Errors:**
- `NotPersonalAgent`: Agent is Service type
- `InvalidPrincipalProof`: Proof invalid

---

### revoke_agent

Revokes an agent's authority (emergency use).

**Accounts:**
- `principal_authority` (signer): Must prove principal ownership
- `identity` (mut): Agent identity PDA

**Args:**
- `revocation_proof`: Proof of principal authority

**Logic:**
1. Verify revocation proof matches principal_hash
2. Set status = Revoked
3. Emit `AgentRevoked` event

**Note:** Revocation is permanent. Vault funds can be recovered via inheritance or special recovery process.

---

### declare_capabilities

Updates an agent's declared capabilities.

**Accounts:**
- `agent` (signer): Agent's wallet
- `identity` (mut): Agent identity PDA

**Args:**
- `capabilities: Vec<CapabilityId>`: New capability set

**Logic:**
1. Verify agent is Active
2. Verify all capabilities are valid
3. Update capabilities list
4. Emit `CapabilitiesUpdated` event

---

### stake_additional

Adds stake to an agent (Service Agents).

**Accounts:**
- `staker` (signer): Account providing stake
- `identity` (mut): Agent identity PDA
- `oxo_source`: OXO token account
- `stake_vault`: Agent's stake vault

**Args:**
- `amount: u64`: OXO to add
- `lock_duration: i64`: Additional lock time (seconds)

**Logic:**
1. Transfer OXO to stake vault
2. Increase stake_amount
3. Extend stake_locked_until if lock_duration > 0
4. Emit `StakeAdded` event

---

### unstake

Withdraws stake from an agent (after lock expires).

**Accounts:**
- `authority` (signer): Creator (Service) or special recovery (Personal)
- `identity` (mut): Agent identity PDA
- `stake_vault`: Agent's stake vault
- `destination`: Where to send OXO

**Args:**
- `amount: u64`: OXO to withdraw

**Logic:**
1. Verify stake_locked_until has passed
2. Verify amount <= stake_amount - minimum_required
3. Transfer OXO to destination
4. Decrease stake_amount
5. Emit `StakeWithdrawn` event

**Errors:**
- `StakeLocked`: Lock period not expired
- `BelowMinimumStake`: Would go below required minimum

---

## Events

```rust
pub struct AgentRegistered {
    pub agent: Pubkey,
    pub agent_type: AgentType,
    pub timestamp: i64,
}

pub struct ServiceAgentRegistered {
    pub agent: Pubkey,
    pub creator: Pubkey,
    pub stake: u64,
    pub timestamp: i64,
}

pub struct AgentBound {
    pub agent: Pubkey,
    pub principal_hash: [u8; 32],
    pub timestamp: i64,
}

pub struct AgentRevoked {
    pub agent: Pubkey,
    pub timestamp: i64,
}

pub struct CapabilitiesUpdated {
    pub agent: Pubkey,
    pub capabilities: Vec<CapabilityId>,
    pub timestamp: i64,
}

pub struct StakeAdded {
    pub agent: Pubkey,
    pub amount: u64,
    pub new_total: u64,
    pub locked_until: i64,
}

pub struct StakeWithdrawn {
    pub agent: Pubkey,
    pub amount: u64,
    pub new_total: u64,
}
```

---

## PDA Seeds

| PDA | Seeds | Purpose |
|-----|-------|---------|
| Agent Identity | `[b"agent", agent_pubkey]` | Stores agent metadata |
| Agent Stake Vault | `[b"stake", agent_pubkey]` | Holds staked OXO |

---

## Constants

```rust
pub const MINIMUM_SERVICE_AGENT_STAKE: u64 = 500_000_000; // 500 OXO (assuming 6 decimals)
pub const CAPABILITY_SHOPPING: CapabilityId = *b"shopping";
pub const CAPABILITY_DATA: CapabilityId = *b"data____";
pub const CAPABILITY_PRESENCE: CapabilityId = *b"presence";
pub const CAPABILITY_ATTENTION: CapabilityId = *b"attn____";
```

---

## Security Considerations

1. **Principal binding is critical** — Compromise of biometric proof could allow agent hijacking
2. **Stake slashing** — Future version should add slashing for misbehavior
3. **Revocation** — Should have recovery mechanism for legitimate owners
4. **Capability verification** — Modules must verify agent has declared capability

---

## Future Enhancements

- ZK principal binding (prove you're a valid principal without revealing identity)
- Reputation system with on-chain history
- Stake slashing for violations
- Agent delegation (agent can authorize sub-agents)
- Cross-program invocation patterns for capability verification

---

*Specification version: 0.1*
