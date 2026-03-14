/**
 * Stacking Example
 * 
 * Demonstrates how to stack Cred for yield using the Loop Protocol SDK.
 * Shows APY calculations, yield claiming, and unstacking.
 */

import { Loop, LoopPDA } from '@loop-protocol/sdk';
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl 
} from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Configuration
const RPC_URL = process.env.RPC_URL || clusterApiUrl('devnet');

async function main() {
  // Initialize connection and SDK
  const connection = new Connection(RPC_URL, 'confirmed');
  const loop = new Loop({ connection });
  
  // Load wallet
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || '[]'))
  );
  const owner = walletKeypair.publicKey;
  
  console.log('📈 Loop Protocol - Stacking Example');
  console.log('====================================');
  console.log(`Owner: ${owner.toBase58()}`);
  
  // Ensure vault exists
  const [vaultPda] = LoopPDA.vault(owner);
  const vaultExists = await loop.vault.exists(owner);
  if (!vaultExists) {
    console.log('❌ Vault does not exist. Please run basic-vault.ts first.');
    return;
  }
  
  // =========================================================================
  // APY TIERS
  // =========================================================================
  console.log('\n📊 APY Tiers');
  console.log('------------');
  
  const durations = [7, 14, 30, 90, 180, 365];
  console.log('\n  Duration  |  APY');
  console.log('  ----------|-------');
  
  for (const days of durations) {
    const apyBps = loop.vault.calculateApy(days);
    const apyPercent = apyBps / 100;
    console.log(`  ${days.toString().padStart(3)} days  |  ${apyPercent.toFixed(1)}%`);
  }
  
  // =========================================================================
  // YIELD CALCULATOR
  // =========================================================================
  console.log('\n💰 Yield Calculator');
  console.log('-------------------');
  
  const stackAmount = new BN(1000_000_000); // 1000 Cred
  const stackDays = 90;
  const apyBps = loop.vault.calculateApy(stackDays);
  
  // Calculate expected yield
  const yearlyYield = stackAmount.mul(new BN(apyBps)).div(new BN(10000));
  const periodYield = yearlyYield.mul(new BN(stackDays)).div(new BN(365));
  
  console.log(`\n  Stack Amount: ${formatCred(stackAmount)} Cred`);
  console.log(`  Lock Period: ${stackDays} days`);
  console.log(`  APY: ${apyBps / 100}%`);
  console.log(`  Expected Yield: ~${formatCred(periodYield)} Cred`);
  console.log(`  Total at End: ~${formatCred(stackAmount.add(periodYield))} Cred`);
  
  // =========================================================================
  // CURRENT VAULT STATUS
  // =========================================================================
  console.log('\n📋 Current Vault Status');
  console.log('-----------------------');
  
  const vault = await loop.vault.getVault(owner);
  if (vault) {
    console.log(`  Available Cred: ${formatCred(vault.credBalance)}`);
    console.log(`  Stacked Cred: ${formatCred(vault.stackedBalance)}`);
    console.log(`  Pending Yield: ${formatCred(vault.pendingYield)}`);
  }
  
  // =========================================================================
  // STACKING DEMO
  // =========================================================================
  console.log('\n🔒 Stacking Demo');
  console.log('----------------');
  
  // Check if we have enough to stack
  if (vault && vault.credBalance.gte(new BN(10_000_000))) {
    const demoStackAmount = new BN(10_000_000); // 10 Cred
    const demoStackDays = 30;
    
    console.log(`\n  Stacking ${formatCred(demoStackAmount)} Cred for ${demoStackDays} days...`);
    
    try {
      const stackIx = await loop.vault.stack(
        owner,
        demoStackAmount,
        demoStackDays
      );
      
      const stackTx = new Transaction().add(stackIx);
      const stackSig = await sendAndConfirmTransaction(connection, stackTx, [walletKeypair]);
      
      console.log(`  ✅ Stacked successfully!`);
      console.log(`  Transaction: ${stackSig}`);
      
      // Get updated vault status
      const updatedVault = await loop.vault.getVault(owner);
      if (updatedVault) {
        console.log(`\n  Updated Status:`);
        console.log(`    Available: ${formatCred(updatedVault.credBalance)}`);
        console.log(`    Stacked: ${formatCred(updatedVault.stackedBalance)}`);
      }
    } catch (error) {
      console.log(`  ⚠️  Stacking failed: ${error.message}`);
    }
  } else {
    console.log('  ⚠️  Insufficient balance for demo stack (need >= 10 Cred)');
  }
  
  // =========================================================================
  // CLAIMING YIELD
  // =========================================================================
  console.log('\n🎁 Claiming Yield');
  console.log('-----------------');
  
  if (vault && vault.pendingYield.gt(new BN(0))) {
    console.log(`  Pending yield available: ${formatCred(vault.pendingYield)} Cred`);
    
    // In production, you would get the actual stack address
    // const stackPda = await getStackAddress(vaultPda, stackIndex);
    // const claimIx = await loop.vault.claimYield(owner, stackPda);
    
    console.log('  (Claim would require stack address from active stacks)');
  } else {
    console.log('  No pending yield to claim.');
    console.log('  Yield accumulates over time based on your stacked amount and APY.');
  }
  
  // =========================================================================
  // STACKING STRATEGIES
  // =========================================================================
  console.log('\n📈 Stacking Strategies');
  console.log('----------------------');
  
  console.log('\n  1. SHORT-TERM (7-14 days)');
  console.log('     - APY: 5-7%');
  console.log('     - Good for: Testing, small amounts');
  console.log('     - Risk: Low (short lock)');
  
  console.log('\n  2. MEDIUM-TERM (30-90 days)');
  console.log('     - APY: 10-15%');
  console.log('     - Good for: Regular savers');
  console.log('     - Risk: Moderate (medium lock)');
  
  console.log('\n  3. LONG-TERM (180-365 days)');
  console.log('     - APY: 18-20%');
  console.log('     - Good for: Committed holders');
  console.log('     - Risk: Higher (long lock)');
  
  // =========================================================================
  // COMPOUND YIELD PROJECTION
  // =========================================================================
  console.log('\n📊 Compound Yield Projection (1000 Cred)');
  console.log('----------------------------------------');
  
  const initialAmount = 1000;
  let compoundedAmount = initialAmount;
  
  console.log('\n  Year | Balance  | Yield (assuming 90-day restacks at 15% APY)');
  console.log('  -----|----------|----------------------------------------------');
  
  for (let year = 1; year <= 5; year++) {
    // 4 restacks per year (90 days each)
    for (let quarter = 0; quarter < 4; quarter++) {
      const quarterlyYield = compoundedAmount * 0.15 * (90 / 365);
      compoundedAmount += quarterlyYield;
    }
    const totalYield = compoundedAmount - initialAmount;
    console.log(`    ${year}  | ${compoundedAmount.toFixed(2).padStart(8)} | +${totalYield.toFixed(2)} Cred`);
  }
  
  // =========================================================================
  // EXTRACTION WARNING
  // =========================================================================
  console.log('\n⚠️  Important: Extract vs Unstack');
  console.log('----------------------------------');
  console.log('  • UNSTACK: Wait for lock to expire, get 100% of stacked Cred');
  console.log('  • EXTRACT: Emergency withdrawal, 5% fee applies');
  console.log('  • Always prefer UNSTACK when possible to avoid fees');
  
  console.log('\n✅ Stacking example complete!');
}

// Helper function to format Cred amounts (6 decimals)
function formatCred(amount: BN): string {
  const value = amount.toNumber() / 1_000_000;
  return value.toFixed(2);
}

// Run the example
main().catch(console.error);
