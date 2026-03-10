# Loop Protocol Whitepaper

## The Economic Layer for the Agentic Era

**Version 0.1 — Draft**

---

## Abstract

Loop Protocol is infrastructure for a future where AI agents manage economic activity on behalf of humans. Instead of value flowing to banks, platforms, and intermediaries, Loop enables individuals to capture value from everything they do — shopping, data, attention, presence, work, and creation — compounding it over time and preserving it across generations.

The protocol defines standards for agent identity, value transfer, and modular value capture. Any agent can implement it. Any human can benefit from it.

This paper describes the vision, architecture, and economics of Loop Protocol.

---

## 1. The Problem: Extraction Everywhere

### 1.1 The Current Model

Every economic interaction you have generates value. When you:
- **Shop** — Your purchase data is sold to data brokers
- **Browse** — Your attention is monetized by advertisers
- **Work** — Your productivity surplus goes to employers
- **Create** — Your content drives platform value
- **Exist** — Your location data is tracked and sold

This value is captured by intermediaries: banks, card networks, platforms, data brokers. You create it. They capture it.

### 1.2 The Scale of Extraction

Consider a typical consumer:
- Credit card interchange: 2-3% of every purchase
- Platform fees: 30% of digital purchases
- Data value: Estimated $200-300/year per person (captured by others)
- Attention value: Unknown but substantial

Over a lifetime, the value extracted from an individual amounts to tens or hundreds of thousands of dollars — value they created but never captured.

### 1.3 The Generational Impact

Extracted value compounds — for the extractors. Banks reinvest your deposits. Platforms grow from your data. But for individuals, there is no compounding. Each generation starts from scratch.

Wealth inequality grows not because people don't create value, but because they don't capture it.

---

## 2. The Opportunity: The Agentic Era

### 2.1 AI Agents Are Coming

Within the next decade, most people will have personal AI agents — software that acts on their behalf. These agents will:
- Manage schedules and communications
- Handle purchases and transactions
- Navigate digital services
- Make decisions within defined parameters

This is not speculation. The technology exists today.

### 2.2 Agents Need Economic Infrastructure

For agents to act on behalf of humans, they need:
- **Identity** — Verifiable proof of who they represent
- **Value storage** — A place to hold assets
- **Transfer mechanisms** — Ways to send and receive value
- **Capture hooks** — Methods to intercept value from activities

No standard infrastructure exists for this. Loop Protocol provides it.

### 2.3 The Opportunity to Realign Incentives

The transition to agent-mediated economics is a rare opportunity to rebuild incentives. If we build the infrastructure right, value can flow to creators instead of extractors.

This is what Loop Protocol does.

---

## 3. The Vision: Capture, Compound, Inherit

### 3.1 Value Capture

Your agent captures value from everything you do:

| Activity | Current Beneficiary | Loop Beneficiary |
|----------|---------------------|------------------|
| Shopping | Banks, card networks | You |
| Data | Platforms, data brokers | You |
| Attention | Advertisers, platforms | You |
| Presence | Location aggregators | You |
| Work | Employers | You (partially) |
| Content | Platforms | You |

Capture is modular. Each activity type has its own module. Agents enable the modules they want.

### 3.2 Value Compounding

Captured value compounds:
- **Stacking** — Lock value for yield (3-15% APY)
- **Reinvestment** — Yield can be automatically restaked
- **Time** — Compounding rewards patience

The closed-loop design encourages staying in the system. You *can* extract, but extraction resets your vault to zero. Rational actors stay and compound.

### 3.3 Value Inheritance

When you die, your vault transfers to your designated heir:
- Full balance
- Staking positions (continue earning)
- Capture history
- No reset, no penalty

This enables generational wealth — not from speculation, but from captured value.

---

## 4. Protocol Architecture

### 4.1 Design Principles

Loop Protocol is built on:

1. **User-centricity** — Value flows to humans, not intermediaries
2. **Agent-agnosticism** — Any agent can implement the protocol
3. **Modularity** — Capture layers are independent and pluggable
4. **Trustlessness** — Verification is cryptographic
5. **Inheritability** — Wealth persists across generations

### 4.2 Protocol Stack

```
┌─────────────────────────────────────────┐
│  Capture Modules                        │
│  (Shopping, Data, Attention, etc.)      │
├─────────────────────────────────────────┤
│  Value Transfer Protocol (VTP)          │
├─────────────────────────────────────────┤
│  Agent Value Protocol (AVP)             │
├─────────────────────────────────────────┤
│  Solana Blockchain                      │
└─────────────────────────────────────────┘
```

### 4.3 Agent Value Protocol (AVP)

Defines agent identity and principal binding:
- Agents are wallets with verifiable identity
- Principals (humans) bind to agents via biometric proof
- Agents declare capabilities and stake requirements

### 4.4 Value Transfer Protocol (VTP)

Defines how value moves:
- Request → Negotiate → Transact → Verify
- Escrow for conditional transfers
- Dispute resolution
- Inheritance triggers

### 4.5 Capture Modules

Independent modules for each value type:
- Shopping: Purchase verification and rewards
- Data: Licensing marketplace
- Attention: Opt-in ad viewing
- Presence: Location proof and licensing
- (Future) Work, Content, and more

Each module defines its own proof format and verification logic.

---

## 5. Token Economics

### 5.1 Dual-Token Model

**Cred (Stable Value)**
- Pegged 1:1 to USD
- Elastic supply (mint on capture, burn on extraction)
- Used for wealth accumulation
- Stackable for yield

**OXO (Protocol Equity)**
- Fixed supply: 1 billion
- Governance rights via veOXO
- Required for Service Agent creation
- Captures protocol-level value appreciation

### 5.2 Value Flows

```
Value Sources → Capture Modules → User Vaults (80-85%)
                                → Protocol Treasury (10-14%)
                                → veOXO Stakers (5-6%)
```

Users receive the majority. The protocol sustains itself. Stakers are rewarded for long-term commitment.

### 5.3 Staking

**Cred Stacking:** Lock Cred for yield (3-15% APY based on duration)

**veOXO:** Lock OXO for governance power, fee share, and boosted capture rates

### 5.4 Closed Loop Incentive

Extraction is allowed but costly:
- 5% extraction fee
- Vault resets to zero
- Staking positions liquidated

The incentive to stay is stronger than the incentive to leave.

---

## 6. Agent Ecosystem

### 6.1 Personal Agents

Every user has a Personal Agent that:
- Captures value on their behalf
- Manages their vault
- Submits proofs to capture modules
- Handles transfers and staking

Personal Agents don't have tokens. They serve one human.

### 6.2 Service Agents

Developers can create Service Agents that:
- Provide services to Personal Agents
- Earn fees for their creators
- Optionally launch their own token
- Are governed by SubDAOs

This creates a two-sided ecosystem:
- Users benefit from Personal Agents
- Creators profit from Service Agents

### 6.3 Agent Interoperability

Loop Protocol is agent-agnostic. The interface is simple:

```
register() → identity + vault
discoverCapabilities() → available modules
enableCapability(id) → activate capture
submitProof(id, proof) → capture value
```

Any agent that implements this interface is Loop-compatible.

---

## 7. Comparison to Existing Models

### 7.1 Traditional Finance

| Dimension | Traditional Finance | Loop Protocol |
|-----------|---------------------|---------------|
| Value flow | To intermediaries | To individuals |
| Compounding | For banks, from your deposits | For you, from your activity |
| Inheritance | Taxed, fragmented | Direct, preserved |
| Control | Institutional | Individual (via agent) |

### 7.2 Existing Crypto

| Dimension | Existing Crypto | Loop Protocol |
|-----------|-----------------|---------------|
| Value source | Speculation | Real economic activity |
| Stability | Volatile | Cred is stable |
| User experience | Complex | Agent handles everything |
| Utility | Often unclear | Captures real value |

### 7.3 Virtuals Protocol

| Dimension | Virtuals Protocol | Loop Protocol |
|-----------|-------------------|---------------|
| Focus | Agent creation | Human value capture |
| Token model | Single ($VIRTUAL) | Dual (Cred + OXO) |
| Primary flow | Agent creators earn | Users earn |
| Agent type | Agents as products | Agents as servants |

Loop and Virtuals are complementary. Virtuals Service Agents could implement Loop Protocol.

---

## 8. Roadmap

### Phase 1: Foundation (Q1 2026)
- Protocol specification
- Whitepaper
- Core architecture design

### Phase 2: Core Protocol (Q2 2026)
- AVP implementation
- VTP implementation
- Vault program
- Devnet deployment

### Phase 3: Tokens (Q2-Q3 2026)
- Cred token
- OXO token
- veOXO staking
- Cred stacking

### Phase 4: First Capture Module (Q3 2026)
- Shopping capture
- Merchant integrations
- End-to-end flow

### Phase 5: MVP Launch (Q3 2026)
- Security audit
- Mainnet deployment
- Initial user onboarding

### Phase 6+: Expansion (Q4 2026+)
- Additional capture modules
- Service Agent framework
- Agent SDK
- Ecosystem growth

---

## 9. Governance

### 9.1 Protocol Governance

veOXO holders govern the protocol:
- Proposal threshold: 0.1% of supply
- Voting quorum: 25%
- Topics: fees, parameters, treasury, upgrades

### 9.2 Progressive Decentralization

Initial development is centralized for speed. Governance decentralizes as the protocol matures:
- Year 1: Core team leads
- Year 2: Shared governance
- Year 3+: Full DAO control

---

## 10. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Cred stability | Collateral reserves, circuit breakers |
| Regulatory uncertainty | Legal review, compliant structure |
| Adoption | Start with shopping (existing behavior) |
| Security | Audits, bug bounties, staged rollout |
| Competition | First-mover in user-centric agent economics |

---

## 11. Conclusion

The agentic era is coming. The question is: who will capture the value that agents generate?

Loop Protocol ensures that value flows to individuals — the people who actually create it. By providing infrastructure for agent identity, value transfer, and modular capture, Loop enables a future where:

- Everyone captures value from their daily activities
- That value compounds over time
- It passes to future generations
- No intermediary extracts it

This is not a marginal improvement. This is a fundamental realignment of economic incentives — built for the age of AI agents.

**Loop Protocol: Capture. Compound. Inherit.**

---

## References

1. Virtuals Protocol Documentation
2. Solana Program Library
3. Vote-Escrow Token Mechanics (Curve Finance)
4. ERC-6551: Token Bound Accounts
5. Light Protocol: ZK Compression on Solana

---

## Appendix

### A. Glossary

See: [GLOSSARY.md](GLOSSARY.md)

### B. Technical Specifications

See: [specs/](../specs/)

### C. Tokenomics Details

See: [TOKENOMICS.md](TOKENOMICS.md)

---

*This whitepaper is a living document. Version 0.1 — March 2026*
