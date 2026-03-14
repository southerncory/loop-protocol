# @loop-protocol/sdk

The official TypeScript SDK for Loop Protocol — value capture infrastructure for AI agents on Solana.

[![npm version](https://img.shields.io/npm/v/@loop-protocol/sdk)](https://www.npmjs.com/package/@loop-protocol/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @loop-protocol/sdk
# or
yarn add @loop-protocol/sdk
# or
pnpm add @loop-protocol/sdk
```

## Quick Start

```typescript
import { Loop, CaptureType, PermissionLevel } from '@loop-protocol/sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Initialize the SDK
const connection = new Connection('https://api.mainnet-beta.solana.com');
const loop = new Loop({ connection });

// Create a vault for value storage
const initVaultIx = await loop.vault.initializeVault(userWallet.publicKey);

// Capture value from a purchase (3% cashback)
const captureIx = await loop.vault.capture(
  vaultPda,
  new BN(3_000_000), // 3 Cred
  CaptureType.Shopping,
  'Amazon purchase',
  captureModulePubkey,
  credMint,
  vaultCredAccount
);

// Stack Cred for yield (15% APY for 90 days)
const stackIx = await loop.vault.stack(
  userWallet.publicKey,
  new BN(100_000_000), // 100 Cred
  90 // days
);
```

## Features

- 🏦 **Vault Management** - Create, deposit, withdraw, stack for yield
- 💰 **Cred Operations** - Wrap/unwrap USDC, 1:1 backed stable value
- 🎫 **OXO Staking** - Lock OXO for veOXO, earn fee share, governance
- 🛒 **11 Capture Modules** - Shopping, Referral, Attention, Data, Compute, Network, Skill, Liquidity, Energy, Social, Insurance
- 🔐 **Security Integrations** - Para (passkeys), Squads (policies), Reclaim (ZK proofs), TEE

## API Reference

### Initialization

```typescript
import { Loop, LoopConfig } from '@loop-protocol/sdk';

const config: LoopConfig = {
  connection: new Connection(clusterApiUrl('mainnet-beta')),
  wallet: anchorWallet // optional, for signing
};

const loop = new Loop(config);

// Access program IDs
console.log(loop.programIds.VAULT);  // 76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7
console.log(loop.programIds.CRED);   // FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA
console.log(loop.programIds.OXO);    // 3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z

// Access constants
console.log(loop.constants.EXTRACTION_FEE_BPS); // 500 (5%)
```

### Vault Module

```typescript
// Check if vault exists
const exists = await loop.vault.exists(userPubkey);

// Get vault data
const vault = await loop.vault.getVault(userPubkey);
console.log(vault.credBalance.toString());
console.log(vault.stackedBalance.toString());

// Initialize vault
const initIx = await loop.vault.initializeVault(owner);

// Deposit Cred
const depositIx = await loop.vault.deposit(
  owner,
  new BN(100_000_000), // 100 Cred
  userCredAccount,
  vaultCredAccount
);

// Stack for yield (5-20% APY based on duration)
const stackIx = await loop.vault.stack(
  owner,
  new BN(50_000_000), // 50 Cred
  180 // 180 days = 18% APY
);

// Calculate APY for duration
const apy = loop.vault.calculateApy(365); // 2000 = 20%

// Claim yield from stack
const claimIx = await loop.vault.claimYield(owner, stackAddress);

// Unstack (after lock period)
const unstackIx = await loop.vault.unstack(owner, stackAddress);

// Withdraw Cred
const withdrawIx = await loop.vault.withdraw(
  owner,
  new BN(25_000_000),
  userCredAccount,
  vaultCredAccount
);

// Set agent permissions
const permIx = await loop.vault.setAgentPermission(
  owner,
  agentPubkey,
  PermissionLevel.Guided, // Can capture with limits
  new BN(100_000_000) // 100 Cred daily limit
);

// Set heir for inheritance
const heirIx = await loop.vault.setHeir(
  owner,
  heirPubkey,
  90 // 90 days inactivity threshold
);

// Extract all value (5% fee, emergency only)
const extractIx = await loop.vault.extract(
  owner,
  userCredAccount,
  vaultCredAccount,
  feeAccount
);
```

### Cred Module

```typescript
// Wrap USDC to Cred (1:1)
const wrapIx = await loop.cred.wrap(
  user,
  new BN(100_000_000), // 100 USDC → 100 Cred
  userUsdcAccount,
  userCredAccount,
  credMint,
  reserveVault
);

// Unwrap Cred to USDC (1:1)
const unwrapIx = await loop.cred.unwrap(
  user,
  new BN(50_000_000), // 50 Cred → 50 USDC
  userCredAccount,
  userUsdcAccount,
  credMint,
  reserveVault
);

// Check reserve status
const status = await loop.cred.getReserveStatus(reserveVault, credMint);
console.log(`Backing ratio: ${status.backingRatio.toNumber() / 100}%`);
```

### OXO Module

```typescript
// Lock OXO for veOXO (voting power)
// Duration multiplier: 6mo=0.25x, 1yr=0.5x, 2yr=1x, 4yr=2x
const lockIx = await loop.oxo.lockOxo(
  owner,
  new BN(1000_000_000), // 1000 OXO
  new BN(126144000), // 4 years = 2x → 2000 veOXO
  userOxoAccount,
  protocolOxoAccount
);

// Calculate veOXO for amount/duration
const veOxo = loop.oxo.calculateVeOxo(
  new BN(1000_000_000),
  new BN(63072000) // 2 years
);
console.log(veOxo.toString()); // 1000 veOXO

// Get current decayed veOXO balance
const currentVeOxo = await loop.oxo.getCurrentVeOxo(owner);

// Extend lock duration
const extendIx = await loop.oxo.extendLock(
  owner,
  new BN(31536000) // Add 1 year
);

// Claim fee share (for veOXO holders)
const claimFeesIx = await loop.oxo.claimFeeShare(
  owner,
  feePoolAccount,
  userCredAccount
);

// Unlock OXO (after lock expires)
const unlockIx = await loop.oxo.unlockOxo(
  owner,
  userOxoAccount,
  protocolOxoAccount
);

// Create agent token (500 OXO fee)
const createTokenIx = await loop.oxo.createAgentToken(
  creator,
  agentMint,
  'Agent Alpha',
  'AGENTA',
  'https://metadata.uri',
  creatorOxoAccount,
  treasuryOxoAccount
);

// Buy agent token on bonding curve
const buyIx = await loop.oxo.buyAgentToken(
  buyer,
  agentMint,
  new BN(100_000_000), // 100 OXO
  buyerOxoAccount,
  buyerAgentAccount,
  curveOxoAccount
);

// Sell agent token (1% fee)
const sellIx = await loop.oxo.sellAgentToken(
  seller,
  agentMint,
  new BN(500_000_000), // 500 agent tokens
  sellerOxoAccount,
  sellerAgentAccount,
  curveOxoAccount
);
```

### Capture Modules

#### Shopping Capture

Value captured automatically via vault capture:

```typescript
const captureIx = await loop.vault.capture(
  vaultPda,
  new BN(5_000_000), // 5 Cred cashback
  CaptureType.Shopping,
  'Target purchase #12345',
  captureModulePubkey,
  credMint,
  vaultCredAccount
);
```

#### Referral Capture

```typescript
// Create tracked affiliate link
const link = await loop.referral.trackLink(
  'https://merchant.com/product/123',
  'my-affiliate-tag'
);

// Register conversion (called by merchant integration)
const conversion = await loop.referral.registerConversion(
  link.id,
  new BN(100_000_000), // 100 Cred purchase
  'tx_signature_proof'
);

// Claim earned commission
const claimIx = await loop.referral.claimCommission(
  user,
  ['conv_1', 'conv_2']
);

// Get affiliate stats
const stats = await loop.referral.getAffiliateStats(user);
console.log(`Conversion rate: ${stats.conversionRateBps / 100}%`);
```

#### Attention Capture

```typescript
// Register for ad rewards
const profile = await loop.attention.registerForAds(
  user,
  {
    categories: ['tech', 'finance'],
    blockedCategories: ['gambling'],
    dailyLimit: 10,
    minReward: new BN(100_000) // 0.1 Cred minimum
  }
);

// Get available ads
const ads = await loop.attention.getAvailableAds(user);

// Submit view proof
const verification = await loop.attention.verifyView(
  user,
  'ad_123',
  viewProofData
);

// Claim rewards
const claimIx = await loop.attention.claimAttentionReward(user, []);
```

#### Data Capture

```typescript
// Set data pricing
const config = await loop.data.setDataPricing(
  user,
  ['browsing', 'preferences'],
  new Map([
    ['browsing', new BN(5_000_000)],
    ['preferences', new BN(2_000_000)]
  ])
);

// License data to buyer
const license = await loop.data.licenseData(
  user,
  buyerPubkey,
  'browsing',
  {
    durationSeconds: new BN(2592000), // 30 days
    allowReshare: false,
    maxAccessCount: 100,
    allowedUseCases: ['analytics'],
    geoRestrictions: []
  }
);

// Revoke license
const revokeIx = await loop.data.revokeDataLicense(user, license.id);

// Claim revenue
const claimIx = await loop.data.claimDataRevenue(user);
```

#### Compute Capture

```typescript
// Register compute resources
const profile = await loop.compute.registerResources(user, {
  cpu: 8,
  gpu: 2,
  storage: 500,
  bandwidth: 1000
});

// Accept task
const acceptance = await loop.compute.acceptTask(
  user,
  'task-abc123',
  new BN(50_000_000) // 50 Cred bid
);

// Submit result
const submission = await loop.compute.submitTaskResult(
  user,
  'task-abc123',
  resultHash,
  proof
);

// Claim rewards
const claimIx = await loop.compute.claimComputeReward(user, ['task-abc123']);
```

#### Network Capture

```typescript
// Register as network node
const registration = await loop.network.registerNode(
  user,
  NodeType.Oracle,
  ['price_feed', 'data_attestation']
);

// Submit governance vote
const vote = await loop.network.submitVote(
  user,
  'prop-upgrade-v2',
  true,
  eligibilityProof
);

// Submit attestation
const attestation = await loop.network.submitAttestation(
  user,
  dataHash,
  AttestationType.PriceOracle
);

// Claim participation rewards
const claimIx = await loop.network.claimParticipationReward(user, activityIds);
```

#### Skill Capture

```typescript
// Export behavior model
const model = await loop.skill.exportBehaviorModel(
  user,
  SkillType.Trading,
  AnonymizationLevel.Differential
);

// License skill to buyer
const license = await loop.skill.licenseSkill(
  user,
  buyerPubkey,
  model.modelId,
  {
    duration: new BN(31536000), // 1 year
    price: new BN(100_000_000), // 100 Cred
    usageLimit: new BN(0), // unlimited
    allowSublicense: false,
    commercialUse: true
  }
);

// Claim skill revenue
const claimIx = await loop.skill.claimSkillRevenue(user);
```

### Security Integrations

#### Para (Passkeys)

```typescript
// Create passkey wallet
const wallet = await loop.para.createPasskeyWallet(userId, {
  deviceId: 'device-123',
  deviceType: 'mobile',
  platform: 'iOS',
  biometricCapable: true
});

// Get scoped session key
const sessionKey = await loop.para.getSessionKey(userId, {
  canCapture: true,
  canStack: true,
  canTransfer: false,
  maxTransferAmount: 0,
  allowedPrograms: [loop.programIds.VAULT]
}, 3600); // 1 hour

// Sign with passkey
const signed = await loop.para.signWithPasskey(userId, transaction);
```

#### Squads (Policies)

```typescript
// Create smart account
const account = await loop.squads.createSmartAccount(owner, {
  threshold: 2,
  members: [
    { pubkey: member1, weight: 1 },
    { pubkey: member2, weight: 1 }
  ],
  timeLockSeconds: 86400 // 24 hours
});

// Set agent policy
const policy = await loop.squads.setAgentPolicy(
  account.address,
  agentKey,
  {
    dailyLimit: 1000_000_000, // 1000 Cred
    allowedInstructions: ['capture', 'stack'],
    timelock: 0,
    requiresApproval: false
  }
);

// Propose transaction for multi-sig
const proposal = await loop.squads.proposeTransaction(
  account.address,
  transaction
);

// Emergency pause
const pauseIx = await loop.squads.pauseAgent(account.address, agentKey);
```

#### Reclaim (ZK Proofs)

```typescript
// Generate ZK proof of capture
const proof = await loop.reclaim.generateCaptureProof(
  CaptureType.Shopping,
  { orderId: '123', amount: 100, merchant: 'Amazon' }
);

// Verify proof
const result = await loop.reclaim.verifyProof(proof, {
  merchant: 'Amazon'
});

// Submit verified capture
const capture = await loop.reclaim.submitVerifiedCapture(
  user,
  proof,
  CaptureType.Shopping
);
```

#### TEE (Trusted Execution)

```typescript
// Get enclave attestation
const attestation = await loop.tee.getEnclaveAttestation('enclave-123');

// Verify enclave code
const verified = await loop.tee.verifyEnclaveCode(
  attestation,
  expectedCodeHash
);

// Register trusted agent
const agent = await loop.tee.registerTrustedAgent(user, attestation);
```

## Configuration

### Network Selection

```typescript
import { Connection, clusterApiUrl } from '@solana/web3.js';

// Mainnet
const mainnet = new Connection(clusterApiUrl('mainnet-beta'));

// Devnet
const devnet = new Connection(clusterApiUrl('devnet'));

const loop = new Loop({ connection: mainnet });
```

### Custom RPC

```typescript
const connection = new Connection('https://your-rpc-endpoint.com', {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000
});
```

### Commitment Levels

```typescript
const connection = new Connection(rpcUrl, {
  commitment: 'finalized' // 'processed' | 'confirmed' | 'finalized'
});
```

## Error Handling

```typescript
import { Loop } from '@loop-protocol/sdk';

try {
  const vault = await loop.vault.getVault(userPubkey);
  if (!vault) {
    console.log('Vault does not exist');
    return;
  }
  
  const withdrawIx = await loop.vault.withdraw(
    owner,
    new BN(amount),
    userCredAccount,
    vaultCredAccount
  );
} catch (error) {
  if (error.message.includes('insufficient funds')) {
    console.error('Not enough Cred in vault');
  } else if (error.message.includes('stack locked')) {
    console.error('Cannot withdraw stacked Cred before lock expires');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Examples

See the [examples folder](./examples) for complete working examples:

- [basic-vault.ts](./examples/basic-vault.ts) - Vault creation, deposits, withdrawals
- [capture-rewards.ts](./examples/capture-rewards.ts) - Value capture from multiple sources
- [stacking.ts](./examples/stacking.ts) - Stacking for yield with APY calculations

## PDA Derivation

All PDAs can be derived using the `LoopPDA` helper:

```typescript
import { LoopPDA } from '@loop-protocol/sdk';

// Vault PDA
const [vaultPda, bump] = LoopPDA.vault(owner);

// Stack record PDA
const [stackPda, stackBump] = LoopPDA.stackRecord(vault, stackIndex);

// Agent permission PDA
const [permPda, permBump] = LoopPDA.agentPermission(vault, agent);

// veOXO position PDA
const [vePda, veBump] = LoopPDA.veOxoPosition(owner);

// Bonding curve PDA
const [curvePda, curveBump] = LoopPDA.bondingCurve(agentMint);

// Escrow PDA
const [escrowPda, escrowBump] = LoopPDA.escrow(sender, recipient, createdAt);
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repo
git clone https://github.com/southerncory/loop-protocol.git
cd loop-protocol/sdk

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## License

MIT © Loop Protocol

---

Built with ❤️ by [Loop Protocol](https://looplocal.io)
