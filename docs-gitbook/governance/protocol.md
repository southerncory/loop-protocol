# Protocol Governance

How Loop Protocol is governed by veOXO holders.

## Model

Loop uses vote-escrow governance:
- Lock OXO to get veOXO
- veOXO equals voting power
- Longer locks mean more power
- Power decays toward unlock

This aligns governance with long-term thinking.

## What Governance Controls

### Parameters

| Parameter | Description |
|-----------|-------------|
| Capture rates | User/protocol/staker split |
| Stacking yields | APY by duration |
| Extraction fee | Fee to exit |
| Agent creation fee | OXO burned |
| Stake minimums | Service agent requirements |

### Treasury

- Grant allocation
- Strategic investments
- Buyback decisions

### Development

- Program upgrades
- New module approval
- Partnership decisions
- Emergency actions

## Proposal Process

1. **Discussion**: Community debate (off-chain)
2. **Proposal**: Requires 0.1% of OXO supply in veOXO
3. **Voting**: 7 days, 25% quorum, simple majority
4. **Timelock**: 48 hours before execution
5. **Execution**: Proposal actions enacted

## Voting Power

```
votingPower = veOXO balance at proposal snapshot
```

Delegation is supported for passive holders.

## Proposal Types

| Type | Voting | Timelock | Threshold |
|------|--------|----------|-----------|
| Standard | 7 days | 48 hours | 50% |
| Emergency | 24 hours | 6 hours | 66% |
| Constitutional | 14 days | 7 days | 75% |

## Guardian System

A 4-of-7 multisig can:
- Pause contracts (emergency)
- Cancel malicious proposals
- Execute emergency fixes

Cannot:
- Drain funds
- Change parameters
- Override valid governance

[Continue to: Decentralization →](decentralization.md)
