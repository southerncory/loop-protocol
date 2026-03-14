/**
 * Loop Protocol - Merchant A2A/UCP Agent
 * 
 * Receives negotiation requests from buyer agents (elizaOS Shopping Agent)
 * and returns UCP artifacts for Loop escrow settlement.
 * 
 * Run: ts-node merchant-agent.ts
 * Deploy: Fly.io, Cloud Run, or any Node.js host
 */

import express from 'express';

// Types (would come from @a2a-js/sdk and @ucp-dev/sdk in production)
interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  protocolVersion: string;
  capabilities: { streaming: boolean; negotiation: boolean };
  skills: { id: string; name: string; description: string; tags: string[] }[];
}

interface Task {
  id: string;
  goal: string;
  params: any;
}

enum TaskStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

interface UCPArtifact {
  type: string;
  total: number;
  rewardAmount: number;
  transactionId: string;
  conditions: { type: string; timestamp?: number; arbiter?: string }[];
  expiry: number;
  metadata: Record<string, any>;
}

// ============================================================================
// MERCHANT AGENT CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 8080;

const merchantCard: AgentCard = {
  name: "LoopMerchantDemo",
  description: "Demo merchant accepting Loop agents via A2A + UCP",
  url: `http://localhost:${PORT}`,
  version: "1.0.0",
  protocolVersion: "0.3.0",
  capabilities: { streaming: true, negotiation: true },
  skills: [
    {
      id: "negotiate_purchase",
      name: "Dynamic Pricing & Checkout",
      description: "Negotiate price, apply Loop rewards, return UCP artifact",
      tags: ["ucp:checkout", "a2a:commerce"]
    }
  ]
};

// Simple in-memory task store (use Redis in production)
const tasks = new Map<string, { task: Task; artifact?: UCPArtifact; status: TaskStatus }>();

// ============================================================================
// EXPRESS SERVER
// ============================================================================

const app = express();
app.use(express.json());

// Agent Card discovery endpoint (A2A required)
app.get('/.well-known/agent.json', (req, res) => {
  res.json(merchantCard);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', agent: merchantCard.name });
});

// A2A Task submission endpoint
app.post('/tasks', async (req, res) => {
  const task: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    goal: req.body.goal,
    params: req.body.params,
  };

  console.log(`[Merchant] Received task: ${task.id}`);
  console.log(`[Merchant] Goal: ${task.goal}`);
  console.log(`[Merchant] Params:`, task.params);

  if (task.goal !== 'negotiate_and_purchase') {
    tasks.set(task.id, { task, status: TaskStatus.REJECTED });
    return res.status(400).json({
      taskId: task.id,
      status: TaskStatus.REJECTED,
      reason: "Unsupported goal. Only 'negotiate_and_purchase' is supported."
    });
  }

  // Start negotiation
  tasks.set(task.id, { task, status: TaskStatus.PENDING });

  // Simulate negotiation logic
  const { items = [], maxAmount = 100 } = task.params;
  const basePrice = items.reduce((sum: number, item: any) => sum + (item.price || 10), 0) || 50;
  
  // Apply dynamic pricing (5-10% discount for Loop agents)
  const discountPercent = 5 + Math.random() * 5;
  const finalPrice = Math.max(basePrice * (1 - discountPercent / 100), maxAmount * 0.9);
  
  // Calculate Loop reward (1-2% cashback)
  const rewardPercent = 1 + Math.random();
  const rewardAmount = Math.floor(finalPrice * rewardPercent / 100 * 1_000_000); // In Cred (6 decimals)

  // Create UCP artifact
  const artifact: UCPArtifact = {
    type: "purchase_confirmed",
    total: Math.floor(finalPrice * 1_000_000), // In Cred
    rewardAmount,
    transactionId: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    conditions: [
      { type: "time", timestamp: Date.now() + 86400000 }, // 24h delivery window
      { type: "arbiter", arbiter: "merchantAgentPubkey" } // Merchant confirms delivery
    ],
    expiry: Date.now() + 172800000, // 48h escrow expiry
    metadata: { a2aTaskId: task.id, discountPercent, rewardPercent }
  };

  tasks.set(task.id, { task, artifact, status: TaskStatus.COMPLETED });

  console.log(`[Merchant] Negotiation complete for task ${task.id}`);
  console.log(`[Merchant] Final price: $${(artifact.total / 1_000_000).toFixed(2)}`);
  console.log(`[Merchant] Reward: ${(artifact.rewardAmount / 1_000_000).toFixed(2)} Cred`);

  res.json({
    taskId: task.id,
    status: TaskStatus.COMPLETED,
    artifact,
    message: `Deal accepted at $${(finalPrice).toFixed(2)}. Reward ${(rewardAmount / 1_000_000).toFixed(2)} Cred ready for Loop capture.`
  });
});

// Get task status
app.get('/tasks/:taskId', (req, res) => {
  const taskData = tasks.get(req.params.taskId);
  if (!taskData) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({
    taskId: req.params.taskId,
    status: taskData.status,
    artifact: taskData.artifact,
  });
});

// A2A message endpoint (for multi-turn negotiation)
app.post('/tasks/:taskId/messages', (req, res) => {
  const taskData = tasks.get(req.params.taskId);
  if (!taskData) {
    return res.status(404).json({ error: 'Task not found' });
  }

  console.log(`[Merchant] Message for task ${req.params.taskId}:`, req.body);

  // Handle counter-offers, confirmations, etc.
  // For demo, just acknowledge
  res.json({
    taskId: req.params.taskId,
    received: true,
    message: "Message received. Negotiation continues."
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('🏪 Loop Merchant Agent running!');
  console.log('');
  console.log(`   Agent Card: http://localhost:${PORT}/.well-known/agent.json`);
  console.log(`   Health:     http://localhost:${PORT}/health`);
  console.log(`   Tasks:      POST http://localhost:${PORT}/tasks`);
  console.log('');
  console.log('Ready to receive A2A/UCP negotiation requests from Loop agents.');
  console.log('');
});

export default app;
