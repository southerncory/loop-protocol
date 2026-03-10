# Value Transfer Protocol (VTP) Specification

## Overview

The Value Transfer Protocol (VTP) defines how value moves between agents in Loop Protocol. It handles simple transfers, escrow-based conditional transfers, and dispute resolution.

---

## Concepts

### Transfer Types

| Type | Use Case | Fee | Reversible |
|------|----------|-----|------------|
| Simple | Direct payment | 0.1% | No |
| Escrow | Conditional (work completion) | 0.1% | Until verified |
| Inheritance | Death-triggered | 0% | No |

### State Machine (ACP Pattern)

For escrow transfers:

```
Request → Negotiate → Transact → Verify
    │         │           │         │
    │         │           │         └── Evaluator checks, releases/refunds
    │         │           └── Escrow created, work begins
    │         └── Terms agreed (optional)
    └── Agent requests transfer/service
```

### Escrow

Funds held by the protocol until conditions are met:
- Timeout: Auto-refund after expiry
- Verification: Release on proof of completion
- Dispute: Third-party resolution

---

## Data Structures

### Transfer

```rust
pub struct Transfer {
    pub id: u64,
    pub from_vault: Pubkey,
    pub to_vault: Pubkey,
    pub token: TokenType,
    pub amount: u64,
    pub transfer_type: TransferType,
    pub status: TransferStatus,
    pub created_at: i64,
    pub completed_at: Option<i64>,
    pub fee_paid: u64,
}

pub enum TokenType {
    Cred,
    Oxo,
}

pub enum TransferType {
    Simple,
    Escrow { escrow_id: u64 },
    Inheritance,
}

pub enum TransferStatus {
    Completed,
    Pending,
    Refunded,
    Disputed,
}
```

### Escrow

```rust
pub struct Escrow {
    pub id: u64,
    pub creator: Pubkey,                 // Who created the escrow
    pub from_vault: Pubkey,              // Source of funds
    pub to_vault: Pubkey,                // Destination on release
    pub token: TokenType,
    pub amount: u64,
    pub status: EscrowStatus,
    
    // Conditions
    pub conditions: EscrowConditions,
    pub timeout: i64,                    // Unix timestamp for auto-refund
    
    // Verification
    pub evaluator: Option<Pubkey>,       // Optional third-party evaluator
    pub verification_proof: Option<Vec<u8>>,
    
    // Timestamps
    pub created_at: i64,
    pub completed_at: Option<i64>,
}

pub struct EscrowConditions {
    pub description: String,             // Human-readable conditions
    pub condition_hash: [u8; 32],        // Hash of formal conditions
    pub require_evaluator: bool,
}

pub enum EscrowStatus {
    Active,
    Released,
    Refunded,
    Disputed,
    Resolved,
}
```

### Dispute

```rust
pub struct Dispute {
    pub id: u64,
    pub escrow_id: u64,
    pub initiator: Pubkey,
    pub reason: String,
    pub evidence_hash: [u8; 32],
    pub status: DisputeStatus,
    pub resolution: Option<DisputeResolution>,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
}

pub enum DisputeStatus {
    Open,
    UnderReview,
    Resolved,
}

pub struct DisputeResolution {
    pub resolver: Pubkey,
    pub decision: DisputeDecision,
    pub reason: String,
}

pub enum DisputeDecision {
    ReleaseToRecipient,
    RefundToSender,
    Split { recipient_share: u8 }, // Percentage (0-100)
}
```

---

## Instructions

### simple_transfer

Executes a direct transfer between vaults.

**Accounts:**
- `authority` (signer): Must be agent bound to from_vault
- `from_vault` (mut): Source vault
- `to_vault` (mut): Destination vault
- `token_program`: SPL Token program
- `fee_vault`: Protocol fee destination

**Args:**
- `token: TokenType`: Cred or OXO
- `amount: u64`: Amount to transfer

**Logic:**
1. Verify authority owns from_vault
2. Calculate fee (0.1%)
3. Deduct amount from from_vault
4. Credit (amount - fee) to to_vault
5. Credit fee to fee_vault
6. Create Transfer record
7. Emit `TransferCompleted` event

**Errors:**
- `InsufficientBalance`: Not enough tokens
- `Unauthorized`: Authority doesn't own vault
- `InvalidVault`: Vault doesn't exist or is closed

---

### create_escrow

Creates a conditional transfer with escrow.

**Accounts:**
- `creator` (signer): Agent creating escrow
- `from_vault` (mut): Source vault
- `escrow_account` (init): Escrow PDA
- `token_program`: SPL Token program

**Args:**
- `to_vault: Pubkey`: Destination on release
- `token: TokenType`: Cred or OXO
- `amount: u64`: Amount to escrow
- `conditions: EscrowConditions`: What must be satisfied
- `timeout: i64`: Auto-refund timestamp
- `evaluator: Option<Pubkey>`: Optional third-party

**Logic:**
1. Verify creator owns from_vault
2. Transfer amount to escrow_account
3. Initialize Escrow struct
4. Emit `EscrowCreated` event

**Errors:**
- `InsufficientBalance`: Not enough tokens
- `InvalidTimeout`: Timeout in the past
- `InvalidConditions`: Malformed conditions

---

### release_escrow

Releases escrowed funds to recipient.

**Accounts:**
- `authority` (signer): Creator or evaluator
- `escrow_account` (mut): Escrow PDA
- `to_vault` (mut): Destination vault
- `fee_vault` (mut): Protocol fee destination
- `token_program`: SPL Token program

**Args:**
- `verification_proof: Vec<u8>`: Proof conditions were met

**Logic:**
1. Verify authority is creator or designated evaluator
2. Verify escrow is Active
3. Verify verification_proof (if required)
4. Calculate fee (0.1%)
5. Transfer (amount - fee) to to_vault
6. Transfer fee to fee_vault
7. Set status = Released
8. Emit `EscrowReleased` event

**Errors:**
- `Unauthorized`: Not creator or evaluator
- `EscrowNotActive`: Wrong status
- `InvalidProof`: Verification failed

---

### refund_escrow

Refunds escrowed funds to sender.

**Accounts:**
- `authority` (signer): Creator (if timeout passed) or dispute resolution
- `escrow_account` (mut): Escrow PDA
- `from_vault` (mut): Original source vault
- `token_program`: SPL Token program

**Args:**
- None (or dispute resolution reference)

**Logic:**
1. Verify authority is creator AND timeout has passed
   OR authority is dispute resolution
2. Transfer full amount back to from_vault (no fee on refund)
3. Set status = Refunded
4. Emit `EscrowRefunded` event

**Errors:**
- `TimeoutNotReached`: Too early for refund
- `EscrowNotActive`: Wrong status

---

### create_dispute

Initiates a dispute on an escrow.

**Accounts:**
- `initiator` (signer): Either party to the escrow
- `escrow_account` (mut): Escrow PDA
- `dispute_account` (init): Dispute PDA

**Args:**
- `reason: String`: Why disputing
- `evidence_hash: [u8; 32]`: Hash of off-chain evidence

**Logic:**
1. Verify initiator is creator or recipient
2. Verify escrow is Active
3. Create Dispute struct
4. Set escrow status = Disputed
5. Emit `DisputeCreated` event

---

### resolve_dispute

Resolves a dispute (by authorized resolver).

**Accounts:**
- `resolver` (signer): Authorized dispute resolver
- `dispute_account` (mut): Dispute PDA
- `escrow_account` (mut): Escrow PDA
- `from_vault` (mut): Original sender
- `to_vault` (mut): Recipient
- `fee_vault` (mut): Protocol fee destination
- `token_program`: SPL Token program

**Args:**
- `decision: DisputeDecision`: Resolution
- `reason: String`: Explanation

**Logic:**
1. Verify resolver is authorized
2. Apply decision:
   - ReleaseToRecipient: Transfer to to_vault (minus fee)
   - RefundToSender: Transfer to from_vault (no fee)
   - Split: Divide accordingly
3. Set escrow status = Resolved
4. Set dispute status = Resolved
5. Emit `DisputeResolved` event

---

### execute_inheritance

Transfers vault contents to heir (death-triggered).

**Accounts:**
- `death_proof` (read): Verification of principal's death
- `from_vault` (mut): Deceased's vault
- `to_vault` (mut): Heir's vault
- `from_identity`: Original agent identity
- `to_identity`: Heir's agent identity
- `token_program`: SPL Token program

**Args:**
- `death_proof_data: Vec<u8>`: Proof of death

**Logic:**
1. Verify from_vault has heir designated
2. Verify to_vault belongs to designated heir
3. Verify death_proof is valid
4. Transfer ALL tokens to heir (no fee)
5. Transfer staking positions to heir
6. Mark from_vault as closed
7. Emit `InheritanceExecuted` event

**Errors:**
- `NoHeirDesignated`: Vault has no heir
- `InvalidHeirVault`: Destination mismatch
- `InvalidDeathProof`: Proof verification failed

---

## Events

```rust
pub struct TransferCompleted {
    pub id: u64,
    pub from_vault: Pubkey,
    pub to_vault: Pubkey,
    pub token: TokenType,
    pub amount: u64,
    pub fee: u64,
    pub timestamp: i64,
}

pub struct EscrowCreated {
    pub id: u64,
    pub creator: Pubkey,
    pub from_vault: Pubkey,
    pub to_vault: Pubkey,
    pub amount: u64,
    pub timeout: i64,
    pub timestamp: i64,
}

pub struct EscrowReleased {
    pub id: u64,
    pub to_vault: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub timestamp: i64,
}

pub struct EscrowRefunded {
    pub id: u64,
    pub from_vault: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

pub struct DisputeCreated {
    pub id: u64,
    pub escrow_id: u64,
    pub initiator: Pubkey,
    pub timestamp: i64,
}

pub struct DisputeResolved {
    pub id: u64,
    pub escrow_id: u64,
    pub decision: DisputeDecision,
    pub timestamp: i64,
}

pub struct InheritanceExecuted {
    pub from_vault: Pubkey,
    pub to_vault: Pubkey,
    pub cred_amount: u64,
    pub oxo_amount: u64,
    pub timestamp: i64,
}
```

---

## PDA Seeds

| PDA | Seeds | Purpose |
|-----|-------|---------|
| Escrow | `[b"escrow", escrow_id.to_le_bytes()]` | Holds escrowed funds |
| Dispute | `[b"dispute", dispute_id.to_le_bytes()]` | Dispute metadata |

---

## Constants

```rust
pub const TRANSFER_FEE_BPS: u16 = 10;           // 0.1% (10 basis points)
pub const EXTRACTION_FEE_BPS: u16 = 500;        // 5% (500 basis points)
pub const MIN_ESCROW_TIMEOUT: i64 = 3600;       // 1 hour minimum
pub const MAX_ESCROW_TIMEOUT: i64 = 31536000;   // 1 year maximum
```

---

## Security Considerations

1. **Reentrancy**: All state changes before external calls
2. **Authority verification**: Strict ownership checks
3. **Timeout manipulation**: Minimum timeout prevents instant refund abuse
4. **Dispute spam**: May need stake or fee for disputes
5. **Resolver centralization**: Consider decentralized dispute resolution

---

## Future Enhancements

- Multi-party escrow (more than 2 parties)
- Programmable conditions (on-chain logic verification)
- Decentralized dispute resolution (jury of stakers)
- Batch transfers
- Streaming payments

---

*Specification version: 0.1*
