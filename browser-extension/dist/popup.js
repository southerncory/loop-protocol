"use strict";
(() => {
  // src/popup.ts
  var DOMAIN_RATES = {
    "amazon.com": 0.04,
    "ebay.com": 0.02,
    "walmart.com": 0.02,
    "bestbuy.com": 0.03,
    "default": 0.02
  };
  var AVG_ORDER_VALUE = {
    "amazon.com": 50,
    "ebay.com": 35,
    "walmart.com": 45,
    "bestbuy.com": 150,
    "default": 40
  };
  function formatAddress(address) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
  function estimateEarnings(domains) {
    let total = 0;
    for (const [domain, count] of Object.entries(domains)) {
      const rate = DOMAIN_RATES[domain] || DOMAIN_RATES["default"];
      const avgOrder = AVG_ORDER_VALUE[domain] || AVG_ORDER_VALUE["default"];
      const conversionRate = 0.02;
      total += count * conversionRate * avgOrder * rate;
    }
    return total;
  }
  async function updateUI() {
    const stats = await chrome.runtime.sendMessage({ type: "GET_STATS" });
    const wallet = await chrome.runtime.sendMessage({ type: "GET_WALLET" });
    const earnings = estimateEarnings(stats.domains || {});
    const earningsEl = document.getElementById("earnings");
    if (earningsEl) {
      earningsEl.textContent = earnings.toFixed(2);
    }
    const linksEl = document.getElementById("linksCount");
    if (linksEl) {
      linksEl.textContent = String(stats.totalLinks || 0);
    }
    const domainsEl = document.getElementById("domainsCount");
    if (domainsEl) {
      domainsEl.textContent = String(Object.keys(stats.domains || {}).length);
    }
    const domainListEl = document.getElementById("domainList");
    if (domainListEl) {
      const sortedDomains = Object.entries(stats.domains || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
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
      `).join("");
      }
    }
    const walletContent = document.getElementById("walletContent");
    const earningsSub = document.getElementById("earningsSub");
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
        const claimBtn = document.getElementById("claimBtn");
        if (claimBtn) {
          claimBtn.addEventListener("click", handleClaim);
        }
      }
      if (earningsSub) {
        earningsSub.textContent = `Vault: ${formatAddress(wallet.vaultAddress || "")}`;
      }
    } else {
      if (walletContent) {
        walletContent.innerHTML = `
        <button class="btn btn-primary" id="connectBtn">Connect Wallet</button>
      `;
        const connectBtn = document.getElementById("connectBtn");
        if (connectBtn) {
          connectBtn.addEventListener("click", handleConnect);
        }
      }
      if (earningsSub) {
        earningsSub.textContent = "Connect wallet to claim";
      }
    }
    const result = await chrome.storage.sync.get(["captureEnabled"]);
    const captureEnabled = result.captureEnabled !== false;
    const toggle = document.getElementById("captureToggle");
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");
    if (toggle) {
      toggle.classList.toggle("active", captureEnabled);
    }
    if (statusDot) {
      statusDot.classList.toggle("inactive", !captureEnabled);
    }
    if (statusText) {
      statusText.textContent = captureEnabled ? "Capturing..." : "Paused";
    }
  }
  async function handleConnect() {
    const phantom = window.phantom?.solana;
    if (phantom) {
      try {
        const resp = await phantom.connect();
        const address = resp.publicKey.toString();
        await chrome.runtime.sendMessage({
          type: "CONNECT_WALLET",
          data: { address }
        });
        updateUI();
      } catch (err) {
        console.error("Wallet connection failed:", err);
        alert("Failed to connect wallet. Make sure Phantom is installed.");
      }
    } else {
      window.open("https://phantom.app/", "_blank");
    }
  }
  async function handleClaim() {
    const claimBtn = document.getElementById("claimBtn");
    if (claimBtn) {
      claimBtn.textContent = "Claiming...";
      claimBtn.disabled = true;
    }
    try {
      const result = await chrome.runtime.sendMessage({ type: "CLAIM_REWARDS" });
      if (result.success) {
        alert("Rewards claimed successfully!");
      } else {
        alert(`Claim failed: ${result.error}`);
      }
    } catch (err) {
      console.error("Claim failed:", err);
      alert("Claim failed. Please try again.");
    }
    if (claimBtn) {
      claimBtn.textContent = "Claim to Vault";
      claimBtn.disabled = false;
    }
  }
  async function handleToggle() {
    const result = await chrome.storage.sync.get(["captureEnabled"]);
    const newState = result.captureEnabled === false;
    await chrome.storage.sync.set({ captureEnabled: newState });
    updateUI();
  }
  function init() {
    updateUI();
    const toggle = document.getElementById("captureToggle");
    if (toggle) {
      toggle.addEventListener("click", handleToggle);
    }
    setInterval(updateUI, 5e3);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
