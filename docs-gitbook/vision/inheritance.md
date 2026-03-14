# Self-Custody and Control

Loop Protocol is infrastructure, not a custodian. You control your funds, your data, and your agent's behavior.

## What Self-Custody Means

**Your Keys**: Your vault is a smart contract controlled by your wallet. Loop cannot access it. Only you can authorize transactions.

**Your Rules**: You configure how your agent operates. Spending limits, stacking preferences, autonomy levels. The protocol enforces your preferences, not ours.

**Your Exit**: You can extract all your funds at any time. A 5% fee applies, but there's no lock-in, no approval process, no waiting period beyond transaction confirmation.

## Why Self-Custody Matters

Traditional financial services require trusting institutions with your funds:

| Risk | Traditional Finance | Loop |
|------|---------------------|------|
| Account freeze | Bank/government can freeze | Only you control access |
| Terms changes | Institution can change unilaterally | Code is law, governance for changes |
| Data access | Institution sees everything | Your data stays with you |
| Custody risk | Institution could fail | Self-custodied, no counterparty |

Self-custody eliminates these risks. The tradeoff is responsibility: you manage your own keys.

## Vault Ownership

Your vault is a Solana account derived from your wallet:

```typescript
// Vault PDA derivation
const [vaultPda] = PublicKey.findProgramAddress(
  [Buffer.from('vault'), userWallet.toBuffer()],
  VAULT_PROGRAM_ID
);
```

This means:
- One vault per wallet
- Vault address is deterministic from your wallet
- No one else can create or control your vault
- Vault persists as long as Solana exists

## Agent Authorization

Your agent operates on your behalf but with constrained authority:

**What Agents Can Do**:
- Submit capture proofs
- Execute stacking within your preferences
- Transfer funds you've authorized
- Manage positions according to your rules

**What Agents Cannot Do**:
- Extract funds without explicit authorization
- Change your core preferences
- Access funds beyond configured limits
- Act outside their registered capabilities

You grant authority; you can revoke it.

## Autonomy Levels

Configure how independently your agent operates:

**Supervised Mode**: Agent proposes actions. You approve each one.
```typescript
await agent.setAutonomy({ level: 'supervised' });
```

**Guided Mode** (default): Agent acts within limits. Notifications for significant events.
```typescript
await agent.setAutonomy({
  level: 'guided',
  dailyLimit: 25_000000,  // $25/day
  notifyOn: ['large_capture', 'stack_maturity']
});
```

**Autonomous Mode**: Agent acts freely. Notifications for critical events only.
```typescript
await agent.setAutonomy({ level: 'autonomous' });
```

## Security Model

### Key Security

Your wallet's private key is the ultimate authority. Protect it accordingly:
- Use hardware wallets for significant holdings
- Maintain secure backups
- Never share your seed phrase

### Agent Compromise

If your agent is compromised:
1. Revoke agent authorization from your wallet
2. Register a new agent
3. Continue operating with new agent

Your vault funds remain safe because the agent can't extract without your wallet signature.

### Smart Contract Risk

Loop programs are:
- Open source and auditable
- Reviewed before mainnet launch
- Upgradeable through governance (with timelock)
- Covered by bug bounty program

No smart contract is perfectly safe. Use amounts you can afford to risk.

## Additional Features

### Delegation

Grant limited access to trusted parties:
```typescript
await loop.vault.addDelegate({
  delegate: trustedWallet,
  permissions: ['view', 'capture'],  // but not 'extract'
  expiry: Date.now() + 30 * 24 * 60 * 60 * 1000
});
```

Useful for:
- Trusted family members monitoring your vault
- Service providers managing specific functions
- Time-limited access for specific purposes

### Inheritance Settings

Optionally configure vault transfer on death:
```typescript
await loop.vault.setHeir({
  heir: heirWallet,
  conditions: {
    proofType: 'death_certificate',
    waitingPeriod: 30 * 24 * 60 * 60,  // 30 days
    contestWindow: true
  }
});
```

This is entirely optional. Most users may never configure it. For those who want estate planning capabilities, the option exists.

### Recovery Options

If you lose access to your wallet:

**Backup Seed**: Restore from your seed phrase (standard wallet recovery)

**Social Recovery** (planned): Designate guardians who can collectively authorize recovery

**Time-Locked Recovery** (planned): Pre-authorize a backup wallet that can claim access after extended inactivity

## The Tradeoff

Self-custody means self-responsibility:

| Benefit | Responsibility |
|---------|----------------|
| No one can freeze your funds | You must protect your keys |
| No institutional counterparty risk | You bear smart contract risk |
| Full control over your assets | No customer support to reverse mistakes |
| Privacy from institutions | You manage your own security |

For many people, this tradeoff is worthwhile. For others, traditional custodied services may be more appropriate. Loop is built for those who value sovereignty over convenience.

[Continue to: Protocol Architecture →](../architecture/principles.md)
