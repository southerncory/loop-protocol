# Loop Protocol — Security Architecture

**Version 1.0 — March 2026**

---

## Executive Summary

Loop Protocol enables AI agents to capture, compound, and transfer value on behalf of human principals. This creates a fundamental security challenge: agents must sign transactions autonomously while users retain true self-custody.

This document specifies Loop's security architecture, which ensures:

1. **Agent Autonomy** — Agents operate 24/7 without user intervention
2. **Self-Custody** — Users control their funds, not Loop
3. **Zero Trust** — Loop (the company) cannot access user funds, even if compromised
4. **Trustless Capture** — Value capture is cryptographically verified, not self-reported
5. **Graceful Recovery** — Users can recover access; heirs inherit automatically

---

## Threat Model

### Threats We Protect Against

| Threat | Mitigation |
|--------|------------|
| Loop company compromise | Zero-knowledge architecture — we never hold keys |
| Rogue agent behavior | Scoped session keys with on-chain spending limits |
| User device loss | Social recovery via guardians |
| User death | Heartbeat-triggered inheritance |
| Fraudulent capture claims | ZK-attestation of real-world activity |
| Key extraction attacks | TEE/Secure enclave isolation |
| Phishing/social engineering | Biometric-only auth, no seed phrases |

### Trust Assumptions

- Device secure elements (Apple/Google) are trustworthy
- AWS Nitro Enclaves provide valid attestations
- Solana validators execute programs correctly
- Cryptographic primitives (Ed25519, P-256, ZK-SNARKs) are sound

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER LAYER                                     │
│                                                                             │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │   Passkey       │    │   Hardware      │    │   Guardian      │        │
│   │   (Biometric)   │    │   Wallet        │    │   Network       │        │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘        │
│            │                      │                      │                  │
│            └──────────────────────┴──────────────────────┘                  │
│                                   │                                         │
│                                   ▼                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                           KEY MANAGEMENT LAYER                              │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                    MPC / TSS Infrastructure                      │      │
│   │                                                                  │      │
│   │   User Share          Agent Share          Backup Share         │      │
│   │   (Device SE)         (TEE Enclave)        (Guardian/Cloud)     │      │
│   │                                                                  │      │
│   │   ─────────────────────────────────────────────────────────     │      │
│   │   Threshold: 2-of-3 for high-value, 1-of-3 for daily ops        │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                                   │                                         │
│                                   ▼                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                         AGENT EXECUTION LAYER                               │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                   AWS Nitro Enclave (TEE)                        │      │
│   │                                                                  │      │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │      │
│   │   │  Capture    │  │  Stacking   │  │  Transfer   │            │      │
│   │   │  Agent      │  │  Agent      │  │  Agent      │            │      │
│   │   └─────────────┘  └─────────────┘  └─────────────┘            │      │
│   │                                                                  │      │
│   │   Cryptographic Attestation: Verifiable code integrity          │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                                   │                                         │
│                                   ▼                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                          POLICY ENFORCEMENT LAYER                           │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                    Squads Protocol v4                            │      │
│   │                                                                  │      │
│   │   • Spending limits per time period                             │      │
│   │   • Allowed instruction whitelist                               │      │
│   │   • Time-locks on sensitive operations                          │      │
│   │   • Multi-sig thresholds per action type                        │      │
│   │   • Emergency pause capability                                  │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                                   │                                         │
│                                   ▼                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                            SOLANA LAYER                                     │
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│   │ loop_vault  │  │ loop_cred   │  │  loop_oxo   │  │  loop_vtp   │      │
│   │             │  │             │  │             │  │             │      │
│   │ User PDAs   │  │ Stable      │  │ Governance  │  │ Transfers   │      │
│   │ Stacking    │  │ Token       │  │ veOXO       │  │ Escrow      │      │
│   │ Inheritance │  │ Mint/Burn   │  │ Bonding     │  │ Settlement  │      │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐                                         │
│   │  loop_avp   │  │loop_shopping│                                         │
│   │             │  │             │                                         │
│   │ Agent ID    │  │ Capture     │                                         │
│   │ Principal   │  │ Verification│                                         │
│   │ Binding     │  │ ZK Proofs   │                                         │
│   └─────────────┘  └─────────────┘                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Seedless Authentication (Passkeys)

**Problem:** Traditional seed phrases are insecure (phishing, loss, theft) and incompatible with AI agent autonomy.

**Solution:** WebAuthn/FIDO2 Passkeys with biometric binding.

**Implementation:**

```
User Registration Flow:
1. User taps "Create Vault" on Loop app
2. Device prompts for Face ID / Touch ID
3. Secure Element generates P-256 keypair
4. Public key registered with Para SDK
5. Para creates MPC-managed Ed25519 signer for Solana
6. User's vault PDA is derived and initialized

User never sees a seed phrase. Private key never leaves Secure Element.
```

**Technology Stack:**
- **Para SDK** (`@para-sdk/solana`) — Passkey → Solana bridge
- **Turnkey** — Alternative with deeper TEE integration
- **Solana secp256r1** — Native P-256 verification (since June 2025)

**Security Properties:**
- Biometric binding (face/fingerprint required)
- Hardware isolation (Secure Element / TPM)
- Phishing resistant (origin-bound credentials)
- No seed phrase exposure

---

### 2. MPC Key Management

**Problem:** Single private keys are single points of failure.

**Solution:** Threshold Signature Scheme (TSS) distributes key shares.

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    2-of-3 Threshold Scheme                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Share A              Share B              Share C             │
│   ────────             ────────             ────────            │
│   User Device          Agent TEE            Backup              │
│   (Secure Element)     (Nitro Enclave)      (Guardian/Cloud)   │
│                                                                 │
│   Weight: 1            Weight: 1            Weight: 1           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│   Signing Requirements:                                         │
│                                                                 │
│   • Daily captures: Share B alone (within policy limits)       │
│   • Large transfers: Share A + Share B                         │
│   • Recovery: Share A + Share C (or Share B + Share C)         │
│   • Key rotation: All 3 shares                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Technology Stack:**
- **Para / Dynamic** — TSS-MPC with GG18/FROST protocols
- **Portal SDK** — High-throughput 2-of-2 parallel TSS
- **Vultisig** — Open-source TSS vault

**Security Properties:**
- No complete private key ever exists
- Loop never possesses any share
- Signing in <100ms (no UX degradation)
- Threshold can be adjusted per-user

---

### 3. Trusted Execution Environment (TEE)

**Problem:** Agent code runs on Loop's infrastructure. Users must trust it won't be tampered with.

**Solution:** AWS Nitro Enclaves with cryptographic attestation.

**How It Works:**

```
1. Agent code is compiled into an Enclave Image File (EIF)
2. EIF hash is published and auditable
3. Enclave boots in isolated memory (no SSH, no admin access)
4. AWS KMS only releases keys if attestation matches expected hash
5. Users can verify: "This enclave runs exactly the audited code"
```

**Attestation Flow:**

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Enclave   │──────│  AWS KMS    │──────│   User      │
│   (Agent)   │      │             │      │  (Verify)   │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │
       │  1. Boot           │                    │
       ├───────────────────►│                    │
       │                    │                    │
       │  2. Attestation    │                    │
       │     document       │                    │
       │◄───────────────────┤                    │
       │                    │                    │
       │  3. Request key    │                    │
       │     (with attesta- │                    │
       │     tion proof)    │                    │
       ├───────────────────►│                    │
       │                    │                    │
       │  4. Key released   │                    │
       │     (only if hash  │                    │
       │     matches)       │                    │
       │◄───────────────────┤                    │
       │                    │                    │
       │                    │  5. Public          │
       │                    │     attestation     │
       │                    ├────────────────────►│
       │                    │     (verifiable)    │
```

**Technology Stack:**
- **AWS Nitro Enclaves** — Primary TEE infrastructure
- **Turnkey** — Managed Nitro integration
- **Sentient Framework** — Agent-specific TEE tooling

**Security Properties:**
- Memory isolation from host OS
- No persistent storage (stateless)
- Cryptographic proof of code integrity
- Admin cannot access enclave contents

---

### 4. Programmable Custody (Squads Protocol)

**Problem:** Agents need autonomy, but users need limits.

**Solution:** On-chain policy enforcement via Squads smart accounts.

**Policy Matrix:**

| Action | Agent Alone | Agent + User | User Alone | Time Lock |
|--------|-------------|--------------|------------|-----------|
| Capture rewards | ✓ | — | — | None |
| Stack Cred (<$1000) | ✓ | — | — | None |
| Stack Cred (>$1000) | — | ✓ | ✓ | None |
| Transfer within Loop | ✓ (daily limit) | ✓ | ✓ | None |
| Extract to fiat | — | ✓ | ✓ | 24 hours |
| Change heir | — | — | ✓ | 48 hours |
| Add guardian | — | — | ✓ | 24 hours |
| Remove guardian | — | — | ✓ | 72 hours |
| Emergency pause | — | — | ✓ | Immediate |

**Implementation:**

```typescript
// Squads policy configuration for Loop vault
const loopVaultPolicy = {
  members: [
    { pubkey: userPasskey, weight: 2, role: "owner" },
    { pubkey: agentSessionKey, weight: 1, role: "agent" },
  ],
  
  thresholds: {
    "capture_value": 1,      // Agent alone
    "stack_cred": 1,          // Agent alone (within limit)
    "transfer_internal": 1,   // Agent alone (within daily limit)
    "transfer_external": 2,   // Requires user
    "extract_fiat": 2,        // Requires user + timelock
    "change_settings": 2,     // Requires user
  },
  
  limits: {
    dailyTransferLimit: 1000_000000,  // 1000 Cred
    singleTxLimit: 500_000000,         // 500 Cred
    stackingAutoApprove: 1000_000000, // 1000 Cred
  },
  
  timelocks: {
    extract: 86400,          // 24 hours
    changeHeir: 172800,      // 48 hours
    removeGuardian: 259200,  // 72 hours
  }
};
```

**Technology Stack:**
- **Squads Protocol v4** — Primary policy engine
- **Custom PDA logic** — In loop_vault program
- **Session keys** — Scoped, expiring agent credentials

---

### 5. Trustless Capture Verification (ZK-Attestations)

**Problem:** Agents self-report value captures. How do we know they're real?

**Solution:** Zero-knowledge proofs of real-world activity.

**How It Works:**

```
Traditional (Trusted):
  Agent says: "User spent $50 at Amazon"
  Protocol: "OK, here's 2 Cred"
  Risk: Agent could lie

ZK-Attested (Trustless):
  1. User's browser captures TLS session with Amazon
  2. TLSNotary creates proof of checkout without revealing details
  3. Agent submits ZK proof to loop_shopping program
  4. Program verifies proof, mints Cred
  Risk: None — cryptographic guarantee of purchase
```

**Architecture:**

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Amazon.com │◄────►│  User       │◄────►│  Reclaim /  │
│  (Merchant) │ TLS  │  Browser    │      │  TLSNotary  │
└─────────────┘      └─────────────┘      └─────────────┘
                            │                    │
                            │                    │
                            ▼                    ▼
                     ┌─────────────┐      ┌─────────────┐
                     │  Loop       │◄─────│  ZK Proof   │
                     │  Agent      │      │  Generator  │
                     └─────────────┘      └─────────────┘
                            │
                            │ Submit proof
                            ▼
                     ┌─────────────┐
                     │loop_shopping│
                     │  Program    │
                     │             │
                     │ Verify ZK   │
                     │ Mint Cred   │
                     └─────────────┘
```

**Technology Stack:**
- **Reclaim Protocol** — ZK proofs of web activity
- **TLSNotary** — Notarized TLS sessions
- **Groth16 / PLONK** — ZK-SNARK verification on-chain

**Security Properties:**
- Captures are cryptographically verified
- No trust in agent reporting
- Privacy-preserving (only proves purchase, not details)
- Merchant cannot be spoofed

---

### 6. Agent Identity (Solana Agent Registry)

**Problem:** How do users know an agent is legitimate?

**Solution:** On-chain agent identity with reputation tracking.

**Implementation:**

```
Agent Registration:
1. Loop registers each agent type in Solana Agent Registry (ERC-8004)
2. Agent receives NFT identity with:
   - Creator signature (Loop)
   - Capability declarations
   - Audit attestations
   - Reputation score
3. Users can verify agent before granting authority

On-Chain Identity:
┌─────────────────────────────────────────────────────────────┐
│  Agent: Loop Shopping Capture v2.1                          │
│  ─────────────────────────────────────────────────────────  │
│  Creator: Loop Protocol (verified)                          │
│  Capabilities: capture_shopping, read_vault, write_vault   │
│  Audit: OtterSec (2026-02-15)                               │
│  Reputation: 98.7% (12,847 successful captures)             │
│  Registry: ERC-8004 Compatible                              │
└─────────────────────────────────────────────────────────────┘
```

**Technology Stack:**
- **Solana Agent Registry** — Native ERC-8004 implementation
- **Metaplex** — NFT identity tokens
- **Custom reputation** — In loop_avp program

---

### 7. Recovery & Inheritance

**Problem:** Users lose devices. Users die. Funds must not be lost.

**Solution:** Multi-layer recovery with automatic inheritance.

**Recovery Mechanisms:**

```
┌─────────────────────────────────────────────────────────────┐
│                    RECOVERY HIERARCHY                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Level 1: Device Recovery                                   │
│  ─────────────────────────                                  │
│  • iCloud/Google passkey sync                               │
│  • Automatic across user's devices                          │
│  • No action required                                       │
│                                                              │
│  Level 2: Social Recovery                                   │
│  ─────────────────────────                                  │
│  • 3-of-5 guardians can restore access                     │
│  • Guardians are friends/family with passkeys              │
│  • 7-day timelock (prevents collusion attacks)             │
│                                                              │
│  Level 3: Inheritance                                        │
│  ─────────────────────────                                  │
│  • Heartbeat monitor (user signs tx every 90 days)         │
│  • If heartbeat fails → 180-day countdown                  │
│  • After countdown → vault transfers to heir               │
│  • Heir is pre-designated PDA                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Inheritance Flow:**

```
Normal Operation:
  User signs any tx → heartbeat resets → 90 days until next check

Heartbeat Missed:
  Day 0:   Last user transaction
  Day 90:  Heartbeat check fails
  Day 91:  Notification sent to user (all channels)
  Day 120: Second notification + guardian alert
  Day 180: Warning: inheritance imminent
  Day 270: execute_inheritance() becomes callable
  Day 271: Heir (or anyone) calls execute_inheritance()
  Day 271: Vault contents transfer to heir's PDA
```

**Technology Stack:**
- **Squads guardians** — Social recovery infrastructure
- **loop_vault heartbeat** — Custom program logic
- **Notification oracles** — Multi-channel alerts

---

## Security Guarantees

### What Loop (the company) CANNOT do:

| Action | Why We Can't |
|--------|--------------|
| Access user funds | We hold zero key shares; MPC is 2-of-3 without us |
| Move user Cred | Signing requires user's passkey or guardian threshold |
| Fake captures | ZK proofs verify real activity; we can't forge proofs |
| Change user settings | Requires user signature + timelock |
| Prevent extraction | User can always exit; we have no veto |
| Access enclave keys | TEE attestation enforced; no admin access |
| Modify agent code silently | Attestation hash is public; changes are visible |

### What Users CAN always do:

| Action | How |
|--------|-----|
| View vault balance | Public on-chain data |
| Pause agent | Single signature, immediate effect |
| Revoke agent | Single signature, immediate effect |
| Extract all funds | Single signature + 24hr timelock |
| Change heir | Single signature + 48hr timelock |
| Recover via guardians | 3-of-5 guardian signatures + 7-day timelock |
| Verify agent code | Check attestation hash against published audit |

---

## Audit & Compliance

### Planned Audits

| Component | Auditor | Status |
|-----------|---------|--------|
| Solana programs (6) | OtterSec | Planned Q2 2026 |
| MPC integration | Trail of Bits | Planned Q2 2026 |
| TEE implementation | NCC Group | Planned Q2 2026 |
| ZK circuits | Veridise | Planned Q3 2026 |

### Open Source Commitments

- All Solana programs: Open source (MIT license)
- SDK: Open source (MIT license)
- TEE enclave code: Published for verification
- Attestation hashes: On-chain and verifiable

---

## Implementation Roadmap

### Phase 1: Foundation (Current)
- [x] Core programs deployed to devnet
- [x] Basic vault + capture flow
- [ ] Para SDK integration
- [ ] Squads policy engine

### Phase 2: Security Hardening (Q2 2026)
- [ ] Nitro Enclave deployment
- [ ] MPC key management
- [ ] ZK capture verification
- [ ] Security audits

### Phase 3: Production (Q3 2026)
- [ ] Mainnet deployment
- [ ] Full recovery system
- [ ] Agent registry integration
- [ ] Public launch

---

## Conclusion

Loop Protocol's security architecture ensures that AI agents can operate autonomously while users retain true self-custody. Through the combination of:

- **Passkeys** — No seed phrases, biometric binding
- **MPC** — No single point of failure
- **TEE** — Verifiable agent execution
- **Squads** — Programmable on-chain policies
- **ZK proofs** — Trustless capture verification
- **Social recovery** — No funds lost to device loss
- **Automatic inheritance** — No funds lost to death

We achieve the seemingly impossible: **autonomous agents that cannot rug their users**.

This is the security standard for the agentic economy.

---

*Document version: 1.0*  
*Last updated: March 2026*  
*Authors: Loop Protocol Team*
