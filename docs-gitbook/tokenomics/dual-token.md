# Dual-Token Model

Loop Protocol uses two tokens: Cred for stable value storage and OXO for protocol equity.

## Why Two Tokens

Single-token models force tradeoffs:

| Goal | Requirement | Conflict |
|------|-------------|----------|
| Wealth storage | Stable value | Can't appreciate |
| Governance | Stakeable | Can't be stable |
| Speculation | Price appreciation | Can't store wealth safely |

Two tokens solve this:
- **Cred**: Stable, for savings and transactions
- **OXO**: Volatile, for governance and equity

## Token Comparison

| Property | Cred | OXO |
|----------|------|-----|
| Purpose | Wealth accumulation | Protocol equity |
| Value | Stable ($1) | Market-determined |
| Supply | Elastic | Fixed (1B) |
| Earning | Captures, stacking yield | Fees, appreciation |
| Staking | Yes (for yield) | Yes (for governance) |

## How They Interact

```
User Activity
    │
    ├───────────────────────────────────┐
    ↓                                   ↓
┌─────────────┐                 ┌─────────────┐
│    Cred     │                 │     OXO     │
│  (Stable)   │                 │   (Equity)  │
├─────────────┤                 ├─────────────┤
│ Capture     │ ←── veOXO ───── │ Governance  │
│ rewards     │     boost       │ Protocol    │
│ Stacking    │                 │ fees        │
│ yield       │                 │             │
└─────────────┘                 └─────────────┘
```

veOXO stakers receive boosted Cred capture rates. Both tokens benefit from protocol growth, but through different mechanisms.

## Value Flows

### Into the System

| Source | Token | Mechanism |
|--------|-------|-----------|
| Capture rewards | Cred | Minted from module fees |
| Stacking yield | Cred | Distributed from revenue |
| Token purchases | OXO | Secondary market |

### Within the System

| Action | Flow |
|--------|------|
| Stack Cred | Liquid Cred → Locked Cred |
| Lock OXO | OXO → veOXO |
| Pay fees | Cred → Protocol treasury |
| Capture boost | veOXO power → Higher Cred rate |

### Out of the System

| Action | Token | Cost |
|--------|-------|------|
| Extract Cred | Cred → USDC | 5% fee |
| Sell OXO | OXO → any | Market price |

## Economic Loop

The tokens create reinforcing dynamics:

```
More Users → More Captures → More Cred
     ↑                           │
     │                     More Stacking
     │                           │
     │                     More Yield Demand
     │                           │
     │                     More OXO Value
     │                           ↓
     └─── More veOXO Staking ←───┘
```

Each token's success supports the other.

## Acquisition

### Getting Cred

| Method | How |
|--------|-----|
| Capture | Enable modules, earn from activity |
| Stacking yield | Lock Cred, earn more |
| Transfer | Receive from others |
| Purchase (future) | DEX trading |

### Getting OXO

| Method | How |
|--------|-----|
| Airdrop | Early users/contributors |
| Purchase | DEXs after launch |
| Grants | Build on the protocol |
| Staking rewards | Early incentive period |

## Summary

- **Cred** = What you save (stable wealth)
- **OXO** = What you stake for influence and upside (volatile equity)

Neither token alone would serve both purposes. Together they enable stable wealth building with optional protocol participation.

[Continue to: Cred Details →](cred.md)
