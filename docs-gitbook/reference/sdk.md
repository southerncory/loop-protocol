# SDK Reference

TypeScript SDK for Loop Protocol integration.

## Installation

```bash
npm install loop-protocol-ai-sdk
```

## Quick Start

```typescript
import { Loop } from 'loop-protocol-ai-sdk';
import { Connection, Keypair } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const wallet = Keypair.generate();

const loop = new Loop({ connection, wallet });

// Create vault
const vault = await loop.vault.initialize(usdcMint);

// Capture value
await loop.vault.capture(vault, 100_000000);

// Stack for yield
await loop.vault.stack(vault, 50_000000, 180 * 24 * 60 * 60);
```

## Vault Operations

```typescript
// Initialize
const vaultPda = await loop.vault.initialize(usdcMint);

// Get state
const state = await loop.vault.get(vaultPda);

// Capture
await loop.vault.capture(vaultPda, amount);

// Stack
await loop.vault.stack(vaultPda, amount, durationSeconds);

// Claim yield
await loop.vault.claimYield(vaultPda);

// Extract to USDC
await loop.vault.extract(vaultPda, amount, usdcAccount);
```

## Cred Operations

```typescript
// Mint from USDC
await loop.cred.mint(amount, usdcSource);

// Transfer
await loop.cred.transfer(to, amount);

// Get balance
const balance = await loop.cred.balance(owner);
```

## OXO Operations

```typescript
// Lock for veOXO
await loop.oxo.lock(amount, durationSeconds);

// Get veOXO balance
const veOxo = await loop.oxo.veBalance(owner);

// Claim fees
await loop.oxo.claimFees();
```

## VTP Operations

```typescript
// Direct transfer
await loop.vtp.transfer({ from, to, amount });

// Create escrow
await loop.vtp.createEscrow({ buyer, seller, amount, conditions });

// Release escrow
await loop.vtp.releaseEscrow(escrowPda, proof);
```

## Capture Operations

```typescript
// Submit shopping proof
await loop.capture.submitShopping({
  vault: vaultPda,
  proof: { merchantId, transactionId, amount, merchantSignature }
});
```

## Simplified Interface

For agent frameworks:

```typescript
import { createSimpleLoop } from 'loop-protocol-ai-sdk/simple';

const loop = createSimpleLoop(connection, wallet);

await loop.capture(vault, amount);
await loop.stack(vault, amount, duration);
await loop.transfer(from, to, amount);
```

## Error Handling

```typescript
import { LoopError, ErrorCode } from 'loop-protocol-ai-sdk';

try {
  await loop.vault.extract(vault, amount, destination);
} catch (e) {
  if (e instanceof LoopError) {
    if (e.code === ErrorCode.InsufficientBalance) {
      // Handle insufficient funds
    }
  }
}
```

## SDK Languages

| Language | Status |
|----------|--------|
| TypeScript | Available |
| Python | Q2 2026 |
| Rust | Q3 2026 |

## Examples

See `/examples` in the SDK repository for complete integration examples.
