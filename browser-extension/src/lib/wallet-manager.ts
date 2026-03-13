/**
 * Wallet Manager
 * 
 * Handles Solana wallet connection and signing.
 * Supports Phantom, Solflare, and other Solana wallets.
 */

const WALLET_KEY = 'loop_wallet';

interface WalletInfo {
  connected: boolean;
  publicKey: string | null;
  walletName: string | null;
}

export class WalletManager {
  /**
   * Get current wallet info
   */
  async getWalletInfo(): Promise<WalletInfo> {
    const result = await chrome.storage.local.get(WALLET_KEY);
    return result[WALLET_KEY] || {
      connected: false,
      publicKey: null,
      walletName: null
    };
  }

  /**
   * Connect to wallet
   * Note: This triggers the popup to request wallet connection
   */
  async connect(): Promise<WalletInfo> {
    // In a browser extension, we need to communicate with the injected wallet
    // This is a simplified version - real implementation would use the
    // wallet adapter or direct window.solana communication
    
    return new Promise((resolve) => {
      // Send message to content script to check for wallet
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]?.id) {
          try {
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
              type: 'CONNECT_WALLET'
            });
            
            if (response?.publicKey) {
              const walletInfo: WalletInfo = {
                connected: true,
                publicKey: response.publicKey,
                walletName: response.walletName || 'Unknown'
              };
              
              await chrome.storage.local.set({ [WALLET_KEY]: walletInfo });
              resolve(walletInfo);
            } else {
              resolve({
                connected: false,
                publicKey: null,
                walletName: null
              });
            }
          } catch (error) {
            console.error('[Loop] Error connecting wallet:', error);
            resolve({
              connected: false,
              publicKey: null,
              walletName: null
            });
          }
        }
      });
    });
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    await chrome.storage.local.set({
      [WALLET_KEY]: {
        connected: false,
        publicKey: null,
        walletName: null
      }
    });
  }

  /**
   * Check if wallet is installed
   */
  async isWalletInstalled(): Promise<{ phantom: boolean; solflare: boolean }> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]?.id) {
          try {
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
              type: 'CHECK_WALLETS'
            });
            resolve(response || { phantom: false, solflare: false });
          } catch {
            resolve({ phantom: false, solflare: false });
          }
        } else {
          resolve({ phantom: false, solflare: false });
        }
      });
    });
  }
}
