/**
 * Example 03: Escrow (Conditional Transfers)
 * 
 * Shows how to:
 * - Create escrow with conditions
 * - Use different condition types
 * - Fulfill conditions
 * - Release or cancel escrow
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { Loop } from '../src';

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  const sender = Keypair.generate();
  const recipient = Keypair.generate();
  const arbiter = Keypair.generate(); // Trusted third party
  
  const loop = new Loop({ connection });
  
  console.log('Sender:', sender.publicKey.toBase58());
  console.log('Recipient:', recipient.publicKey.toBase58());
  console.log('Arbiter:', arbiter.publicKey.toBase58());
  
  // ─────────────────────────────────────────────────────────────────────────
  // Condition Types
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Condition Types ---');
  console.log('1. Arbiter Approval: A trusted party must approve release');
  console.log('2. Time Release: Funds release after a timestamp');
  console.log('3. Oracle Attestation: External oracle provides proof');
  console.log('4. Multi-Sig: Multiple signers must approve');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Create Simple Escrow (Arbiter Approval)
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Creating Escrow with Arbiter ---');
  
  const amount = new BN(500_000_000); // 500 Cred
  const expiry = new BN(Math.floor(Date.now() / 1000) + 86400 * 7); // 7 days
  
  // Create arbiter condition
  const arbiterCondition = loop.vtp.arbiterCondition(arbiter.publicKey);
  
  // Token accounts (replace with actual accounts)
  const senderCredAccount = sender.publicKey;
  const escrowCredAccount = sender.publicKey;
  const feeAccount = sender.publicKey;
  
  const createIx = await loop.vtp.createEscrow(
    sender.publicKey,
    recipient.publicKey,
    amount,
    [arbiterCondition], // Single condition
    expiry,
    senderCredAccount,
    escrowCredAccount,
    feeAccount
  );
  console.log('Escrow created with arbiter condition');
  console.log(`Amount: ${amount.toString()} (500 Cred)`);
  console.log(`Expiry: ${new Date(expiry.toNumber() * 1000).toISOString()}`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Create Time-Locked Escrow
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Creating Time-Locked Escrow ---');
  
  const releaseTime = new BN(Math.floor(Date.now() / 1000) + 86400 * 30); // 30 days
  const timeCondition = loop.vtp.timeCondition(releaseTime);
  
  console.log(`Release time: ${new Date(releaseTime.toNumber() * 1000).toISOString()}`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Create Multi-Condition Escrow
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Creating Multi-Condition Escrow ---');
  
  const multiSigSigners = [
    Keypair.generate().publicKey,
    Keypair.generate().publicKey,
    Keypair.generate().publicKey,
  ];
  
  const multiSigCondition = loop.vtp.multiSigCondition(2, multiSigSigners); // 2 of 3
  
  console.log('Multi-sig: 2 of 3 signers required');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Fulfill Condition (Arbiter approves)
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Fulfilling Condition ---');
  
  const escrowAddress = sender.publicKey; // Replace with actual escrow PDA
  
  const fulfillIx = await loop.vtp.fulfillCondition(
    arbiter.publicKey, // Arbiter signs
    escrowAddress,
    0, // Condition index
    null // No proof needed for arbiter
  );
  console.log('Arbiter fulfilled condition 0');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Release Escrow
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Releasing Escrow ---');
  
  const recipientCredAccount = recipient.publicKey;
  
  const releaseIx = await loop.vtp.releaseEscrow(
    recipient.publicKey, // Anyone can call after conditions met
    escrowAddress,
    escrowCredAccount,
    recipientCredAccount
  );
  console.log('Escrow released to recipient');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Cancel Escrow (before conditions met or after expiry)
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Canceling Escrow ---');
  
  const cancelIx = await loop.vtp.cancelEscrow(
    sender.publicKey, // Sender can cancel
    escrowAddress,
    escrowCredAccount,
    senderCredAccount
  );
  console.log('Escrow canceled, funds returned to sender');
}

main().catch(console.error);
