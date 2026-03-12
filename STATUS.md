# STATUS.md — Current State

> **Read this first every session.**

---

## Current Phase

**Phase 2: Core Implementation** (In Progress)

Building the core protocol infrastructure — Solana programs and TypeScript SDK.

---

## Last Session

**Date:** 2026-03-12

**What happened:**
- Built OXO program (veOXO staking + bonding curves for agent tokens)
- Built VTP program (vault-to-vault transfers + escrow + inheritance)
- Set up Anchor project structure
- Installed Anchor CLI (0.32.1) and Solana CLI (3.1.10)
- Wrote test suites for vault and OXO programs
- Attempted full build (blocked by server disk space - need ~5GB free)

**Programs Complete:**
1. **loop-vault** — User vaults, deposits, stacking, withdrawals, agent permissions
2. **loop-cred** — USDC-backed stable token, wrap/unwrap, capture minting
3. **loop-oxo** — Protocol equity, veOXO staking (0.25x-2x), bonding curves, agent tokens
4. **loop-vtp** — Transfers, escrow with conditions, inheritance planning

---

## Current State

| Component | Status |
|-----------|--------|
| Repository structure | ✅ Complete |
| Documentation scaffold | ✅ Complete |
| Architecture spec | ✅ Complete |
| Tokenomics spec | ✅ Complete |
| **loop-vault program** | ✅ Code complete |
| **loop-cred program** | ✅ Code complete |
| **loop-oxo program** | ✅ Code complete |
| **loop-vtp program** | ✅ Code complete |
| **TypeScript SDK** | ✅ Core implementation |
| Anchor.toml | ✅ Configured |
| Cargo.toml | ✅ Configured |
| Program keypairs | ✅ Generated |
| Tests | ✅ Written (vault, oxo) |
| Build | ⚠️ Needs more disk space |
| Devnet deploy | ⏳ Pending build |

---

## Program IDs (Localnet/Devnet)

| Program | Address |
|---------|---------|
| loop-vault | `76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7` |
| loop-cred | `FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA` |
| loop-oxo | `3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z` |
| loop-vtp | `4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj` |

---

## What's Built

### Solana Programs

**loop-vault** (`programs/loop-vault/src/lib.rs`)
- Initialize vault (PDA per user)
- Deposit Cred
- Capture value (from authorized modules)
- Stack for yield (7-365 days, 5-20% APY)
- Unstack (with early penalty)
- Withdraw
- Agent permissions (none/read/capture/guided/autonomous)

**loop-cred** (`programs/loop-cred/src/lib.rs`)
- Initialize (USDC backing)
- Wrap USDC → Cred (1:1)
- Unwrap Cred → USDC (1:1)
- Capture mint (authorized modules mint Cred)
- Register capture modules
- Reserve transparency

**loop-oxo** (`programs/loop-oxo/src/lib.rs`) — NEW
- Protocol initialization
- Lock OXO → veOXO (6mo-4yr, 0.25x-2x multiplier)
- Extend lock duration
- Unlock OXO after expiry
- Fee share distribution to veOXO holders
- Create agent tokens (bonding curve)
- Buy/sell agent tokens on curve
- Agent graduation (25,000 OXO threshold)
- Treasury fee deposits

**loop-vtp** (`programs/loop-vtp/src/lib.rs`) — NEW
- Direct vault-to-vault transfers (0.1% fee)
- Batch transfers (up to 10 recipients)
- Escrow creation with conditions
- Condition types: ArbiterApproval, TimeRelease, OracleAttestation, MultiSig
- Escrow release/cancel
- Inheritance setup (heirs, percentages)
- Inheritance heartbeat (activity proof)
- Inheritance trigger (inactivity threshold)

### SDK

**@loop-protocol/sdk** (`sdk/src/index.ts`)
- Full TypeScript SDK implementation
- `loop.register()` — create user vault
- `loop.vault.*` — balance, stack, unstack, withdraw
- `loop.capture.*` — shopping, data, presence, attention
- `loop.transfer.*` — send, batch, escrow
- Types and interfaces

### Tests

**tests/loop-vault.ts** — Vault operations, stacking, agent permissions
**tests/loop-oxo.ts** — veOXO staking, bonding curves, governance

---

## Next Steps

1. **Build programs** — Need ~5GB disk space, or build on external machine
2. **Run tests** — `anchor test`
3. **Deploy to devnet** — Test full flow
4. **Kard integration** — Shopping capture module
5. **Website update** — Reflect protocol progress

---

## Build Instructions

```bash
# Requires: Rust, Solana CLI, Anchor CLI
# Needs: ~5GB free disk space

cd /home/ubuntu/clawd/loop/loop-protocol-full

# Source environment
source "$HOME/.cargo/env"
export PATH="/home/ubuntu/.local/share/solana/install/active_release/bin:$PATH"

# Build all programs
anchor build

# Or build individually
cargo build-sbf --manifest-path programs/loop-vault/Cargo.toml
cargo build-sbf --manifest-path programs/loop-cred/Cargo.toml
cargo build-sbf --manifest-path programs/loop-oxo/Cargo.toml
cargo build-sbf --manifest-path programs/loop-vtp/Cargo.toml
```

---

## Key Files

| File | Purpose |
|------|---------|
| `programs/loop-vault/src/lib.rs` | Vault program |
| `programs/loop-cred/src/lib.rs` | Cred token program |
| `programs/loop-oxo/src/lib.rs` | OXO + veOXO program |
| `programs/loop-vtp/src/lib.rs` | Transfer protocol |
| `sdk/src/index.ts` | TypeScript SDK |
| `tests/*.ts` | Test suites |
| `Anchor.toml` | Anchor config |
| `Cargo.toml` | Workspace config |

---

## Disk Space Note

Server has limited disk (~19GB total). Build requires ~5GB free.
To free space:
- Remove node_modules from inactive projects
- Clear `target/` directory after builds
- Clear npm/cargo cache

---

*Last updated: 2026-03-12*
