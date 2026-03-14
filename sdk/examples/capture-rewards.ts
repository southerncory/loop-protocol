/**
 * Capture Rewards Example
 * 
 * Demonstrates how to capture value from multiple sources using the Loop Protocol SDK.
 * Shows shopping rewards, referral commissions, attention rewards, and data licensing.
 */

import { 
  Loop, 
  LoopPDA, 
  CaptureType,
  DataType
} from '@loop-protocol/sdk';
import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl 
} from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';

// Configuration
const RPC_URL = process.env.RPC_URL || clusterApiUrl('devnet');
const CRED_MINT = new PublicKey(process.env.CRED_MINT || 'CredMint111111111111111111111111111111111');

async function main() {
  // Initialize connection and SDK
  const connection = new Connection(RPC_URL, 'confirmed');
  const loop = new Loop({ connection });
  
  // Load wallet
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || '[]'))
  );
  const user = walletKeypair.publicKey;
  
  console.log('🛒 Loop Protocol - Capture Rewards Example');
  console.log('==========================================');
  console.log(`User: ${user.toBase58()}`);
  
  // Ensure vault exists
  const [vaultPda] = LoopPDA.vault(user);
  const vaultExists = await loop.vault.exists(user);
  if (!vaultExists) {
    console.log('❌ Vault does not exist. Please run basic-vault.ts first.');
    return;
  }
  console.log(`✅ Vault: ${vaultPda.toBase58()}`);
  
  // =========================================================================
  // 1. SHOPPING CAPTURE - Cashback from purchases
  // =========================================================================
  console.log('\n🛍️  1. Shopping Capture (Cashback)');
  console.log('----------------------------------');
  
  // Simulate a purchase capture (in production, this comes from merchant integrations)
  const purchaseAmount = 100_000_000; // $100 purchase
  const cashbackRate = 3; // 3%
  const cashbackAmount = new BN((purchaseAmount * cashbackRate) / 100); // 3 Cred
  
  console.log(`  Purchase: $${purchaseAmount / 1_000_000}`);
  console.log(`  Cashback Rate: ${cashbackRate}%`);
  console.log(`  Captured: ${cashbackAmount.toNumber() / 1_000_000} Cred`);
  
  // In production, the capture module would call this:
  // const captureIx = await loop.vault.capture(
  //   vaultPda,
  //   cashbackAmount,
  //   CaptureType.Shopping,
  //   'Amazon order #12345',
  //   captureModulePubkey,
  //   credMint,
  //   vaultCredAccount
  // );
  
  // =========================================================================
  // 2. REFERRAL CAPTURE - Affiliate commissions
  // =========================================================================
  console.log('\n🔗 2. Referral Capture (Affiliate Commissions)');
  console.log('----------------------------------------------');
  
  try {
    // Create a tracked affiliate link
    console.log('  Creating tracked link...');
    const link = await loop.referral.trackLink(
      'https://merchant.com/product/gaming-laptop',
      'user-affiliate-2024'
    );
    console.log(`  Link ID: ${link.id}`);
    console.log(`  Original URL: ${link.originalUrl}`);
    
    // Get affiliate stats
    const stats = await loop.referral.getAffiliateStats(user);
    console.log(`  Total Links: ${stats.totalLinks}`);
    console.log(`  Total Conversions: ${stats.totalConversions}`);
    console.log(`  Total Earned: ${stats.totalEarned.toNumber() / 1_000_000} Cred`);
    console.log(`  Unclaimed: ${stats.unclaimedBalance.toNumber() / 1_000_000} Cred`);
    
    // Claim commissions if available
    if (stats.unclaimedBalance.gt(new BN(0))) {
      console.log('  Claiming commissions...');
      const claimSig = await loop.referral.claimCommission(user, []);
      console.log(`  ✅ Claimed: ${claimSig}`);
    }
  } catch (error) {
    console.log(`  ⚠️  Referral module: ${error.message}`);
  }
  
  // =========================================================================
  // 3. ATTENTION CAPTURE - Ad viewing rewards
  // =========================================================================
  console.log('\n👁️  3. Attention Capture (Ad Rewards)');
  console.log('--------------------------------------');
  
  try {
    // Register for attention rewards with preferences
    console.log('  Registering for ad rewards...');
    const profile = await loop.attention.registerForAds(user, {
      categories: ['technology', 'gaming', 'finance'],
      blockedCategories: ['gambling', 'adult'],
      dailyLimit: 10,
      minReward: new BN(100_000) // 0.1 Cred minimum per ad
    });
    console.log(`  Profile Active: ${profile.isActive}`);
    console.log(`  Daily Limit: ${profile.dailyAdLimit} ads`);
    console.log(`  Min Reward: ${profile.minRewardPerView.toNumber() / 1_000_000} Cred`);
    
    // Get available ads
    const ads = await loop.attention.getAvailableAds(user);
    console.log(`  Available Ads: ${ads.length}`);
    
    if (ads.length > 0) {
      // Show first ad details
      const ad = ads[0];
      console.log(`  Top Ad: "${ad.title}"`);
      console.log(`    Reward: ${ad.rewardPerView.toNumber() / 1_000_000} Cred`);
      console.log(`    Min View: ${ad.minViewDuration}s`);
    }
  } catch (error) {
    console.log(`  ⚠️  Attention module: ${error.message}`);
  }
  
  // =========================================================================
  // 4. DATA CAPTURE - Data licensing revenue
  // =========================================================================
  console.log('\n📊 4. Data Capture (Licensing Revenue)');
  console.log('--------------------------------------');
  
  try {
    // Set pricing for user's data
    console.log('  Setting data pricing...');
    const pricingConfig = await loop.data.setDataPricing(
      user,
      ['browsing', 'preferences', 'demographics'] as DataType[],
      new Map([
        ['browsing' as DataType, new BN(5_000_000)],     // 5 Cred per license
        ['preferences' as DataType, new BN(2_000_000)],  // 2 Cred per license
        ['demographics' as DataType, new BN(10_000_000)] // 10 Cred per license
      ])
    );
    console.log(`  Config Active: ${pricingConfig.isActive}`);
    console.log(`  Available Types: ${pricingConfig.availableTypes.join(', ')}`);
    
    // Get data stats
    const dataStats = await loop.data.getDataStats(user);
    console.log(`  Active Licenses: ${dataStats.activeLicenses}`);
    console.log(`  Total Revenue: ${dataStats.totalRevenue.toNumber() / 1_000_000} Cred`);
    console.log(`  Unclaimed: ${dataStats.unclaimedRevenue.toNumber() / 1_000_000} Cred`);
    
    // Claim revenue if available
    if (dataStats.unclaimedRevenue.gt(new BN(0))) {
      console.log('  Claiming data revenue...');
      const claimSig = await loop.data.claimDataRevenue(user);
      console.log(`  ✅ Claimed: ${claimSig}`);
    }
  } catch (error) {
    console.log(`  ⚠️  Data module: ${error.message}`);
  }
  
  // =========================================================================
  // 5. COMPUTE CAPTURE - Resource monetization
  // =========================================================================
  console.log('\n💻 5. Compute Capture (Resource Revenue)');
  console.log('-----------------------------------------');
  
  try {
    // Get compute stats
    const computeStats = await loop.compute.getComputeStats(user);
    console.log(`  Total Tasks: ${computeStats.totalTasks}`);
    console.log(`  Total Rewards: ${computeStats.totalRewards.toNumber() / 1_000_000} Cred`);
    console.log(`  Success Rate: ${computeStats.successRate / 100}%`);
    console.log(`  Active Tasks: ${computeStats.activeTasks}`);
    console.log(`  Reputation: ${computeStats.reputationScore}`);
  } catch (error) {
    console.log(`  ⚠️  Compute module: ${error.message}`);
  }
  
  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n📈 Capture Summary');
  console.log('==================');
  
  const vault = await loop.vault.getVault(user);
  if (vault) {
    console.log(`Total Captured (all time): ${vault.totalCaptured.toNumber() / 1_000_000} Cred`);
    console.log(`Current Vault Balance: ${vault.credBalance.toNumber() / 1_000_000} Cred`);
    console.log(`Stacked Balance: ${vault.stackedBalance.toNumber() / 1_000_000} Cred`);
  }
  
  console.log('\n✅ Capture rewards example complete!');
  console.log('\nCapture Types Available:');
  console.log('  - Shopping: Cashback from purchases');
  console.log('  - Referral: Affiliate commissions');
  console.log('  - Attention: Ad viewing rewards');
  console.log('  - Data: Data licensing revenue');
  console.log('  - Compute: Resource monetization');
  console.log('  - Network: Node participation rewards');
  console.log('  - Skill: Behavior model licensing');
  console.log('  - Liquidity: DeFi yield');
  console.log('  - Energy: Distributed energy resources');
  console.log('  - Social: Introduction fees');
  console.log('  - Insurance: Premium returns');
}

// Run the example
main().catch(console.error);
