# Value Capture

Capture is the foundation: intercepting value that would otherwise flow to intermediaries and routing it to user vaults.

## How Capture Works

### 1. Activity Occurs

You (or your agent) performs a value-generating activity:
- Makes a purchase
- Views content
- Shares data
- Visits a location

### 2. Proof Generated

A capture module generates cryptographic proof of the activity:
- Shopping: signed receipt from merchant POS
- Attention: attestation from content provider
- Data: licensing agreement hash
- Presence: location proof from oracle

### 3. Proof Verified

Your agent submits the proof to the capture module's on-chain verifier. The module checks:
- Is the proof cryptographically valid?
- Is the merchant/provider registered?
- Has this activity already been claimed?
- Is the amount within expected bounds?

### 4. Value Captured

If verification passes, value flows to your vault:
- Cred tokens transferred or minted
- Balance updated immediately
- Ready for stacking or transfer

## Capture Modules

Each activity type has its own module:

### Shopping Capture

The first and primary capture module.

**Flow**: Purchase → Merchant POS → Signed Receipt → Verify → Capture

**Integration**: Works with Square, Stripe Connect, and Clover through OAuth integrations. Merchant signs purchase receipts, which serve as capture proofs.

**Economics**: Merchants pay lower fees than card networks. The difference is split between user capture and protocol revenue.

**Status**: Primary development focus. Pilot planned for Q3 2026.

### Data Capture (Planned)

Monetize your personal data on your terms.

**Flow**: Data Request → User Consent → License Agreement → Payment → Capture

**Concept**: A marketplace where companies can request access to specific data types. Users (via agents) review requests, set prices, and grant licenses. Revenue flows to vaults.

**Privacy**: Actual data is never stored on-chain. Only license agreements and payment records. Users control what they share and with whom.

### Attention Capture (Planned)

Get paid for your attention directly.

**Flow**: Ad Opportunity → User Opt-in → Verified View → Payment → Capture

**Concept**: Instead of platforms selling your attention to advertisers, you sell it directly. Choose when and how often you see ads. Get paid per verified view.

**Verification Challenge**: Proving genuine attention (not bots) requires careful design. Approaches include biometric presence checks and behavioral analysis.

### Presence Capture (Planned)

Monetize location proofs.

**Flow**: Physical Presence → Location Proof → Verify → Capture

**Concept**: Businesses pay for verified customer visits. You generate location proofs when you're somewhere, and merchants who want foot traffic data pay for them.

**Privacy**: You control granularity. Prove you were in a neighborhood without revealing exact address. Prove you visited a store without revealing when.

## Capture Economics

Default split for captured value:

| Recipient | Share | Purpose |
|-----------|-------|---------|
| User Vault | 85% | Wealth building |
| Protocol Treasury | 10% | Development, operations |
| veOXO Stakers | 5% | Long-term alignment |

These rates are adjustable through governance. The principle is: users get the majority.

## Enabling Capture

Users enable the modules they want:

```typescript
// Enable shopping capture
await loop.capture.enable('shopping');

// Enable with preferences
await loop.capture.enable('attention', {
  maxAdsPerDay: 10,
  preferredCategories: ['technology', 'travel']
});
```

Modules can be disabled anytime. You control what your agent captures.

## Capture Verification

All captures are verifiable on-chain:

- Proof hashes stored permanently
- Cannot double-claim the same activity
- Audit trail for all value flows
- Transparent economics

This transparency is deliberate. Unlike opaque bank systems where you can't see how fees are calculated, Loop capture is fully auditable.

## Building Custom Modules

The capture system is extensible. Third parties can build modules for new activity types:

1. Define proof format
2. Implement verification logic
3. Deploy capture program
4. Get governance approval
5. Launch to users

Future modules might capture value from fitness activities, learning achievements, creative outputs, or professional services.

[Continue to: Value Compounding →](compounding.md)
