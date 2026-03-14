# Capture Modules

Capture modules are pluggable systems that intercept and verify value from specific activity types.

## Architecture

Each module is an independent Solana program that:
1. Defines proof format for its activity type
2. Verifies proofs on-chain
3. Calculates capture amounts
4. Transfers value to user vaults

Modules are independent. Enabling one doesn't affect others.

## Module Interface

```typescript
interface CaptureModule {
  // Module metadata
  readonly MODULE_ID: string;
  readonly VERSION: string;
  
  // Core functions
  generateProof(activity: Activity): Promise<Proof>;
  verifyProof(proof: Proof): Promise<boolean>;
  calculateCapture(proof: Proof): CaptureAmount;
  capture(vault: PublicKey, proof: Proof): Promise<Transaction>;
}
```

## Shopping Module

The first and primary capture module.

### How It Works

```
Purchase → Merchant POS → Signed Receipt → Verify → Capture
```

1. User makes purchase at integrated merchant
2. Merchant POS signs a receipt proof
3. User's agent submits proof to module
4. Module verifies merchant signature and transaction uniqueness
5. Capture amount calculated and transferred to vault

### Proof Format

```typescript
interface ShoppingProof {
  merchantId: string;
  transactionId: string;
  amount: number;
  timestamp: number;
  items?: ItemSummary[];
  merchantSignature: string;
}
```

### Verification Checks

- Is merchant signature valid?
- Is merchant registered in the system?
- Has this transaction already been claimed?
- Is the amount within reasonable bounds?
- Is the timestamp within valid window?

### Integration Partners

| Partner | Integration Type | Status |
|---------|------------------|--------|
| Square | OAuth + Webhooks | In progress |
| Stripe Connect | OAuth + Webhooks | In progress |
| Clover | OAuth + Webhooks | Planned |
| Shopify | App integration | Planned |

### Economics

Merchants pay lower effective fees than card networks. The savings are split:
- 85% to user as capture reward
- 10% to protocol treasury
- 5% to veOXO stakers

## Data Module (Planned)

Monetize personal data on user terms.

### Concept

Companies request access to specific data types. Users review requests, set prices, and grant licenses. Revenue flows to vaults.

### Proof Format

```typescript
interface DataProof {
  dataType: 'browsing' | 'purchase' | 'location' | 'health';
  licensee: string;
  duration: number;
  price: number;
  consentHash: string;
  signatures: { user: string; licensee: string };
}
```

### Privacy

- Actual data never stored on-chain
- Only license agreements recorded
- Users control granularity
- Revocation possible (affects future access)

## Attention Module (Planned)

Direct payment for attention.

### Concept

Users opt into viewing ads. Verified views generate direct payment. No tracking, no data sale, just attention for compensation.

### Verification Challenge

Proving genuine attention (not bots) requires:
- Biometric presence verification
- Behavioral analysis
- Device attestation
- View duration minimums

## Presence Module (Planned)

Monetize location proofs.

### Concept

Businesses pay for verified customer visits. Users generate location proofs, merchants purchase them.

### Privacy Controls

- Prove neighborhood without exact address
- Prove store visit without timestamp
- User controls all granularity

## Building Custom Modules

Third parties can build capture modules:

### Requirements

1. Implement CaptureModule interface
2. Define clear proof format
3. Pass security review
4. Get governance approval

### Registration

```typescript
await loop.capture.registerModule({
  program: customProgramId,
  name: 'Fitness Capture',
  description: 'Capture value from fitness activities',
  proofSchema: fitnessProofSchema,
  feeStructure: {
    userShare: 80,
    protocolShare: 14,
    stakerShare: 6
  }
});
```

### Revenue Opportunity

Module creators can earn a portion of protocol fees from their module's activity, subject to governance approval.

## Capture Economics

Default value split:

| Recipient | Share | Purpose |
|-----------|-------|---------|
| User Vault | 85% | Wealth building |
| Protocol Treasury | 10% | Operations |
| veOXO Stakers | 5% | Alignment |

Governance can adjust these rates. The principle remains: users get the majority.

[Continue to: Token Economics →](../tokenomics/dual-token.md)
