/**
 * Example 02: Agent Permissions
 * 
 * Shows how to:
 * - Grant agent permissions to your vault
 * - Different permission levels
 * - Agent-directed stacking
 * - Revoke permissions
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { Loop, PermissionLevel } from '../src';

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Vault owner
  const owner = Keypair.generate();
  
  // AI Agent (could be elizaOS, Auto-GPT, etc.)
  const agent = Keypair.generate();
  
  const loop = new Loop({ connection });
  
  console.log('Owner:', owner.publicKey.toBase58());
  console.log('Agent:', agent.publicKey.toBase58());
  
  // ─────────────────────────────────────────────────────────────────────────
  // Permission Levels Explained
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Permission Levels ---');
  console.log('0 = None:       No access');
  console.log('1 = Read:       View balances only');
  console.log('2 = Capture:    Can capture value into vault');
  console.log('3 = Guided:     Can stack/unstack with daily limits');
  console.log('4 = Autonomous: Full control over stacking strategy');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Grant Guided Permission (with daily limit)
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Granting Guided Permission ---');
  
  const dailyLimit = new BN(100_000_000); // 100 Cred per day
  
  const grantIx = await loop.vault.setAgentPermission(
    owner.publicKey,
    agent.publicKey,
    PermissionLevel.Guided,
    dailyLimit
  );
  console.log(`Granted Guided permission to agent`);
  console.log(`Daily limit: ${dailyLimit.toString()} (100 Cred)`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Agent Stacking (agent signs this transaction)
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Agent-Directed Stacking ---');
  
  const stackAmount = new BN(50_000_000); // 50 Cred
  const durationDays = 90;
  const stackNonce = new BN(Date.now());
  
  const agentStackIx = await loop.vault.agentStack(
    owner.publicKey,   // vault owner
    agent.publicKey,   // agent (signer)
    stackAmount,
    durationDays,
    stackNonce
  );
  console.log(`Agent stacking ${stackAmount.toString()} for ${durationDays} days`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Configure Auto-Stack
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Configure Auto-Stack ---');
  
  const autoStackIx = await loop.vault.setAutoStack(owner.publicKey, {
    enabled: true,
    minDurationDays: 30,
    reinvestYield: true,
    reinvestCaptures: true,
    targetStackRatio: 80, // Keep 80% stacked
    minStackAmount: new BN(10_000_000), // Min 10 Cred
  });
  console.log('Auto-stack configured:');
  console.log('  - Reinvest yield: true');
  console.log('  - Reinvest captures: true');
  console.log('  - Target stack ratio: 80%');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Agent Rebalance Analysis
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Agent Rebalance ---');
  
  // Requires Autonomous permission
  const upgradeIx = await loop.vault.setAgentPermission(
    owner.publicKey,
    agent.publicKey,
    PermissionLevel.Autonomous,
    new BN(0) // No limit for autonomous
  );
  console.log('Upgraded agent to Autonomous');
  
  const rebalanceIx = await loop.vault.agentRebalance(
    owner.publicKey,
    agent.publicKey,
    80 // Target 80% stacked
  );
  console.log('Agent rebalance instruction created');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Revoke Permission
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Revoke Permission ---');
  
  const revokeIx = await loop.vault.revokeAgentPermission(
    owner.publicKey,
    agent.publicKey
  );
  console.log('Agent permission revoked');
}

main().catch(console.error);
