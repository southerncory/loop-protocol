# Security Model

Loop Protocol's security approach prioritizes transparency and continuous verification over checkbox audits.

## Code Security

### Automated Checks

Every code change runs through:

| Check | Tool | Purpose |
|-------|------|---------|
| Static analysis | Clippy + custom lints | Catch common bugs |
| Overflow detection | checked_* arithmetic | Prevent math errors |
| Access control | Anchor constraints | Enforce permissions |
| Fuzzing | cargo-fuzz | Find edge cases |
| Test coverage | cargo-tarpaulin | Ensure paths tested |

### Design Principles

**1. Minimal Authority**
- Each instruction does one thing
- Accounts have minimum required permissions
- PDAs constrain what can be modified

**2. Explicit Over Implicit**
- All state changes require explicit transactions
- No hidden admin functions
- No upgradeable proxies

**3. Fail Secure**
- Invalid inputs rejected (not sanitized)
- Arithmetic errors halt execution
- Missing accounts fail transaction

### Known Limitations

We document what the protocol cannot protect against:

| Risk | Mitigation | Residual Risk |
|------|------------|---------------|
| Private key compromise | User responsibility | High if key leaked |
| Frontend attacks | Open source, verify TX | Medium |
| Oracle manipulation | Multiple sources | Low |
| Solana downtime | Wait for recovery | Low |

## Audit Philosophy

### What Traditional Audits Provide

1. **Legal liability** - You can sue if they miss something
2. **Brand credibility** - "Audited by X" is a trust signal
3. **Fresh perspective** - Auditors haven't seen code evolve
4. **Regulatory checkbox** - Some jurisdictions require it

### What Traditional Audits Don't Provide

1. **Ongoing security** - Point-in-time snapshot only
2. **Guaranteed safety** - Audited protocols get hacked regularly
3. **Understanding** - Auditors don't know intent as well as builders
4. **Fast iteration** - Re-audits take weeks and cost $50-200k

### Our Approach

**Continuous Security** over point-in-time audits:

```
Every Commit:
  → Static analysis
  → Full test suite
  → Fuzzing (nightly)
  → Human review

Every Release:
  → Full code walkthrough
  → Threat modeling
  → Invariant verification
  → Public review period
```

**Open Source Everything:**
- All program code on GitHub
- All tests public
- Build from source instructions
- Deterministic builds (verify deployed = source)

**Bug Bounty Program:**
- Critical: Up to $100,000
- High: Up to $25,000
- Medium: Up to $5,000
- Low: Up to $1,000

### Third-Party Reviews

We will engage external reviewers for:

1. **Mainnet launch** - Full protocol review
2. **Major upgrades** - Changed components only
3. **New modules** - Before activation

These serve as additional perspectives, not security guarantees.

## Incident Response

### Severity Levels

| Level | Definition | Response Time |
|-------|------------|---------------|
| Critical | Funds at immediate risk | Minutes |
| High | Exploit possible with effort | Hours |
| Medium | Edge case vulnerability | Days |
| Low | Theoretical issue | Next release |

### Response Process

**Critical (Funds at Risk):**
1. Emergency pause (multisig, 2/3 required)
2. Assess scope
3. Deploy fix
4. Post-mortem within 72 hours

**High/Medium:**
1. Verify report
2. Develop fix
3. Test thoroughly
4. Deploy with governance (unless emergency)

### Communication

- Security issues: security@looplocal.io
- Public disclosure: After fix deployed + 7 days
- Post-mortems: Published for all incidents

## Verification

### For Users

Verify you're interacting with real Loop:

**Program IDs (Mainnet):**
```
loop_vault:    [TBD at mainnet]
loop_cred:     [TBD at mainnet]
loop_oxo:      [TBD at mainnet]
loop_vtp:      [TBD at mainnet]
loop_avp:      [TBD at mainnet]
```

**Official Domains:**
- App: app.looplocal.io
- Docs: docs.looplocal.io
- API: api.looplocal.io

### For Developers

Build and verify yourself:

```bash
git clone https://github.com/loop-protocol/loop
cd loop
anchor build
# Compare target/deploy/*.so hashes to deployed programs
```

## Responsible Disclosure

If you find a vulnerability:

1. **Don't exploit it**
2. **Don't disclose publicly**
3. Email security@looplocal.io with:
   - Description of issue
   - Steps to reproduce
   - Potential impact
4. We'll respond within 24 hours
5. Bounty paid after fix deployed

[Continue to: Decentralization →](decentralization.md)
