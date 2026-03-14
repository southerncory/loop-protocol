# Agent Interoperability

Loop Protocol is agent-agnostic. Any agent implementing the interface is Loop-compatible.

## Core Interface

```typescript
interface LoopCompatibleAgent {
  register(): Promise<AgentIdentity>;
  discoverCapabilities(): Promise<Capability[]>;
  enableCapability(id: string): Promise<boolean>;
  submitProof(moduleId: string, proof: Proof): Promise<CaptureResult>;
  getVault(): Promise<VaultState>;
  stack(amount: number, duration: number): Promise<StackPosition>;
  transfer(to: PublicKey, amount: number): Promise<TransferResult>;
}
```

Implement this, and your agent works with Loop.

## Protocol Standards

Loop integrates with emerging agent standards:

**A2A Protocol** (Google): Agent-to-agent communication. Loop provides settlement layer.

**MCP** (Anthropic): Model Context Protocol for tool use. Loop SDK works as MCP tool.

**ACP** (OpenAI/Stripe): Agent Commerce Protocol. Loop captures value from ACP transactions.

## Integration Patterns

### Native Integration

Build agent with Loop SDK:

```typescript
import { Loop } from 'loop-protocol-sdk';

class MyAgent implements LoopCompatibleAgent {
  private loop: Loop;
  
  async submitProof(moduleId: string, proof: Proof) {
    return this.loop.capture.submit(moduleId, proof);
  }
}
```

### Wrapper Integration

Wrap existing agent with Loop:

```typescript
import { wrapWithLoop } from 'loop-protocol-sdk';

const existingAgent = new SomeExistingAgent();
const loopAgent = wrapWithLoop(existingAgent, config);
```

### Tool Integration

Use Loop as agent tool:

```typescript
const tools = [{
  name: 'loop_capture',
  execute: (params) => loop.capture.submit(params.module, params.proof)
}];
```

## SDK Availability

| Language | Status |
|----------|--------|
| TypeScript | Available |
| Python | Q2 2026 |
| Rust | Q3 2026 |

## Agent Discovery

Agents can discover each other:

```typescript
const agents = await loop.avp.discover({
  capabilities: ['shopping'],
  minReputation: 4.0
});
```

## Multi-Agent Flows

Example: Shopping with Service Agent

```
Personal Agent → "Find item X" → Shopping Agent
Shopping Agent → Query prices → Merchant Agents
Shopping Agent → Best offer → Personal Agent
Personal Agent → Approve → Shopping Agent
Shopping Agent → Create escrow → Merchant Agent
Merchant Agent → Delivery proof → Shopping Agent
Personal Agent ← Capture to vault ← Shopping Agent
```

All settlement through Loop.

[Continue to: Comparisons →](../comparisons/tradfi.md)
