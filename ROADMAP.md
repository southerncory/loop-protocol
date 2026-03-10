# ROADMAP.md — Development Phases

---

## Overview

Loop Protocol is built modularly. Each phase produces something functional. We ship incrementally.

**Target: MVP on mainnet in 5-6 months.**

---

## Phase 1: Foundation (Month 1)

**Goal:** Complete specification and documentation.

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Repository structure | ✅ | Created 2026-03-10 |
| Architecture document | ✅ | Full system design |
| Tokenomics document | ✅ | Cred + OXO economics |
| Protocol specification | ✅ | AVP, VTP, Vault |
| Module specifications | ✅ | Shopping, Data, Presence, Attention |
| Whitepaper draft | ✅ | Ready for review |
| Review and refine | ⏳ | Awaiting feedback |

**Exit criteria:** Alex approves all specifications. Ready for implementation.

---

## Phase 2: Core Protocol (Month 2-3)

**Goal:** AVP, Vault, and VTP programs on Solana devnet.

| Deliverable | Status | Notes |
|-------------|--------|-------|
| AVP program | ⏳ | Agent identity, registration, binding |
| Vault program | ⏳ | Value storage, basic operations |
| VTP program | ⏳ | Transfers, escrow, settlement |
| Integration tests | ⏳ | Core protocol tests |
| Devnet deployment | ⏳ | Deploy and verify |

**Exit criteria:** Core protocol functional on devnet. Agents can register, have vaults, transfer value.

---

## Phase 3: Tokens (Month 3-4)

**Goal:** Cred and OXO tokens with staking.

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Cred token program | ⏳ | Mint/burn mechanics |
| OXO token program | ⏳ | Fixed supply |
| veOXO staking program | ⏳ | Lock, governance power |
| Cred stacking (yield) | ⏳ | Lock for yield |
| Token integration tests | ⏳ | Full token lifecycle |

**Exit criteria:** Both tokens functional. Staking works. Yield accrues.

---

## Phase 4: First Capture Module (Month 4-5)

**Goal:** Shopping capture integrated with protocol.

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Shopping capture program | ⏳ | Receipt verification, proof submission |
| Merchant integration | ⏳ | Connect to existing POS work |
| ZK proofs (if needed) | ⏳ | Privacy-preserving verification |
| End-to-end testing | ⏳ | Full flow: purchase → capture → vault |

**Exit criteria:** User can make a purchase, agent submits proof, Cred lands in vault.

---

## Phase 5: MVP Launch (Month 5-6)

**Goal:** Mainnet deployment with shopping capture.

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Security audit | ⏳ | External auditor |
| Bug fixes | ⏳ | Address audit findings |
| Mainnet deployment | ⏳ | All programs live |
| Initial documentation | ⏳ | User-facing docs |
| Soft launch | ⏳ | Limited users |

**Exit criteria:** Loop Protocol live on Solana mainnet. Users earning Cred from shopping.

---

## Phase 6+: Expansion (Month 6-12)

**Goal:** Additional capture modules, Service Agent framework, SDK.

| Deliverable | Timeline | Notes |
|-------------|----------|-------|
| Data licensing module | Month 6-7 | Second capture layer |
| Presence module | Month 7-8 | Location-based capture |
| Service Agent framework | Month 8-10 | Bonding curve, SubDAOs |
| Agent SDK | Month 9-10 | Universal interface |
| Attention module | Month 10-12 | Ad-based capture |

---

## Dependencies

```
Phase 1 (Specs)
    │
    ▼
Phase 2 (Core Protocol)
    │
    ├──────────────────┐
    ▼                  ▼
Phase 3 (Tokens)    Phase 4 (Shopping)
    │                  │
    └────────┬─────────┘
             ▼
      Phase 5 (MVP)
             │
             ▼
      Phase 6+ (Expansion)
```

Note: Phases 3 and 4 can run in parallel.

---

## Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Scaffold complete | 2026-03-10 | ✅ |
| Specs approved | 2026-03-17 | ⏳ |
| Core protocol on devnet | 2026-05-01 | ⏳ |
| Tokens functional | 2026-06-01 | ⏳ |
| Shopping capture integrated | 2026-07-15 | ⏳ |
| Security audit complete | 2026-08-01 | ⏳ |
| **MVP on mainnet** | **2026-08-15** | ⏳ |

---

## Risk Factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| Security vulnerabilities | High | External audit, thorough testing |
| Scope creep | Medium | Stick to modular phases |
| Regulatory uncertainty | Medium | Legal review before mainnet |
| Alex availability | Medium | Async workflow, clear specs |
| ZK complexity | Medium | Start simple, add ZK later if needed |

---

*This roadmap will be updated as we progress.*
