# Vault Specification

## Overview

The Vault is the value storage container for each Personal Agent. It holds Cred, OXO, staking positions, and inheritance configuration. Every Personal Agent has exactly one Vault.

---

## Concepts

### Vault Ownership

- Each Vault is owned by one Agent
- Only the bound agent can modify the vault
- Vault transfers only via inheritance

### Contents

A Vault contains:
- **Cred balance**: Liquid stable value
- **OXO balance**: Liquid protocol equity
- **Cred stacking positions**: Locked Cred earning yield
- **veOXO positions**: Locked OXO with governance power
- **Inheritance config**: Designated heir

### Extraction

Extraction converts Cred to external value (fiat):
- 5% fee
- Vault Cred balance resets to zero
- Stacking positions liquidated
- OXO unaffected

---

## Data Structures

### Vault

```rust
pub struct Vault {
    pub id: u64,
    pub owner_agent: Pubkey,
    pub created_at: i64,
    
    // Balances
    pub cred_balance: u64,
    pub oxo_balance: u64,
    
    // Staking
    pub cred_stacking_positions: Vec<StackingPosition>,
    pub ve_oxo_positions: Vec<VeOxoPosition>,
    
    // Inheritance
    pub heir_agent: Option<Pubkey>,
    pub inheritance_proof_type: Option<InheritanceProofType>,
    
    // Metadata
    pub total_captured: u64,             // Lifetime capture (for reputation)
    pub capture_count: u64,              // Number of captures
    pub status: VaultStatus,
}

pub enum VaultStatus {
    Active,
    Closed,                              // After inheritance or extraction
}
```

### StackingPosition (Cred)

```rust
pub struct StackingPosition {
    pub id: u64,
    pub amount: u64,
    pub started_at: i64,
    pub locked_until: i64,
    pub apy_bps: u16,                    // APY in basis points (e.g., 1200 = 12%)
    pub last_claim: i64,
    pub accumulated_yield: u64,
}
```

### VeOxoPosition

```rust
pub struct VeOxoPosition {
    pub id: u64,
    pub oxo_locked: u64,
    pub ve_oxo_amount: u64,              // Voting power (decays over time)
    pub locked_at: i64,
    pub unlock_at: i64,
    pub initial_ve_oxo: u64,             // For decay calculation
}
```

### InheritanceProofType

```rust
pub enum InheritanceProofType {
    MultiSig {
        signers: Vec<Pubkey>,
        threshold: u8,
    },
    LegalOracle {
        oracle: Pubkey,
    },
    TimeLock {
        inactivity_period: i64,          // Seconds of inactivity before auto-transfer
    },
}
```

---

## Instructions

### create_vault

Creates a new vault for a Personal Agent. Called by AVP during agent registration.

**Accounts:**
- `agent` (signer): Agent being registered
- `vault` (init): Vault PDA
- `system_program`: System program

**Args:**
- None (vault created with zero balances)

**Logic:**
1. Verify caller is AVP program
2. Create vault PDA: `[b"vault", agent.key()]`
3. Initialize with zero balances
4. Set status = Active
5. Emit `VaultCreated` event

---

### deposit

Deposits Cred or OXO into a vault.

**Accounts:**
- `depositor` (signer): Source of tokens
- `vault` (mut): Destination vault
- `token_account`: Depositor's token account
- `vault_token_account`: Vault's token account
- `token_program`: SPL Token program

**Args:**
- `token: TokenType`: Cred or OXO
- `amount: u64`: Amount to deposit

**Logic:**
1. Transfer tokens to vault_token_account
2. Increase cred_balance or oxo_balance
3. Emit `Deposited` event

---

### stack_cred

Locks Cred in a stacking position to earn yield.

**Accounts:**
- `agent` (signer): Vault owner
- `vault` (mut): Agent's vault

**Args:**
- `amount: u64`: Cred to stack
- `duration: StackingDuration`: Lock period

**Logic:**
1. Verify agent owns vault
2. Verify sufficient cred_balance
3. Calculate APY based on duration
4. Create StackingPosition
5. Deduct from cred_balance
6. Emit `CredStacked` event

**Stacking Durations and APY:**

| Duration | Lock Period | APY |
|----------|-------------|-----|
| Flexible | None | 3% |
| ThreeMonth | 90 days | 6% |
| SixMonth | 180 days | 9% |
| OneYear | 365 days | 12% |
| TwoYear | 730 days | 15% |

```rust
pub enum StackingDuration {
    Flexible,
    ThreeMonth,
    SixMonth,
    OneYear,
    TwoYear,
}
```

---

### unstack_cred

Unlocks a stacking position.

**Accounts:**
- `agent` (signer): Vault owner
- `vault` (mut): Agent's vault

**Args:**
- `position_id: u64`: Which position to unlock

**Logic:**
1. Verify agent owns vault
2. Find position
3. If locked and lock hasn't expired: reject
4. If Flexible: allow anytime
5. Calculate accrued yield
6. Add (principal + yield) to cred_balance
7. Remove position
8. Emit `CredUnstacked` event

---

### claim_yield

Claims accrued yield without unstacking.

**Accounts:**
- `agent` (signer): Vault owner
- `vault` (mut): Agent's vault
- `yield_source`: Protocol yield pool

**Args:**
- `position_id: u64`: Which position to claim from

**Logic:**
1. Calculate accrued yield since last_claim
2. Mint yield from protocol pool
3. Add yield to cred_balance (or position if auto-compound)
4. Update last_claim timestamp
5. Emit `YieldClaimed` event

---

### lock_oxo_for_veoxo

Locks OXO to receive veOXO governance power.

**Accounts:**
- `agent` (signer): Vault owner
- `vault` (mut): Agent's vault
- `ve_oxo_program`: veOXO staking program

**Args:**
- `amount: u64`: OXO to lock
- `duration: VeLockDuration`: Lock period

**Logic:**
1. Verify agent owns vault
2. Verify sufficient oxo_balance
3. Calculate veOXO amount based on duration
4. Create VeOxoPosition
5. Deduct from oxo_balance
6. Mint veOXO to governance program
7. Emit `OxoLocked` event

**Lock Durations and Multipliers:**

| Duration | Multiplier |
|----------|------------|
| SixMonth | 0.25x |
| OneYear | 0.5x |
| TwoYear | 1.0x |
| FourYear | 2.0x |

---

### unlock_oxo

Unlocks OXO after veOXO lock expires.

**Accounts:**
- `agent` (signer): Vault owner
- `vault` (mut): Agent's vault
- `ve_oxo_program`: veOXO staking program

**Args:**
- `position_id: u64`: Which position to unlock

**Logic:**
1. Verify agent owns vault
2. Find position
3. Verify unlock_at has passed
4. Add oxo_locked back to oxo_balance
5. Remove position
6. Burn veOXO from governance
7. Emit `OxoUnlocked` event

---

### set_heir

Designates an heir for inheritance.

**Accounts:**
- `agent` (signer): Vault owner
- `vault` (mut): Agent's vault
- `heir_identity`: Heir's agent identity (to verify valid agent)

**Args:**
- `heir_agent: Pubkey`: Heir's agent address
- `proof_type: InheritanceProofType`: How death will be verified

**Logic:**
1. Verify agent owns vault
2. Verify heir_agent is a valid Personal Agent
3. Set heir_agent and inheritance_proof_type
4. Emit `HeirDesignated` event

---

### extract

Converts Cred to external value (exit from Loop).

**Accounts:**
- `agent` (signer): Vault owner
- `vault` (mut): Agent's vault
- `cred_reserve`: Protocol's Cred collateral
- `destination`: External destination for value
- `fee_vault`: Protocol fee destination
- `token_program`: SPL Token program

**Args:**
- `amount: u64`: Cred to extract

**Logic:**
1. Verify agent owns vault
2. Calculate fee (5%)
3. Liquidate ALL stacking positions (forfeit any unvested yield)
4. Calculate total extractable = cred_balance + stacking principal
5. If amount > total: amount = total
6. Send (amount - fee) to destination
7. Send fee to fee_vault
8. Set cred_balance = 0
9. Clear all stacking positions
10. Emit `Extracted` event

**Note:** OXO is NOT affected by extraction.

---

### close_vault

Closes a vault (after extraction or inheritance).

**Accounts:**
- `authority` (signer): Agent or inheritance executor
- `vault` (mut): Vault to close

**Args:**
- None

**Logic:**
1. Verify cred_balance = 0
2. Verify no stacking positions
3. Set status = Closed
4. Emit `VaultClosed` event

---

## Events

```rust
pub struct VaultCreated {
    pub vault: Pubkey,
    pub owner_agent: Pubkey,
    pub timestamp: i64,
}

pub struct Deposited {
    pub vault: Pubkey,
    pub token: TokenType,
    pub amount: u64,
    pub timestamp: i64,
}

pub struct CredStacked {
    pub vault: Pubkey,
    pub position_id: u64,
    pub amount: u64,
    pub duration: StackingDuration,
    pub apy_bps: u16,
    pub timestamp: i64,
}

pub struct CredUnstacked {
    pub vault: Pubkey,
    pub position_id: u64,
    pub principal: u64,
    pub yield_earned: u64,
    pub timestamp: i64,
}

pub struct YieldClaimed {
    pub vault: Pubkey,
    pub position_id: u64,
    pub yield_amount: u64,
    pub timestamp: i64,
}

pub struct OxoLocked {
    pub vault: Pubkey,
    pub position_id: u64,
    pub oxo_amount: u64,
    pub ve_oxo_amount: u64,
    pub unlock_at: i64,
    pub timestamp: i64,
}

pub struct OxoUnlocked {
    pub vault: Pubkey,
    pub position_id: u64,
    pub oxo_amount: u64,
    pub timestamp: i64,
}

pub struct HeirDesignated {
    pub vault: Pubkey,
    pub heir_agent: Pubkey,
    pub proof_type: InheritanceProofType,
    pub timestamp: i64,
}

pub struct Extracted {
    pub vault: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub positions_liquidated: u64,
    pub timestamp: i64,
}

pub struct VaultClosed {
    pub vault: Pubkey,
    pub timestamp: i64,
}
```

---

## PDA Seeds

| PDA | Seeds | Purpose |
|-----|-------|---------|
| Vault | `[b"vault", agent_pubkey]` | Main vault account |
| Vault Cred Account | `[b"vault_cred", vault_pubkey]` | SPL token account for Cred |
| Vault OXO Account | `[b"vault_oxo", vault_pubkey]` | SPL token account for OXO |

---

## Constants

```rust
pub const EXTRACTION_FEE_BPS: u16 = 500;        // 5%
pub const MAX_STACKING_POSITIONS: usize = 10;   // Limit positions per vault
pub const MAX_VE_OXO_POSITIONS: usize = 5;

// APY in basis points
pub const APY_FLEXIBLE: u16 = 300;              // 3%
pub const APY_THREE_MONTH: u16 = 600;           // 6%
pub const APY_SIX_MONTH: u16 = 900;             // 9%
pub const APY_ONE_YEAR: u16 = 1200;             // 12%
pub const APY_TWO_YEAR: u16 = 1500;             // 15%
```

---

## Security Considerations

1. **Reentrancy on extraction**: All state changes before transfers
2. **Yield source**: Must be sustainable (from protocol fees)
3. **Position limits**: Prevent gas-based attacks
4. **Inheritance attacks**: Robust death verification critical
5. **Integer overflow**: Use checked math for yield calculations

---

## Future Enhancements

- Auto-compound option for yield
- Partial extraction (with proportional penalty)
- Vault snapshots for governance voting
- Multi-heir inheritance with split percentages
- Recovery mechanism for lost agents

---

*Specification version: 0.1*
