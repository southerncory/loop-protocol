# STATUS.md — Current State

> **Read this first every session.**

---

## Current Phase

**Phase 2: Core Implementation**

Building the core protocol infrastructure — Solana programs and TypeScript SDK.

---

## Last Session

**Date:** 2026-03-12

**What happened:**
- Completed multi-LLM audit of protocol design (Gemini + xAI + Claude)
- Pivoted to Virtuals-aligned approach: aggressive, tokenized, ship fast
- Clarified Loop's position: VALUE CAPTURE PROTOCOL that any agent integrates
- Built core Solana programs (loop-vault, loop-cred)
- Built TypeScript SDK (@loop-protocol/sdk)
- Set up multi-LLM research pipeline for ongoing development

**Decisions made:**
- Loop is NOT an agent provider — it's infrastructure for any agent
- Triple token model: Cred (stable) + OXO (equity) + LATs (per-agent)
- Ship first, decentralize from day 1, don't ask permission
- Target 6-month mainnet launch
- Start with shopping capture (clearest utility)
- Integrate with Virtuals ecosystem (both layer AND agent)

---

## Current State

| Component | Status |
|-----------|--------|
| Repository structure | ✅ Complete |
| Documentation scaffold | ✅ Complete |
| Architecture spec | ✅ Complete |
| Tokenomics spec | ✅ Complete |
| **loop-vault program** | ✅ Core implementation |
| **loop-cred program** | ✅ Core implementation |
| loop-oxo program | ⏳ Not started |
| loop-vtp program | ⏳ Not started |
| **TypeScript SDK** | ✅ Core implementation |
| Python SDK | ⏳ Not started |
| Tests | ⏳ Not started |
| Anchor build setup | ⏳ Needs Anchor CLI install |

---

## What's Built

### Solana Programs

**loop-vault** (`programs/loop-vault/`)
- Initialize vault (PDA per user)
- Deposit Cred
- Capture value (from authorized modules)
- Stack for yield (7-365 days, 5-20% APY)
- Unstack (with early penalty)
- Withdraw
- Agent permissions (none/read/capture/guided/autonomous)

**loop-cred** (`programs/loop-cred/`)
- Initialize (USDC backing)
- Wrap USDC → Cred (1:1)
- Unwrap Cred → USDC (1:1)
- Capture mint (authorized modules mint Cred)
- Register capture modules
- Reserve transparency

### SDK

**@loop-protocol/sdk** (`sdk/`)
- `Loop` main class
- `loop.register(owner)` — create vault
- `loop.vault.balance()` — check balances
- `loop.vault.stack(amount, days)` — lock for yield
- `loop.vault.unstack(stackId)` — withdraw with yield
- `loop.vault.withdraw(amount, destination)` — exit
- `loop.capture.shopping.connect()` — card linking
- `loop.capture.data.connect()` — data monetization
- `loop.capture.presence.connect()` — location rewards
- `loop.capture.attention.connect()` — attention rewards
- `loop.transfer.send(from, to, amount)` — VTP

---

## Next Steps

1. **Install Anchor CLI** — needed for building/testing programs
2. **Write tests** — unit tests for vault and cred programs
3. **Build OXO program** — bonding curve, governance
4. **Build VTP program** — vault-to-vault transfers
5. **Shopping capture module** — Kard/CLO integration
6. **Deploy to devnet** — test full flow

---

## Multi-LLM Research Pipeline

Set up automated research using:
- **Gemini** (gemini-2.5-flash)
- **xAI** (grok-4-latest)

Usage: `python3 tools/research_agent.py --provider all --prompt "question"`

Use for: Architecture questions, implementation guidance, market research.

---

## Key Documents

| Document | Path |
|----------|------|
| Master Spec | `/home/ubuntu/clawd/loop/LOOP-PROTOCOL-MASTER-SPEC.md` |
| Virtuals Synthesis | `/home/ubuntu/clawd/loop/VIRTUALS-SYNTHESIS.md` |
| Audit Results | `/home/ubuntu/clawd/loop/AUDIT-SYNTHESIS.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Tokenomics | `docs/TOKENOMICS.md` |
| Whitepaper | `docs/WHITEPAPER.md` |

---

## Quick Reference

```bash
# Build SDK
cd sdk && npm install && npm run build

# Research with LLMs
python3 ~/clawd/tools/research_agent.py --provider all --prompt "Your question"

# Git
git add . && git commit -m "message" && git push
```

---

*Last updated: 2026-03-12*
