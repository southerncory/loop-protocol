# Protocol Stack

Loop Protocol consists of four layers, each building on the one below.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│               Capture Modules                        │
│       Shopping · Data · Attention · Presence         │
├─────────────────────────────────────────────────────┤
│            Value Transfer Protocol (VTP)             │
│     Transfer · Escrow · Stream · Dispute             │
├─────────────────────────────────────────────────────┤
│            Agent Value Protocol (AVP)                │
│     Identity · Binding · Capabilities · Stake        │
├─────────────────────────────────────────────────────┤
│               Solana Blockchain                      │
│         Programs · Accounts · Transactions           │
└─────────────────────────────────────────────────────┘
```

## Layer 1: Solana Blockchain

The foundation layer. Solana was chosen for:

| Feature | Benefit |
|---------|---------|
| 400ms finality | Real-time agent interactions |
| $0.00025 per transaction | Micro-captures are economically viable |
| Parallel execution | Scales with agent activity |
| Program composability | Modules can interact |
| Battle-tested security | Billions in value secured |

Loop is Solana-native. Future bridges to other chains are possible but not the current focus.

### Core Programs

| Program | Purpose |
|---------|---------|
| loop_vault | User vaults, stacking, custody |
| loop_cred | Stable token operations |
| loop_oxo | Governance token, veOXO staking |
| loop_vtp | Value transfers, escrow, streams |
| loop_avp | Agent identity, registration |
| loop_shopping | Shopping capture module |

## Layer 2: Agent Value Protocol (AVP)

Handles agent identity and authorization.

### Functions

**Agent Registration**: Agents declare themselves to the protocol with capabilities and metadata.

**Principal Binding**: Cryptographic proof that an agent represents a specific human. Uses biometric hashes (no raw data stored).

**Capability Management**: Agents declare what they can do. Other parties query capabilities before interacting.

**Stake Requirements**: Service agents post collateral as accountability. Stake can be slashed for misbehavior.

### Key Concepts

```typescript
interface AgentIdentity {
  publicKey: PublicKey;        // Agent's wallet
  principalHash: Hash;         // Human they represent
  capabilities: Capability[];  // What they can do
  registeredAt: Timestamp;
  stake: number;               // Service agents only
}
```

## Layer 3: Value Transfer Protocol (VTP)

Handles how value moves between parties.

### Transfer Types

**Direct**: Immediate, unconditional transfer.

**Escrow**: Value held until conditions are met. Used for purchases, contracts, conditional agreements.

**Stream**: Continuous value flow over time. Used for subscriptions, salaries, ongoing services.

**Conditional**: Released based on external triggers (oracle data, proofs, signatures).

### Transfer Flow

```
Request → Negotiate → Agree → Transact → Verify
                         │
                         ↓ (if conditional)
                      Escrow
                         │
            ┌────────────┼────────────┐
            ↓            ↓            ↓
         Release      Dispute      Timeout
```

## Layer 4: Capture Modules

Independent programs that capture value from specific activities.

### Module Interface

Every capture module implements:

```typescript
interface CaptureModule {
  // Verify proof of activity
  verifyProof(proof: Proof): boolean;
  
  // Calculate value to capture
  calculateCapture(proof: Proof): CaptureAmount;
  
  // Execute capture to vault
  capture(vault: PublicKey, proof: Proof): Transaction;
}

interface CaptureAmount {
  userAmount: number;      // To user vault (85%)
  protocolAmount: number;  // To treasury (10%)
  stakerAmount: number;    // To veOXO stakers (5%)
}
```

### Initial Modules

| Module | Status | Description |
|--------|--------|-------------|
| Shopping | Active development | Purchase verification |
| Data | Planned | Data licensing |
| Attention | Planned | Ad viewing |
| Presence | Planned | Location proofs |

### Extensibility

Third parties can build new modules:
1. Define proof format
2. Implement verification
3. Deploy program
4. Get governance approval
5. Users can enable

## Inter-Layer Communication

Layers communicate through defined interfaces:

```
User Activity
    ↓
Agent (AVP) validates and submits
    ↓
Capture Module verifies proof
    ↓
VTP transfers value
    ↓
Vault receives Cred
```

Each layer only knows about adjacent layers. This enables independent upgrades and testing.

## Program Upgrades

Programs are upgradeable through governance:

1. Proposal with new program binary
2. veOXO holders vote
3. 48-hour timelock if passed
4. Upgrade authority executes

Emergency upgrades (security issues) have shortened timelines but require supermajority.

[Continue to: Agent Value Protocol →](avp.md)
