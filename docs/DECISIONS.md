# Decisions Log

This document tracks key architectural and design decisions for Loop Protocol.

---

## Decision Format

Each decision includes:
- **Date**: When decided
- **Context**: Why the decision was needed
- **Decision**: What was decided
- **Rationale**: Why this choice
- **Alternatives considered**: What else was evaluated
- **Implications**: What this affects

---

## Foundational Decisions

### D001: Dual-Token Model (Cred + OXO)

**Date:** 2026-03-10

**Context:** Need to support both stable wealth accumulation and protocol equity/governance.

**Decision:** Two tokens:
- Cred: Stable value (1:1 USD), elastic supply
- OXO: Protocol equity, fixed supply (1B)

**Rationale:**
- Separating stability from speculation allows users to accumulate wealth without volatility
- OXO captures protocol growth for long-term holders
- Similar to stablecoin + governance token patterns, but purpose-built

**Alternatives considered:**
- Single token with variable value — rejected (users need stability for wealth accumulation)
- Three tokens (stable, utility, governance) — rejected (unnecessary complexity)

**Implications:**
- Need stability mechanism for Cred
- OXO distribution strategy critical for decentralization
- Two token contracts to maintain

---

### D002: Solana as Base Chain

**Date:** 2026-03-10

**Context:** Need high-throughput, low-cost blockchain for frequent micro-transactions.

**Decision:** Build on Solana mainnet.

**Rationale:**
- ~400ms block time (fast settlement)
- ~$0.00025 per transaction (micro-transaction friendly)
- Existing ecosystem (DEXs, wallets, tools)
- ZK support via Light Protocol
- Alex already building on Solana

**Alternatives considered:**
- Ethereum L1 — rejected (too expensive for frequent captures)
- Ethereum L2s — considered (cheaper, but less ecosystem maturity)
- Cosmos/custom chain — rejected (unnecessary complexity)
- Virtuals/Base — rejected (Ethereum ecosystem, different philosophy)

**Implications:**
- Solana program development (Rust/Anchor)
- Dependent on Solana network health
- Can't easily migrate if Solana fails

---

### D003: User-Centric Philosophy

**Date:** 2026-03-10

**Context:** Deciding who the primary beneficiary of the protocol should be.

**Decision:** Users (principals) are primary beneficiaries. Value flows to humans, not to agent creators or the protocol.

**Rationale:**
- Virtuals is agent-centric (agents as products)
- Loop differentiates by being user-centric (agents as servants)
- Aligns with mission of reversing extraction economy
- Creates adoption incentive (users have reason to join)

**Alternatives considered:**
- Agent-centric like Virtuals — rejected (doesn't solve extraction problem)
- Protocol-centric (high fees) — rejected (becomes new extractor)

**Implications:**
- Fee structure must favor users (80-85% of capture value)
- Service Agent economy is secondary to user capture
- Marketing focuses on user benefits

---

### D004: Two Agent Types (Personal + Service)

**Date:** 2026-03-10

**Context:** Need to support both user-serving agents and developer-created agents.

**Decision:** Two distinct agent types:
- Personal Agents: Serve one human, capture value, no token
- Service Agents: Serve many, earn fees, optional token

**Rationale:**
- Personal Agents are the core value capture mechanism
- Service Agents enable developer economy (like Virtuals)
- Separation prevents confusion about purpose
- Personal Agents don't need tokens (no speculation on individual wealth)

**Alternatives considered:**
- Single agent type — rejected (conflates purposes)
- No Service Agents — rejected (limits ecosystem growth)

**Implications:**
- Different registration flows
- Service Agents have more complexity (tokens, SubDAOs)
- Personal Agents are simpler to use

---

### D005: Extraction Resets to Zero

**Date:** 2026-03-10

**Context:** Need mechanism to discourage extraction while allowing freedom.

**Decision:** Users can extract Cred anytime, but:
- 5% extraction fee
- Vault resets to zero
- Staking positions liquidated

**Rationale:**
- Prohibition is philosophically wrong (your value, your choice)
- Reset creates strong economic disincentive
- Users who stay benefit from those who leave (fees)
- Builds long-term commitment culture

**Alternatives considered:**
- Prohibition of extraction — rejected (too restrictive)
- No penalty — rejected (no reason to stay)
- Gradual vesting — considered (complex, may add later)

**Implications:**
- Users must understand trade-off
- Early users have less to lose (cold start challenge)
- Messaging must be clear

---

### D006: Modular Capture Layers

**Date:** 2026-03-10

**Context:** Different value sources require different capture mechanisms.

**Decision:** Each capture type is an independent module:
- Shopping, Data, Presence, Attention, Work, Content
- Modules are pluggable and optional
- Agents enable modules they want

**Rationale:**
- Different verification mechanisms per type
- Can ship incrementally (shopping first)
- Can add new modules without protocol changes
- Reduces complexity per module

**Alternatives considered:**
- Monolithic capture system — rejected (too complex)
- External plugins (anyone can create) — deferred (security concerns)

**Implications:**
- Need module interface specification
- Each module is separate development effort
- Modules can have different fee structures

---

### D007: Shopping as First Module

**Date:** 2026-03-10

**Context:** Need to choose which capture module to build first.

**Decision:** Shopping capture is the MVP module.

**Rationale:**
- Alex already building shopping rewards
- Existing behavior (people already shop)
- Clear value proposition (earn from purchases)
- Merchant integration patterns established
- Easiest to explain to users

**Alternatives considered:**
- Data licensing — considered (valuable but harder to explain)
- Attention — considered (requires advertiser network)
- Presence — considered (requires geofence infrastructure)

**Implications:**
- Merchant integration is critical path
- MVP doesn't require ZK (can add later)
- Sets pattern for other modules

---

### D008: veOXO for Governance

**Date:** 2026-03-10

**Context:** Need governance mechanism that rewards long-term commitment.

**Decision:** Vote-escrow model (veOXO):
- Lock OXO for duration → receive veOXO
- Longer lock = more voting power
- veOXO decays toward unlock

**Rationale:**
- Proven model (Curve Finance)
- Aligns governance with long-term holders
- Prevents governance attacks by short-term holders
- Creates demand for OXO

**Alternatives considered:**
- Simple token voting (1 token = 1 vote) — rejected (short-term capture)
- NFT-based governance — rejected (unnecessary complexity)
- Reputation-based — considered (may add later)

**Implications:**
- Need veOXO staking contract
- Governance participation requires commitment
- Power concentrates with long-term holders

---

### D009: Service Agent Bonding Curve

**Date:** 2026-03-10

**Context:** Need launch mechanism for Service Agent tokens.

**Decision:** Bonding curve launch, graduate at 25,000 OXO, then LP.

**Rationale:**
- Virtuals pattern proven (42,000 VIRTUAL graduation)
- Quality filter (must attract real investment)
- Fair launch (anyone can buy early)
- LP lock creates long-term liquidity

**Alternatives considered:**
- Direct LP launch — rejected (no quality filter)
- DAO approval — rejected (centralization, slow)
- Fixed price sale — rejected (unfair distribution)

**Implications:**
- Need bonding curve math
- 500 OXO creation fee filters spam
- 10-year LP lock traps liquidity

---

### D010: Inheritance Mechanism

**Date:** 2026-03-10

**Context:** Core value proposition is generational wealth. Need inheritance.

**Decision:** Vault transfers to designated heir on death:
- Full balance, all positions
- No fee, no reset
- Triggered by death verification

**Rationale:**
- Differentiator from all other protocols
- Emotionally resonant (family wealth)
- Logical extension of user-centric philosophy

**Alternatives considered:**
- No inheritance — rejected (fails core vision)
- Partial inheritance (tax) — considered (may add based on regulations)
- Auto-burn on death — rejected (contrary to philosophy)

**Implications:**
- Need death verification mechanism (oracle, multi-sig, legal)
- Legal/regulatory review needed
- Edge cases (no heir, disputed claims) need handling

---

## Future Decisions Needed

| Topic | Status | Notes |
|-------|--------|-------|
| Cred stability mechanism (algorithmic vs collateral) | Deferred | Start with collateral |
| Death verification method | Deferred | Multi-sig + legal oracle likely |
| ZK circuit design for privacy modules | Deferred | After MVP |
| Cross-chain bridging | Deferred | Solana-first |
| Governance transition timeline | Deferred | After launch |

---

*This log will be updated as new decisions are made.*
