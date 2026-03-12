# STATUS.md — Current State

> **Read this first every session.**

---

## Current Phase

**Phase 4: MVP Complete** ✅

All core programs + Shopping Capture Module built and ready.

---

## Last Session

**Date:** 2026-03-12

**What happened:**
- ✅ Built loop-shopping (Shopping Capture Module)
- ✅ Updated TypeScript SDK (40+ methods)
- ✅ Wrote comprehensive integration tests (4,183 lines)
- ✅ All 6 programs compiled on A9

---

## Build Status

| Program | Status | Size | Description |
|---------|--------|------|-------------|
| **loop_vault.so** | ✅ | 364 KB | User vaults, stacking, inheritance |
| **loop_cred.so** | ✅ | 297 KB | USDC-backed stable token |
| **loop_oxo.so** | ✅ | 373 KB | Protocol equity, veOXO, bonding curves |
| **loop_vtp.so** | ✅ | 354 KB | Transfers, escrow, inheritance |
| **loop_avp.so** | ✅ | 261 KB | Agent identity, capabilities |
| **loop_shopping.so** | ✅ | 345 KB | Purchase capture, rewards |

**Total:** 6 programs, ~2 MB

---

## Program IDs

| Program | Address |
|---------|---------|
| loop-vault | `76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7` |
| loop-cred | `FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA` |
| loop-oxo | `3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z` |
| loop-vtp | `4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj` |
| loop-avp | `H5c9xfPYcx6EtC8hpThshARtUR7tq1NfMJVrTx8z9Jcx` |
| loop-shopping | `D9EVmPZXMwqL3v9ebdpanyrJi3i1ZdfNRJo2MsZkd7qJ` |

---

## SDK

**Location:** `sdk/src/index.ts`

| Module | Methods |
|--------|---------|
| loop.vault.* | 11 methods |
| loop.cred.* | 6 methods |
| loop.oxo.* | 10 methods |
| loop.vtp.* | 11 methods |
| loop.avp.* | 10 methods |

**Total:** 48 TypeScript methods with PDA helpers and types.

---

## Tests

**Location:** `tests/`

| File | Lines | Coverage |
|------|-------|----------|
| integration.ts | 828 | Full flow |
| loop-cred.ts | 795 | Cred program |
| loop-vtp.ts | 1,009 | VTP program |
| loop-avp.ts | 881 | AVP program |
| loop-vault.ts | ~300 | Vault basics |
| loop-oxo.ts | ~400 | OXO basics |

**Total:** ~4,200 lines of tests

---

## What's Built

### Core Protocol (Phase 2-3) ✅
- **AVP** — Agent identity, registration, capabilities
- **Vault** — User vaults, stacking, yield, inheritance
- **Cred** — USDC-backed stable token
- **OXO** — Protocol equity, veOXO governance
- **VTP** — Transfers, escrow, inheritance

### Capture Module (Phase 4) ✅
- **Shopping** — Merchant registration, purchase proof, rewards

### SDK & Tests ✅
- TypeScript SDK matching all programs
- Comprehensive integration tests

---

## Next Steps

1. **Deploy to devnet** — Test on live network
2. **Run integration tests** — Verify full flow
3. **Security audit** — Before mainnet
4. **Mainnet launch** — Target: 2026-08

---

## Deploy Commands (on A9)

```bash
# SSH to A9
sshpass -p 'crypticbox589' ssh "cory southern@100.85.44.90"

# In WSL
wsl -d Ubuntu
cd ~/loop-protocol
source ~/.cargo/env

# Deploy to devnet
solana config set --url devnet
anchor deploy
```

---

*Last updated: 2026-03-12*
