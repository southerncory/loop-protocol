# Loop Protocol

**The Economic Layer for the Agentic Era**

---

## Vision

Loop Protocol is infrastructure for a future where everyone has a personal AI agent that captures value on their behalf. Instead of banks, platforms, and intermediaries extracting value from your economic activity, your agent captures it, compounds it, and preserves it for generations.

**The old model:** You create value everywhere you go. Others capture it.

**The Loop model:** You create value everywhere you go. You capture it.

---

## Core Concepts

### Two Types of Value

- **Cred** — Stable value token (1 Cred = $1). What you earn from capture activities. Stackable for yield. Inheritable.
- **OXO** — Protocol equity token. Fixed supply. Governance rights. Required for Service Agent creation.

### Two Types of Agents

- **Personal Agents** — Serve one human (the principal). Capture value into the principal's vault. No token.
- **Service Agents** — Serve many users/agents. Earn fees for their creators. Can have their own token.

### The Closed Loop

Value can:
- Flow IN (capture from activities)
- Compound (staking yield)
- Transfer (agent-to-agent)
- Inherit (to designated heirs)

Value can be extracted, but extraction resets your vault to zero. The incentive is to stay and compound.

---

## Protocol Stack

```
┌─────────────────────────────────────────┐
│  Application Protocols                  │
│  (Shopping, Data, Attention, etc.)      │
├─────────────────────────────────────────┤
│  Capture Layer                          │
│  (Cryptographic activity proofs)        │
├─────────────────────────────────────────┤
│  Value Transfer Protocol (VTP)          │
│  (On-chain transfers, settlement)       │
├─────────────────────────────────────────┤
│  Agent Value Protocol (AVP)             │
│  (Identity, binding, capabilities)      │
├─────────────────────────────────────────┤
│  Solana Blockchain                      │
└─────────────────────────────────────────┘
```

---

## Repository Structure

```
loop-protocol/
├── STATUS.md                    # Current state — READ FIRST
├── ROADMAP.md                   # Phases and timeline
├── docs/
│   ├── ARCHITECTURE.md          # System design
│   ├── WHITEPAPER.md            # Public document
│   ├── TOKENOMICS.md            # Token economics
│   ├── GLOSSARY.md              # Definitions
│   └── DECISIONS.md             # Key decisions
├── specs/
│   ├── avp.md                   # Agent Value Protocol
│   ├── vtp.md                   # Value Transfer Protocol
│   ├── vault.md                 # Vault program
│   ├── cred.md                  # Cred token
│   ├── oxo.md                   # OXO token
│   ├── ve-oxo.md                # Staking
│   └── modules/                 # Capture modules
├── programs/                    # Solana programs
├── sdk/                         # Agent SDK
├── tests/                       # Tests
└── sessions/                    # Work logs
```

---

## Quick Links

- [Architecture](docs/ARCHITECTURE.md)
- [Tokenomics](docs/TOKENOMICS.md)
- [Whitepaper](docs/WHITEPAPER.md)
- [Current Status](STATUS.md)
- [Roadmap](ROADMAP.md)

---

## The Big Picture

Loop Protocol isn't an app. It's not a platform. It's a protocol — like HTTP or TCP/IP.

Any agent can implement it. Any user can join through their agent. Value capture is modular. The protocol verifies. The agent executes. The user lives their life.

**"Hey agent, add Loop and reward me for everything I do."**

That's the entire onboarding.

---

## License

MIT

---

*Built for the future where agents work for humans, not the other way around.*
