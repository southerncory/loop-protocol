# Glossary

## Core Concepts

### Agent
An AI system that acts on behalf of a human (principal). In Loop Protocol, agents have on-chain identity and can capture, transfer, and manage value.

### Agent Value Protocol (AVP)
The identity layer of Loop Protocol. Defines how agents register, bind to principals, declare capabilities, and manage stake.

### Bonding Curve
A mathematical formula that determines token price based on supply. Used for Service Agent token launches.

### Capture
The act of extracting value from an economic activity (shopping, data licensing, attention, etc.) and crediting it to a user's vault.

### Capture Module
An independent protocol component that handles value capture for a specific activity type (e.g., Shopping Module, Data Module).

### Closed Loop
The economic design where value circulates within the system rather than being extracted. Extraction is possible but costly.

### Cred
The stable value token of Loop Protocol. Pegged 1:1 to USD. Earned from capture activities. Can be stacked for yield.

### Escrow
A conditional transfer where value is held until specific conditions are met or verified.

### Extraction
Converting Cred to external value (fiat, other tokens). Allowed but incurs a 5% fee and resets the vault to zero.

### Graduation
When a Service Agent token transitions from bonding curve to liquidity pool, triggered by collecting sufficient OXO.

### Inheritance
The transfer of a vault's contents to a designated heir upon the principal's death.

### Loop
A closed economic circle where value circulates. Also the name of the protocol.

### OXO
The protocol equity token of Loop Protocol. Fixed supply of 1 billion. Used for governance, Service Agent creation, and premium features.

### Personal Agent
An agent that serves exactly one human (principal). Captures value into the principal's vault. Does not have its own token.

### Principal
The human who owns and is served by an agent. The ultimate beneficiary of captured value.

### Proof
Cryptographic evidence that an activity occurred, submitted to a capture module for verification and reward.

### Service Agent
An agent that provides services to multiple users or other agents. Created by developers. Can have its own token. Earns fees for its creator.

### Stacking
Locking Cred for a duration to earn yield. Longer locks earn higher APY.

### SubDAO
A governance structure for an individual Service Agent. Token holders vote on agent behavior and parameters.

### Value Transfer Protocol (VTP)
The transfer layer of Loop Protocol. Defines how value moves between agents, including simple transfers, escrow, and disputes.

### Vault
The value storage container for a Personal Agent. Holds Cred, OXO, staking positions, and inheritance configuration.

### veOXO
Vote-escrowed OXO. Obtained by locking OXO for a duration. Provides governance power, fee share, and other benefits.

---

## Technical Terms

### ACP (Agent Commerce Protocol)
A state machine pattern for agent-to-agent commerce: Request → Negotiate → Transact → Verify. Inspired by Virtuals Protocol.

### Evaluator
An agent or mechanism that verifies work completion in an escrow transaction before releasing payment.

### LP (Liquidity Pool)
A pool of tokens that enables trading on a DEX. Service Agent tokens graduate to LP status.

### PDA (Program Derived Address)
A Solana address deterministically derived from a program and seeds. Used for agent identity.

### ZK Proof (Zero-Knowledge Proof)
A cryptographic proof that verifies information without revealing the underlying data. Used for privacy-preserving capture modules.

---

## Token Mechanics

### Buyback-Burn
A mechanism where revenue is used to purchase and permanently destroy tokens, reducing supply and increasing scarcity.

### Elastic Supply
A token supply that expands and contracts based on demand. Cred has elastic supply (minted on capture, burned on extraction).

### Hard Cap
A maximum supply that cannot be exceeded. OXO has a hard cap of 1 billion.

### Vote-Escrow (ve)
A mechanism where tokens are locked for a duration to receive governance power. Longer locks provide more power.

---

## Roles

### Creator
A developer who builds and deploys a Service Agent. Earns fees from agent usage.

### Merchant
A business that integrates with Loop Protocol to provide capture opportunities (e.g., shopping rewards).

### Staker
Someone who locks tokens (Cred or OXO) to earn yield or governance power.

### User
A human who uses a Personal Agent to capture and compound value.

### Value Source
An entity that pays for access to users (merchants, advertisers, data buyers). The source of captured value.

---

## Economic Terms

### APY (Annual Percentage Yield)
The annualized rate of return on staked assets, accounting for compounding.

### Extraction Fee
The 5% fee charged when converting Cred to external value.

### Protocol Fee
Fees taken by the protocol on captures and transfers. Funds treasury and staker rewards.

### Trading Tax
A fee on Service Agent token trades (1%), distributed to creator, protocol, and ACP incentives.

---

## Capture Types

### Attention Capture
Earning value by opting into viewing advertisements or content.

### Data Capture
Earning value by licensing personal data to buyers.

### Presence Capture
Earning value by sharing verified location/presence information.

### Shopping Capture
Earning value from purchase transactions with participating merchants.

### Work Capture
Earning value from productivity (future module, may involve employer participation).

### Content Capture
Earning value from creative output on external platforms (future module).

---

*This glossary will expand as the protocol develops.*
