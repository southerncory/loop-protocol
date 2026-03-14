# Value Transfer Protocol (VTP)

VTP defines how value moves between parties in the Loop ecosystem.

## Transfer Types

### Direct Transfer

Immediate, unconditional:

```typescript
await loop.vtp.transfer({
  from: senderVault,
  to: receiverVault,
  amount: 100_000000,
  memo: 'Payment for services'
});
```

Use for: simple payments, gifts, settlements.

### Escrow Transfer

Value held until conditions are met:

```typescript
const escrow = await loop.vtp.createEscrow({
  buyer: buyerVault,
  seller: sellerVault,
  amount: 500_000000,
  conditions: [{
    type: 'proof',
    requirement: 'delivery_confirmation',
    timeout: 7 * 24 * 60 * 60
  }],
  fallback: 'refund'
});
```

Use for: purchases, contracts, conditional agreements.

### Stream Transfer

Continuous flow over time:

```typescript
await loop.vtp.createStream({
  from: payerVault,
  to: receiverVault,
  totalAmount: 5000_000000,
  duration: 30 * 24 * 60 * 60,
  schedule: 'linear'
});
```

Use for: subscriptions, salaries, ongoing services.

### Conditional Transfer

Released based on external conditions:

```typescript
await loop.vtp.conditional({
  from: insurerVault,
  to: insuredVault,
  amount: 10000_000000,
  condition: {
    type: 'oracle',
    oracle: weatherOraclePubkey,
    trigger: 'hurricane_category_3_plus'
  }
});
```

Use for: insurance payouts, performance bonuses, milestone payments.

## Escrow System

### Creating Escrow

```typescript
const escrowPda = await loop.vtp.createEscrow({
  buyer: buyerAgent,
  seller: sellerAgent,
  amount: 1000_000000,
  conditions: [{
    type: 'proof',
    requirement: 'item_received'
  }],
  timeout: 14 * 24 * 60 * 60,
  disputeResolver: arbitrationAgent
});
```

### Escrow Lifecycle

```
Created → Funded → Condition Check → Released
              │                         │
              ↓                         ↓
          Disputed → Resolved → Released/Refunded/Split
              │
              ↓
          Timed Out → Fallback Action
```

### Condition Types

| Type | Description | Verification |
|------|-------------|--------------|
| proof | Requires cryptographic proof | On-chain |
| time | Releases after timestamp | Block time |
| signature | Requires party signature | Sig verification |
| oracle | External data feed | Oracle submission |
| multisig | Multiple parties approve | M-of-N |

## Dispute Resolution

When parties disagree:

### Filing a Dispute

```typescript
await loop.vtp.dispute({
  escrowId: escrow.id,
  claimant: buyerAgent,
  reason: 'item_not_as_described',
  evidence: [proofHash1, proofHash2]
});
```

### Resolution Process

1. **Cooling Period** (24h): Parties can resolve directly
2. **Evidence Submission**: Both parties submit evidence
3. **Arbitration**: Designated resolver reviews
4. **Decision**: Funds released per ruling
5. **Appeal** (optional): Governance can override

### Outcomes

| Outcome | Effect |
|---------|--------|
| release | Full amount to seller |
| refund | Full amount to buyer |
| split | Divided per ruling |
| partial | Custom allocation |

## Agent Negotiation

Agents can negotiate terms before transacting:

### Request Phase

```typescript
const request = await loop.vtp.request({
  type: 'purchase',
  item: itemDescription,
  maxAmount: 1000_000000,
  preferredConditions: ['escrow', 'dispute_resolution']
});
```

### Offer Phase

```typescript
const offer = await loop.vtp.offer({
  requestId: request.id,
  amount: 800_000000,
  conditions: [{
    type: 'proof',
    requirement: 'delivery_within_5_days'
  }],
  expiry: Date.now() + 3600000
});
```

### Agreement Phase

```typescript
await loop.vtp.accept({ offerId: offer.id });
// Escrow created automatically
```

## Security

### Replay Protection

- Nonces on all transfers
- Transaction expiry
- Signature verification

### Amount Verification

- Overflow checking
- Balance verification
- Atomic execution

### Access Control

- Only vault owner initiates
- Only designated parties participate
- Only valid agents interact

## Fees

| Transfer Type | Fee |
|---------------|-----|
| Direct (small) | Free |
| Direct (large, >$10k) | 0.1% |
| Escrow creation | 0.05% |
| Stream creation | 0.05% |
| Dispute filing | 1 Cred flat |

Fees fund protocol operations and veOXO staker rewards.

[Continue to: Capture Modules →](capture-modules.md)
