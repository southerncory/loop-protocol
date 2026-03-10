# Attention Capture Module Specification

## Overview

The Attention module enables users to earn Cred by opting into viewing advertisements and sponsored content. Unlike traditional advertising where platforms capture all value, users directly receive compensation for their attention.

---

## Concepts

### Attention Model

Traditional: `Advertiser → Platform → User sees ad (free content)`

Loop: `Advertiser → User directly (Cred payment)`

Users **opt-in** to view content. No tracking without consent. Value flows directly to user.

### Content Types

| Type | Description | Typical Reward |
|------|-------------|----------------|
| Video Ad | Short video content | $0.05-0.50 |
| Interactive | Engagement required | $0.10-1.00 |
| Survey | Answer questions | $0.25-2.00 |
| Article | Sponsored content | $0.02-0.10 |
| Notification | Push message | $0.01-0.05 |

### Verification

How do we know the user actually paid attention?

1. **Time-based**: Content viewed for minimum duration
2. **Interaction-based**: User completes action (click, answer)
3. **Attestation**: Agent attests to content render
4. **ZK Proof**: Prove engagement without revealing behavior

---

## Data Structures

### Campaign

```rust
pub struct Campaign {
    pub id: u64,
    pub advertiser: Pubkey,
    pub name: String,
    pub content_type: ContentType,
    pub content_uri: String,             // IPFS/Arweave link to content
    pub content_hash: [u8; 32],          // Hash for verification
    pub targeting: Targeting,
    pub budget: CampaignBudget,
    pub verification: VerificationConfig,
    pub stats: CampaignStats,
    pub status: CampaignStatus,
    pub created_at: i64,
    pub expires_at: i64,
}

pub enum ContentType {
    VideoAd { duration_seconds: u32 },
    Interactive { actions_required: u32 },
    Survey { questions: u32 },
    Article { min_read_seconds: u32 },
    Notification,
}

pub struct Targeting {
    pub categories: Vec<DataCategory>,   // Interest targeting
    pub demographics: Option<Demographics>,
    pub locations: Option<Vec<GeoLocation>>,
    pub exclude_categories: Vec<DataCategory>,
}

pub struct Demographics {
    pub age_min: Option<u8>,
    pub age_max: Option<u8>,
    pub genders: Option<Vec<Gender>>,
}

pub struct CampaignBudget {
    pub total_budget: u64,               // Total Cred allocated
    pub remaining_budget: u64,
    pub reward_per_view: u64,            // Cred per verified view
    pub max_views: u64,
    pub views_completed: u64,
}

pub struct VerificationConfig {
    pub method: VerificationMethod,
    pub min_duration_seconds: u32,
    pub require_interaction: bool,
}

pub enum VerificationMethod {
    TimeOnly,                            // Just duration
    TimeAndInteraction,                  // Duration + action
    AgentAttestation,                    // Agent vouches
    ZkProof,                             // Cryptographic proof
}

pub struct CampaignStats {
    pub impressions: u64,
    pub verified_views: u64,
    pub total_paid: u64,
    pub avg_engagement_seconds: u32,
}

pub enum CampaignStatus {
    Active,
    Paused,
    Completed,
    Expired,
}
```

### AttentionOffer

```rust
pub struct AttentionOffer {
    pub id: u64,
    pub campaign_id: u64,
    pub target_agent: Pubkey,
    pub offered_at: i64,
    pub expires_at: i64,
    pub status: OfferStatus,
}

pub enum OfferStatus {
    Pending,
    Accepted,
    Completed,
    Declined,
    Expired,
}
```

### AttentionProof

```rust
pub struct AttentionProof {
    pub offer_id: u64,
    pub agent: Pubkey,
    pub proof_type: AttentionProofType,
    pub engagement_seconds: u32,
    pub interactions: Vec<Interaction>,
    pub timestamp: i64,
}

pub enum AttentionProofType {
    AgentAttestation {
        attestation: [u8; 64],           // Agent signature
    },
    InteractionLog {
        actions: Vec<InteractionAction>,
        action_hashes: Vec<[u8; 32]>,
    },
    ZkEngagement {
        proof: Vec<u8>,
        public_inputs: Vec<u8>,
    },
}

pub struct Interaction {
    pub action_type: InteractionAction,
    pub timestamp: i64,
    pub data_hash: Option<[u8; 32]>,
}

pub enum InteractionAction {
    Started,
    Paused,
    Resumed,
    Clicked,
    Answered,
    Completed,
    Dismissed,
}
```

### AttentionRecord

```rust
pub struct AttentionRecord {
    pub id: u64,
    pub agent: Pubkey,
    pub vault: Pubkey,
    pub campaign_id: u64,
    pub offer_id: u64,
    pub engagement_seconds: u32,
    pub reward_earned: u64,
    pub verified_at: i64,
}
```

---

## Instructions

### create_campaign

Creates a new advertising campaign.

**Accounts:**
- `advertiser` (signer): Campaign creator
- `campaign` (init): Campaign PDA
- `cred_source`: Advertiser's Cred
- `campaign_pool`: Campaign's Cred pool
- `token_program`: SPL Token program

**Args:**
- `name: String`: Campaign name
- `content_type: ContentType`: Type of content
- `content_uri: String`: Link to content
- `content_hash: [u8; 32]`: Content verification hash
- `targeting: Targeting`: Who to target
- `budget: CampaignBudget`: Budget settings
- `verification: VerificationConfig`: How to verify
- `expires_at: i64`: Campaign expiry

**Logic:**
1. Validate content_uri accessible
2. Transfer total_budget to campaign_pool
3. Create Campaign
4. Emit `CampaignCreated` event

---

### offer_attention

Agent requests available attention opportunities.

**Accounts:**
- `agent` (signer): User's agent
- `agent_identity`: Agent identity with data profile
- `offer` (init): AttentionOffer PDA

**Args:**
- `campaign_id: u64`: Which campaign to request from

**Logic:**
1. Verify agent has attention capability
2. Verify agent matches campaign targeting
3. Verify campaign is Active and has budget
4. Create AttentionOffer
5. Emit `AttentionOffered` event

---

### submit_attention_proof

Submits proof of content engagement.

**Accounts:**
- `agent` (signer): User's agent
- `agent_identity`: Agent's identity
- `vault` (mut): Agent's vault
- `offer` (mut): AttentionOffer
- `campaign` (mut): Campaign
- `cred_mint` (mut): Cred mint
- `vault_cred_account` (mut): Vault's Cred account
- `campaign_pool` (mut): Campaign's Cred pool
- `treasury` (mut): Protocol treasury
- `staker_pool` (mut): veOXO staker rewards
- `token_program`: SPL Token program

**Args:**
- `proof: AttentionProof`: Engagement verification

**Logic:**
1. Verify offer is Accepted and not expired
2. Verify proof based on campaign's verification method:
   - TimeOnly: engagement_seconds >= min_duration
   - TimeAndInteraction: time + required actions completed
   - AgentAttestation: verify agent signature
   - ZkProof: verify ZK proof
3. Calculate reward (may be prorated by engagement)
4. Distribute:
   - 80% → vault
   - 14% → treasury
   - 6% → staker_pool
5. Update campaign stats
6. Create AttentionRecord
7. Set offer status = Completed
8. Emit `AttentionCaptured` event

---

### update_campaign

Updates campaign settings.

**Accounts:**
- `advertiser` (signer): Campaign owner
- `campaign` (mut): Campaign account

**Args:**
- `status: Option<CampaignStatus>`: New status
- `budget_addition: Option<u64>`: Add more budget

**Logic:**
1. Verify advertiser owns campaign
2. Update fields
3. If adding budget, transfer additional Cred
4. Emit `CampaignUpdated` event

---

### withdraw_campaign_budget

Withdraws unused budget from completed/expired campaign.

**Accounts:**
- `advertiser` (signer): Campaign owner
- `campaign` (mut): Campaign account
- `campaign_pool` (mut): Campaign's Cred pool
- `destination`: Where to send remaining Cred
- `token_program`: SPL Token program

**Args:**
- None

**Logic:**
1. Verify campaign is Completed or Expired
2. Calculate remaining = remaining_budget
3. Transfer remaining to destination
4. Set remaining_budget = 0
5. Emit `BudgetWithdrawn` event

---

## Events

```rust
pub struct CampaignCreated {
    pub campaign_id: u64,
    pub advertiser: Pubkey,
    pub name: String,
    pub content_type: ContentType,
    pub total_budget: u64,
    pub reward_per_view: u64,
    pub timestamp: i64,
}

pub struct AttentionOffered {
    pub offer_id: u64,
    pub campaign_id: u64,
    pub agent: Pubkey,
    pub expires_at: i64,
    pub timestamp: i64,
}

pub struct AttentionCaptured {
    pub record_id: u64,
    pub agent: Pubkey,
    pub campaign_id: u64,
    pub engagement_seconds: u32,
    pub reward_earned: u64,
    pub timestamp: i64,
}

pub struct CampaignUpdated {
    pub campaign_id: u64,
    pub status: CampaignStatus,
    pub remaining_budget: u64,
    pub timestamp: i64,
}

pub struct BudgetWithdrawn {
    pub campaign_id: u64,
    pub amount: u64,
    pub timestamp: i64,
}
```

---

## PDA Seeds

| PDA | Seeds | Purpose |
|-----|-------|---------|
| Campaign | `[b"campaign", campaign_id]` | Campaign data |
| Campaign Pool | `[b"campaign_pool", campaign_id]` | Cred pool |
| Attention Offer | `[b"offer", offer_id]` | Individual offer |
| Attention Record | `[b"attention", agent, campaign_id]` | Completion record |

---

## Constants

```rust
pub const USER_SHARE_BPS: u16 = 8000;            // 80%
pub const TREASURY_SHARE_BPS: u16 = 1400;        // 14%
pub const STAKER_SHARE_BPS: u16 = 600;           // 6%
pub const MIN_REWARD_PER_VIEW: u64 = 10_000;     // 0.01 Cred
pub const MAX_OFFER_EXPIRY_HOURS: u32 = 24;
pub const MIN_ENGAGEMENT_SECONDS: u32 = 5;
```

---

## Verification Details

### Agent Attestation

Agent signs a message:
```
message = campaign_id || offer_id || engagement_seconds || content_hash
signature = agent_sign(message)
```

Verification checks:
- Signature valid
- engagement_seconds >= min_duration
- Timestamp reasonable

### ZK Engagement Proof

Proves engagement without revealing exact behavior:

**Public Inputs:**
- Campaign ID
- Content hash
- Minimum duration

**Private Inputs:**
- Actual engagement log
- Interaction timestamps
- Agent private key

**Proof Statement:**
"I engaged with content matching content_hash for at least min_duration seconds"

---

## Bot Prevention

1. **Rate limiting**: Max offers per agent per day
2. **Agent reputation**: Low-rep agents get fewer opportunities
3. **Interaction requirements**: Require meaningful actions
4. **Randomized verification**: Occasional deep verification
5. **Stake slashing**: Agents stake, slashed for fraud

---

## Security Considerations

1. **Click fraud**: Interaction verification mitigates
2. **Content spoofing**: Content hash verification
3. **Attention farming**: Rate limits and reputation
4. **Advertiser fraud**: Budget held in escrow
5. **Privacy**: Targeting uses categories, not raw data

---

*Specification version: 0.1*
