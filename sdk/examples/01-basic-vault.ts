/**
 * Example 01: Basic Vault Operations
 * 
 * Shows how to:
 * - Initialize a vault
 * - Deposit Cred
 * - Stack for yield
 * - Withdraw
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { Loop } from '../src';

async function main() {
  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load your wallet (in production, use secure key management)
  const wallet = Keypair.generate(); // Replace with your keypair
  
  // Initialize SDK
  const loop = new Loop({ connection });
  
  console.log('Owner:', wallet.publicKey.toBase58());
  
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Initialize Vault
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Initializing Vault ---');
  
  // Check if vault exists
  const vaultExists = await loop.vault.exists(wallet.publicKey);
  console.log('Vault exists:', vaultExists);
  
  if (!vaultExists) {
    // Create vault initialization instruction
    const initIx = await loop.vault.initializeVault(wallet.publicKey);
    console.log('Vault init instruction created');
    
    // In production, sign and send transaction:
    // const tx = new Transaction().add(initIx);
    // await sendAndConfirmTransaction(connection, tx, [wallet]);
  }
  
  // Get vault address
  const [vaultAddress] = loop.vault.getVaultAddress(wallet.publicKey);
  console.log('Vault PDA:', vaultAddress.toBase58());
  
  // ─────────────────────────────────────────────────────────────────────────
  // 2. Deposit Cred
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Depositing Cred ---');
  
  const depositAmount = new BN(100_000_000); // 100 Cred (6 decimals)
  const userCredAccount = wallet.publicKey; // Replace with actual token account
  const vaultCredAccount = vaultAddress; // Replace with actual token account
  
  const depositIx = await loop.vault.deposit(
    wallet.publicKey,
    depositAmount,
    userCredAccount,
    vaultCredAccount
  );
  console.log(`Deposit instruction: ${depositAmount.toString()} lamports`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // 3. Stack for Yield
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Stacking for Yield ---');
  
  const stackAmount = new BN(50_000_000); // 50 Cred
  const durationDays = 90; // 90 days
  const stackNonce = new BN(Date.now()); // Unique nonce
  
  // Calculate APY
  const apy = loop.vault.calculateApy(durationDays);
  console.log(`APY for ${durationDays} days: ${apy / 100}%`);
  
  const stackIx = await loop.vault.stack(
    wallet.publicKey,
    stackAmount,
    durationDays,
    stackNonce
  );
  console.log(`Stack instruction: ${stackAmount.toString()} for ${durationDays} days`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // 4. Withdraw
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- Withdrawing ---');
  
  const withdrawAmount = new BN(25_000_000); // 25 Cred
  
  const withdrawIx = await loop.vault.withdraw(
    wallet.publicKey,
    withdrawAmount,
    userCredAccount,
    vaultCredAccount
  );
  console.log(`Withdraw instruction: ${withdrawAmount.toString()} lamports`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // APY Table
  // ─────────────────────────────────────────────────────────────────────────
  
  console.log('\n--- APY by Duration ---');
  const durations = [7, 14, 30, 90, 180, 365, 730];
  for (const days of durations) {
    const rate = loop.vault.calculateApy(days);
    console.log(`  ${days} days: ${rate / 100}% APY`);
  }
}

main().catch(console.error);
