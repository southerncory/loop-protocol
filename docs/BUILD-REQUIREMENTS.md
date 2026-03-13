# Loop Protocol — Build Requirements

## What We Have

### On-Chain (Solana Programs)
| Program | Status | Devnet |
|---------|--------|--------|
| loop_vault | ✅ Built | ✅ Deployed |
| loop_cred | ✅ Built | ✅ Deployed |
| loop_oxo | ✅ Built | ✅ Deployed |
| loop_vtp | ✅ Built | ✅ Deployed |
| loop_avp | ✅ Built | ✅ Deployed |
| loop_shopping | ✅ Built | ⏳ Pending |

### Off-Chain
| Component | Status |
|-----------|--------|
| TypeScript SDK | ✅ Built |
| elizaOS Plugin | ✅ Demo |
| Merchant integrations | 🟡 Partial (Square OAuth) |

---

## What We Need to Build

### 1. CAPTURE MODULE FRAMEWORK

**Problem:** Each capture layer needs similar infrastructure (proof verification, reward calculation, Cred minting). Currently only Shopping exists.

**Solution:** Generic capture module interface

```rust
// On-chain: Capture Module Interface
pub trait CaptureModule {
    fn verify_proof(proof: &CaptureProof) -> Result<bool>;
    fn calculate_reward(proof: &CaptureProof) -> Result<u64>;
    fn mint_reward(vault: &Pubkey, amount: u64) -> Result<()>;
    fn get_fee_split() -> FeeSplit;
}
```

**Build:**
- [ ] Abstract capture module base program
- [ ] Proof verification registry (different proof types)
- [ ] Reward calculation engine
- [ ] Fee distribution logic

**Effort:** 2-3 weeks

---

### 2. NEW ON-CHAIN PROGRAMS

Each capture layer needs on-chain logic:

| Layer | Program Needed | Complexity |
|-------|----------------|------------|
| Referral | loop_referral | Medium |
| Attention | loop_attention | Medium |
| Data | loop_data | High |
| Compute | loop_compute | High |
| Network | loop_network | Low |
| Skill | loop_skill | Medium |
| Liquidity | loop_liquidity | Very High |
| Energy | loop_energy | High |
| Social | loop_social | Medium |
| Insurance | loop_insurance | Very High |

**Priority builds:**

```
Phase 1: loop_referral, loop_attention
Phase 2: loop_data, loop_compute, loop_network
Phase 3: loop_skill, loop_liquidity
Phase 4: loop_energy, loop_social, loop_insurance
```

**Effort:** 4-6 weeks per program

---

### 3. AGENT RUNTIME

**Problem:** We have on-chain programs but no software that actually runs on user devices to capture value.

**Solution:** Loop Agent — cross-platform daemon/app

```
┌─────────────────────────────────────────────┐
│              LOOP AGENT RUNTIME             │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │         Capture Orchestrator        │   │
│  │  (coordinates all capture modules)  │   │
│  └─────────────────────────────────────┘   │
│       │       │       │       │            │
│  ┌────┴──┐┌───┴───┐┌──┴──┐┌───┴───┐       │
│  │Shopping││Referral││Attention││Data│ ... │
│  │Capture ││Capture ││Capture  ││Cap │     │
│  └────────┘└────────┘└─────────┘└────┘     │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │          Local Data Store           │   │
│  │  (behavior patterns, preferences)   │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │         Solana RPC Client           │   │
│  │    (signs txs, submits proofs)      │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Platforms:**
| Platform | Tech | Priority |
|----------|------|----------|
| Mobile (iOS/Android) | React Native | High |
| Browser Extension | Chrome/Firefox | High |
| Desktop | Electron or Tauri | Medium |
| CLI/Daemon | Node.js/Rust | Low |

**Build:**
- [ ] Core agent runtime (TypeScript)
- [ ] Capture module plugin system
- [ ] Local encrypted storage
- [ ] Wallet integration (Phantom, Solflare)
- [ ] Background task scheduler
- [ ] Mobile app shell
- [ ] Browser extension shell

**Effort:** 8-12 weeks for MVP

---

### 4. MARKETPLACE INFRASTRUCTURE

**Problem:** Several capture layers need marketplaces (data buyers, compute tasks, attention bids).

**Solution:** Loop Marketplace — matching buyers and sellers

```
┌─────────────────────────────────────────────┐
│            LOOP MARKETPLACE                 │
├─────────────────────────────────────────────┤
│  Data Marketplace                           │
│  - Buyers post data requests               │
│  - Agents match and fulfill                │
│  - Escrow and settlement                   │
├─────────────────────────────────────────────┤
│  Compute Marketplace                        │
│  - Task posters submit jobs                │
│  - Agents bid and execute                  │
│  - Result verification                     │
├─────────────────────────────────────────────┤
│  Attention Marketplace                      │
│  - Advertisers post campaigns              │
│  - Agents filter and serve                 │
│  - View verification                       │
├─────────────────────────────────────────────┤
│  Skill Marketplace                          │
│  - Model buyers request patterns           │
│  - Agents license behavior models          │
│  - Privacy-preserving delivery             │
└─────────────────────────────────────────────┘
```

**Build:**
- [ ] Marketplace core (order matching, escrow)
- [ ] Data marketplace module
- [ ] Compute marketplace module
- [ ] Attention marketplace module
- [ ] API for buyers/advertisers
- [ ] Dashboard for demand side

**Effort:** 6-8 weeks

---

### 5. EXTERNAL INTEGRATIONS

**Problem:** Capture layers need to connect to external services.

| Layer | Integrations Needed |
|-------|---------------------|
| Shopping | Square, Stripe, Clover, Shopify |
| Referral | Amazon Associates, ShareASale, Impact, CJ |
| Attention | Ad networks (or build our own) |
| Data | Data brokers, market researchers |
| Compute | Render, Akash, Golem, or custom |
| Network | DAOs, oracles, L2s |
| Energy | Tesla, Nest, utility APIs |
| Liquidity | DEXs (Raydium, Orca), lending (Solend, Marginfi) |

**Build:**
- [ ] Integration SDK (standard connector interface)
- [ ] Shopping connectors (expand beyond Square)
- [ ] Affiliate network connectors
- [ ] DeFi protocol connectors
- [ ] Smart home connectors

**Effort:** 2-4 weeks per integration

---

### 6. PRIVACY INFRASTRUCTURE

**Problem:** Data and Skill layers need privacy-preserving computation.

**Solution:** ZK proofs for sensitive captures

```
User Data → Local Processing → ZK Proof → On-chain Verification
           (never leaves device)  (proves property without revealing data)
```

**Build:**
- [ ] ZK circuit for data licensing proofs
- [ ] ZK circuit for behavior pattern proofs
- [ ] Light Protocol integration (Solana ZK)
- [ ] Local secure enclave usage (mobile)

**Effort:** 8-12 weeks (specialized)

---

### 7. ORACLE INFRASTRUCTURE

**Problem:** Many captures happen off-chain, need trusted verification.

**Solution:** Loop Oracle Network

| Capture | Verification Method |
|---------|---------------------|
| Shopping | POS webhook + merchant signature |
| Referral | Affiliate network confirmation |
| Attention | Client-side attestation + spot checks |
| Compute | Result hash verification |
| Energy | Utility API + meter data |

**Build:**
- [ ] Oracle program (on-chain)
- [ ] Oracle node software
- [ ] Staking/slashing for oracle operators
- [ ] Multi-source verification

**Effort:** 6-8 weeks

---

## Build Priority Matrix

### Must Have (MVP)
| Component | Why | Weeks |
|-----------|-----|-------|
| Agent Runtime (mobile) | Users need app to capture | 8-10 |
| Browser Extension | Referral capture | 3-4 |
| loop_referral program | Easiest new revenue | 3-4 |
| loop_attention program | High demand exists | 4-5 |
| Affiliate integrations | Referral needs these | 2-3 |

**Total MVP expansion:** ~20-26 weeks

### Should Have (V1)
| Component | Why | Weeks |
|-----------|-----|-------|
| loop_data program | Big revenue potential | 4-5 |
| loop_compute program | Background passive | 5-6 |
| Data marketplace | Buyers need interface | 4-5 |
| Compute marketplace | Task distribution | 4-5 |
| Privacy (basic ZK) | Data layer needs it | 6-8 |

**Total V1:** ~24-29 weeks

### Nice to Have (V2)
| Component | Why | Weeks |
|-----------|-----|-------|
| loop_liquidity | Requires DeFi expertise | 8-10 |
| loop_energy | Hardware dependencies | 6-8 |
| loop_social | Complex reputation | 5-6 |
| loop_insurance | Actuarial complexity | 8-10 |
| Full ZK stack | Maximum privacy | 8-12 |

---

## Team Requirements

### Core Build Team
| Role | Count | Focus |
|------|-------|-------|
| Solana/Rust dev | 2 | On-chain programs |
| Full-stack (TS/React) | 2 | Agent runtime, dashboard |
| Mobile dev | 1 | iOS/Android app |
| Integrations dev | 1 | External APIs |
| ZK specialist | 1 | Privacy infrastructure |

**Minimum viable team:** 4-5 devs
**Optimal team:** 7-8 devs

### Timeline Estimates

| Milestone | Team of 4 | Team of 8 |
|-----------|-----------|-----------|
| MVP (Shopping + Referral + Attention) | 6 months | 3 months |
| V1 (+ Data + Compute) | 12 months | 6 months |
| V2 (Full 11 layers) | 24 months | 12 months |

---

## Immediate Next Steps

### Week 1-2
1. [ ] Finish devnet deployment (need SOL for shopping program)
2. [ ] Design agent runtime architecture
3. [ ] Spec browser extension for referral capture
4. [ ] Identify affiliate networks to integrate

### Week 3-4
5. [ ] Build browser extension MVP (link rewriting)
6. [ ] Build loop_referral program
7. [ ] Start mobile app shell

### Week 5-8
8. [ ] Integrate 2-3 affiliate networks
9. [ ] Build attention marketplace spec
10. [ ] Build loop_attention program
11. [ ] Beta test with small user group

---

## Cost Estimates

### Development (12 months, team of 5)
| Item | Monthly | Annual |
|------|---------|--------|
| Salaries (5 devs @ $15k avg) | $75,000 | $900,000 |
| Infrastructure | $2,000 | $24,000 |
| Tools/Services | $1,000 | $12,000 |
| **Total** | **$78,000** | **$936,000** |

### Bootstrap Alternative
| Item | Monthly | Annual |
|------|---------|--------|
| 2 devs (you + contractor) | $20,000 | $240,000 |
| Infrastructure | $500 | $6,000 |
| **Total** | **$20,500** | **$246,000** |

Timeline extends to 18-24 months for full build.

---

## Summary

**What exists:** 6 on-chain programs, SDK, shopping capture

**What's missing:**
1. Agent runtime (the app users actually use)
2. 10 more capture programs
3. Marketplace infrastructure
4. External integrations
5. Privacy layer
6. Oracle network

**Fastest path to revenue:**
1. Browser extension for referral capture (4 weeks)
2. Mobile app with shopping + referral (8 weeks)
3. Add attention marketplace (4 weeks)

**That gets you 3 capture layers live in ~16 weeks.**
