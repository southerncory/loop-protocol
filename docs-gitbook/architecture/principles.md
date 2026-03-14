# Design Principles

Loop Protocol is built on five principles that guide technical decisions.

## 1. User-Centric

Value flows to humans by default. Every design decision asks: does this benefit users?

This manifests in:
- Capture modules route 80-85% of value to users
- Fees are minimal and transparent
- Users control their data and preferences
- Agents serve users, not platforms

User-centricity isn't altruism. Protocols that benefit users get adopted. Protocols that extract from users eventually get replaced.

## 2. Agent-Agnostic

Loop doesn't care which agent you use. The protocol defines interfaces, not implementations.

Compatible agents include:
- OpenAI agents
- Anthropic agents
- Google agents
- Open-source models
- Custom implementations

Any software implementing the Loop interface can capture value for users. Betting on a single AI provider would be shortsighted given how fast the space evolves.

## 3. Modular

Capture systems are independent and pluggable. Each activity type has its own module:

```
Shopping Module ──┐
                  │
Data Module ──────┼───→ Vault Program
                  │
Attention Module ─┘
```

Benefits:
- Enable only the modules you want
- Modules upgrade independently
- New modules don't affect existing ones
- Third parties can build custom modules

## 4. Self-Custodied

Users control their own funds. Loop provides infrastructure, not custody.

This means:
- Your keys, your vault
- No institutional counterparty risk
- No one can freeze your account
- You bear responsibility for key security

Self-custody is a tradeoff. Users who prefer institutional custody should use traditional services.

## 5. Verifiable

All operations happen on-chain with cryptographic proofs. Nothing requires trusting Loop as an organization.

| Component | Verification |
|-----------|--------------|
| Captures | Proof hashes on-chain |
| Transfers | Transaction history |
| Yields | Programmatic distribution |
| Governance | On-chain voting |

You verify, not trust.

## Principle Hierarchy

When principles conflict, priority order:

1. **User-centric** always wins
2. **Self-custody** over convenience
3. **Verifiable** over efficient
4. **Modular** over optimized
5. **Agent-agnostic** over controlled

This hierarchy resolves design disputes. User benefit takes precedence over protocol efficiency. Self-custody takes precedence over ease of use.

## Tradeoffs

Every principle has costs:

| Principle | Benefit | Cost |
|-----------|---------|------|
| User-centric | Adoption, loyalty | Lower protocol capture |
| Agent-agnostic | Broad ecosystem | Less UX control |
| Modular | Flexibility | Complexity |
| Self-custodied | Security, sovereignty | User responsibility |
| Verifiable | Trust minimization | Higher development effort |

These are conscious choices. The costs are acceptable given the benefits.

## Anti-Principles

Loop explicitly rejects:

**Extraction**: The protocol doesn't take hidden fees or monetize user data. Revenue comes from transparent capture fees.

**Lock-in**: Users can exit anytime. Agents can switch. No proprietary requirements.

**Opacity**: Code is open source. Economics are on-chain. Nothing is hidden.

**Centralization**: Progressive decentralization toward full DAO control. No permanent central authority.

[Continue to: Protocol Stack →](stack.md)
