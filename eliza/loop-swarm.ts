/**
 * Loop Protocol - elizaOS Multi-Agent Swarm
 * 
 * Shopping Agent + Wealth Optimizer coordinating via elizaOS runtime.
 * Shopping captures value → event fires → Wealth Optimizer auto-stacks.
 * 
 * Run: elizaos start --config loop-swarm.config.ts
 */

import { Keypair, PublicKey } from '@solana/web3.js';

// Import Loop SDK (simplified interface)
// In production: import { LoopSDK, CaptureType } from '@loop-protocol/sdk/simple';

// ============================================================================
// MOCK TYPES (elizaOS types - would come from @elizaos/core)
// ============================================================================

interface Runtime {
  getSetting: (key: string) => any;
  emit: (event: string, data: any) => void;
}

interface Message {
  content: any;
}

interface State {
  [key: string]: any;
}

interface Action {
  name: string;
  description: string;
  handler: (runtime: Runtime, message: Message, state: State) => Promise<string>;
}

interface Plugin {
  name: string;
  actions: Action[];
}

interface AgentConfig {
  name: string;
  plugins: Plugin[];
  character: { role: string; goal: string };
}

interface SwarmConfig {
  name: string;
  agents: AgentConfig[];
  coordinator: {
    onEvent: (event: { type: string; data: any }) => Promise<void>;
  };
}

// ============================================================================
// MOCK LOOP SDK (for demo - replace with real import)
// ============================================================================

enum CaptureType {
  Shopping = 0,
  Data = 1,
  Presence = 2,
  Attention = 3,
}

class MockLoopSDK {
  private vaultBalance = 0;

  constructor(config: { rpc: string; wallet: Keypair }) {
    console.log(`[LoopSDK] Initialized with RPC: ${config.rpc}`);
  }

  async getVaultBalance(): Promise<number> {
    return this.vaultBalance;
  }

  async getOrCreateVault(address?: PublicKey): Promise<{ address: PublicKey }> {
    return { address: address || Keypair.generate().publicKey };
  }

  async capture(params: {
    vault: PublicKey;
    amount: number;
    captureType: CaptureType;
    source: string;
    metadata?: any;
  }): Promise<string> {
    console.log(`[LoopSDK] Capture: ${params.amount} Cred from ${params.source}`);
    this.vaultBalance += params.amount;
    return `capture_${Date.now()}`;
  }

  async stack(params: { amount: number; durationDays: number }): Promise<string> {
    console.log(`[LoopSDK] Stack: ${params.amount} Cred for ${params.durationDays} days`);
    this.vaultBalance -= params.amount;
    return `stack_${Date.now()}`;
  }

  async createEscrow(params: {
    recipient: PublicKey;
    amount: number;
    conditions: any[];
    expiry: number;
  }): Promise<string> {
    console.log(`[LoopSDK] Escrow: ${params.amount} Cred to ${params.recipient.toBase58()}`);
    return `escrow_${Date.now()}`;
  }
}

// ============================================================================
// SWARM CONFIGURATION
// ============================================================================

// User wallet (in production, loaded from secure storage)
const userWallet = Keypair.generate();

// Initialize Loop SDK
const loop = new MockLoopSDK({ 
  rpc: process.env.SOLANA_RPC || 'http://localhost:8899', 
  wallet: userWallet 
});

// Event bus for swarm coordination
const eventBus: { type: string; data: any }[] = [];

function emitSwarmEvent(type: string, data: any) {
  eventBus.push({ type, data });
  console.log(`[Swarm] Event emitted: ${type}`);
}

// ============================================================================
// LOOP PLUGIN - Shared by all agents
// ============================================================================

const loopPlugin: Plugin = {
  name: 'loop-protocol',
  actions: [
    // ─────────────────────────────────────────────────────────────────────
    // Shopping Capture Action
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'LOOP_SHOPPING_CAPTURE',
      description: 'Negotiate purchase via A2A/UCP then capture value into user vault',
      async handler(runtime: Runtime, message: Message, state: State): Promise<string> {
        const merchantUrl = message.content.merchantAgentUrl || 'http://localhost:8080';
        const items = message.content.items || [{ name: 'Demo Item', price: 25 }];
        const maxAmount = message.content.maxAmount || 100;

        console.log(`[ShoppingAgent] Starting A2A negotiation with ${merchantUrl}`);

        // 1. Fetch merchant agent card (A2A discovery)
        let agentCard: any;
        try {
          const response = await fetch(`${merchantUrl}/.well-known/agent.json`);
          agentCard = await response.json() as any;
          console.log(`[ShoppingAgent] Found merchant: ${agentCard.name}`);
        } catch (e) {
          return `Failed to discover merchant at ${merchantUrl}`;
        }

        // 2. Send task for negotiation (A2A)
        let taskResult: any;
        try {
          const response = await fetch(`${merchantUrl}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              goal: 'negotiate_and_purchase',
              params: { items, maxAmount, preferredRail: 'solana-pay' }
            })
          });
          taskResult = await response.json() as any;
          console.log(`[ShoppingAgent] Negotiation result:`, taskResult);
        } catch (e) {
          return `Negotiation failed: ${e}`;
        }

        if (taskResult.status !== 'completed') {
          return `Merchant rejected: ${taskResult.reason || 'Unknown reason'}`;
        }

        // 3. Extract UCP artifact
        const artifact = taskResult.artifact;

        // 4. Capture reward into vault
        const vault = await loop.getOrCreateVault();
        await loop.capture({
          vault: vault.address,
          amount: artifact.rewardAmount,
          captureType: CaptureType.Shopping,
          source: artifact.transactionId,
          metadata: { a2aTaskId: artifact.metadata.a2aTaskId }
        });

        // 5. Create escrow for purchase (if needed)
        if (artifact.conditions && artifact.conditions.length > 0) {
          await loop.createEscrow({
            recipient: Keypair.generate().publicKey, // merchant vault
            amount: artifact.total,
            conditions: artifact.conditions,
            expiry: artifact.expiry
          });
        }

        // 6. Emit event for swarm coordination
        emitSwarmEvent('capture_completed', {
          amount: artifact.rewardAmount,
          source: artifact.transactionId,
          timestamp: Date.now()
        });

        return `Captured ${artifact.rewardAmount / 1_000_000} Cred into vault. Escrow live for $${artifact.total / 1_000_000}.`;
      }
    },

    // ─────────────────────────────────────────────────────────────────────
    // Wealth Optimizer Action
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'LOOP_AUTO_STACK',
      description: 'Detect idle balance and stack for yield',
      async handler(runtime: Runtime, message: Message, state: State): Promise<string> {
        const vaultBalance = await loop.getVaultBalance();
        const threshold = 1_000_000; // 1 Cred minimum to stack

        console.log(`[WealthOptimizer] Checking vault balance: ${vaultBalance / 1_000_000} Cred`);

        if (vaultBalance < threshold) {
          return `Balance ${vaultBalance / 1_000_000} Cred below threshold. Waiting for more captures.`;
        }

        // Stack 80% of balance, keep 20% liquid
        const stackAmount = Math.floor(vaultBalance * 0.8);
        const durationDays = 90; // Default to 90 days for 15% APY

        await loop.stack({ amount: stackAmount, durationDays });

        const apy = durationDays >= 90 ? 15 : durationDays >= 30 ? 10 : 5;
        
        return `Auto-stacked ${stackAmount / 1_000_000} Cred @ ${apy}% APY. Shopping agent just fed me fresh rewards.`;
      }
    },

    // ─────────────────────────────────────────────────────────────────────
    // Manual Stack Action (user-triggered)
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'LOOP_STACK',
      description: 'Manually stack a specific amount for yield',
      async handler(runtime: Runtime, message: Message, state: State): Promise<string> {
        const amount = message.content.amount || 0;
        const durationDays = message.content.durationDays || 30;

        if (amount <= 0) {
          return 'Please specify an amount to stack.';
        }

        const vaultBalance = await loop.getVaultBalance();
        if (vaultBalance < amount) {
          return `Insufficient balance. Have ${vaultBalance / 1_000_000} Cred, need ${amount / 1_000_000} Cred.`;
        }

        await loop.stack({ amount, durationDays });

        const apy = durationDays >= 365 ? 20 : durationDays >= 180 ? 18 : durationDays >= 90 ? 15 : durationDays >= 30 ? 10 : 5;

        return `Stacked ${amount / 1_000_000} Cred for ${durationDays} days @ ${apy}% APY.`;
      }
    },

    // ─────────────────────────────────────────────────────────────────────
    // Vault Status Action
    // ─────────────────────────────────────────────────────────────────────
    {
      name: 'LOOP_VAULT_STATUS',
      description: 'Get current vault balance and status',
      async handler(runtime: Runtime, message: Message, state: State): Promise<string> {
        const balance = await loop.getVaultBalance();
        return `Vault balance: ${balance / 1_000_000} Cred (liquid)`;
      }
    }
  ]
};

// ============================================================================
// AGENT DEFINITIONS
// ============================================================================

const shoppingAgent: AgentConfig = {
  name: "ShoppingCaptureAgent",
  plugins: [loopPlugin],
  character: {
    role: "shopping-capture",
    goal: "negotiate purchases via A2A/UCP and capture rewards into user vault"
  }
};

const wealthOptimizerAgent: AgentConfig = {
  name: "WealthOptimizerAgent",
  plugins: [loopPlugin],
  character: {
    role: "wealth-optimizer",
    goal: "monitor vault and auto-compound idle balances for maximum yield"
  }
};

// ============================================================================
// SWARM CONFIGURATION
// ============================================================================

const swarm: SwarmConfig = {
  name: "Loop Personal Economy Swarm",
  agents: [shoppingAgent, wealthOptimizerAgent],
  coordinator: {
    // Swarm coordination logic
    async onEvent(event: { type: string; data: any }) {
      console.log(`[Swarm Coordinator] Received event: ${event.type}`);

      if (event.type === 'capture_completed') {
        console.log(`[Swarm Coordinator] Capture completed, triggering Wealth Optimizer...`);
        
        // Trigger Wealth Optimizer to check and auto-stack
        const mockRuntime: Runtime = {
          getSetting: () => null,
          emit: () => {}
        };
        const mockMessage: Message = { content: {} };
        
        const action = loopPlugin.actions.find(a => a.name === 'LOOP_AUTO_STACK');
        if (action) {
          const result = await action.handler(mockRuntime, mockMessage, {});
          console.log(`[Swarm Coordinator] Wealth Optimizer result: ${result}`);
        }
      }
    }
  }
};

// ============================================================================
// DEMO: Run the swarm
// ============================================================================

async function runDemo() {
  console.log('');
  console.log('🤖 Loop Personal Economy Swarm Starting...');
  console.log('');
  console.log(`   Agents: ${swarm.agents.map(a => a.name).join(', ')}`);
  console.log(`   RPC: ${process.env.SOLANA_RPC || 'http://localhost:8899'}`);
  console.log('');

  // Simulate a shopping capture
  const mockRuntime: Runtime = {
    getSetting: () => null,
    emit: emitSwarmEvent
  };

  const mockMessage: Message = {
    content: {
      merchantAgentUrl: 'http://localhost:8080',
      items: [{ name: 'Test Product', price: 49.99 }],
      maxAmount: 60
    }
  };

  // Run shopping capture
  console.log('─'.repeat(60));
  console.log('[Demo] Simulating shopping capture...');
  console.log('─'.repeat(60));
  
  const shoppingAction = loopPlugin.actions.find(a => a.name === 'LOOP_SHOPPING_CAPTURE');
  if (shoppingAction) {
    try {
      const result = await shoppingAction.handler(mockRuntime, mockMessage, {});
      console.log(`[Demo] Shopping result: ${result}`);
    } catch (e) {
      console.log(`[Demo] Shopping failed (merchant may not be running): ${e}`);
      
      // Simulate capture anyway for demo
      console.log('[Demo] Simulating capture for demo purposes...');
      await loop.capture({
        vault: (await loop.getOrCreateVault()).address,
        amount: 2_500_000, // 2.5 Cred
        captureType: CaptureType.Shopping,
        source: 'demo_transaction',
        metadata: { demo: true }
      });
      emitSwarmEvent('capture_completed', { amount: 2_500_000 });
    }
  }

  // Process events (swarm coordination)
  console.log('');
  console.log('─'.repeat(60));
  console.log('[Demo] Processing swarm events...');
  console.log('─'.repeat(60));
  
  for (const event of eventBus) {
    await swarm.coordinator.onEvent(event);
  }

  // Final status
  console.log('');
  console.log('─'.repeat(60));
  console.log('[Demo] Final vault status:');
  console.log('─'.repeat(60));
  
  const statusAction = loopPlugin.actions.find(a => a.name === 'LOOP_VAULT_STATUS');
  if (statusAction) {
    const status = await statusAction.handler(mockRuntime, { content: {} }, {});
    console.log(status);
  }

  console.log('');
  console.log('✅ Swarm demo complete!');
  console.log('');
}

// Run if executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

export { swarm, loopPlugin, shoppingAgent, wealthOptimizerAgent };
export default swarm;
