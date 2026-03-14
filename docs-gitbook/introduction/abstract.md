# Abstract

Loop Protocol provides infrastructure for AI agents to capture economic value on behalf of humans and manage it in self-custodied vaults.

## The Problem

Every economic interaction generates value that flows to intermediaries rather than to the individual who created it. Card networks collect 2-3% of every transaction. Data brokers monetize purchase histories. Platforms sell attention to advertisers. Over a lifetime, this extraction amounts to hundreds of thousands of dollars per person.

## The Opportunity

AI agents will soon mediate most economic activity. They'll handle purchases, manage finances, negotiate deals, and navigate digital services on our behalf. This transition creates a unique opportunity: if we build the right infrastructure now, agents can capture value for users instead of extracting it for platforms.

## The Solution

Loop Protocol consists of six Solana programs that enable:

**Value Capture**: Modular systems that intercept and verify value from activities like shopping, data licensing, and attention monetization. Captured value flows directly to user vaults.

**Wealth Building**: Users can stack captured value for yield (3-15% APY depending on lock duration), and agents can execute automated wealth-building strategies. The system functions like a self-directed retirement account where users and their agents maintain full control.

**Self-Custody**: Loop is infrastructure, not a custodian. Users hold their own keys and control their own funds. The protocol provides rails for value capture and transfer; users maintain sovereignty over their assets.

## Token Model

The protocol uses two tokens with distinct purposes:

**Cred** is a stable token pegged 1:1 to USDC, backed by reserves. Cred is what accumulates in user vaults. Stability is intentional: wealth building requires a reliable unit of account.

**OXO** is the protocol equity token with fixed supply. OXO provides governance rights, fee sharing through veOXO staking, and is required for Service Agent creation. OXO can appreciate with protocol success; Cred cannot.

## Design Principles

1. **User-centric**: Value flows to humans by default
2. **Agent-agnostic**: Any agent implementing the interface works with Loop
3. **Modular**: Capture systems are independent and pluggable
4. **Self-custodied**: Users control their own funds
5. **Verifiable**: All operations happen on-chain with cryptographic proofs

## Scope

This document covers the protocol architecture, token economics, agent ecosystem, and governance model. Technical specifications for individual programs are available in the reference section.
