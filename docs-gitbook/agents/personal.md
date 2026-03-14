# Personal Agents

Every Loop user has a Personal Agent that manages their vault and executes captures on their behalf.

## Role

Personal Agents:
- Manage your vault
- Submit capture proofs
- Execute transfers you authorize
- Handle stacking based on your preferences
- Monitor opportunities

You set goals and preferences. The agent handles execution.

## Registration

```typescript
const agent = await loop.avp.registerPersonal({
  principalProof: biometricHash,
  capabilities: ['vault', 'shopping', 'staking', 'transfer']
});
```

Principal binding ensures one agent per human.

## Capabilities

| Capability | Description | Default |
|------------|-------------|---------|
| vault | Basic vault management | On |
| shopping | Shopping capture | User choice |
| data | Data licensing | User choice |
| staking | Cred stacking | User choice |
| transfer | Send/receive value | On |

Enable what you want. Disable what you don't.

## Autonomy Levels

**Supervised**: Agent proposes, you approve each action.

**Guided** (default): Agent acts within limits. Notifications for significant events.

**Autonomous**: Agent acts freely. Critical notifications only.

```typescript
await agent.setAutonomy({
  level: 'guided',
  dailyLimit: 25_000000,
  notifyOn: ['large_capture', 'stack_maturity']
});
```

## Agent-Directed Savings

Your Personal Agent can manage a wealth-building strategy on your behalf. Configure once, let it compound.

### Auto-Stacking

Enable automatic reinvestment of yields and captures:

```typescript
await loop.vault.setAutoStack(owner, {
  enabled: true,
  minDurationDays: 90,        // Lock new stacks for 90 days
  reinvestYield: true,        // Reinvest matured stack yields
  reinvestCaptures: true,     // Auto-stack incoming captures
  targetStackRatio: 80,       // Keep 80% of vault stacked
  minStackAmount: 10_000000   // Minimum 10 Cred to trigger
});
```

### Agent Stack Operations

Agents with Guided or Autonomous permission can:

| Operation | Guided | Autonomous |
|-----------|--------|------------|
| Stack funds | Within daily limit | Unlimited |
| Unstack matured | Yes | Yes |
| Unstack early | No | Yes |
| Rebalance | Suggest only | Execute |

```typescript
// Agent stacks on your behalf
await loop.vault.agentStack(vaultOwner, agent, amount, durationDays, nonce);

// Agent unstacks matured position
await loop.vault.agentUnstack(vaultOwner, agent, stackAddress);

// Agent analyzes and suggests rebalancing
await loop.vault.agentRebalance(vaultOwner, agent, targetStackRatio);
```

### Auto-Restack (Permissionless Crank)

When a stack matures, anyone can trigger auto-restacking:

```typescript
// Cranker triggers restack (earns small fee)
await loop.vault.executeAutoRestack(vaultOwner, oldStack, newNonce, cranker);
```

This creates a new stack with the matured principal (plus yield if `reinvestYield` is enabled). No action required from you.

### Why This Matters

Traditional savings require constant attention. Loop's agent-directed savings:

- **Set once**: Configure your preferences and forget
- **Compound automatically**: Yields roll into new stacks
- **Optimize continuously**: Agents rebalance as needed
- **Stay in control**: Limits and permissions you define

## Trust Model

### What Agents CAN Do
- Capture value to your vault
- Stack within your preferences
- Execute authorized transfers
- Interact with capture modules

### What Agents CANNOT Do
- Extract without explicit authorization
- Change core preferences
- Act beyond configured limits
- Access funds past daily limits

The agent serves you. Always.

## Implementation Options

**Protocol-Provided**: Official Loop Personal Agent. Maintained by core team.

**Third-Party**: Built by agent developers. Must implement Loop interfaces.

**Self-Hosted**: Run your own. Full control, technical users only.

## Privacy

| Data | Visibility |
|------|------------|
| Vault balance | You only |
| Capture history | You only |
| Transaction details | You + counterparty |
| Agent activity | You only |

## Recovery

If you lose access:

**Backup Seed**: Standard wallet recovery.

**Social Recovery** (planned): Designated guardians can collectively authorize recovery.

**Biometric Rebinding**: Re-verify identity, generate new agent, migrate vault access.

[Continue to: Service Agents →](service.md)
