# Staking Mechanics

Loop has two staking systems: Cred Stacking (for yield) and veOXO (for governance and fees).

## Cred Stacking

### Basic Mechanics

Lock Cred to earn yield:

```typescript
await loop.vault.stack({
  amount: 1000_000000,
  duration: 180 * 24 * 60 * 60  // 180 days
});
```

### Yield Rates

| Duration | Base APY | With veOXO Boost (max) |
|----------|----------|------------------------|
| 30 days | 3% | 4.5% |
| 90 days | 5% | 7.5% |
| 180 days | 8% | 12% |
| 365 days | 12% | 18% |
| 730 days | 15% | 22.5% |

### Yield Calculation

```
Annual Yield = Stacked Amount × APY
Partial Year = Stacked Amount × APY × (Days / 365)
```

Example: 10,000 Cred stacked for 180 days at 8% APY
Yield = 10,000 × 0.08 × (180/365) = 394 Cred

### Auto-Restacking

Configure automatic compounding:

```typescript
await loop.vault.setAutoStack({
  enabled: true,
  minDuration: 180 * 24 * 60 * 60,
  reinvestYield: true,
  reinvestCaptures: true
});
```

On maturity: principal + yield + new captures enter next stack automatically.

### Early Unlock Penalty

Breaking a stack early costs:
- All accrued yield forfeit
- 5% of principal as fee

Only stack what you can afford to lock.

## veOXO Staking

### Locking OXO

```typescript
await loop.oxo.lock({
  amount: 10000_000000,
  duration: 2 * 365 * 24 * 60 * 60
});
```

### veOXO Calculation

```
veOXO = OXO × (lockDuration / maxDuration)
```

Where maxDuration = 4 years.

| Lock | OXO Amount | veOXO Received |
|------|------------|----------------|
| 1 year | 1,000 | 250 |
| 2 years | 1,000 | 500 |
| 4 years | 1,000 | 1,000 |

### veOXO Decay

veOXO decays linearly to zero at unlock:

```
veOXO(t) = initialVeOXO × (timeToUnlock / lockDuration)
```

Just locked: full power. Halfway to unlock: 50% power. At unlock: zero power.

### Extending Locks

Add time without unlocking:

```typescript
await loop.oxo.extendLock({
  additionalDuration: 365 * 24 * 60 * 60
});
```

This resets decay and increases veOXO balance.

## veOXO Benefits

| Benefit | Description |
|---------|-------------|
| Governance | Vote on protocol decisions |
| Fee Share | Portion of protocol fees |
| Capture Boost | Up to 1.5x capture rates |
| Early Access | New features and modules |

## Comparing Options

| Feature | Cred Stacking | veOXO |
|---------|---------------|-------|
| Asset | Cred (stable) | OXO (volatile) |
| Reward | More Cred | Fees + Governance |
| Risk | Low | Higher |
| Minimum Lock | 30 days | 1 week |
| Maximum Lock | 2 years | 4 years |
| Early Exit | 5% penalty + yield loss | Not possible |

## Strategy Combinations

**Conservative**: Stack Cred at 6-12 month durations. Small veOXO position for boost.

**Balanced**: Maximum Cred stacking. Medium veOXO position for governance participation.

**Aggressive**: Long-term Cred stacking. Large 4-year veOXO lock. Maximum boosts.

## Yield Sustainability

This section explains exactly where stacking yield comes from. No magic. No hand-waving.

### The Yield Pool

A dedicated on-chain account holds USDC backing for all yield obligations:

```
┌─────────────────────────────────────────────────┐
│                 YIELD POOL                       │
├─────────────────────────────────────────────────┤
│ Inflows:                                         │
│   • Capture module fees (5% of all captures)    │
│   • Extraction fees (5% of exits)               │
│   • Protocol service fees                        │
│   • Treasury yield operations                    │
│   • Early unlock penalties                       │
├─────────────────────────────────────────────────┤
│ Outflows:                                        │
│   • Stacking yield claims                        │
│   • Auto-restack yield additions                 │
└─────────────────────────────────────────────────┘
```

### Revenue Sources (Detailed)

**1. Capture Module Fees (Primary)**

Every value capture charges a 5% protocol fee:
- User captures $100 of shopping value
- User receives 95 Cred
- Yield pool receives 5 Cred

At scale (1M users × $150/month captures):
- Monthly captures: $150M
- Protocol fee: $7.5M/month to yield pool

**2. Extraction Fees**

Users exiting the system pay 5%:
- User extracts 1,000 Cred
- User receives $950 USDC
- Yield pool receives $50

**3. Early Unlock Penalties**

Breaking a stack early forfeits yield + 5% principal:
- 100 Cred accrued yield → yield pool
- 50 Cred penalty (5% of 1,000) → yield pool

**4. Treasury Operations**

Protocol treasury generates yield through:
- USDC lending on established protocols
- Liquidity provision (stablecoin pairs only)
- Conservative DeFi strategies

Target: 3-5% annual return on treasury assets.

### Yield Coverage Ratio

The protocol tracks a key metric:

```
Coverage Ratio = Yield Pool Balance / Outstanding Yield Obligations
```

| Ratio | Status | Action |
|-------|--------|--------|
| > 150% | Healthy | Normal operations |
| 100-150% | Watch | Monitor closely |
| < 100% | Critical | Rate reduction proposal |

This ratio is publicly queryable on-chain.

### Rate Adjustment Mechanism

If coverage drops below 100%:

1. Governance receives automatic notification
2. 7-day discussion period
3. Rate reduction proposal (requires 60% veOXO approval)
4. New rates apply to future stacks only (existing stacks honored)

Existing stacks are never modified. Only future rates change.

### Bootstrap Period (Year 1-2)

During early growth, capture volume may not cover all yield:

**OXO Emission Supplement**
- Treasury allocates OXO to supplement yield pool
- Converts to USDC as needed
- Diminishes as capture volume grows

**Target Timeline:**
- Year 1: 40% emissions, 60% revenue
- Year 2: 15% emissions, 85% revenue
- Year 3+: 0% emissions, 100% revenue

### Transparency Commitments

1. **Real-time dashboard**: Yield pool balance, coverage ratio, inflows/outflows
2. **Monthly reports**: Breakdown of all yield sources
3. **Governance alerts**: Automatic proposals if coverage drops
4. **No hidden subsidies**: All yield sources documented on-chain

### What This Means for Users

- Your yield is backed by real revenue, not token inflation
- Coverage ratio tells you system health at a glance
- Rates may decrease if revenue drops (but existing stacks honored)
- No Ponzi mechanics: early users don't profit from later users' deposits

### Rate Adjustments

Governance can adjust rates if:
- Revenue insufficient
- Market conditions change
- Risk parameters shift

Rates are not guaranteed. They reflect protocol health.

[Continue to: Agent Ecosystem →](../agents/personal.md)
