# Why Agents Need Economic Infrastructure

For AI agents to manage economic activity on behalf of humans, they require infrastructure that doesn't currently exist in coherent form.

## Infrastructure Requirements

### 1. Agent Identity

Agents must prove who they represent:
- "This agent acts on behalf of Alice"
- "Alice has authorized these specific actions"
- "Alice is a real human, not a bot network"

Without verifiable identity, counterparties can't trust agent transactions. Anyone could claim their agent represents anyone else.

Current state: No standard exists for agent identity or principal binding.

### 2. Value Storage

Agents need secure storage for user funds:
- Receive payments and capture rewards
- Hold balances for future transactions
- Track history and positions
- Support user-defined access controls

A basic wallet isn't sufficient. Agents need programmable vaults with policies, access controls, and automation capabilities.

Current state: Wallets exist, but agent-oriented vault infrastructure doesn't.

### 3. Transfer Mechanisms

Agents need to move value:
- Pay for services
- Receive earnings
- Escrow for conditional transactions
- Stream payments over time
- Handle disputes

These transfers must be verifiable, reversible when appropriate, and cheap enough for micro-transactions.

Current state: Traditional payment rails are slow and expensive. Crypto rails exist but lack agent-specific features.

### 4. Capture Hooks

Agents need ways to intercept value from activities:
- Verify that a purchase occurred
- Prove that attention was given
- Document that data was licensed
- Confirm any value-generating activity

Each activity type requires specific proof formats and verification logic.

Current state: No infrastructure exists for activity-based value capture.

## Why Existing Infrastructure Fails

### Traditional Banking

- **Not programmable**: Can't build automated agent strategies on bank APIs
- **Slow settlement**: Days for transfers, not seconds
- **High fees**: Micro-transactions are economically unviable
- **Access restrictions**: Not designed for software agent access
- **No capture mechanisms**: Banks extract value, they don't help you capture it

### Existing Crypto

- **Complex key management**: Agents managing private keys creates security challenges
- **Volatile assets**: Can't build stable wealth on tokens that swing 20% daily
- **Poor UX**: Most users can't interact with crypto directly, let alone configure agents
- **No identity standards**: Wallets aren't linked to verified humans
- **No capture infrastructure**: Value transfer exists, but not value capture

### Platform APIs

- **Siloed**: Each platform has its own API with no interoperability
- **Platform-controlled**: Access can be revoked, terms can change
- **Extraction-oriented**: APIs help platforms extract value, not users capture it
- **No portability**: Your data and relationships don't move between platforms

## The Gap

| Requirement | Traditional | Crypto | Loop |
|-------------|-------------|--------|------|
| Agent identity | Limited (KYC) | None | AVP |
| Principal binding | Legal only | None | Biometric proof |
| Programmable vaults | No | Limited | Yes |
| Stable value | Yes | No | Cred |
| Cheap transfers | No | Yes | Yes |
| Capture modules | No | No | Yes |
| Self-custody | No | Yes | Yes |

Loop fills the specific gap that agent economic activity requires.

## Technical Approach

Loop provides:

**Agent Value Protocol (AVP)**
- Agent registration and discovery
- Principal binding via biometric proofs
- Capability declaration
- Stake requirements for service agents

**Value Transfer Protocol (VTP)**
- Request/negotiate/transact flow
- Escrow for conditional transfers
- Streaming for subscriptions
- Dispute resolution

**Capture Modules**
- Shopping: purchase verification and rewards
- Data: licensing marketplace (planned)
- Attention: opt-in monetization (planned)
- Extensible for new activity types

**Vault Program**
- Self-custodied value storage
- Stacking for yield
- Agent-managed strategies
- Optional inheritance settings

Any agent implementing these interfaces is Loop-compatible. The protocol doesn't care which AI model powers the agent.

[Continue to: Realigning Incentives →](realignment.md)
