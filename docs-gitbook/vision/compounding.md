# Value Compounding

Captured value grows through stacking, reinvestment, and agent-managed strategies.

## Stacking Basics

Stacking is locking Cred to earn yield. The mechanics are simple:

1. Choose an amount to lock
2. Choose a duration
3. Earn yield during the lock period
4. Unlock principal plus yield at maturity

```typescript
// Stack 1000 Cred for 6 months
await loop.vault.stack({
  amount: 1000_000000,
  duration: 180 * 24 * 60 * 60
});
```

## Yield Rates

Longer locks earn higher yields:

| Lock Duration | Base APY |
|---------------|----------|
| 30 days | 3% |
| 90 days | 5% |
| 180 days | 8% |
| 365 days | 12% |
| 730 days | 15% |

veOXO holders receive boosted rates (up to 1.5x base).

## Yield Sources

Where does yield come from? Three sources:

**Protocol Revenue**: Capture modules generate fees. A portion of these fees funds stacking yield. As capture volume grows, sustainable yield capacity grows.

**Treasury Operations**: The protocol treasury generates yield through liquidity provision and strategic investments. A portion is distributed to stackers.

**OXO Emissions (Early Period)**: During the bootstrap phase, OXO emissions supplement yield. This decreases over time as protocol revenue grows.

Long-term sustainability depends on protocol revenue covering yield obligations. Conservative yield rates ensure this remains achievable.

## Compound Growth

The power of stacking comes from compound growth over time.

Monthly capture of $150, stacked at 8% average APY:

| Years | Total Captured | Compounded Value |
|-------|----------------|------------------|
| 5 | $9,000 | $11,700 |
| 10 | $18,000 | $31,000 |
| 20 | $36,000 | $114,000 |
| 30 | $54,000 | $340,000 |

The difference between "captured" and "compounded" is the yield effect. Same activity, dramatically different outcome based on whether value compounds or sits idle.

## Auto-Restacking

Configure automatic restacking for hands-off compounding:

```typescript
await loop.vault.setAutoStack(owner, {
  enabled: true,
  minDurationDays: 180,        // 6 months minimum
  reinvestYield: true,         // Restack yield too
  reinvestCaptures: true,      // Add new captures to next stack
  targetStackRatio: 80,        // Keep 80% stacked
  minStackAmount: 10_000000    // Minimum 10 Cred to trigger
});
```

When a stack matures:
1. Principal plus yield automatically enter a new stack
2. Any captures since last stack are added
3. Process repeats indefinitely

A permissionless crank executes the restack:

```typescript
// Anyone can trigger (earns rent refund)
await loop.vault.executeAutoRestack(vaultOwner, oldStack, nonce, cranker);
```

Your agent handles everything. You accumulate wealth without active management.

## Agent-Managed Strategies

Beyond basic stacking, agents can execute sophisticated strategies through protocol-level permissions.

### Permission Levels

```typescript
await loop.vault.setAgentPermission(owner, agent, PermissionLevel.Guided, dailyLimit);
```

| Level | What Agent Can Do |
|-------|-------------------|
| Read | View vault balances |
| Capture | Deposit value into vault |
| Guided | Stack/unstack with daily limits |
| Autonomous | Full strategy control |

### Strategy Execution

**Laddering**: Spread stacks across multiple durations. Provides liquidity (some stacks maturing regularly) while capturing higher yields on longer locks.

```typescript
// Agent stacks across durations
await loop.vault.agentStack(owner, agent, amount1, 30, nonce1);  // 30-day
await loop.vault.agentStack(owner, agent, amount2, 90, nonce2);  // 90-day
await loop.vault.agentStack(owner, agent, amount3, 180, nonce3); // 180-day
```

**Yield Optimization**: Automatically adjust stacking durations based on rate changes. Move to longer durations when rates are favorable.

**Capture Reinvestment**: Immediately stack new captures rather than letting them sit as liquid Cred.

**Rebalancing**: Maintain target allocations between liquid Cred, stacked Cred, and OXO positions.

```typescript
// Agent analyzes and suggests rebalancing
await loop.vault.agentRebalance(owner, agent, 80); // Target 80% stacked
```

## Example: 30-Year Wealth Building

A 25-year-old starts using Loop:

**Phase 1 (Years 1-5)**: Building the base
- Enables shopping and attention capture
- Captures ~$150/month
- Auto-stacks at 6-month intervals
- End of year 5: ~$12,000 balance

**Phase 2 (Years 5-15)**: Acceleration
- Capture rates improve as more modules activate
- Agent optimizes stacking for yield
- Compound growth accelerating
- End of year 15: ~$85,000 balance

**Phase 3 (Years 15-30)**: Compound dominance
- Yield on existing balance exceeds new captures
- Agent manages increasingly large positions
- End of year 30: ~$350,000+ balance

This isn't guaranteed. Rates may change. Capture opportunities may vary. But the math of compound growth on captured value is real.

## Extraction Option

Stacking isn't mandatory. You can keep Cred liquid or extract to USDC:

**Liquid Cred**: Available for transfer or extraction anytime. No yield.

**Extraction**: Convert Cred to USDC. 5% fee applies. Funds sent to your external wallet.

The 5% extraction fee exists to encourage long-term stacking, not to trap users. Anyone can exit. The protocol just creates incentives for staying.

## Early Unlock Penalty

Breaking a stack before maturity costs:
- All accrued yield forfeit
- 5% of principal as fee

This makes early unlocking expensive. Only stack amounts you can afford to lock for the full duration.

[Continue to: Self-Custody →](inheritance.md)
