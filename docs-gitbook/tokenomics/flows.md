# Value Flows

How value moves through the Loop Protocol ecosystem.

## Flow Overview

```
External Value (Merchants, Advertisers, Data Buyers)
                    │
                    ↓
            Capture Modules
                    │
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
User Vault      Protocol        veOXO
  (85%)        Treasury         Stakers
                (10%)            (5%)
    │               │
    ↓               ↓
 Stacking       Operations
  Yield         Development
                Partnerships
```

## Inbound Flows

### From Captures

When users capture value:

| Source | Flow |
|--------|------|
| Shopping | Merchant savings → 85% to user |
| Data | Licensing payment → 80% to user |
| Attention | Ad payment → 85% to user |

### From Fees

Protocol collects fees from:
- Extraction (5% of extracted amount)
- Large transfers (0.1% above $10k)
- Service Agent creation (500 OXO burned)
- Escrow services (0.05%)

## Internal Flows

### User to Stack

```
Liquid Cred → Locked Cred → Yield Accrual → More Cred
```

### OXO to veOXO

```
OXO → veOXO (locked) → Governance + Fee Share
```

### Protocol to Yield

```
Revenue → Yield Reserve → Distributed to Stackers
```

## Outbound Flows

### Extraction

Users can exit to USDC:
```
1000 Cred → 950 USDC (5% fee retained)
```

Fee split:
- 3% to protocol treasury
- 2% to veOXO stakers

### OXO Sales

Users can sell OXO on DEXs. No protocol fee on secondary market trades.

## Fee Schedule

| Fee Type | Rate | Recipient |
|----------|------|-----------|
| Capture (user share) | 85% | User vault |
| Capture (protocol) | 10% | Treasury |
| Capture (stakers) | 5% | veOXO pool |
| Extraction | 5% | Treasury + Stakers |
| Large transfer | 0.1% | Treasury |
| Agent creation | 500 OXO | Burned |

## Sustainability Model

### Revenue Sources

| Source | Expected Monthly (at scale) |
|--------|----------------------------|
| Capture fees | $500K-1M |
| Extraction fees | Variable |
| Agent creation | Variable |

### Cost Centers

| Expense | Monthly |
|---------|---------|
| Stacking yield | Depends on TVL |
| Development | Fixed team costs |
| Infrastructure | RPC, hosting |

### Sustainability Equation

```
Protocol Sustainable When:
  Capture Fees + Other Revenue ≥ Stacking Yield + Operations
```

At $10M monthly capture volume:
- $1M in capture fees (10% to protocol)
- $500K allocated to stacking yield
- Remainder for operations and growth

## Metrics to Track

| Metric | Description | Target |
|--------|-------------|--------|
| Capture Volume | Total monthly captures | Growth |
| Stack Ratio | % of Cred stacked | >70% |
| Extraction Rate | Monthly extraction % | <5% |
| veOXO Lock Rate | % of OXO locked | >50% |
| Fee Coverage | Revenue / Yield obligation | >100% |

[Continue to: Staking Mechanics →](staking.md)
