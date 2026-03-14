# Loop Protocol

Loop Protocol is economic infrastructure for AI agents. It lets agents capture value from everyday activities, manage wealth-building strategies, and store assets in user-controlled vaults.

The core principle is simple: when your agent handles your economic life, the value it generates should flow to you, not to banks, platforms, or data brokers. And you should maintain full custody of your funds at all times.

---

## What Loop Does

**Value Capture**: Your agent intercepts value from activities like shopping, data licensing, and attention. Instead of interchange fees going to card networks or your browsing data getting sold without your knowledge, that value routes to your personal vault.

**Wealth Building**: Captured value doesn't just sit there. Your agent can stack it for yield, reinvest returns, and execute wealth-building strategies on your behalf. Think of it as a 401k where you and your agent make the decisions, not some fund manager.

**Self-Custody**: Loop is infrastructure, not a custodian. Your vault is yours. Your keys, your funds. Loop provides the rails; you maintain control.

---

## The Two Tokens

**Cred** is the stable value token, pegged 1:1 to USDC. This is what accumulates in your vault. We made it stable because savings shouldn't be a rollercoaster.

**OXO** is the protocol token. It provides governance rights, fee sharing for stakers, and is required to create Service Agents. If you want exposure to Loop's growth, you hold OXO. If you just want stable savings, you can ignore it entirely.

---

## Protocol Components

**Vault Program**: Creates and manages user vaults. Handles deposits, stacking (locking funds for yield), withdrawals, and optional inheritance settings.

**Capture Modules**: Pluggable systems that verify and capture value from specific activities. The shopping module verifies purchase receipts. The data module handles licensing agreements. Each module operates independently.

**Agent Identity (AVP)**: Verifies that agents represent who they claim to represent. Handles registration, principal binding, and capability management.

**Value Transfer (VTP)**: Manages how value moves between parties. Direct transfers, escrow for conditional payments, streaming for subscriptions.

---

## Who This Is For

**Users** who want their AI agents to capture value and build wealth on their behalf, while maintaining full custody of their funds.

**Developers** building agents who want to add value capture capabilities. The SDK is open and the protocol is permissionless.

**Investors** evaluating OXO as exposure to agent economic infrastructure.

---

## Current Status

The protocol is in active development. Core programs are built and deployed to devnet. Security audit is pending before mainnet launch.

| Component | Status |
|-----------|--------|
| Solana Programs | Built |
| TypeScript SDK | Released |
| Devnet Deployment | Live |
| Security Audit | Q2 2026 |
| Mainnet Launch | Q3 2026 |

---

## Documentation Structure

This documentation covers:

1. **The Problem**: Why value extraction matters and why it gets worse as agents become prevalent
2. **The Opportunity**: Why the agent transition creates a window to rebuild economic infrastructure
3. **Protocol Architecture**: Technical details on programs, accounts, and flows
4. **Token Economics**: How Cred and OXO work, value flows, staking mechanics
5. **Agent Ecosystem**: Personal agents, service agents, and interoperability
6. **Governance**: How protocol decisions are made

[Begin with The Problem →](problem/extraction.md)
