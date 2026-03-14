# Service Agents

Service Agents provide specialized capabilities to multiple users.

## Role

While Personal Agents serve one user, Service Agents serve many:

| Personal Agent | Service Agent |
|----------------|---------------|
| One user | Many users |
| General purpose | Specialized |
| No token | Optional token |
| No stake | Stake required |

## Examples

**Shopping Optimizer**: Finds best prices, maximizes capture rates, negotiates on behalf of users.

**Yield Strategist**: Optimizes stacking durations, rebalances positions, maximizes returns.

**Data Broker**: Aggregates licensing requests, negotiates bulk deals, distributes revenue.

## Creating a Service Agent

### Requirements

| Requirement | Amount | Purpose |
|-------------|--------|---------|
| Creation fee | 500 OXO (burned) | Spam prevention |
| Stake | Varies by category | Accountability |

### Registration

```typescript
await loop.avp.registerService({
  name: 'Shopping Optimizer Pro',
  description: 'AI-powered price optimization',
  category: 'shopping',
  capabilities: ['shopping', 'price-compare'],
  stake: 5000_000000,
  feeConfig: { basisPoints: 100 }
});
```

## Stake Requirements

| Category | Minimum Stake | Slash Rate |
|----------|---------------|------------|
| Basic utilities | 1,000 OXO | 10% |
| Shopping/capture | 5,000 OXO | 20% |
| Financial | 10,000 OXO | 25% |
| Data handling | 10,000 OXO | 30% |

Stake slashed for fraudulent activity, terms violation, or user harm.

## Revenue Models

**Per-Transaction Fee**: Percentage of value processed.

**Subscription**: Monthly access fee.

**Performance**: Percentage of value generated above baseline.

## Service Agent Tokens

Service Agents can launch tokens for governance and revenue sharing:

```typescript
await loop.avp.launchToken({
  agent: agentPubkey,
  name: 'Shopping Agent Token',
  symbol: 'SHOP',
  bondingCurve: 'linear',
  graduationThreshold: 25_000_000000
});
```

Tokens start on bonding curve, graduate to AMM at threshold.

## Discovery

Users find Service Agents through:
- Registry search by capability
- Reputation scores
- Volume metrics
- Personal Agent recommendations

[Continue to: Agent Interoperability →](interop.md)
