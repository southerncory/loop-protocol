# Cred Token Specification

## Overview

Cred is the stable value token of Loop Protocol. It represents captured value and is designed for wealth accumulation, not speculation.

---

## Properties

| Property | Value |
|----------|-------|
| Name | Cred |
| Symbol | CRED |
| Decimals | 6 |
| Peg | 1 CRED = 1 USD |
| Supply | Elastic (no cap) |
| Standard | SPL Token |

---

## Stability Mechanism

### Phase 1: Collateral-Backed (MVP)

Cred is backed 1:1 by USDC reserves:

```
Mint: 1 USDC deposited → 1 CRED minted
Burn: 1 CRED burned → 1 USDC released
```

**Reserve Management:**
- Protocol holds USDC reserves
- Reserves held in protocol-controlled accounts
- Regular audits of reserve balance vs. Cred supply

### Phase 2: Hybrid (Future)

As protocol matures, may add:
- Multiple collateral types
- Partial algorithmic stability
- Insurance fund for de-peg protection

---

## Minting

Cred is minted ONLY on value capture:

```
Capture Module verifies activity
         │
         ▼
Calculate reward amount
         │
         ▼
Verify collateral available
         │
         ▼
Mint Cred to user's vault
```

**No other minting paths exist.**

### Mint Authority

The mint authority is a PDA controlled by the protocol:
- Only capture modules can request minting
- Each mint requires valid capture proof
- Protocol treasury funds collateral

---

## Burning

Cred is burned on extraction:

```
User requests extraction
         │
         ▼
Calculate fee (5%)
         │
         ▼
Burn Cred tokens
         │
         ▼
Release USDC from reserves
```

### Automatic Burn Events

- Extraction (user exits)
- Protocol fee payments (converted to OXO or burned)

---

## Data Structures

### CredMint

```rust
pub struct CredMint {
    pub mint: Pubkey,                    // SPL Token mint
    pub authority: Pubkey,               // PDA with mint authority
    pub total_supply: u64,
    pub reserve_balance: u64,            // USDC in reserve
    pub last_audit: i64,
}
```

### CredReserve

```rust
pub struct CredReserve {
    pub usdc_account: Pubkey,            // USDC token account
    pub balance: u64,
    pub last_deposit: i64,
    pub last_withdrawal: i64,
}
```

---

## Instructions

### mint_cred

Mints Cred to a vault (called by capture modules).

**Accounts:**
- `capture_module` (signer): Authorized capture program
- `cred_mint` (mut): Cred SPL mint
- `mint_authority`: Protocol mint authority PDA
- `destination_vault`: Recipient vault
- `destination_token_account`: Vault's Cred account
- `reserve`: Cred reserve account
- `token_program`: SPL Token program

**Args:**
- `amount: u64`: Cred to mint
- `capture_proof: CaptureProof`: Proof of valid capture

**Logic:**
1. Verify capture_module is authorized
2. Verify capture_proof is valid
3. Verify reserve.balance >= current_supply + amount
4. Mint Cred to destination
5. Update total_supply
6. Emit `CredMinted` event

---

### burn_cred

Burns Cred on extraction.

**Accounts:**
- `authority` (signer): Vault owner
- `cred_mint` (mut): Cred SPL mint
- `source_token_account`: Source of Cred to burn
- `reserve` (mut): Cred reserve
- `destination_usdc`: Where to send USDC
- `token_program`: SPL Token program

**Args:**
- `amount: u64`: Cred to burn

**Logic:**
1. Verify authority owns source account
2. Calculate fee (5%)
3. Burn (amount) Cred
4. Transfer (amount - fee) USDC to destination
5. Transfer fee USDC to protocol treasury
6. Update total_supply
7. Emit `CredBurned` event

---

### deposit_reserve

Adds USDC to the reserve (called by treasury).

**Accounts:**
- `treasury` (signer): Protocol treasury
- `reserve` (mut): Cred reserve
- `usdc_source`: Source of USDC
- `token_program`: SPL Token program

**Args:**
- `amount: u64`: USDC to deposit

**Logic:**
1. Transfer USDC to reserve
2. Update reserve.balance
3. Emit `ReserveDeposited` event

---

## Events

```rust
pub struct CredMinted {
    pub amount: u64,
    pub vault: Pubkey,
    pub capture_module: Pubkey,
    pub new_supply: u64,
    pub timestamp: i64,
}

pub struct CredBurned {
    pub amount: u64,
    pub authority: Pubkey,
    pub fee: u64,
    pub new_supply: u64,
    pub timestamp: i64,
}

pub struct ReserveDeposited {
    pub amount: u64,
    pub new_balance: u64,
    pub timestamp: i64,
}
```

---

## PDA Seeds

| PDA | Seeds | Purpose |
|-----|-------|---------|
| Mint Authority | `[b"cred_authority"]` | Controls minting |
| Reserve | `[b"cred_reserve"]` | Metadata for reserve |

---

## Constants

```rust
pub const CRED_DECIMALS: u8 = 6;
pub const USDC_DECIMALS: u8 = 6;         // Same as Cred for 1:1
pub const EXTRACTION_FEE_BPS: u16 = 500; // 5%
```

---

## Security Considerations

1. **Reserve solvency**: Must maintain 1:1 backing
2. **Mint authorization**: Only capture modules can mint
3. **Oracle risk**: If using price oracles, ensure robustness
4. **Reserve custody**: Multi-sig or timelock on reserve

---

## Invariants

The following must always be true:

```
cred_total_supply <= reserve_usdc_balance
```

If this invariant breaks, minting should be paused until rectified.

---

## Future Enhancements

- Multi-collateral support (USDC, USDT, DAI)
- Algorithmic component for scaling
- Insurance fund for de-peg protection
- Yield on reserves (invest in low-risk DeFi)

---

*Specification version: 0.1*
