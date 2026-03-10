# Presence Capture Module Specification

## Overview

The Presence module captures value from location and foot traffic data. Users earn Cred by verifying their presence at specific locations, providing valuable data to businesses while maintaining privacy.

---

## Concepts

### Presence Types

| Type | Description | Value |
|------|-------------|-------|
| Visit | Verified presence at a location | Per-visit reward |
| Dwell | Time spent at location | Time-based reward |
| Foot Traffic | Aggregate presence data | Bulk pricing |
| Event | Presence at specific event | Premium reward |

### Privacy Model

Users control:
- Which locations they share
- Granularity of data (exact vs. zone)
- Who can access their presence data
- Whether to use ZK proofs (hide exact location)

### Geofences

Businesses define geofences (geographic areas) where presence has value:
- Retail stores
- Event venues
- Commercial districts
- Transit hubs

---

## Data Structures

### Geofence

```rust
pub struct Geofence {
    pub id: u64,
    pub owner: Pubkey,                   // Business/entity
    pub name: String,
    pub location: GeoLocation,
    pub radius_meters: u32,
    pub category: GeofenceCategory,
    pub reward_config: RewardConfig,
    pub budget_pool: u64,                // Cred available
    pub total_visits: u64,
    pub total_distributed: u64,
    pub status: GeofenceStatus,
    pub created_at: i64,
}

pub struct GeoLocation {
    pub latitude: i64,                   // Microdegrees (lat × 1_000_000)
    pub longitude: i64,                  // Microdegrees (lon × 1_000_000)
}

pub enum GeofenceCategory {
    Retail,
    Restaurant,
    Entertainment,
    Transit,
    Event,
    Commercial,
    Other,
}

pub struct RewardConfig {
    pub visit_reward: u64,               // Cred per visit
    pub dwell_reward_per_min: u64,       // Cred per minute of dwell
    pub max_dwell_minutes: u32,          // Cap on dwell rewards
    pub cooldown_hours: u32,             // Hours between claimable visits
}

pub enum GeofenceStatus {
    Active,
    Paused,
    Depleted,
}
```

### PresenceProof

```rust
pub struct PresenceProof {
    pub agent: Pubkey,
    pub geofence_id: u64,
    pub proof_type: PresenceProofType,
    pub timestamp: i64,
    pub dwell_minutes: Option<u32>,
}

pub enum PresenceProofType {
    // Device attestation (from secure enclave)
    DeviceAttestation {
        attestation: [u8; 256],
        device_id_hash: [u8; 32],
    },
    // ZK proof (proves presence without revealing exact location)
    ZkProof {
        proof: Vec<u8>,
        public_inputs: Vec<u8>,
    },
    // Beacon verification (Bluetooth beacon check-in)
    BeaconVerification {
        beacon_id: [u8; 16],
        beacon_signature: [u8; 64],
    },
}
```

### PresenceRecord

```rust
pub struct PresenceRecord {
    pub id: u64,
    pub agent: Pubkey,
    pub vault: Pubkey,
    pub geofence_id: u64,
    pub visit_time: i64,
    pub dwell_minutes: u32,
    pub reward_earned: u64,
    pub proof_type: PresenceProofType,
}
```

---

## Instructions

### create_geofence

Creates a new geofence for presence capture.

**Accounts:**
- `owner` (signer): Business creating geofence
- `geofence` (init): Geofence PDA

**Args:**
- `name: String`: Location name
- `location: GeoLocation`: Center point
- `radius_meters: u32`: Geofence radius
- `category: GeofenceCategory`: Business type
- `reward_config: RewardConfig`: Reward settings

**Logic:**
1. Validate location and radius
2. Create Geofence
3. Emit `GeofenceCreated` event

---

### fund_geofence

Adds Cred to geofence budget.

**Accounts:**
- `owner` (signer): Geofence owner
- `geofence` (mut): Geofence account
- `cred_source`: Source of Cred
- `geofence_pool`: Geofence's reward pool
- `token_program`: SPL Token program

**Args:**
- `amount: u64`: Cred to deposit

**Logic:**
1. Transfer Cred to pool
2. Update budget_pool
3. If was Depleted and now has funds, set Active
4. Emit `GeofenceFunded` event

---

### submit_presence_proof

Submits proof of presence for rewards.

**Accounts:**
- `agent` (signer): User's agent
- `agent_identity`: Agent's identity
- `vault` (mut): Agent's vault
- `geofence` (mut): Target geofence
- `cred_mint` (mut): Cred mint
- `mint_authority`: Cred mint authority
- `vault_cred_account` (mut): Vault's Cred account
- `geofence_pool` (mut): Geofence's reward pool
- `treasury` (mut): Protocol treasury
- `staker_pool` (mut): veOXO staker rewards
- `token_program`: SPL Token program

**Args:**
- `proof: PresenceProof`: Presence verification

**Logic:**
1. Verify agent has presence capability
2. Verify geofence is Active
3. Verify proof based on proof_type:
   - DeviceAttestation: Verify attestation signature
   - ZkProof: Verify ZK proof against geofence
   - BeaconVerification: Verify beacon signature
4. Check cooldown (last visit + cooldown_hours < now)
5. Calculate reward (visit + dwell)
6. Verify geofence has sufficient budget
7. Distribute reward:
   - 85% → vault
   - 10% → treasury
   - 5% → staker_pool
8. Create PresenceRecord
9. Update geofence stats
10. Emit `PresenceCaptured` event

---

### update_geofence

Updates geofence settings.

**Accounts:**
- `owner` (signer): Geofence owner
- `geofence` (mut): Geofence account

**Args:**
- `reward_config: Option<RewardConfig>`: New rewards
- `status: Option<GeofenceStatus>`: New status

**Logic:**
1. Verify owner
2. Update fields
3. Emit `GeofenceUpdated` event

---

## Events

```rust
pub struct GeofenceCreated {
    pub geofence_id: u64,
    pub owner: Pubkey,
    pub name: String,
    pub location: GeoLocation,
    pub radius_meters: u32,
    pub timestamp: i64,
}

pub struct GeofenceFunded {
    pub geofence_id: u64,
    pub amount: u64,
    pub new_balance: u64,
    pub timestamp: i64,
}

pub struct PresenceCaptured {
    pub record_id: u64,
    pub agent: Pubkey,
    pub geofence_id: u64,
    pub dwell_minutes: u32,
    pub reward_earned: u64,
    pub proof_type: String,
    pub timestamp: i64,
}

pub struct GeofenceUpdated {
    pub geofence_id: u64,
    pub status: GeofenceStatus,
    pub timestamp: i64,
}
```

---

## PDA Seeds

| PDA | Seeds | Purpose |
|-----|-------|---------|
| Geofence | `[b"geofence", geofence_id]` | Geofence data |
| Geofence Pool | `[b"geofence_pool", geofence_id]` | Reward pool |
| Presence Record | `[b"presence", agent, geofence_id, day]` | Daily record |

---

## Constants

```rust
pub const USER_SHARE_BPS: u16 = 8500;            // 85%
pub const TREASURY_SHARE_BPS: u16 = 1000;        // 10%
pub const STAKER_SHARE_BPS: u16 = 500;           // 5%
pub const MIN_GEOFENCE_RADIUS: u32 = 50;         // 50 meters
pub const MAX_GEOFENCE_RADIUS: u32 = 10000;      // 10 km
pub const MIN_COOLDOWN_HOURS: u32 = 1;
pub const MAX_DWELL_MINUTES: u32 = 480;          // 8 hours
```

---

## ZK Proof Circuit

For ZK presence proofs:

**Public Inputs:**
- Geofence center (lat, lon)
- Geofence radius
- Current timestamp

**Private Inputs:**
- User's actual location
- Device attestation

**Proof Statement:**
"I know a location (lat, lon) and device attestation such that:
1. The location is within radius R of (center_lat, center_lon)
2. The device attestation is valid
3. The timestamp is within acceptable range"

This proves presence without revealing exact location.

---

## Security Considerations

1. **Location spoofing**: Secure enclave attestation mitigates
2. **Multiple devices**: Device ID tracking prevents multi-claim
3. **Collusion**: Geofence owners can't verify false presence
4. **Privacy leakage**: ZK proofs essential for sensitive locations

---

*Specification version: 0.1*
