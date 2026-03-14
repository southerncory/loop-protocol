/**
 * Example 04: OXO Staking & Bonding Curves
 * 
 * Shows how to:
 * - Lock OXO for veOXO
 * - Calculate voting power
 * - Create agent tokens
 * - Buy/sell on bonding curves
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { Loop, CONSTANTS } from '../src';

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  const owner = Keypair.generate();
  const loop = new Loop({ connection });
  
  console.log('Owner:', owner.publicKey.toBase58());
  
  // ─────────────────────────────────────────────────────────────────────────
  // veOXO Locking Explained
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- veOXO Voting Power ---');
  console.log('Lock OXO to receive veOXO voting power.');
  console.log('Longer locks = more voting power:');
  console.log('  6 months: 0.25x multiplier');
  console.log('  1 year:   0.5x multiplier');
  console.log('  2 years:  1.0x multiplier');
  console.log('  4 years:  2.0x multiplier');
  console.log('\nveOXO decays linearly as unlock approaches.');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Calculate veOXO
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Calculate veOXO ---');
  
  const oxoAmount = new BN(1000_000_000); // 1000 OXO (6 decimals)
  const lockDurations = [
    CONSTANTS.MIN_LOCK_SECONDS,           // 6 months
    31_536_000,                            // 1 year
    63_072_000,                            // 2 years
    CONSTANTS.MAX_LOCK_SECONDS,           // 4 years
  ];
  
  for (const seconds of lockDurations) {
    const veOxo = loop.oxo.calculateVeOxo(oxoAmount, new BN(seconds));
    const years = seconds / 31_536_000;
    console.log(`${years.toFixed(1)} years: ${veOxo.toString()} veOXO`);
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // Lock OXO
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Locking OXO ---');
  
  const lockAmount = new BN(500_000_000); // 500 OXO
  const lockSeconds = new BN(63_072_000); // 2 years
  
  const userOxoAccount = owner.publicKey; // Replace with actual token account
  const protocolOxoAccount = owner.publicKey; // Replace with actual token account
  
  const lockIx = await loop.oxo.lockOxo(
    owner.publicKey,
    lockAmount,
    lockSeconds,
    userOxoAccount,
    protocolOxoAccount
  );
  console.log(`Locking ${lockAmount.toString()} OXO for 2 years`);
  
  const expectedVeOxo = loop.oxo.calculateVeOxo(lockAmount, lockSeconds);
  console.log(`Expected veOXO: ${expectedVeOxo.toString()}`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Extend Lock
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Extending Lock ---');
  
  const additionalSeconds = new BN(31_536_000); // +1 year
  
  const extendIx = await loop.oxo.extendLock(owner.publicKey, additionalSeconds);
  console.log('Extended lock by 1 year');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Claim Fee Share
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Claiming Fee Share ---');
  console.log('veOXO holders receive a share of protocol fees.');
  
  const feePoolAccount = owner.publicKey;
  const userCredAccount = owner.publicKey;
  
  const claimIx = await loop.oxo.claimFeeShare(
    owner.publicKey,
    feePoolAccount,
    userCredAccount
  );
  console.log('Claimed fee share');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Create Agent Token (Bonding Curve)
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Creating Agent Token ---');
  console.log(`Cost: ${CONSTANTS.AGENT_CREATION_FEE} OXO (500 OXO)`);
  
  const agentMint = Keypair.generate().publicKey;
  const creatorOxoAccount = owner.publicKey;
  const treasuryOxoAccount = owner.publicKey;
  
  const createAgentIx = await loop.oxo.createAgentToken(
    owner.publicKey,
    agentMint,
    'MyAgent',
    'AGENT',
    'https://example.com/agent-metadata.json',
    creatorOxoAccount,
    treasuryOxoAccount
  );
  console.log('Agent token created with bonding curve');
  console.log('Mint:', agentMint.toBase58());
  
  // ─────────────────────────────────────────────────────────────────────────
  // Buy Agent Tokens
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Buying Agent Tokens ---');
  
  const buyAmount = new BN(100_000_000); // 100 OXO
  const buyerOxoAccount = owner.publicKey;
  const buyerAgentAccount = owner.publicKey;
  const curveOxoAccount = owner.publicKey;
  
  const buyIx = await loop.oxo.buyAgentToken(
    owner.publicKey,
    agentMint,
    buyAmount,
    buyerOxoAccount,
    buyerAgentAccount,
    curveOxoAccount
  );
  console.log(`Buying with ${buyAmount.toString()} OXO`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Sell Agent Tokens
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Selling Agent Tokens ---');
  
  const sellAmount = new BN(50_000_000); // 50 tokens
  const sellerOxoAccount = owner.publicKey;
  const sellerAgentAccount = owner.publicKey;
  
  const sellIx = await loop.oxo.sellAgentToken(
    owner.publicKey,
    agentMint,
    sellAmount,
    sellerOxoAccount,
    sellerAgentAccount,
    curveOxoAccount
  );
  console.log(`Selling ${sellAmount.toString()} tokens (1% fee)`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Graduation
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Graduation ---');
  console.log(`Threshold: ${CONSTANTS.GRADUATION_THRESHOLD} OXO (25,000 OXO)`);
  console.log('When curve reaches threshold:');
  console.log('  1. LP is locked for 10 years');
  console.log('  2. Token becomes freely tradeable');
  console.log('  3. Creator can claim LP after 10 years');
}

main().catch(console.error);
