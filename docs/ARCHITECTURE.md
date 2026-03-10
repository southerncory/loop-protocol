# Architecture

## Overview

Loop Protocol is the economic layer for the agentic era — infrastructure that enables AI agents to capture, transfer, compound, and inherit value on behalf of human principals.

The protocol is designed around these principles:

1. **User-centric** — Value flows to humans, not intermediaries
2. **Agent-agnostic** — Any agent can implement the protocol
3. **Modular** — Capture layers are independent and pluggable
4. **Trustless** — Verification is cryptographic, not institutional
5. **Inheritable** — Wealth persists across generations

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REAL WORLD                                     │
│     (Shopping, Data, Presence, Attention, Work, Content)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Economic activities
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CAPTURE MODULES                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Shopping │ │   Data   │ │ Presence │ │Attention │ │   Work   │         │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘         │
│       │            │            │            │            │                 │
│       └────────────┴────────────┴────────────┴────────────┘                 │
│                                 │                                           │
│                                 │ Cryptographic proofs                      │
│                                 ▼                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                     VALUE TRANSFER PROTOCOL (VTP)                           │
│                                                                             │
│  • Request → Negotiate → Transact → Verify (state machine)                 │
│  • Escrow and conditional transfers                                        │
│  • Settlement finality                                                     │
│  • Dispute resolution                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                     AGENT VALUE PROTOCOL (AVP)                              │
│                                                                             │
│  • Agent identity (wallet-based)                                           │
│  • Principal binding (biometric proof)                                     │
│  • Capability declarations                                                 │
│  • Stake requirements                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                            VAULT LAYER                                      │
│                                                                             │
│  • Cred storage (stable value)                                             │
│  • OXO storage (protocol equity)                                           │
│  • Staking positions (Cred stacking, veOXO)                                │
│  • Inheritance configuration                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                         SOLANA BLOCKCHAIN                                   │
│                                                                             │
│  • Program execution                                                       │
│  • State storage                                                           │
│  • Transaction settlement                                                  │
│  • ZK verification                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Agent Value Protocol (AVP)

The identity layer. Defines how agents exist and prove who they are.

**Functions:**
- `register_personal_agent(principal_proof)` → Creates agent identity + vault
- `register_service_agent(creator_proof, capabilities, stake)` → Creates service agent
- `bind_agent(biometric_proof, agent_pubkey)` → Binds agent to principal
- `revoke_agent(principal_auth, agent_pubkey)` → Revokes agent authority
- `declare_capabilities(agent_pubkey, capabilities[])` → Declares what agent can do

**Agent Identity:**
- Each agent is a Solana wallet (keypair)
- Agent identity is a PDA (Program Derived Address) linked to that wallet
- Identity stores: principal binding, capabilities, stake, reputation

**Two Agent Types:**

| Type | Purpose | Has Token | Vault |
|------|---------|-----------|-------|
| Personal Agent | Serves one human | No | User's vault |
| Service Agent | Serves many | Optional | Creator's vault |

See: [specs/avp.md](../specs/avp.md)

---

### 2. Vault

The value storage layer. Every personal agent has exactly one vault.

**Functions:**
- `create_vault(agent_pubkey)` → Creates vault for agent
- `deposit(vault, token, amount)` → Deposits tokens
- `withdraw(vault, token, amount, auth)` → Withdraws (with extraction penalty for Cred)
- `stack_cred(vault, amount, duration)` → Locks Cred for yield
- `unstack_cred(vault, position_id)` → Unlocks staked Cred
- `set_heir(vault, heir_agent_pubkey)` → Designates inheritance recipient
- `execute_inheritance(vault, death_proof)` → Transfers vault to heir

**Vault Contents:**
- Cred balance (liquid)
- Cred staking positions (locked, earning yield)
- OXO balance
- veOXO positions (locked for governance)
- Inheritance configuration

**Extraction Rules:**
- Cred can be extracted (converted to fiat off-ramp)
- Extraction incurs 5% fee
- Extraction resets liquid Cred to zero
- Staking positions are liquidated
- OXO is unaffected (separate)

See: [specs/vault.md](../specs/vault.md)

---

### 3. Value Transfer Protocol (VTP)

The transfer and settlement layer. How value moves between agents.

**State Machine:**
```
Request → Negotiate → Transact → Verify
    │         │           │         │
    │         │           │         └── Evaluator checks, releases payment
    │         │           └── Escrow created, work begins
    │         └── Terms agreed
    └── Agent requests service/transfer
```

**Functions:**
- `simple_transfer(from_vault, to_vault, token, amount)` → Direct transfer
- `create_escrow(from_vault, amount, conditions, timeout)` → Conditional transfer
- `release_escrow(escrow_id, verification_proof)` → Release on verification
- `refund_escrow(escrow_id)` → Refund on timeout/failure
- `dispute(transfer_id, evidence)` → Initiate dispute

**Transfer Types:**

| Type | Use Case | Fee |
|------|----------|-----|
| Simple transfer | Agent-to-agent payment | 0.1% |
| Escrow transfer | Service payment (held until verified) | 0.1% |
| Inheritance transfer | Death-triggered vault transfer | 0% |
| Extraction | Cred → fiat off-ramp | 5% + reset |

See: [specs/vtp.md](../specs/vtp.md)

---

### 4. Capture Modules

Independent modules that capture value from real-world activities.

**Module Interface:**
```rust
trait CaptureModule {
    fn submit_proof(agent: Pubkey, proof: Proof) -> Result<CaptureResult>;
    fn verify_proof(proof: Proof) -> bool;
    fn calculate_reward(proof: Proof) -> u64;
    fn get_fee_distribution() -> FeeDistribution;
}
```

**Available Modules:**

| Module | Captures Value From | Status |
|--------|---------------------|--------|
| Shopping | Purchase transactions | Spec complete |
| Data | Data licensing | Spec complete |
| Presence | Location/foot traffic | Spec complete |
| Attention | Ad viewing | Spec complete |
| Work | Productivity | Future |
| Content | Creative output | Future |

**Value Flow (Shopping Example):**
```
1. User makes purchase at merchant
2. Merchant POS signs receipt
3. User's agent receives receipt
4. Agent submits proof to Shopping module
5. Module verifies signature + receipt validity
6. Module calculates reward (e.g., $2.50 rewards budget)
7. Distribution:
   - 80% ($2.00) → User's vault as Cred
   - 14% ($0.35) → Protocol treasury
   - 6% ($0.15) → veOXO stakers
8. User's vault balance increases
```

See: [specs/modules/](../specs/modules/)

---

### 5. Token Layer

Two tokens with distinct purposes.

**Cred (Stable Value)**
- Pegged: 1 Cred = $1
- Elastic supply: minted on capture, burned on extraction
- Earned from capture activities
- Stackable for yield (3-15% APY)
- The wealth accumulation layer

**OXO (Protocol Equity)**
- Fixed supply: 1,000,000,000 (1B)
- Non-inflationary
- Governance rights (via veOXO)
- Required for Service Agent creation
- The ownership layer

**veOXO (Vote-Escrowed OXO)**
- Lock OXO for 6mo-4yr → receive veOXO
- Governance voting power
- Share of protocol fees
- Boosted capture rates
- Service Agent launch access

See: [specs/cred.md](../specs/cred.md), [specs/oxo.md](../specs/oxo.md), [specs/ve-oxo.md](../specs/ve-oxo.md)

---

### 6. Service Agent Framework

For developers who want to build agents that serve the ecosystem.

**Lifecycle:**
```
1. Creator pays 500 OXO fee
2. Registers Service Agent (capabilities, fee structure)
3. Optionally launches agent token on bonding curve
4. Agent provides services, earns fees
5. Creator receives 90% of fees
6. Can use revenue for buyback-burn of agent token
```

**Bonding Curve:**
- Agent token paired against OXO
- Graduate at 25,000 OXO collected
- Post-graduation: Raydium LP, locked 10 years

**SubDAO Governance:**
- Each Service Agent can have its own SubDAO
- Agent token holders vote on agent behavior
- Delegated Proof of Stake for validators

---

## Data Flow Diagrams

### Personal Agent Value Capture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Human     │     │   Personal   │     │    Vault     │
│  (Principal) │────▶│    Agent     │────▶│   (Cred)     │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │ Lives life         │ Detects capture    │ Compounds
       │                    │ opportunities      │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Shopping   │     │   Capture    │     │   Staking    │
│   Presence   │────▶│   Modules    │────▶│   Yield      │
│   Data, etc. │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Service Agent Interaction

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Personal   │     │   Service    │     │   Creator    │
│    Agent     │────▶│    Agent     │────▶│   Wallet     │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │ Requests service   │ Performs work      │ Receives 90%
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    VTP       │     │   Escrow     │     │   Agent      │
│   Request    │────▶│   Created    │────▶│   Token      │
│              │     │              │     │  (optional)  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    ▼                    ▼
       │             ┌──────────────┐     ┌──────────────┐
       │             │  Evaluator   │     │  Buyback &   │
       └────────────▶│   Verifies   │────▶│    Burn      │
                     └──────────────┘     └──────────────┘
```

### Inheritance Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Principal  │     │    Death     │     │    Heir's    │
│    Dies      │────▶│   Verified   │────▶│    Agent     │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                    │
                            ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐
                     │   Original   │────▶│    Heir's    │
                     │    Vault     │     │    Vault     │
                     └──────────────┘     └──────────────┘
                            │                    │
                            │ Transfers:         │
                            │ • Cred balance     │
                            │ • Staking positions│
                            │ • OXO holdings     │
                            │ • veOXO positions  │
                            │ • Capture history  │
                            └────────────────────┘
```

---

## Security Model

### Trust Assumptions

| Component | Trust Model |
|-----------|-------------|
| Agent identity | Cryptographic (wallet signatures) |
| Principal binding | Biometric verification |
| Capture proofs | Cryptographic (signed attestations, ZK proofs) |
| Transfers | On-chain settlement (Solana consensus) |
| Staking | Smart contract enforcement |

### Threat Mitigation

| Threat | Mitigation |
|--------|------------|
| Fake capture proofs | Cryptographic signatures from value sources (merchants, etc.) |
| Agent impersonation | Principal biometric binding |
| Extraction gaming | Reset-to-zero penalty makes gaming irrational |
| Collusion | Stake slashing, pattern detection |
| Service Agent fraud | Escrow + evaluator pattern |

### Stake Requirements

| Action | Stake Required |
|--------|----------------|
| Personal Agent registration | None (low risk) |
| Service Agent registration | 500 OXO |
| High-value capture | Variable (based on risk tier) |
| Service provision | Set by protocol based on service type |

---

## Scalability

### Solana Advantages

- ~400ms block time
- ~$0.00025 per transaction
- High throughput (theoretically 65k TPS)
- ZK verification support (Light Protocol)

### Design Choices for Scale

- Capture proofs are batched where possible
- ZK proofs for privacy-heavy modules (presence, attention)
- Minimal on-chain state (balances, not full history)
- Off-chain activity detection, on-chain settlement

---

## Integration Points

### For Agent Developers

Universal interface any agent can implement:

```typescript
interface LoopProtocol {
  register(principalProof: PrincipalProof): Promise<AgentIdentity>;
  discoverCapabilities(): Promise<Capability[]>;
  enableCapability(capabilityId: string): Promise<void>;
  submitProof(capabilityId: string, proof: Proof): Promise<CaptureResult>;
  getBalance(vaultAddress: string): Promise<Balance>;
  transfer(to: string, amount: number): Promise<TransferResult>;
}
```

### For Value Sources (Merchants, etc.)

```typescript
interface LoopValueSource {
  signReceipt(receipt: Receipt): Promise<SignedReceipt>;
  registerWebhook(endpoint: string): Promise<void>;
  getPublicKey(): Promise<PublicKey>;
}
```

---

## Future Considerations

### ZK Expansion
- ZK proofs for all capture modules (full privacy)
- ZK identity (prove you're a valid principal without revealing identity)

### Cross-Chain
- Bridge to other chains if needed
- But Solana-native first

### Agent AI Evolution
- As agents become more capable, protocol adapts
- Governance can update parameters
- Module interface is extensible

---

*This architecture document will evolve as the protocol develops.*
