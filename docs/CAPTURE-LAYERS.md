# Loop Protocol — Capture Layers v2

## Vision

Every dimension of human existence generates value. Currently, that value is extracted by intermediaries. Loop Protocol captures it for the individual instead.

**Goal:** $200-500/month passive income for average user, compounding over lifetime, inheritable.

---

## Capture Layer Roadmap

### Phase 1: Foundation (Q2 2026)
| Layer | Status | Description |
|-------|--------|-------------|
| Shopping | ✅ Built | Purchase rewards via POS integration |

### Phase 2: Low Friction (Q3 2026)
| Layer | Status | Description |
|-------|--------|-------------|
| Referral | 📋 Spec | Affiliate capture on shared links |
| Attention | 📋 Spec | Opt-in ad viewing rewards |
| Data | 📋 Spec | License personal data with consent |

### Phase 3: Background Passive (Q4 2026)
| Layer | Status | Description |
|-------|--------|-------------|
| Compute | 📋 Spec | Rent idle device resources |
| Network | 📋 Spec | Protocol participation tasks |
| Skill | 📋 Spec | License anonymized behavior patterns |

### Phase 4: Advanced (2027)
| Layer | Status | Description |
|-------|--------|-------------|
| Liquidity | 📋 Spec | Automated DeFi yield strategies |
| Energy | 📋 Spec | Smart grid participation |
| Social | 📋 Spec | Network/reputation monetization |
| Insurance | 📋 Spec | Risk pooling and hedging |

---

## Layer Specifications

### 1. SHOPPING CAPTURE (Built)

**How it works:**
```
User shops at Loop merchant
    → POS sends purchase proof
    → Agent verifies and claims
    → Cred minted to vault (80% of merchant reward)
```

**Revenue:** $50-200/month depending on spending

**Technical:** OAuth with Square/Stripe/Clover, webhook verification

---

### 2. REFERRAL CAPTURE

**How it works:**
```
User shares any product link
    → Agent auto-appends affiliate tag (or creates one)
    → Tracks clicks and conversions
    → Revenue captured when purchase occurs
```

**Revenue:** $20-100/month for active sharers

**Technical requirements:**
- Browser extension or OS-level link interception
- Affiliate network integrations (Amazon Associates, ShareASale, Impact, etc.)
- Link shortener with tracking
- Conversion attribution

**Agent behavior:**
- Detects product URLs in clipboard/share actions
- Looks up best affiliate program for that merchant
- Rewrites link transparently
- Tracks and claims commissions

**Privacy:** User controls which links are monetized

---

### 3. ATTENTION CAPTURE

**How it works:**
```
User opts into attention marketplace
    → Agent receives ad requests with bid prices
    → Shows ads user might actually want (or rejects)
    → User views → payment captured
```

**Revenue:** $10-40/month (replaces ~$200/year platforms currently extract)

**Technical requirements:**
- Attention marketplace (advertisers bid for user attention)
- Preference matching (don't show irrelevant ads)
- View verification (proof of attention)
- Frequency capping (respect user experience)

**Agent behavior:**
- Maintains user interest profile (local, private)
- Filters incoming ad requests
- Negotiates rates based on user value
- Presents ads at non-intrusive moments

**Key insight:** Users currently see ads and get $0. Same ads, but user gets paid.

---

### 4. DATA LICENSING

**How it works:**
```
Data buyer requests specific data type
    → Agent checks user consent settings
    → Packages and encrypts relevant data
    → Delivers via secure channel
    → Payment captured
```

**Revenue:** $20-50/month for full participation

**Data types:**
| Type | Example Buyers | Est. Value |
|------|----------------|------------|
| Purchase history | Market researchers | $5/month |
| Location patterns | Urban planners, retail | $10/month |
| Health metrics | Pharma, insurers | $15/month |
| Browsing behavior | Ad networks | $10/month |
| Social graph | Recruiters, marketers | $5/month |

**Technical requirements:**
- Granular consent management
- Data packaging and anonymization
- Secure delivery (ZK proofs where possible)
- Audit trail

**Privacy controls:**
- Per-category opt-in/out
- Buyer whitelist/blacklist
- Anonymization levels (full, partial, aggregated)
- Right to revoke

---

### 5. COMPUTE CAPTURE

**How it works:**
```
User device is idle
    → Agent accepts compute tasks from marketplace
    → Runs tasks in sandboxed environment
    → Returns results
    → Payment captured
```

**Revenue:** $15-60/month depending on hardware

**Task types:**
| Task | Hardware | Est. $/month |
|------|----------|--------------|
| AI inference | GPU | $30-60 |
| Rendering | GPU | $20-40 |
| Storage | Disk | $5-15 |
| Bandwidth | Network | $5-20 |
| Light validation | CPU | $5-10 |

**Technical requirements:**
- Sandboxed execution environment (WASM, containers)
- Resource metering
- Task marketplace integration (Render Network, Akash, Golem, etc.)
- Battery/thermal management (don't cook the phone)

**Agent behavior:**
- Only accepts tasks when truly idle
- Respects battery thresholds
- Thermal throttling
- Bandwidth caps on metered connections

---

### 6. NETWORK PARTICIPATION

**How it works:**
```
Protocols need human participants for various tasks
    → Agent monitors task boards
    → Completes eligible tasks
    → Submits proofs
    → Payment captured
```

**Revenue:** $10-30/month

**Task types:**
| Task | Protocol Examples | Est. $/month |
|------|-------------------|--------------|
| Governance voting | DAOs, L2s | $5-10 |
| Data attestation | Oracles | $5-15 |
| Proof of humanity | Worldcoin, etc. | $5-10 |
| Content moderation | Decentralized social | $5-10 |
| Testing/QA | Testnets | $5-20 |

**Technical requirements:**
- Multi-protocol integration
- Task discovery and matching
- Proof generation
- Reputation tracking

---

### 7. SKILL/EXPERTISE LICENSING

**How it works:**
```
Agent observes user behavior over time
    → Learns decision patterns and preferences
    → Anonymizes into transferable models
    → Licenses to AI trainers, recommender systems
    → Payment captured
```

**Revenue:** $10-50/month depending on expertise uniqueness

**Example skills:**
| Skill Domain | Buyers | Value |
|--------------|--------|-------|
| Shopping taste | Recommender engines | Medium |
| Professional expertise | AI trainers | High |
| Creative judgment | Content platforms | Medium |
| Navigation patterns | Mapping services | Low |
| Communication style | Chatbot trainers | Medium |

**Technical requirements:**
- Local behavior modeling
- Differential privacy for anonymization
- Model export formats
- Licensing marketplace

**Privacy:** Only patterns exported, never raw data. User approves each license.

---

### 8. LIQUIDITY PROVISION

**How it works:**
```
User has idle capital (Cred, stablecoins, etc.)
    → Agent analyzes yield opportunities
    → Deploys capital to optimal strategies
    → Manages risk and rebalances
    → Yield captured to vault
```

**Revenue:** 8-20% APY on deployed capital

**Strategies:**
| Strategy | Risk | Est. APY |
|----------|------|----------|
| Lending pools | Low | 5-10% |
| Stable LPs | Low-Med | 8-15% |
| Yield aggregators | Medium | 10-20% |
| MEV capture | Medium | Variable |
| Basis trades | Low | 5-15% |

**Technical requirements:**
- DeFi protocol integrations
- Risk assessment engine
- Auto-rebalancing
- Slippage protection
- MEV protection (or capture)

**Agent behavior:**
- User sets risk tolerance
- Agent optimizes within bounds
- Auto-exits on risk threshold breach
- Reports performance transparently

---

### 9. ENERGY ARBITRAGE

**How it works:**
```
User has smart devices (EV, battery, smart thermostat)
    → Agent monitors energy prices in real-time
    → Shifts consumption to low-price periods
    → Sells back during high-price periods
    → Savings/revenue captured
```

**Revenue:** $30-150/month for EV owners, $10-30 for smart home

**Opportunities:**
| Device | Action | Est. $/month |
|--------|--------|--------------|
| EV battery | Charge low, sell high (V2G) | $50-100 |
| Home battery | Peak shaving | $30-60 |
| Smart thermostat | Demand response | $10-20 |
| Water heater | Load shifting | $5-15 |
| Pool pump | Off-peak operation | $5-10 |

**Technical requirements:**
- Smart device integrations (Tesla, Nest, etc.)
- Real-time energy pricing feeds
- Grid interconnection (for V2G)
- Utility program enrollment

**Regulatory:** Varies by region, V2G not available everywhere yet

---

### 10. SOCIAL GRAPH MONETIZATION

**How it works:**
```
User's network has value (connections, reputation, reach)
    → Agent facilitates paid introductions
    → Provides reputation attestations
    → Gates access to user's community
    → Revenue captured
```

**Revenue:** Highly variable, $0-500/month depending on network

**Mechanisms:**
| Mechanism | Description | Revenue Model |
|-----------|-------------|---------------|
| Warm intros | Facilitate introductions for a fee | $5-50 per intro |
| Reputation staking | Vouch for others, earn if they perform | Staking returns |
| Access gating | Charge for community/group access | Subscription |
| Signal boost | Amplify others' content for pay | Per-post fee |

**Technical requirements:**
- Social graph analysis
- Reputation scoring
- Intro request marketplace
- Privacy-preserving matching

**Sensitivity:** Must be opt-in, respect relationships

---

### 11. INSURANCE/RISK POOLING

**How it works:**
```
Agent joins user to risk pools
    → Contributes to collective coverage
    → Claims processed automatically
    → Unused premiums returned/earn yield
```

**Revenue/Savings:** $20-100/month in premium savings + returns

**Pool types:**
| Type | Traditional Cost | Loop Cost | Savings |
|------|------------------|-----------|---------|
| Phone insurance | $15/month | $5/month | $10 |
| Travel insurance | $50/trip | $20/trip | $30 |
| Warranty pools | $10/month | $3/month | $7 |
| Health gap coverage | Varies | Lower | Varies |

**Technical requirements:**
- Actuarial modeling
- Claims verification
- Pool management
- Reinsurance integration

**Agent behavior:**
- Assesses user's risk profile
- Joins optimal pools
- Files claims automatically
- Exits underperforming pools

---

## Revenue Stacking Model

### Average User Profile

```
Monthly Passive Income Breakdown:

Shopping capture      $75   (normal spending patterns)
Referral capture      $25   (occasional sharing)
Attention capture     $20   (opt-in ads)
Data licensing        $30   (full participation)
Compute capture       $20   (phone + laptop idle)
Network participation $15   (background tasks)
Skill licensing       $15   (behavior patterns)
                    ─────
Subtotal:           $200/month

+ Cred stacking yield (12% APY on accumulated Cred)
+ Insurance savings ($30/month)
+ Energy arbitrage ($0 if no EV, $80 if EV)

Total: $200-310/month passive
       $2,400-3,720/year
       
Compounded @ 12% over 40 years = $1.9M - $2.9M
(Inheritable to next generation)
```

### Power User Profile

```
High-value professional with:
- Above-average spending
- Large social network  
- Valuable expertise
- EV + smart home
- Capital to deploy

Shopping:            $150
Referral:            $100
Attention:            $30
Data:                 $50
Compute:              $40
Network:              $25
Skill licensing:      $75
Liquidity (on $50k):  $500
Energy:              $100
Social graph:        $100
Insurance savings:    $50
                    ─────
Total:            $1,220/month
                  $14,640/year

Compounded @ 12% over 40 years = $11.4M
```

---

## Implementation Priority

### Tier 1: Ship Now (Q2-Q3 2026)
1. **Shopping** ✅ (done)
2. **Referral** — Browser extension + link rewriting
3. **Attention** — Ad marketplace integration

### Tier 2: Background Passive (Q4 2026)
4. **Data licensing** — Consent management + marketplace
5. **Compute** — Idle resource monetization
6. **Network participation** — Multi-protocol tasks

### Tier 3: Advanced (2027)
7. **Skill licensing** — Behavior model export
8. **Liquidity** — DeFi automation
9. **Energy** — Smart device integration
10. **Social** — Graph monetization
11. **Insurance** — Risk pooling

---

## Technical Architecture

Each capture layer is a module that:
1. Integrates with external value sources
2. Verifies capture proofs
3. Calculates user share
4. Mints Cred to vault

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPTURE ORCHESTRATOR                     │
│  (Agent runtime that coordinates all capture layers)        │
└─────────────────────────────────────────────────────────────┘
        │         │         │         │         │
        ▼         ▼         ▼         ▼         ▼
   ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
   │Shopping││Referral││Attention││  Data  ││Compute │ ...
   │ Module ││ Module ││ Module  ││ Module ││ Module │
   └────────┘└────────┘└────────┘└────────┘└────────┘
        │         │         │         │         │
        └─────────┴─────────┴─────────┴─────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │   User Vault    │
                  │  (Cred + OXO)   │
                  └─────────────────┘
```

---

## The Vision

**Today:** You generate value. Corporations capture it.

**Tomorrow:** You generate value. Your agent captures it. It compounds. Your kids inherit it.

This is the inversion of the extraction economy.

---

*Draft v2 — March 2026*
