# Shopping Capture Module Specification

## Overview

The Shopping module captures value from purchase transactions. When a user makes a purchase at a participating merchant, their agent submits proof and receives Cred.

---

## Concepts

### Capture Flow

```
1. User makes purchase at merchant
2. Merchant POS signs receipt
3. User's agent receives signed receipt
4. Agent submits proof to Shopping module
5. Module verifies signature and receipt
6. Cred minted and distributed:
   - 80% → User's vault
   - 14% → Protocol treasury
   - 6% → veOXO stakers
```

### Merchants

Merchants must register with the protocol:
- Register public key for receipt signing
- Define rewards rate (% of purchase)
- Fund rewards pool or pay-as-you-go

### Receipts

A signed receipt contains:
- Merchant ID
- Transaction ID (unique)
- Purchase amount
- Timestamp
- Items (optional, for category bonuses)
- Merchant signature

---

## Data Structures

### Merchant

```rust
pub struct Merchant {
    pub id: u64,
    pub pubkey: Pubkey,                  // For signature verification
    pub name: String,
    pub category: MerchantCategory,
    pub rewards_rate_bps: u16,           // Basis points (e.g., 250 = 2.5%)
    pub rewards_pool: u64,               // Pre-funded Cred
    pub total_distributed: u64,
    pub transaction_count: u64,
    pub status: MerchantStatus,
    pub registered_at: i64,
}

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

pub enum MerchantStatus {
    Active,
    Paused,
    Suspended,
}
```

### Receipt

```rust
pub struct Receipt {
    pub merchant_id: u64,
    pub transaction_id: [u8; 32],        // Unique identifier
    pub amount: u64,                     // Purchase amount in cents
    pub currency: Currency,
    pub timestamp: i64,
    pub items: Option<Vec<LineItem>>,
    pub signature: [u8; 64],             // Ed25519 signature
}

pub struct LineItem {
    pub description: String,
    pub category: ItemCategory,
    pub amount: u64,
}

pub enum Currency {
    USD,
    EUR,
    GBP,
    // etc.
}
```

### CaptureRecord

```rust
pub struct CaptureRecord {
    pub id: u64,
    pub agent: Pubkey,
    pub vault: Pubkey,
    pub merchant_id: u64,
    pub transaction_id: [u8; 32],
    pub purchase_amount: u64,
    pub reward_amount: u64,
    pub timestamp: i64,
}
```

---

## Instructions

### register_merchant

Registers a new merchant with the protocol.

**Accounts:**
- `admin` (signer): Protocol admin (initially) or governance
- `merchant` (init): Merchant PDA
- `merchant_pubkey`: Merchant's signing key

**Args:**
- `name: String`: Merchant name
- `category: MerchantCategory`: Business category
- `rewards_rate_bps: u16`: Rewards rate in basis points
- `signing_pubkey: Pubkey`: Key for receipt verification

**Logic:**
1. Create Merchant account
2. Set initial status = Active
3. Emit `MerchantRegistered` event

---

### fund_merchant_pool

Adds Cred to merchant's rewards pool.

**Accounts:**
- `merchant_authority` (signer): Merchant admin
- `merchant` (mut): Merchant account
- `cred_source`: Source of Cred
- `merchant_pool`: Merchant's reward pool
- `token_program`: SPL Token program

**Args:**
- `amount: u64`: Cred to deposit

**Logic:**
1. Transfer Cred to merchant pool
2. Update merchant.rewards_pool
3. Emit `MerchantFunded` event

---

### submit_purchase_proof

Submits proof of purchase for rewards.

**Accounts:**
- `agent` (signer): User's agent
- `agent_identity`: Agent's identity (for capability check)
- `vault` (mut): Agent's vault
- `merchant`: Merchant account
- `cred_mint` (mut): Cred mint
- `mint_authority`: Cred mint authority
- `vault_cred_account` (mut): Vault's Cred account
- `treasury` (mut): Protocol treasury
- `staker_pool` (mut): veOXO staker rewards
- `token_program`: SPL Token program

**Args:**
- `receipt: Receipt`: Signed purchase receipt

**Logic:**
1. Verify agent has shopping capability
2. Verify merchant is Active
3. Verify receipt signature against merchant pubkey
4. Verify transaction_id not already claimed
5. Calculate reward: `amount × rewards_rate_bps / 10000`
6. Verify merchant has sufficient pool (or use protocol backup)
7. Distribute reward:
   - 80% → vault
   - 14% → treasury
   - 6% → staker pool
8. Record capture
9. Update merchant stats
10. Emit `PurchaseCaptured` event

---

### claim_with_webhook

Alternative: Merchant pushes transaction directly.

**Accounts:**
- `merchant` (signer): Merchant's signing key
- `agent_identity`: Target agent
- `vault` (mut): Agent's vault
- ... (same as above)

**Args:**
- `agent: Pubkey`: Which agent to credit
- `transaction_id: [u8; 32]`: Unique ID
- `amount: u64`: Purchase amount

**Logic:**
Similar to submit_purchase_proof, but initiated by merchant.

---

### update_merchant

Updates merchant settings.

**Accounts:**
- `merchant_authority` (signer): Merchant admin
- `merchant` (mut): Merchant account

**Args:**
- `rewards_rate_bps: Option<u16>`: New rate
- `status: Option<MerchantStatus>`: New status

**Logic:**
1. Verify authority
2. Update fields
3. Emit `MerchantUpdated` event

---

## Events

```rust
pub struct MerchantRegistered {
    pub merchant_id: u64,
    pub name: String,
    pub category: MerchantCategory,
    pub rewards_rate_bps: u16,
    pub timestamp: i64,
}

pub struct MerchantFunded {
    pub merchant_id: u64,
    pub amount: u64,
    pub new_pool_balance: u64,
    pub timestamp: i64,
}

pub struct PurchaseCaptured {
    pub capture_id: u64,
    pub agent: Pubkey,
    pub merchant_id: u64,
    pub purchase_amount: u64,
    pub reward_amount: u64,
    pub timestamp: i64,
}

pub struct MerchantUpdated {
    pub merchant_id: u64,
    pub rewards_rate_bps: u16,
    pub status: MerchantStatus,
    pub timestamp: i64,
}
```

---

## PDA Seeds

| PDA | Seeds | Purpose |
|-----|-------|---------|
| Merchant | `[b"merchant", merchant_id]` | Merchant data |
| Merchant Pool | `[b"merchant_pool", merchant_id]` | Rewards pool |
| Capture Record | `[b"capture", transaction_id]` | Prevent double-claim |

---

## Constants

```rust
pub const MAX_REWARDS_RATE_BPS: u16 = 1000;      // 10% max
pub const USER_SHARE_BPS: u16 = 8000;            // 80%
pub const TREASURY_SHARE_BPS: u16 = 1400;        // 14%
pub const STAKER_SHARE_BPS: u16 = 600;           // 6%
pub const MIN_PURCHASE_AMOUNT: u64 = 100;        // $1.00 minimum
```

---

## Verification

### Signature Verification

```rust
fn verify_receipt(receipt: &Receipt, merchant: &Merchant) -> Result<()> {
    let message = create_receipt_message(receipt);
    verify_ed25519(
        &merchant.pubkey,
        &message,
        &receipt.signature
    )?;
    Ok(())
}

fn create_receipt_message(receipt: &Receipt) -> Vec<u8> {
    // Deterministic serialization
    let mut message = Vec::new();
    message.extend_from_slice(&receipt.merchant_id.to_le_bytes());
    message.extend_from_slice(&receipt.transaction_id);
    message.extend_from_slice(&receipt.amount.to_le_bytes());
    message.extend_from_slice(&receipt.timestamp.to_le_bytes());
    message
}
```

### Double-Claim Prevention

Transaction IDs are recorded on-chain. Attempting to claim the same transaction twice fails with `AlreadyClaimed` error.

---

## Merchant Integration

### POS Integration Options

1. **Direct API**: Merchant POS calls Loop API after each sale
2. **Webhook**: Loop registers webhook, merchant pushes transactions
3. **Agent-initiated**: User's agent requests receipt from merchant

### Receipt Format (JSON)

```json
{
  "merchant_id": 12345,
  "transaction_id": "a1b2c3d4...",
  "amount": 5000,
  "currency": "USD",
  "timestamp": 1710086400,
  "items": [
    {"description": "Coffee", "category": "food", "amount": 500}
  ],
  "signature": "base64..."
}
```

---

## Security Considerations

1. **Replay attacks**: Transaction IDs must be unique and recorded
2. **Fake merchants**: Registration requires KYC/verification
3. **Collusion**: Monitor for suspicious patterns
4. **Rate limiting**: Prevent spam submissions
5. **Merchant key security**: Encourage HSM/secure key storage

---

## Future Enhancements

- Category-based bonus rates
- Loyalty tiers (more purchases = higher rewards)
- Cross-merchant promotions
- ZK proofs for privacy (hide purchase details)
- NFC/tap-to-earn integration

---

*Specification version: 0.1*
