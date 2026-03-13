/**
 * Capture Tracker
 * 
 * Tracks all captured links and syncs with on-chain data.
 * Stores capture history locally and periodically syncs earnings.
 */

import { Connection, PublicKey } from '@solana/web3.js';

interface CaptureEvent {
  originalUrl: string;
  capturedUrl: string;
  timestamp: number;
  source: 'context-menu' | 'content-script' | 'popup' | 'clipboard';
  affiliate?: string;
  clicked?: boolean;
  converted?: boolean;
  earnings?: number;
}

interface CaptureStats {
  totalCaptures: number;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  capturesByProgram: Record<string, number>;
  last7Days: number;
  last30Days: number;
}

const STORAGE_KEY = 'loop_captures';
const STATS_KEY = 'loop_stats';
const EARNINGS_KEY = 'loop_earnings';

// Devnet RPC (switch to mainnet for production)
const SOLANA_RPC = 'https://api.devnet.solana.com';

// Loop Protocol program IDs (devnet)
const LOOP_VAULT_PROGRAM = '59TcVKRtME1mzGUL4xfpjMfhstGqoCEoZTTySpAeuZXZ';

export class CaptureTracker {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(SOLANA_RPC, 'confirmed');
  }

  /**
   * Track a new capture event
   */
  async trackCapture(event: CaptureEvent): Promise<void> {
    // Get existing captures
    const captures = await this.getCaptures();
    
    // Add new capture
    captures.push(event);

    // Keep only last 1000 captures to avoid storage limits
    const trimmed = captures.slice(-1000);

    // Save
    await chrome.storage.local.set({ [STORAGE_KEY]: trimmed });

    // Update stats
    await this.updateStats(event);

    console.log('[Loop] Capture tracked:', event.capturedUrl);
  }

  /**
   * Get all captures
   */
  async getCaptures(): Promise<CaptureEvent[]> {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
  }

  /**
   * Get capture statistics
   */
  async getStats(): Promise<CaptureStats> {
    const result = await chrome.storage.local.get(STATS_KEY);
    return result[STATS_KEY] || {
      totalCaptures: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalEarnings: 0,
      capturesByProgram: {},
      last7Days: 0,
      last30Days: 0
    };
  }

  /**
   * Update statistics after a capture
   */
  private async updateStats(event: CaptureEvent): Promise<void> {
    const stats = await this.getStats();
    
    stats.totalCaptures++;
    
    if (event.affiliate) {
      stats.capturesByProgram[event.affiliate] = 
        (stats.capturesByProgram[event.affiliate] || 0) + 1;
    }

    // Update time-based stats
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const captures = await this.getCaptures();
    stats.last7Days = captures.filter(c => c.timestamp > sevenDaysAgo).length;
    stats.last30Days = captures.filter(c => c.timestamp > thirtyDaysAgo).length;

    await chrome.storage.local.set({ [STATS_KEY]: stats });
  }

  /**
   * Get earnings from on-chain vault
   */
  async getEarnings(): Promise<{ cred: number; pending: number }> {
    const result = await chrome.storage.local.get(EARNINGS_KEY);
    return result[EARNINGS_KEY] || { cred: 0, pending: 0 };
  }

  /**
   * Sync earnings with on-chain data
   */
  async syncWithChain(walletPublicKey: string): Promise<void> {
    try {
      const pubkey = new PublicKey(walletPublicKey);
      
      // Find the user's vault PDA
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), pubkey.toBuffer()],
        new PublicKey(LOOP_VAULT_PROGRAM)
      );

      // Fetch vault account
      const vaultAccount = await this.connection.getAccountInfo(vaultPda);
      
      if (vaultAccount) {
        // Parse vault data (simplified - real implementation needs proper deserialization)
        // The vault struct contains: owner, cred_balance, staked_balance, etc.
        const dataView = new DataView(vaultAccount.data.buffer);
        
        // Skip discriminator (8 bytes) and owner pubkey (32 bytes)
        const credBalance = Number(dataView.getBigUint64(40, true)) / 1_000_000; // 6 decimals
        const stakedBalance = Number(dataView.getBigUint64(48, true)) / 1_000_000;

        await chrome.storage.local.set({
          [EARNINGS_KEY]: {
            cred: credBalance,
            staked: stakedBalance,
            pending: 0, // Would need separate tracking
            lastSync: Date.now()
          }
        });

        console.log('[Loop] Synced earnings:', credBalance, 'Cred');
      }
    } catch (error) {
      console.error('[Loop] Error syncing with chain:', error);
    }
  }

  /**
   * Clear all tracking data (for debugging)
   */
  async clearAll(): Promise<void> {
    await chrome.storage.local.remove([STORAGE_KEY, STATS_KEY, EARNINGS_KEY]);
    console.log('[Loop] Cleared all tracking data');
  }
}
