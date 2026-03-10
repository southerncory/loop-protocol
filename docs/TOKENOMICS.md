# Tokenomics

## Overview

Loop Protocol uses a dual-token model:

1. **Cred** — Stable value token for wealth accumulation
2. **OXO** — Protocol equity token for governance and ownership

This separation allows users to accumulate stable wealth (Cred) while participating in protocol growth (OXO).

---

## Cred — The Stable Value Layer

### Properties

| Property | Value |
|----------|-------|
| Name | Cred |
| Type | Stable value token |
| Peg | 1 Cred = $1 USD |
| Supply | Elastic (no cap) |
| Mint | On value capture |
| Burn | On extraction |

### Purpose

Cred is what users earn from capture activities. It's designed for:
- Wealth accumulation (stable, not speculative)
- Stacking for yield (compounding)
- Spending within the Loop ecosystem
- Inheritance (transfers to heirs)

### Stability Mechanism

**Phase 1 (MVP):** Collateral-backed
- Protocol holds USDC reserves
- Cred minted 1:1 against collateral
- Extraction burns Cred, releases collateral

**Phase 2 (Future):** Algorithmic
- Expand stability mechanisms as protocol matures
- Potentially add other collateral types
- May introduce stability module

### Minting

Cred is minted when value is captured:

```
Capture event occurs (e.g., shopping)
    │
    ▼
Proof verified by capture module
    │
    ▼
Reward calculated (e.g., $2.00)
    │
    ▼
Cred minted to user's vault
```

Minting only occurs against real value capture — not arbitrarily.

### Burning

Cred is burned on extraction:

```
User requests extraction
    │
    ▼
5% extraction fee taken
    │
    ▼
Remaining Cred burned
    │
    ▼
Equivalent fiat/USDC released
    │
    ▼
User's vault reset to zero
```

### Stacking (Yield)

Users can lock Cred to earn yield:

| Lock Duration | APY |
|---------------|-----|
| Flexible (no lock) | 3% |
| 3 months | 6% |
| 6 months | 9% |
| 1 year | 12% |
| 2 years | 15% |

**Yield Source:** Protocol treasury, funded by capture fees.

**Compounding:** Yield can be auto-compounded or claimed.

---

## OXO — The Protocol Equity Layer

### Properties

| Property | Value |
|----------|-------|
| Name | OXO |
| Type | Protocol equity token |
| Supply | 1,000,000,000 (1B) |
| Inflation | None (hard cap) |
| Governance | Yes (via veOXO) |

### Purpose

OXO represents ownership of the protocol:
- Governance rights (vote on protocol changes)
- Share of protocol fees
- Required for Service Agent creation
- Premium features and benefits

### Distribution

| Category | Allocation | Amount | Vesting |
|----------|------------|--------|---------|
| Community / Public | 50% | 500,000,000 | Immediate + ongoing rewards |
| Treasury | 25% | 250,000,000 | DAO-governed, max 10% annual emission |
| Team / Early | 15% | 150,000,000 | 2-year vest, 6-month cliff |
| Liquidity | 5% | 50,000,000 | Immediate (DEX pools) |
| Ecosystem Partners | 5% | 50,000,000 | 1-year vest |

### Community Distribution Methods

The 50% community allocation is distributed via:

1. **Capture Bonuses** — Early users earn OXO alongside Cred
2. **Staking Rewards** — veOXO stakers earn additional OXO
3. **Airdrops** — Strategic airdrops to aligned communities
4. **Referral Program** — Users earn OXO for bringing others
5. **Contribution Rewards** — Developers, creators, community contributors

### Treasury Governance

The 25% treasury allocation is governed by veOXO holders:

- Maximum 10% of treasury can be emitted per year
- Proposals require 0.1% OXO threshold to submit
- Voting requires 25% quorum to pass
- Used for: grants, partnerships, liquidity, development

---

## veOXO — Vote-Escrowed OXO

### Mechanism

Lock OXO to receive veOXO (voting power):

| Lock Duration | veOXO Multiplier |
|---------------|------------------|
| 6 months | 0.25x |
| 1 year | 0.5x |
| 2 years | 1x |
| 4 years | 2x |

**Example:** Lock 1,000 OXO for 4 years → receive 2,000 veOXO

### Benefits

| Benefit | Description |
|---------|-------------|
| Governance voting | Vote on protocol proposals |
| Protocol fee share | Receive portion of capture fees |
| Boosted capture rates | Up to 1.5x capture multiplier |
| Service Agent launches | Early access to new agent tokens |
| Premium features | Access to advanced protocol features |

### veOXO Decay

veOXO linearly decays toward unlock date:
- Lock 1,000 OXO for 4 years → 2,000 veOXO initially
- After 2 years → 1,000 veOXO remaining
- At unlock → 0 veOXO, OXO unlocked

Users can extend locks to maintain/increase veOXO.

---

## Fee Structure

### Capture Fees

Fees are paid by value sources (merchants, advertisers, data buyers), not users.

| Capture Layer | User Share | Protocol | veOXO Stakers |
|---------------|------------|----------|---------------|
| Shopping | 80% | 14% | 6% |
| Data licensing | 85% | 10% | 5% |
| Attention | 80% | 14% | 6% |
| Presence | 85% | 10% | 5% |

**Example: Shopping Capture**
```
Merchant rewards budget: $2.50
├── User receives: $2.00 Cred (80%)
├── Protocol treasury: $0.35 (14%)
└── veOXO stakers: $0.15 (6%)
```

### Transfer Fees

| Transfer Type | Fee | Destination |
|---------------|-----|-------------|
| Agent-to-agent | 0.1% | Protocol treasury |
| Inheritance | 0% | None |
| Extraction (Cred → fiat) | 5% | Protocol treasury |

### Service Agent Fees

| Fee Type | Amount | Distribution |
|----------|--------|--------------|
| Creation fee | 500 OXO | Treasury |
| Trading fee (post-graduation) | 1% | 70% creator, 20% protocol, 10% ACP |
| Service usage | Set by creator | 90% creator, 10% protocol |

---

## Service Agent Tokenomics

Service Agents can optionally launch their own token.

### Launch Mechanism

1. **Bonding Curve** — Agent token launches paired against OXO
2. **Graduation** — Collect 25,000 OXO to graduate
3. **LP Creation** — Post-graduation, tokens paired in Raydium LP
4. **LP Lock** — Liquidity locked for 10 years

### Token Mechanics

**Trading Fee:** 1% on all trades
- 70% to creator/SubDAO
- 20% to protocol treasury
- 10% to ACP incentive pool

**Buyback-Burn:** Creators can use revenue to buy back and burn their agent token, making it deflationary.

### SubDAO Governance

Each Service Agent can have a SubDAO:
- Agent token holders vote on agent behavior
- Can adjust: personality, goals, model, fees
- Delegated Proof of Stake for validators

---

## Value Flows

### Capture Flow

```
Value Source (Merchant/Advertiser/etc.)
           │
           │ Pays for access/engagement
           ▼
┌─────────────────────────┐
│     Capture Module      │
│   (Shopping/Data/etc.)  │
└───────────┬─────────────┘
            │
            │ Distributes
            ▼
    ┌───────┴───────┬─────────────┐
    │               │             │
    ▼               ▼             ▼
User Vault    Protocol      veOXO
(80-85%)     Treasury      Stakers
              (10-14%)      (5-6%)
```

### Service Flow

```
Personal Agent (User)
           │
           │ Requests service, pays fee
           ▼
┌─────────────────────────┐
│     Service Agent       │
│   (performs service)    │
└───────────┬─────────────┘
            │
            │ Revenue distributed
            ▼
    ┌───────┴───────┐
    │               │
    ▼               ▼
Creator          Protocol
(90%)           Treasury
                 (10%)
```

### Staking Flow

```
User holds OXO
      │
      │ Locks for veOXO
      ▼
┌─────────────────────────┐
│    veOXO Position       │
│   (governance power)    │
└───────────┬─────────────┘
            │
            │ Earns
            ▼
    ┌───────┴───────┬──────────────┐
    │               │              │
    ▼               ▼              ▼
Protocol      Governance       Boosted
Fee Share       Rights         Capture
```

---

## Economic Incentives

### For Users

| Incentive | Mechanism |
|-----------|-----------|
| Earn from daily activities | Capture modules |
| Compound wealth | Cred stacking yield |
| No extraction pressure | Closed loop disincentivizes extraction |
| Generational wealth | Inheritance mechanism |

### For OXO Holders

| Incentive | Mechanism |
|-----------|-----------|
| Protocol fee share | veOXO staking |
| Governance control | Voting on protocol direction |
| Network growth | OXO value increases with protocol usage |

### For Service Agent Creators

| Incentive | Mechanism |
|-----------|-----------|
| Service fees | 90% of usage revenue |
| Token appreciation | Buyback-burn creates scarcity |
| Community ownership | SubDAO engagement |

### For Value Sources (Merchants, etc.)

| Incentive | Mechanism |
|-----------|-----------|
| Customer acquisition | Users incentivized to transact with Loop merchants |
| Customer retention | Closed loop keeps users in ecosystem |
| Data insights | Aggregated, privacy-preserving analytics |

---

## Comparison to Virtuals Protocol

| Dimension | Virtuals | Loop |
|-----------|----------|------|
| Main token | $VIRTUAL (1B) | OXO (1B) |
| Stable value | None | Cred (elastic) |
| Primary value flow | Agent creators earn | Users capture value |
| User relationship | Consumers (pay) | Accumulators (earn) |
| Staking | veVIRTUAL | veOXO + Cred stacking |
| Agent tokens | All agents | Service Agents only |
| Inheritance | None | Built-in |

---

## Risk Factors

| Risk | Mitigation |
|------|------------|
| Cred de-peg | Collateral reserves, circuit breakers |
| OXO value collapse | Utility-driven demand, fee distribution |
| Insufficient yield source | Diverse capture layers, protocol fees |
| Regulatory classification | Legal review, compliant structure |
| Extraction runs | Reset penalty creates disincentive |

---

## Summary

| Token | Purpose | Supply | Earns From |
|-------|---------|--------|------------|
| Cred | Wealth accumulation | Elastic | Value capture, stacking yield |
| OXO | Protocol ownership | 1B fixed | Fee share, appreciation |
| veOXO | Governance power | Derived from OXO | Fee share, boosted capture |
| Agent tokens | Service Agent equity | Per-agent | Service usage |

The model ensures:
- Users accumulate stable wealth (Cred)
- Protocol ownership is distributed (OXO)
- Long-term alignment via staking (veOXO)
- Creator economy thrives (Service Agents)
- Value flows to participants, not extractors

---

*Tokenomics subject to refinement based on modeling and community feedback.*
