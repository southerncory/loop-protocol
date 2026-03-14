# OXO (Protocol Equity)

OXO is the governance and equity token of Loop Protocol. It represents ownership in the protocol's future.

## Purpose

OXO exists to:
- Govern protocol parameters
- Align long-term incentives
- Capture protocol value appreciation
- Enable Service Agent creation
- Reward early participants

Unlike Cred (stable), OXO can appreciate with protocol success.

## Token Specifications

| Property | Value |
|----------|-------|
| Total Supply | 1,000,000,000 (1 billion) |
| Decimals | 6 |
| Type | SPL Token (Solana) |
| Inflation | None (fixed supply) |

## Distribution

| Allocation | Percentage | Amount | Vesting |
|------------|------------|--------|---------|
| Community & Ecosystem | 40% | 400M | Various programs |
| Team & Advisors | 20% | 200M | 4-year, 1-year cliff |
| Treasury | 20% | 200M | DAO-controlled |
| Investors | 15% | 150M | 2-year, 6-month cliff |
| Liquidity | 5% | 50M | At launch |

### Community Allocation Detail

| Program | Amount | Purpose |
|---------|--------|---------|
| User Rewards | 150M | Early capture incentives |
| Developer Grants | 100M | Build on Loop |
| Retroactive Airdrop | 50M | Early contributors |
| Staking Rewards | 50M | veOXO incentives |
| Partnerships | 50M | Strategic integrations |

## veOXO (Vote-Escrow OXO)

Lock OXO to get veOXO, the power token.

### Locking

```typescript
await loop.oxo.lock({
  amount: 10000_000000,
  duration: 2 * 365 * 24 * 60 * 60  // 2 years
});
```

### veOXO Multiplier

Longer locks yield more veOXO per OXO:

| Lock Duration | veOXO per OXO |
|---------------|---------------|
| 1 month | 0.02 |
| 3 months | 0.06 |
| 6 months | 0.125 |
| 1 year | 0.25 |
| 2 years | 0.5 |
| 4 years | 1.0 |

### veOXO Decay

veOXO decays linearly toward unlock:

```
veOXO(t) = initialVeOXO × (timeRemaining / lockDuration)
```

At lock: full power. At unlock: zero power. Re-lock to maintain influence.

## veOXO Benefits

### 1. Governance

Vote on protocol decisions:
- Parameter changes (fees, rates)
- Treasury allocation
- Module approvals
- Program upgrades

Voting power equals veOXO balance.

### 2. Fee Share

Receive portion of protocol fees:

```
Your Share = (Your veOXO / Total veOXO) × Weekly Fee Pool
```

Fees distributed weekly from:
- Capture module fees (5% allocation)
- Extraction fees (portion)
- Other protocol revenue

### 3. Capture Boost

Higher capture rates with veOXO:

| veOXO Balance | Capture Boost |
|---------------|---------------|
| 0 | 1.0x (base) |
| 1,000 | 1.1x |
| 10,000 | 1.25x |
| 100,000 | 1.5x |

### 4. Service Agent Creation

Create Service Agents by burning OXO:
- 500 OXO burned to create
- Additional stake required
- Token launch possible

## Value Accrual

OXO captures value through:

### Protocol Growth

More users → More captures → More fees → More fee share value → OXO more valuable

### Token Burns

OXO burned for:
- Service Agent creation (500 OXO)
- Premium features (future)
- Governance decisions (buyback and burn)

Reduces supply, increases scarcity.

### Treasury Value

Treasury holds assets governed by OXO holders. Treasury value accrues to protocol, benefiting OXO.

## Risks

### Volatility

OXO is volatile. Don't store wealth in OXO. Use Cred for savings, OXO for governance exposure.

### Lock Risk

Locked OXO cannot be sold during lock period. Only lock what you can afford to lock.

### Governance Risk

Concentrated OXO could manipulate governance. Mitigated by quorum requirements, timelocks, and progressive decentralization.

[Continue to: Value Flows →](flows.md)
