/**
 * Loop Capture — Popup UI
 */

// Estimated rates per domain (placeholder)
const DOMAIN_RATES: Record<string, number> = {
  'amazon.com': 0.04,
  'ebay.com': 0.02,
  'walmart.com': 0.02,
  'bestbuy.com': 0.03,
  'default': 0.02
};

// Average order value estimates
const AVG_ORDER_VALUE: Record<string, number> = {
  'amazon.com': 50,
  'ebay.com': 35,
  'walmart.com': 45,
  'bestbuy.com': 150,
  'default': 40
};

/**
 * Format address for display
 */
function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Estimate earnings from link captures
 */
function estimateEarnings(domains: Record<string, number>): number {
  let total = 0;
  
  for (const [domain, count] of Object.entries(domains)) {
    const rate = DOMAIN_RATES[domain] || DOMAIN_RATES['default'];
    const avgOrder = AVG_ORDER_VALUE[domain] || AVG_ORDER_VALUE['default'];
    // Assume 2% of links result in purchases
    const conversionRate = 0.02;
    total += count * conversionRate * avgOrder * rate;
  }
  
  return total;
}

/**
 * Update UI with stats
 */
async function updateUI(): Promise<void> {
  // Get stats from background
  const stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
  const wallet = await chrome.runtime.sendMessage({ type: 'GET_WALLET' });
  
  // Update earnings
  const earnings = estimateEarnings(stats.domains || {});
  const earningsEl = document.getElementById('earnings');
  if (earningsEl) {
    earningsEl.textContent = earnings.toFixed(2);
  }
  
  // Update links count
  const linksEl = document.getElementById('linksCount');
  if (linksEl) {
    linksEl.textContent = String(stats.totalLinks || 0);
  }
  
  // Update domains count
  const domainsEl = document.getElementById('domainsCount');
  if (domainsEl) {
    domainsEl.textContent = String(Object.keys(stats.domains || {}).length);
  }
  
  // Update domain list
  const domainListEl = document.getElementById('domainList');
  if (domainListEl) {
    const sortedDomains = Object.entries(stats.domains || {})
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5);
    
    if (sortedDomains.length === 0) {
      domainListEl.innerHTML = `
        <div class="domain-item" style="color: #6b7280; justify-content: center;">
          No captures yet. Browse some shopping sites!
        </div>
      `;
    } else {
      domainListEl.innerHTML = sortedDomains.map(([domain, count]) => `
        <div class="domain-item">
          <span class="domain-name">${domain}</span>
          <span class="domain-count">${count} links</span>
        </div>
      `).join('');
    }
  }
  
  // Update wallet section
  const walletContent = document.getElementById('walletContent');
  const earningsSub = document.getElementById('earningsSub');
  
  if (wallet.connected && wallet.address) {
    if (walletContent) {
      walletContent.innerHTML = `
        <div class="wallet-connected">
          <span class="wallet-address">${formatAddress(wallet.address)}</span>
        </div>
        <button class="btn btn-secondary" id="claimBtn" style="margin-top: 12px;">
          Claim to Vault
        </button>
      `;
      
      // Add claim button listener
      const claimBtn = document.getElementById('claimBtn');
      if (claimBtn) {
        claimBtn.addEventListener('click', handleClaim);
      }
    }
    if (earningsSub) {
      earningsSub.textContent = `Vault: ${formatAddress(wallet.vaultAddress || '')}`;
    }
  } else {
    if (walletContent) {
      walletContent.innerHTML = `
        <button class="btn btn-primary" id="connectBtn">Connect Wallet</button>
      `;
      
      const connectBtn = document.getElementById('connectBtn');
      if (connectBtn) {
        connectBtn.addEventListener('click', handleConnect);
      }
    }
    if (earningsSub) {
      earningsSub.textContent = 'Connect wallet to claim';
    }
  }
  
  // Update capture toggle
  const result = await chrome.storage.sync.get(['captureEnabled']);
  const captureEnabled = result.captureEnabled !== false;
  
  const toggle = document.getElementById('captureToggle');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  if (toggle) {
    toggle.classList.toggle('active', captureEnabled);
  }
  if (statusDot) {
    statusDot.classList.toggle('inactive', !captureEnabled);
  }
  if (statusText) {
    statusText.textContent = captureEnabled ? 'Capturing...' : 'Paused';
  }
}

/**
 * Handle wallet connection
 */
async function handleConnect(): Promise<void> {
  // Check for Phantom or other Solana wallet
  const phantom = (window as any).phantom?.solana;
  
  if (phantom) {
    try {
      const resp = await phantom.connect();
      const address = resp.publicKey.toString();
      
      await chrome.runtime.sendMessage({
        type: 'CONNECT_WALLET',
        data: { address }
      });
      
      updateUI();
    } catch (err) {
      console.error('Wallet connection failed:', err);
      alert('Failed to connect wallet. Make sure Phantom is installed.');
    }
  } else {
    // Open Phantom install page
    window.open('https://phantom.app/', '_blank');
  }
}

/**
 * Handle claim rewards
 */
async function handleClaim(): Promise<void> {
  const claimBtn = document.getElementById('claimBtn');
  if (claimBtn) {
    claimBtn.textContent = 'Claiming...';
    (claimBtn as HTMLButtonElement).disabled = true;
  }
  
  try {
    const result = await chrome.runtime.sendMessage({ type: 'CLAIM_REWARDS' });
    
    if (result.success) {
      alert('Rewards claimed successfully!');
    } else {
      alert(`Claim failed: ${result.error}`);
    }
  } catch (err) {
    console.error('Claim failed:', err);
    alert('Claim failed. Please try again.');
  }
  
  if (claimBtn) {
    claimBtn.textContent = 'Claim to Vault';
    (claimBtn as HTMLButtonElement).disabled = false;
  }
}

/**
 * Handle capture toggle
 */
async function handleToggle(): Promise<void> {
  const result = await chrome.storage.sync.get(['captureEnabled']);
  const newState = result.captureEnabled === false;
  
  await chrome.storage.sync.set({ captureEnabled: newState });
  updateUI();
}

/**
 * Initialize popup
 */
function init(): void {
  // Update UI
  updateUI();
  
  // Set up toggle listener
  const toggle = document.getElementById('captureToggle');
  if (toggle) {
    toggle.addEventListener('click', handleToggle);
  }
  
  // Refresh every 5 seconds
  setInterval(updateUI, 5000);
}

// Run on load
document.addEventListener('DOMContentLoaded', init);
