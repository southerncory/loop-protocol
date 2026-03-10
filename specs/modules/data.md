# Data Licensing Module Specification

## Overview

The Data module enables users to license their personal data to businesses in exchange for Cred. Users control what data is shared, with whom, and at what price.

---

## Concepts

### Data Types

| Category | Examples | Typical Value |
|----------|----------|---------------|
| Shopping | Purchase history, preferences | High |
| Demographics | Age, location, income bracket | Medium |
| Interests | Hobbies, content preferences | Medium |
| Behavioral | App usage, browsing patterns | High |
| Professional | Industry, job function | Medium-High |

### Data Ownership

- Users own their data
- Data stored encrypted, controlled by agent
- Licensing grants access, not ownership
- Users can revoke access anytime

### Licensing Models

1. **One-time**: Single access for fixed fee
2. **Subscription**: Ongoing access for recurring fee
3. **Query-based**: Pay per query/use

---

## Data Structures

### DataProfile

```rust
pub struct DataProfile {
    pub owner_agent: Pubkey,
    pub vault: Pubkey,
    pub data_hash: [u8; 32],             // Hash of encrypted data
    pub storage_uri: String,             // IPFS/Arweave URI
    pub encryption_key_hash: [u8; 32],   // Hash of encryption key
    pub categories: Vec<DataCategory>,
    pub created_at: i64,
    pub updated_at: i64,
}

pub enum DataCategory {
    Shopping,
    Demographics,
    Interests,
    Behavioral,
    Professional,
    Location,
    Financial,
    Health,
    Social,
    Custom(String),
}
```

### DataListing

```rust
pub struct DataListing {
    pub id: u64,
    pub owner_agent: Pubkey,
    pub categories: Vec<DataCategory>,
    pub pricing: DataPricing,
    pub terms: DataTerms,
    pub status: ListingStatus,
    pub total_licenses: u64,
    pub total_earned: u64,
    pub created_at: i64,
}

pub struct DataPricing {
    pub model: PricingModel,
    pub price_cred: u64,                 // Price in Cred
}

pub enum PricingModel {
    OneTime,
    Subscription { period_days: u32 },
    PerQuery { max_queries: u32 },
}

pub struct DataTerms {
    pub allowed_uses: Vec<DataUse>,
    pub prohibited_uses: Vec<DataUse>,
    pub retention_days: u32,             // How long buyer can keep data
    pub resale_allowed: bool,
}

pub enum DataUse {
    Analytics,
    Advertising,
    Research,
    ProductDevelopment,
    Personalization,
    ThirdPartySharing,
}

pub enum ListingStatus {
    Active,
    Paused,
    Expired,
}
```

### DataLicense

```rust
pub struct DataLicense {
    pub id: u64,
    pub listing_id: u64,
    pub buyer: Pubkey,                   // Buyer's agent/identity
    pub seller_agent: Pubkey,
    pub categories: Vec<DataCategory>,
    pub pricing_model: PricingModel,
    pub price_paid: u64,
    pub granted_at: i64,
    pub expires_at: Option<i64>,
    pub queries_used: u32,
    pub queries_max: Option<u32>,
    pub status: LicenseStatus,
    pub decryption_key: Option<[u8; 32]>, // Encrypted to buyer
}

pub enum LicenseStatus {
    Active,
    Expired,
    Revoked,
}
```

---

## Instructions

### create_data_profile

Creates a data profile for an agent.

**Accounts:**
- `agent` (signer): Owner agent
- `profile` (init): DataProfile PDA
- `vault`: Agent's vault

**Args:**
- `data_hash: [u8; 32]`: Hash of encrypted data
- `storage_uri: String`: Where data is stored
- `encryption_key_hash: [u8; 32]`: Hash of encryption key
- `categories: Vec<DataCategory>`: Data categories included

**Logic:**
1. Create DataProfile
2. Emit `DataProfileCreated` event

---

### create_listing

Lists data for licensing.

**Accounts:**
- `agent` (signer): Owner agent
- `profile`: DataProfile
- `listing` (init): DataListing PDA

**Args:**
- `categories: Vec<DataCategory>`: Categories to list
- `pricing: DataPricing`: Pricing structure
- `terms: DataTerms`: Usage terms

**Logic:**
1. Verify agent owns profile
2. Verify categories exist in profile
3. Create DataListing
4. Emit `DataListed` event

---

### purchase_license

Purchases a data license.

**Accounts:**
- `buyer` (signer): Buyer's agent
- `listing` (mut): DataListing
- `license` (init): DataLicense PDA
- `buyer_vault` (mut): Buyer's vault
- `seller_vault` (mut): Seller's vault
- `treasury` (mut): Protocol treasury
- `staker_pool` (mut): veOXO stakers
- `token_program`: SPL Token program

**Args:**
- None (price from listing)

**Logic:**
1. Verify listing is Active
2. Calculate total price
3. Transfer Cred:
   - 85% → seller_vault
   - 10% → treasury
   - 5% → staker_pool
4. Create DataLicense
5. Generate decryption key for buyer (off-chain coordination)
6. Update listing stats
7. Emit `LicensePurchased` event

---

### revoke_license

Seller revokes a license.

**Accounts:**
- `seller` (signer): Seller's agent
- `license` (mut): DataLicense
- `listing`: Associated listing

**Args:**
- `reason: String`: Why revoking

**Logic:**
1. Verify seller owns listing
2. Set license status = Revoked
3. Emit `LicenseRevoked` event

**Note:** Buyer has already received data. Revocation is for terms enforcement and future access.

---

### query_data

Records a query against a per-query license.

**Accounts:**
- `buyer` (signer): License holder
- `license` (mut): DataLicense

**Args:**
- `query_hash: [u8; 32]`: Hash of query (for audit)

**Logic:**
1. Verify license is Active and PerQuery model
2. Verify queries_used < queries_max
3. Increment queries_used
4. Emit `DataQueried` event

---

## Events

```rust
pub struct DataProfileCreated {
    pub owner_agent: Pubkey,
    pub categories: Vec<DataCategory>,
    pub timestamp: i64,
}

pub struct DataListed {
    pub listing_id: u64,
    pub owner_agent: Pubkey,
    pub categories: Vec<DataCategory>,
    pub pricing_model: PricingModel,
    pub price_cred: u64,
    pub timestamp: i64,
}

pub struct LicensePurchased {
    pub license_id: u64,
    pub listing_id: u64,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub price_paid: u64,
    pub timestamp: i64,
}

pub struct LicenseRevoked {
    pub license_id: u64,
    pub reason: String,
    pub timestamp: i64,
}

pub struct DataQueried {
    pub license_id: u64,
    pub queries_used: u32,
    pub queries_remaining: u32,
    pub timestamp: i64,
}
```

---

## PDA Seeds

| PDA | Seeds | Purpose |
|-----|-------|---------|
| DataProfile | `[b"data_profile", agent]` | User's data profile |
| DataListing | `[b"data_listing", listing_id]` | Listing details |
| DataLicense | `[b"data_license", license_id]` | License record |

---

## Constants

```rust
pub const SELLER_SHARE_BPS: u16 = 8500;          // 85%
pub const TREASURY_SHARE_BPS: u16 = 1000;        // 10%
pub const STAKER_SHARE_BPS: u16 = 500;           // 5%
pub const MIN_LISTING_PRICE: u64 = 100_000;      // 0.10 Cred
pub const MAX_RETENTION_DAYS: u32 = 365;         // 1 year max
```

---

## Privacy Considerations

### Data Storage

- Data is stored encrypted off-chain (IPFS, Arweave)
- Only hash stored on-chain
- Decryption key shared only with licensees

### ZK Enhancement (Future)

- ZK proofs could allow queries without revealing data
- "Prove age > 21" without revealing birth date
- Aggregated insights without individual exposure

---

## Security Considerations

1. **Key management**: Secure handling of encryption keys
2. **Terms enforcement**: Off-chain legal recourse for violations
3. **Data authenticity**: How to verify data is accurate?
4. **Re-encryption**: New key per licensee for revocation

---

*Specification version: 0.1*
