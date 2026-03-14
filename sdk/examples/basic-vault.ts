/**
 * Basic Vault Example
 * 
 * Demonstrates vault creation, deposits, and withdrawals using the Loop Protocol SDK.
 */

import { Loop, LoopPDA, PermissionLevel } from '@loop-protocol/sdk';
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl 
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';

// Configuration
const RPC_URL = process.env.RPC_URL || clusterApiUrl('devnet');
const CRED_MINT = new PublicKey(process.env.CRED_MINT || 'CredMint111111111111111111111111111111111');

async function main() {
  // Initialize connection and SDK
  const connection = new Connection(RPC_URL, 'confirmed');
  const loop = new Loop({ connection });
  
  // Load wallet from environment (in production, use secure key management)
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || '[]'))
  );
  const owner = walletKeypair.publicKey;
  
  console.log('🏦 Loop Protocol - Basic Vault Example');
  console.log('=====================================');
  console.log(`Owner: ${owner.toBase58()}`);
  console.log(`Program ID: ${loop.programIds.VAULT.toBase58()}`);
  
  // Step 1: Check if vault already exists
  console.log('\n📋 Step 1: Checking vault status...');
  const [vaultPda] = LoopPDA.vault(owner);
  const vaultExists = await loop.vault.exists(owner);
  
  if (vaultExists) {
    console.log(`✅ Vault already exists: ${vaultPda.toBase58()}`);
  } else {
    console.log('❌ Vault does not exist, creating...');
    
    // Initialize vault
    const initIx = await loop.vault.initializeVault(owner);
    const initTx = new Transaction().add(initIx);
    
    const initSig = await sendAndConfirmTransaction(connection, initTx, [walletKeypair]);
    console.log(`✅ Vault created: ${initSig}`);
  }
  
  // Step 2: Get vault info
  console.log('\n📊 Step 2: Fetching vault data...');
  const vault = await loop.vault.getVault(owner);
  
  if (vault) {
    console.log(`  Cred Balance: ${vault.credBalance.toString()} (${formatCred(vault.credBalance)} Cred)`);
    console.log(`  Stacked Balance: ${vault.stackedBalance.toString()} (${formatCred(vault.stackedBalance)} Cred)`);
    console.log(`  Pending Yield: ${vault.pendingYield.toString()}`);
    console.log(`  OXO Balance: ${vault.oxoBalance.toString()}`);
    console.log(`  Total Captured: ${vault.totalCaptured.toString()}`);
    console.log(`  Total Withdrawn: ${vault.totalWithdrawn.toString()}`);
  }
  
  // Step 3: Deposit Cred into vault
  console.log('\n💰 Step 3: Depositing Cred...');
  const depositAmount = new BN(10_000_000); // 10 Cred
  
  // Get token accounts
  const userCredAccount = await getAssociatedTokenAddress(CRED_MINT, owner);
  const vaultCredAccount = await getAssociatedTokenAddress(CRED_MINT, vaultPda, true);
  
  try {
    // Check if vault token account exists, create if needed
    const vaultTokenInfo = await connection.getAccountInfo(vaultCredAccount);
    const tx = new Transaction();
    
    if (!vaultTokenInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          owner,
          vaultCredAccount,
          vaultPda,
          CRED_MINT
        )
      );
      console.log('  Creating vault token account...');
    }
    
    // Add deposit instruction
    const depositIx = await loop.vault.deposit(
      owner,
      depositAmount,
      userCredAccount,
      vaultCredAccount
    );
    tx.add(depositIx);
    
    const depositSig = await sendAndConfirmTransaction(connection, tx, [walletKeypair]);
    console.log(`✅ Deposited ${formatCred(depositAmount)} Cred: ${depositSig}`);
  } catch (error) {
    console.log(`⚠️  Deposit skipped (insufficient balance or error): ${error.message}`);
  }
  
  // Step 4: Set agent permissions
  console.log('\n🤖 Step 4: Setting agent permissions...');
  const agentPubkey = Keypair.generate().publicKey; // Demo agent
  
  try {
    const permIx = await loop.vault.setAgentPermission(
      owner,
      agentPubkey,
      PermissionLevel.Guided, // Can capture with limits
      new BN(50_000_000) // 50 Cred daily limit
    );
    
    const permTx = new Transaction().add(permIx);
    const permSig = await sendAndConfirmTransaction(connection, permTx, [walletKeypair]);
    console.log(`✅ Agent permissions set: ${permSig}`);
    console.log(`  Agent: ${agentPubkey.toBase58()}`);
    console.log(`  Permission Level: Guided`);
    console.log(`  Daily Limit: 50 Cred`);
  } catch (error) {
    console.log(`⚠️  Permission setting skipped: ${error.message}`);
  }
  
  // Step 5: Withdraw Cred
  console.log('\n📤 Step 5: Withdrawing Cred...');
  const withdrawAmount = new BN(5_000_000); // 5 Cred
  
  try {
    const withdrawIx = await loop.vault.withdraw(
      owner,
      withdrawAmount,
      userCredAccount,
      vaultCredAccount
    );
    
    const withdrawTx = new Transaction().add(withdrawIx);
    const withdrawSig = await sendAndConfirmTransaction(connection, withdrawTx, [walletKeypair]);
    console.log(`✅ Withdrew ${formatCred(withdrawAmount)} Cred: ${withdrawSig}`);
  } catch (error) {
    console.log(`⚠️  Withdrawal skipped: ${error.message}`);
  }
  
  // Step 6: Final vault status
  console.log('\n📊 Final Vault Status:');
  const finalVault = await loop.vault.getVault(owner);
  if (finalVault) {
    console.log(`  Cred Balance: ${formatCred(finalVault.credBalance)} Cred`);
    console.log(`  Stacked Balance: ${formatCred(finalVault.stackedBalance)} Cred`);
  }
  
  console.log('\n✅ Example complete!');
}

// Helper function to format Cred amounts (6 decimals)
function formatCred(amount: BN): string {
  const value = amount.toNumber() / 1_000_000;
  return value.toFixed(2);
}

// Run the example
main().catch(console.error);
