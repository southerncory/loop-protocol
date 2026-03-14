# Cred (Stable Value)

Cred is the stable value token of Loop Protocol. 1 Cred = $1, always.

## Purpose

Cred exists to:
- Store captured value reliably
- Enable transfers without volatility
- Provide stable unit for stacking yield
- Make Loop usable for daily economics

Wealth building requires stability. You can't save for the future on a token that might drop 50% tomorrow.

## Stability Mechanism

### USDC Backing

Every Cred is backed 1:1 by USDC in protocol reserves:

```
Cred Supply = USDC Reserves
```

When Cred is minted (from captures), USDC enters reserves. When Cred is extracted, USDC leaves reserves.

### Why Not Just Use USDC?

Cred adds capabilities USDC doesn't have:
- Native stacking yield
- Capture module integration
- Agent-managed strategies
- Optional inheritance features

Cred is USDC with Loop functionality built in.

## Supply Dynamics

### Elastic Supply

Cred has no fixed supply. It expands and contracts:

| Event | Effect |
|-------|--------|
| Capture rewards | Cred minted |
| Stacking yield | Cred minted |
| Extraction | Cred burned |
| Protocol fees | Cred redistributed |

### Inflation Management

Net supply changes based on:
- Capture volume (growth pressure)
- Stacking vs extraction behavior
- Protocol revenue generation

Healthy state: moderate inflation from captures, absorbed by stacking demand.

## Minting

### From Captures

```typescript
// Merchant pays for purchase verification
merchantPaysUSDC(100);

// Protocol mints Cred proportionally
mintCred({
  to: userVault,
  amount: 2_000000,  // 2% capture rate
  source: 'shopping_capture'
});
```

### From Stacking Yield

```typescript
// Protocol revenue covers yield
protocolRevenue.allocate('stacking_yield', yieldAmount);

// Cred minted to stacker
mintCred({
  to: stackerVault,
  amount: yieldAmount,
  source: 'stacking_yield'
});
```

## Extraction

Converting Cred to USDC:

```typescript
const extracted = await loop.cred.extract({
  from: userVault,
  amount: 1000_000000,
  to: userUSDCAccount
});

// Result:
// 950 USDC sent (5% fee)
// 1000 Cred burned
// 50 USDC to protocol treasury
```

The 5% extraction fee encourages long-term stacking but doesn't prevent exit.

## Stacking Yield

Lock Cred to earn more Cred:

| Duration | APY |
|----------|-----|
| 30 days | 3% |
| 90 days | 5% |
| 180 days | 8% |
| 365 days | 12% |
| 730 days | 15% |

veOXO holders receive boosted rates (up to 1.5x base).

### Yield Sources

1. **Protocol Revenue** (primary): Capture module fees fund yield
2. **Treasury Operations**: Investment returns distributed to stackers
3. **OXO Emissions** (early): Bootstrap incentives, decreasing over time

Long-term sustainability depends on protocol revenue covering yield. Conservative rates ensure achievability.

## Risks and Mitigations

### De-peg Risk

Mitigation:
- 1:1 USDC backing (auditable)
- No algorithmic components
- Circuit breakers on large extractions
- Insurance fund

### Yield Sustainability

Mitigation:
- Conservative yield rates
- Revenue-backed (not emission-dependent long-term)
- Rate adjustment via governance
- Transparent reserve reporting

### Regulatory

Mitigation:
- Wrapped USDC model (not new stablecoin issuance)
- Value accrual, not money transmission
- Legal review ongoing
- Jurisdictionally aware deployment

[Continue to: OXO Details →](oxo.md)
