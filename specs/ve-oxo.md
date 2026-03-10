# veOXO Specification

## Overview

veOXO (vote-escrowed OXO) is the governance and staking mechanism for Loop Protocol. Users lock OXO to receive veOXO, which grants voting power, protocol fee share, and premium benefits.

---

## Properties

| Property | Value |
|----------|-------|
| Name | Vote-Escrowed OXO |
| Symbol | veOXO |
| Type | Non-transferable |
| Decay | Linear toward unlock |
| Max Lock | 4 years |

---

## Mechanism

### Locking

Lock OXO for a duration to receive veOXO:

| Lock Duration | veOXO Multiplier |
|---------------|------------------|
| 6 months | 0.25x |
| 1 year | 0.5x |
| 2 years | 1.0x |
| 4 years | 2.0x |

**Example:** Lock 1,000 OXO for 4 years → receive 2,000 veOXO

### Decay

veOXO decays linearly toward the unlock date:

```
veOXO(t) = initial_veOXO × (time_remaining / lock_duration)
```

**Example:** 
- Lock 1,000 OXO for 4 years → 2,000 veOXO initially
- After 2 years → 1,000 veOXO remaining
- After 3 years → 500 veOXO remaining
- At unlock → 0 veOXO, OXO unlocked

### Extending Locks

Users can extend their lock to maintain or increase veOXO:
- Cannot reduce lock duration
- veOXO recalculated based on new unlock date

---

## Benefits

### 1. Governance Voting

veOXO holders can vote on:
- Protocol parameters (fees, rates)
- Treasury spending
- New capture modules
- Upgrades and changes

**Voting power = veOXO balance at snapshot**

### 2. Protocol Fee Share

Portion of all protocol fees distributed to veOXO stakers:

| Fee Source | veOXO Share |
|------------|-------------|
| Capture fees | 6% |
| Transfer fees | 50% |
| Extraction fees | 20% |

Distributed pro-rata based on veOXO balance.

### 3. Boosted Capture Rates

veOXO holders get multiplied capture rewards:

| veOXO Balance | Capture Boost |
|---------------|---------------|
| 0 | 1.0x |
| 100+ | 1.1x |
| 1,000+ | 1.2x |
| 10,000+ | 1.3x |
| 100,000+ | 1.5x |

### 4. Premium Access

- Early access to new capture modules
- Service Agent genesis launches
- Priority dispute resolution
- Exclusive features

---

## Data Structures

### VeOxoGlobal

```rust
pub struct VeOxoGlobal {
    pub total_locked_oxo: u64,
    pub total_veoxo: u64,              // Sum of all veOXO
    pub num_stakers: u64,
    pub reward_pool: u64,              // Cred available for distribution
    pub last_distribution: i64,
}
```

### VeOxoPosition

```rust
pub struct VeOxoPosition {
    pub id: u64,
    pub owner: Pubkey,
    pub oxo_locked: u64,
    pub ve_oxo_initial: u64,           // veOXO at lock time
    pub locked_at: i64,
    pub unlock_at: i64,
    pub last_claim: i64,               // Last reward claim
}
```

### VeOxoCheckpoint

```rust
pub struct VeOxoCheckpoint {
    pub timestamp: i64,
    pub total_veoxo: u64,              // Total veOXO at this time
}
```

---

## Instructions

### lock_oxo

Locks OXO to receive veOXO.

**Accounts:**
- `user` (signer): OXO holder
- `user_oxo_account` (mut): Source of OXO
- `position` (init): New veOXO position PDA
- `global` (mut): VeOxoGlobal state
- `escrow` (mut): OXO escrow account
- `token_program`: SPL Token program

**Args:**
- `amount: u64`: OXO to lock
- `duration: LockDuration`: Lock period

**Logic:**
1. Validate duration is valid enum variant
2. Transfer OXO to escrow
3. Calculate veOXO based on multiplier
4. Create VeOxoPosition
5. Update global totals
6. Create checkpoint
7. Emit `OxoLocked` event

```rust
pub enum LockDuration {
    SixMonth,    // 15,768,000 seconds
    OneYear,     // 31,536,000 seconds
    TwoYear,     // 63,072,000 seconds
    FourYear,    // 126,144,000 seconds
}
```

---

### extend_lock

Extends an existing lock.

**Accounts:**
- `user` (signer): Position owner
- `position` (mut): Existing position
- `global` (mut): VeOxoGlobal state

**Args:**
- `new_duration: LockDuration`: New lock duration (must be longer)

**Logic:**
1. Verify new unlock > current unlock
2. Calculate new veOXO
3. Update position
4. Update global totals
5. Create checkpoint
6. Emit `LockExtended` event

---

### increase_lock

Adds more OXO to an existing lock.

**Accounts:**
- `user` (signer): Position owner
- `user_oxo_account` (mut): Additional OXO source
- `position` (mut): Existing position
- `global` (mut): VeOxoGlobal state
- `escrow` (mut): OXO escrow
- `token_program`: SPL Token program

**Args:**
- `amount: u64`: Additional OXO to lock

**Logic:**
1. Transfer additional OXO to escrow
2. Recalculate veOXO with new total
3. Update position
4. Update global totals
5. Create checkpoint
6. Emit `LockIncreased` event

---

### unlock_oxo

Unlocks OXO after lock expires.

**Accounts:**
- `user` (signer): Position owner
- `position` (mut): veOXO position
- `global` (mut): VeOxoGlobal state
- `escrow` (mut): OXO escrow
- `destination`: Where to send OXO
- `token_program`: SPL Token program

**Args:**
- None

**Logic:**
1. Verify unlock_at has passed
2. Claim any pending rewards
3. Transfer OXO to destination
4. Close position
5. Update global totals
6. Emit `OxoUnlocked` event

---

### claim_rewards

Claims accumulated fee share rewards.

**Accounts:**
- `user` (signer): Position owner
- `position` (mut): veOXO position
- `global` (mut): VeOxoGlobal state
- `reward_pool` (mut): Cred reward pool
- `destination`: User's Cred account
- `token_program`: SPL Token program

**Args:**
- None

**Logic:**
1. Calculate rewards since last_claim
2. Transfer Cred from reward pool
3. Update last_claim
4. Emit `RewardsClaimed` event

**Reward Calculation:**
```
user_share = user_veoxo / total_veoxo
user_reward = reward_pool × user_share × time_fraction
```

---

### deposit_rewards

Deposits fees into the reward pool (called by protocol).

**Accounts:**
- `protocol` (signer): Protocol authority
- `global` (mut): VeOxoGlobal state
- `reward_pool` (mut): Cred reward pool
- `source`: Cred source (protocol fees)
- `token_program`: SPL Token program

**Args:**
- `amount: u64`: Cred to deposit

**Logic:**
1. Transfer Cred to reward pool
2. Update global.reward_pool
3. Emit `RewardsDeposited` event

---

### get_current_veoxo

View function to calculate current veOXO (with decay).

**Args:**
- `position: VeOxoPosition`: Position to query

**Returns:**
- `current_veoxo: u64`: veOXO accounting for decay

**Logic:**
```rust
fn get_current_veoxo(position: &VeOxoPosition) -> u64 {
    let now = Clock::get().unix_timestamp;
    if now >= position.unlock_at {
        return 0;
    }
    let time_remaining = position.unlock_at - now;
    let lock_duration = position.unlock_at - position.locked_at;
    
    position.ve_oxo_initial * time_remaining / lock_duration
}
```

---

## Events

```rust
pub struct OxoLocked {
    pub user: Pubkey,
    pub position_id: u64,
    pub oxo_amount: u64,
    pub veoxo_amount: u64,
    pub unlock_at: i64,
    pub timestamp: i64,
}

pub struct LockExtended {
    pub user: Pubkey,
    pub position_id: u64,
    pub old_unlock: i64,
    pub new_unlock: i64,
    pub new_veoxo: u64,
    pub timestamp: i64,
}

pub struct LockIncreased {
    pub user: Pubkey,
    pub position_id: u64,
    pub additional_oxo: u64,
    pub new_total_oxo: u64,
    pub new_veoxo: u64,
    pub timestamp: i64,
}

pub struct OxoUnlocked {
    pub user: Pubkey,
    pub position_id: u64,
    pub oxo_amount: u64,
    pub timestamp: i64,
}

pub struct RewardsClaimed {
    pub user: Pubkey,
    pub position_id: u64,
    pub cred_amount: u64,
    pub timestamp: i64,
}

pub struct RewardsDeposited {
    pub amount: u64,
    pub new_pool_balance: u64,
    pub timestamp: i64,
}
```

---

## PDA Seeds

| PDA | Seeds | Purpose |
|-----|-------|---------|
| Global | `[b"veoxo_global"]` | Global staking state |
| Position | `[b"veoxo", user, position_id]` | Individual position |
| Escrow | `[b"veoxo_escrow"]` | Locked OXO |
| Reward Pool | `[b"veoxo_rewards"]` | Cred for distribution |
| Checkpoint | `[b"checkpoint", timestamp]` | Historical snapshots |

---

## Constants

```rust
pub const MIN_LOCK_DURATION: i64 = 15_768_000;    // 6 months
pub const MAX_LOCK_DURATION: i64 = 126_144_000;   // 4 years

pub const MULTIPLIER_6_MONTH: u64 = 2500;         // 0.25x (basis points)
pub const MULTIPLIER_1_YEAR: u64 = 5000;          // 0.5x
pub const MULTIPLIER_2_YEAR: u64 = 10000;         // 1.0x
pub const MULTIPLIER_4_YEAR: u64 = 20000;         // 2.0x

pub const REWARD_DISTRIBUTION_INTERVAL: i64 = 86400; // Daily
```

---

## Governance Integration

veOXO is used for governance voting:

1. **Proposal Creation**: Requires 0.1% of total veOXO
2. **Voting**: 1 veOXO = 1 vote
3. **Quorum**: 25% of total veOXO must vote
4. **Snapshot**: veOXO balance at proposal creation
5. **Execution Delay**: 48 hours after passing

---

## Security Considerations

1. **Decay calculation**: Use safe math for time calculations
2. **Reward distribution**: Prevent gaming via flash stakes
3. **Checkpoint manipulation**: Secure checkpoint creation
4. **Unlock timing**: Strict enforcement of lock periods

---

*Specification version: 0.1*
