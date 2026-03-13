/**
 * Loop Capture — Background Service Worker
 * Manages capture tracking, wallet connection, and on-chain claims
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js';

// Types
interface CaptureEvent {
  type: 'link' | 'attention' | 'referral_conversion';
  domain: string;
  originalUrl?: string;
  affiliateUrl?: string;
  amount?: number;
  timestamp: number;
}

interface CaptureStats {
  totalLinks: number;
  totalConversions: number;
  estimatedEarnings: number;
  domains: Record<string, number>;
}

interface WalletState {
  connected: boolean;
  address: string | null;
  vaultAddress: string | null;
}

// State
let captureHistory: CaptureEvent[] = [];
let stats: CaptureStats = {
  totalLinks: 0,
  totalConversions: 0,
  estimatedEarnings: 0,
  domains: {}
};
let wallet: WalletState = {
  connected: false,
  address: null,
  vaultAddress: null
};

// Solana connection (devnet for now)
const SOLANA_RPC = 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_RPC);

// Program IDs (from devnet deployment)
const PROGRAM_IDS = {
  VAULT: '59TcVKRtME1mzGUL4xfpjMfhstGqoCEoZTTySpAeuZXZ',
  CRED: '4THszk4dzFAkrcRXB2bXhrLunc74qmc6AUbzRGsGVETH',
  SHOPPING: 'PENDING', // Will be deployed
};

// Estimated earnings per domain (placeholder - will come from API)
const DOMAIN_RATES: Record<string, number> = {
  'amazon.com': 0.04, // 4% average commission
  'ebay.com': 0.02,
  'walmart.com': 0.02,
  'bestbuy.com': 0.03,
  'default': 0.02
};

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'LINK_CAPTURED':
      handleLinkCapture(message.data);
      sendResponse({ success: true });
      break;
      
    case 'CAPTURE_STATS':
      updateStats(message.data);
      sendResponse({ success: true });
      break;
      
    case 'GET_STATS':
      sendResponse(getStats());
      break;
      
    case 'GET_WALLET':
      sendResponse(wallet);
      break;
      
    case 'CONNECT_WALLET':
      connectWallet(message.data.address)
        .then(() => sendResponse({ success: true, wallet }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // async response
      
    case 'CLAIM_REWARDS':
      claimRewards()
        .then(tx => sendResponse({ success: true, tx }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // async response
  }
});

/**
 * Handle captured link event
 */
function handleLinkCapture(data: any): void {
  const event: CaptureEvent = {
    type: 'link',
    domain: data.domain,
    originalUrl: data.originalUrl,
    affiliateUrl: data.affiliateUrl,
    timestamp: data.timestamp
  };
  
  captureHistory.push(event);
  stats.totalLinks++;
  stats.domains[data.domain] = (stats.domains[data.domain] || 0) + 1;
  
  // Persist
  saveState();
  
  console.log('[Loop] Link captured:', data.domain);
}

/**
 * Update stats from content script
 */
function updateStats(data: any): void {
  // Aggregate stats from content scripts
  for (const domain of data.domains) {
    stats.domains[domain] = (stats.domains[domain] || 0) + 1;
  }
  
  saveState();
}

/**
 * Get current stats
 */
function getStats(): CaptureStats & { history: CaptureEvent[] } {
  return {
    ...stats,
    history: captureHistory.slice(-100) // Last 100 events
  };
}

/**
 * Connect wallet
 */
async function connectWallet(address: string): Promise<void> {
  wallet.address = address;
  wallet.connected = true;
  
  // Derive vault PDA
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), new PublicKey(address).toBuffer()],
    new PublicKey(PROGRAM_IDS.VAULT)
  );
  wallet.vaultAddress = vaultPda.toBase58();
  
  // Check if vault exists on-chain
  const vaultAccount = await connection.getAccountInfo(vaultPda);
  if (!vaultAccount) {
    console.log('[Loop] Vault not found - user needs to create one');
  }
  
  saveState();
}

/**
 * Claim pending rewards (placeholder - needs affiliate network integration)
 */
async function claimRewards(): Promise<string> {
  if (!wallet.connected || !wallet.address) {
    throw new Error('Wallet not connected');
  }
  
  // TODO: Implement actual claim logic
  // 1. Query affiliate networks for confirmed conversions
  // 2. Build capture proof
  // 3. Submit to loop_shopping/loop_referral program
  // 4. Mint Cred to vault
  
  console.log('[Loop] Claim rewards - not yet implemented');
  return 'pending_implementation';
}

/**
 * Save state to storage
 */
async function saveState(): Promise<void> {
  await chrome.storage.local.set({
    captureHistory: captureHistory.slice(-1000), // Keep last 1000
    stats,
    wallet
  });
}

/**
 * Load state from storage
 */
async function loadState(): Promise<void> {
  const result = await chrome.storage.local.get(['captureHistory', 'stats', 'wallet']);
  
  if (result.captureHistory) {
    captureHistory = result.captureHistory;
  }
  if (result.stats) {
    stats = result.stats;
  }
  if (result.wallet) {
    wallet = result.wallet;
  }
}

/**
 * Initialize
 */
async function init(): Promise<void> {
  await loadState();
  console.log('[Loop] Background service started');
  console.log('[Loop] Wallet:', wallet.connected ? wallet.address : 'not connected');
  console.log('[Loop] Stats:', stats);
}

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ captureEnabled: true });
  init();
});

// Initialize on startup
init();

// Keep service worker alive
setInterval(() => {
  console.log('[Loop] Heartbeat');
}, 20000);
