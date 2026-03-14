# Program IDs

Solana program addresses for Loop Protocol.

## Devnet

| Program | Address |
|---------|---------|
| loop_vault | `48uqsLFQnYiqdFHzeLbafXC6CxAtDvJrq1KRuQZFW2aD` |
| loop_cred | `2ePSx7NNti7faR9EADTDPEn1yZfMfgWr6frrAcd8a6iM` |
| loop_oxo | `3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z` |
| loop_vtp | `5xyyWo4v9tuwAYKuDgofGBi5AuUSDNVcH1EXKJCtUWRa` |
| loop_avp | `4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj` |
| loop_shopping | (deploying) |

## Mainnet (Q3 2026)

All addresses TBD pending security audit.

## Program Descriptions

**loop_vault**: User vaults, stacking, custody, optional inheritance.

**loop_cred**: Stable token mint, burn, transfer operations.

**loop_oxo**: Governance token, veOXO staking, fee distribution.

**loop_vtp**: Value transfers, escrow, streaming.

**loop_avp**: Agent registration, principal binding, capabilities.

**loop_shopping**: Shopping capture module.

## IDL Files

Download Interface Definition Language files:

```bash
curl -O https://raw.githubusercontent.com/southerncory/loop-protocol/main/target/idl/loop_vault.json
curl -O https://raw.githubusercontent.com/southerncory/loop-protocol/main/target/idl/loop_cred.json
# ... etc
```

## Verification

All programs are open source with verifiable builds:

```bash
anchor verify <PROGRAM_ID> --provider.cluster devnet
```

## Upgrades

Programs are upgradeable via governance:
1. Proposal with new binary
2. veOXO vote (7 days)
3. 48-hour timelock
4. Execution

Emergency upgrades require 66% supermajority and 6-hour timelock.

[Continue to: SDK Reference →](sdk.md)
