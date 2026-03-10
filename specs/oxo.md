# OXO Token Specification

## Overview

OXO is the protocol equity token of Loop Protocol. It represents ownership of the protocol and provides governance rights, fee share, and premium features.

---

## Properties

| Property | Value |
|----------|-------|
| Name | OXO |
| Symbol | OXO |
| Decimals | 6 |
| Total Supply | 1,000,000,000 (1 billion) |
| Supply Type | Fixed (hard cap) |
| Standard | SPL Token |

---

## Distribution

| Category | Allocation | Amount | Vesting |
|----------|------------|--------|---------|
| Community | 50% | 500,000,000 | Immediate + ongoing |
| Treasury | 25% | 250,000,000 | DAO-governed |
| Team | 15% | 150,000,000 | 2yr vest, 6mo cliff |
| Liquidity | 5% | 50,000,000 | Immediate |
| Partners | 5% | 50,000,000 | 1yr vest |

### Community Distribution (50%)

Distributed via:
- **Capture bonuses**: Early users earn OXO alongside Cred
- **Staking rewards**: veOXO stakers earn additional OXO
- **Airdrops**: Strategic distribution to aligned communities
- **Referrals**: Users earn for bringing others
- **Contributions**: Developers, creators, community builders

### Treasury (25%)

- Governed by veOXO holders
- Maximum 10% can be emitted per year
- Used for: grants, partnerships, liquidity, development
- Requires governance proposal and vote

### Team (15%)

- 6-month cliff (nothing vests until month 6)
- Linear vesting from month 6 to month 24
- Subject to clawback if team member leaves early

### Liquidity (5%)

- Immediate allocation
- Used for DEX liquidity pools (OXO/SOL, OXO/USDC)
- LP tokens may be locked or protocol-owned

### Partners (5%)

- 1-year linear vesting
- Reserved for: integration partners, strategic investors, advisors

---

## Utility

### Governance (via veOXO)

- Vote on protocol parameters
- Vote on treasury spending
- Vote on fee structures
- Vote on upgrades

### Service Agent Creation

- 500 OXO required to create a Service Agent
- Fee goes to protocol treasury

### Premium Features

- Boosted capture rates (up to 1.5x)
- Early access to new modules
- Service Agent genesis launches
- Priority dispute resolution

### Fee Share

- veOXO stakers receive portion of protocol fees
- Distributed in Cred

---

## Data Structures

### OxoMint

```rust
pub struct OxoMint {
    pub mint: Pubkey,                    // SPL Token mint
    pub authority: Pubkey,               // Mint authority (set to null after TGE)
    pub total_supply: u64,               // Fixed at 1B
    pub circulating_supply: u64,         // Tokens not in treasury/vesting
}
```

### VestingSchedule

```rust
pub struct VestingSchedule {
    pub beneficiary: Pubkey,
    pub total_amount: u64,
    pub released_amount: u64,
    pub start_time: i64,
    pub cliff_time: i64,                 // When vesting begins
    pub end_time: i64,                   // When fully vested
    pub revocable: bool,                 // Can be clawed back
}
```

### Treasury

```rust
pub struct Treasury {
    pub oxo_account: Pubkey,
    pub balance: u64,
    pub annual_emission_limit: u64,      // 10% of balance
    pub emitted_this_year: u64,
    pub year_start: i64,
}
```

---

## Instructions

### initialize_oxo

One-time initialization at protocol launch.

**Accounts:**
- `authority` (signer): Initial deployer
- `oxo_mint` (init): OXO SPL mint
- `token_program`: SPL Token program

**Args:**
- None

**Logic:**
1. Create mint with 1B supply
2. Mint all tokens to distribution accounts
3. Set mint authority to null (no future minting)
4. Emit `OxoInitialized` event

---

### create_vesting

Creates a vesting schedule for team/partners.

**Accounts:**
- `admin` (signer): Protocol admin
- `vesting_account` (init): Vesting schedule PDA
- `source_account`: OXO source (team/partner allocation)
- `token_program`: SPL Token program

**Args:**
- `beneficiary: Pubkey`: Who receives tokens
- `amount: u64`: Total tokens to vest
- `cliff_duration: i64`: Seconds until vesting starts
- `vesting_duration: i64`: Seconds from cliff to full vest
- `revocable: bool`: Whether can be clawed back

**Logic:**
1. Transfer tokens to vesting escrow
2. Create VestingSchedule
3. Emit `VestingCreated` event

---

### claim_vested

Claims vested tokens.

**Accounts:**
- `beneficiary` (signer): Vesting beneficiary
- `vesting_account` (mut): Vesting schedule PDA
- `destination`: Where to send tokens
- `escrow`: Vesting escrow account
- `token_program`: SPL Token program

**Args:**
- None

**Logic:**
1. Calculate vested amount
2. Calculate claimable = vested - already_released
3. Transfer claimable to destination
4. Update released_amount
5. Emit `VestingClaimed` event

---

### treasury_emit

Emits OXO from treasury (requires governance).

**Accounts:**
- `governance` (signer): Governance program
- `treasury` (mut): Treasury account
- `destination`: Recipient account
- `proposal`: Passed governance proposal
- `token_program`: SPL Token program

**Args:**
- `amount: u64`: OXO to emit
- `proposal_id: u64`: Governance proposal ID

**Logic:**
1. Verify proposal passed
2. Verify amount <= annual_emission_limit - emitted_this_year
3. Transfer OXO to destination
4. Update emitted_this_year
5. Emit `TreasuryEmission` event

---

## Events

```rust
pub struct OxoInitialized {
    pub mint: Pubkey,
    pub total_supply: u64,
    pub timestamp: i64,
}

pub struct VestingCreated {
    pub beneficiary: Pubkey,
    pub amount: u64,
    pub cliff_time: i64,
    pub end_time: i64,
    pub timestamp: i64,
}

pub struct VestingClaimed {
    pub beneficiary: Pubkey,
    pub amount: u64,
    pub total_claimed: u64,
    pub timestamp: i64,
}

pub struct TreasuryEmission {
    pub amount: u64,
    pub destination: Pubkey,
    pub proposal_id: u64,
    pub remaining_annual: u64,
    pub timestamp: i64,
}
```

---

## PDA Seeds

| PDA | Seeds | Purpose |
|-----|-------|---------|
| Treasury | `[b"treasury"]` | Protocol treasury account |
| Vesting | `[b"vesting", beneficiary]` | Individual vesting schedule |

---

## Constants

```rust
pub const OXO_DECIMALS: u8 = 6;
pub const TOTAL_SUPPLY: u64 = 1_000_000_000_000_000; // 1B with 6 decimals
pub const ANNUAL_TREASURY_EMISSION_BPS: u16 = 1000;  // 10%
pub const SERVICE_AGENT_CREATION_FEE: u64 = 500_000_000; // 500 OXO
```

---

## Security Considerations

1. **Mint authority**: Must be nullified after initial distribution
2. **Vesting clawback**: Only for revocable schedules
3. **Treasury governance**: Strict voting requirements
4. **Emission limits**: Hard cap on annual treasury spending

---

## Invariants

```
total_supply = 1,000,000,000 (always)
circulating + treasury + vesting = total_supply
emitted_this_year <= annual_emission_limit
```

---

## Future Enhancements

- Token buyback from protocol revenue
- Burns from Service Agent creation fees
- Delegation of voting power
- Cross-chain bridging (if needed)

---

*Specification version: 0.1*
