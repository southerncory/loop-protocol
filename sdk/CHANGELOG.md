# Changelog

All notable changes to the Loop Protocol SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Modular file structure (constants, pda, types, modules, utils, errors)
- 11 capture modules (attention, compute, data, energy, insurance, liquidity, network, referral, skill, social, shopping)
- 4 security integrations (Para, Squads, Reclaim, TEE)
- Custom error classes (`LoopError`, `ValidationError`, `InsufficientBalanceError`, etc.)
- Input validation utilities (`validatePublicKey`, `validateAmount`, `validateStackDuration`, etc.)
- Retry utilities with exponential backoff (`retry`, `retryWithResult`, `retryBatch`)
- Test suite (vitest)
- Example code (`01-basic-vault.ts`, `02-agent-permissions.ts`, `03-escrow.ts`, `04-oxo-staking.ts`)

### Changed
- Split monolithic `index.ts` (5,300 lines) into 35+ modular files
- Improved TypeScript types with full coverage
- Enhanced JSDoc documentation

## [0.1.0] - 2026-03-14

### Added
- Initial SDK release
- Core modules:
  - `VaultModule` - User-owned value storage, stacking, agent permissions
  - `CredModule` - Stable value token (1 Cred = $1 USDC)
  - `OxoModule` - veOXO staking, bonding curves
  - `VtpModule` - Transfers, escrow, inheritance
  - `AvpModule` - Agent identity, capabilities, reputation
- PDA derivation helpers (`LoopPDA`)
- Program constants (`PROGRAM_IDS`, `CONSTANTS`)
- Simple SDK wrapper for elizaOS integration (`LoopSDK`)
- Devnet program IDs:
  - loop-vault: `59TcVKRtME1mzGUL4xfpjMfhstGqoCEoZTTySpAeuZXZ`
  - loop-cred: `4THszk4dzFAkrcRXB2bXhrLunc74qmc6AUbzRGsGVETH`
  - loop-oxo: `AidgmTgrbV7UMTLzyDM1MhQLzkrGZMFGTdgHVd3dVC7R`

### Infrastructure
- TypeScript with strict mode
- Dual ESM/CJS output
- Type declarations
- tsup build system

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 0.1.0 | 2026-03-14 | Initial SDK release with 5 core modules |

---

## Migration Guides

### From v0.0.x to v0.1.0

If you were using an early alpha version:

1. **Import changes**: The SDK now uses modular exports
   ```typescript
   // Before
   import { Loop } from '@loop-protocol/sdk/index';
   
   // After
   import { Loop } from '@loop-protocol/sdk';
   ```

2. **Error handling**: Use specific error types
   ```typescript
   import { InsufficientBalanceError } from '@loop-protocol/sdk';
   
   try {
     await loop.vault.stack(...);
   } catch (error) {
     if (error instanceof InsufficientBalanceError) {
       console.log(`Need ${error.required}, have ${error.available}`);
     }
   }
   ```

3. **Validation**: Use built-in validators
   ```typescript
   import { validatePublicKey, validateAmount } from '@loop-protocol/sdk';
   
   const pubkey = validatePublicKey(input, 'owner');
   const amount = validateAmount(input, 'amount', 1);
   ```

---

## Upcoming Features

- [ ] Event subscriptions (`onVaultChange`, `onCaptureComplete`)
- [ ] Connection pooling and fallback RPC
- [ ] Transaction simulation before send
- [ ] GitHub Actions CI/CD
- [ ] NPM publish automation
