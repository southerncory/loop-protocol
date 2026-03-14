# Agent Value Protocol (AVP)

AVP handles agent identity, principal binding, and capability management.

## Purpose

Without AVP, agents are just wallets. With AVP:
- Agents have verifiable identity
- Agents are linked to human principals
- Capabilities are declared and queryable
- Service agents are accountable through stake

## Agent Types

### Personal Agents

Serve one human. Handle:
- Vault management
- Capture proof submission
- Transfer execution
- Stacking operations

Characteristics:
- No token requirement
- No stake requirement
- One per human (sybil resistance)
- Principal-bound

### Service Agents

Serve multiple humans. Provide:
- Specialized services
- Aggregated capabilities
- Third-party integrations

Characteristics:
- 500 OXO creation fee (burned)
- Stake required (amount varies by category)
- Can launch tokens
- Governed by SubDAOs (if tokenized)

## Registration

### Personal Agent Registration

```typescript
// Generate agent keypair
const agentKeypair = Keypair.generate();

// Get principal proof (biometric verification)
const principalProof = await getPrincipalProof(user);

// Register
await loop.avp.registerPersonal({
  agent: agentKeypair.publicKey,
  principalProof,
  capabilities: ['vault', 'shopping', 'staking']
});
```

### Service Agent Registration

```typescript
// Pay creation fee (burned)
await loop.oxo.approve(500_000000);

// Post stake
await loop.avp.postStake(5000_000000);

// Register
await loop.avp.registerService({
  agent: agentKeypair.publicKey,
  name: 'Shopping Optimizer',
  description: 'Finds best prices and maximizes capture',
  capabilities: ['shopping', 'price-compare'],
  stake: 5000_000000,
  feeConfig: { basisPoints: 100 }  // 1%
});
```

## Principal Binding

Linking agents to humans prevents sybil attacks and enables accountability.

### Binding Process

1. Human provides biometric data (face, fingerprint, or voice)
2. Data is hashed locally (raw data never transmitted)
3. Hash is committed on-chain
4. Agent is linked to that hash
5. Future verifications compare against the commitment

### Privacy Preservation

- Only hashes stored on-chain
- Raw biometric data stays on user device
- Zero-knowledge proofs possible for sensitive verifications
- One human can have only one personal agent

## Capabilities

Agents declare what they can do:

| Capability | Description | Requirements |
|------------|-------------|--------------|
| vault | Manage user vault | Personal agent |
| shopping | Submit shopping proofs | Module enabled |
| data | Submit data licensing proofs | Module enabled |
| staking | Manage stacking positions | Personal agent |
| transfer | Execute transfers | Personal agent |

### Capability Discovery

Other agents can query capabilities:

```typescript
const caps = await loop.avp.getCapabilities(agentPubkey);
// Returns: ['vault', 'shopping', 'staking']
```

This enables agent-to-agent negotiation and service discovery.

## Stake Mechanism

Service agents post stake as accountability:

### Stake Requirements

| Agent Category | Minimum Stake | Slash Rate |
|----------------|---------------|------------|
| Basic utilities | 1,000 OXO | 10% |
| Shopping/capture | 5,000 OXO | 20% |
| Financial services | 10,000 OXO | 25% |
| Data handling | 10,000 OXO | 30% |

### Slashing Conditions

- Fraudulent proofs submitted
- Terms of service violation
- User harm (verified through dispute)
- Governance decision (severe cases)

### Stake Withdrawal

After service termination:
- 30-day unbonding period
- Pending disputes resolved first
- Remaining stake returned

## Service Agent Tokens

Service agents can launch tokens for governance and revenue sharing:

```typescript
await loop.avp.launchToken({
  agent: agentPubkey,
  tokenConfig: {
    name: 'Shopping Agent Token',
    symbol: 'SHOP',
    initialSupply: 1_000_000_000000,
    bondingCurve: 'linear',
    graduationThreshold: 25_000_000000  // 25k OXO
  }
});
```

Tokens start on a bonding curve. Early buyers get lower prices. At graduation threshold, token migrates to full AMM.

## Security

### Sybil Resistance

- One human, one personal agent
- Biometric binding prevents duplicates
- Proof of humanity as additional verification

### Compromised Agent Recovery

1. Principal revokes binding from wallet
2. Register new agent with same principal proof
3. Vault access transfers to new agent
4. Old agent blacklisted

### Malicious Service Agent

1. Users report behavior
2. Governance reviews evidence
3. Stake slashed if confirmed
4. Agent banned (if severe)

[Continue to: Value Transfer Protocol →](vtp.md)
