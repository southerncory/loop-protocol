// src/background.ts
import { Connection, PublicKey } from "@solana/web3.js";
var captureHistory = [];
var stats = {
  totalLinks: 0,
  totalConversions: 0,
  estimatedEarnings: 0,
  domains: {}
};
var wallet = {
  connected: false,
  address: null,
  vaultAddress: null
};
var SOLANA_RPC = "https://api.devnet.solana.com";
var connection = new Connection(SOLANA_RPC);
var PROGRAM_IDS = {
  VAULT: "59TcVKRtME1mzGUL4xfpjMfhstGqoCEoZTTySpAeuZXZ",
  CRED: "4THszk4dzFAkrcRXB2bXhrLunc74qmc6AUbzRGsGVETH",
  SHOPPING: "PENDING"
  // Will be deployed
};
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "LINK_CAPTURED":
      handleLinkCapture(message.data);
      sendResponse({ success: true });
      break;
    case "CAPTURE_STATS":
      updateStats(message.data);
      sendResponse({ success: true });
      break;
    case "GET_STATS":
      sendResponse(getStats());
      break;
    case "GET_WALLET":
      sendResponse(wallet);
      break;
    case "CONNECT_WALLET":
      connectWallet(message.data.address).then(() => sendResponse({ success: true, wallet })).catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    case "CLAIM_REWARDS":
      claimRewards().then((tx) => sendResponse({ success: true, tx })).catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
  }
});
function handleLinkCapture(data) {
  const event = {
    type: "link",
    domain: data.domain,
    originalUrl: data.originalUrl,
    affiliateUrl: data.affiliateUrl,
    timestamp: data.timestamp
  };
  captureHistory.push(event);
  stats.totalLinks++;
  stats.domains[data.domain] = (stats.domains[data.domain] || 0) + 1;
  saveState();
  console.log("[Loop] Link captured:", data.domain);
}
function updateStats(data) {
  for (const domain of data.domains) {
    stats.domains[domain] = (stats.domains[domain] || 0) + 1;
  }
  saveState();
}
function getStats() {
  return {
    ...stats,
    history: captureHistory.slice(-100)
    // Last 100 events
  };
}
async function connectWallet(address) {
  wallet.address = address;
  wallet.connected = true;
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), new PublicKey(address).toBuffer()],
    new PublicKey(PROGRAM_IDS.VAULT)
  );
  wallet.vaultAddress = vaultPda.toBase58();
  const vaultAccount = await connection.getAccountInfo(vaultPda);
  if (!vaultAccount) {
    console.log("[Loop] Vault not found - user needs to create one");
  }
  saveState();
}
async function claimRewards() {
  if (!wallet.connected || !wallet.address) {
    throw new Error("Wallet not connected");
  }
  console.log("[Loop] Claim rewards - not yet implemented");
  return "pending_implementation";
}
async function saveState() {
  await chrome.storage.local.set({
    captureHistory: captureHistory.slice(-1e3),
    // Keep last 1000
    stats,
    wallet
  });
}
async function loadState() {
  const result = await chrome.storage.local.get(["captureHistory", "stats", "wallet"]);
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
async function init() {
  await loadState();
  console.log("[Loop] Background service started");
  console.log("[Loop] Wallet:", wallet.connected ? wallet.address : "not connected");
  console.log("[Loop] Stats:", stats);
}
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ captureEnabled: true });
  init();
});
init();
setInterval(() => {
  console.log("[Loop] Heartbeat");
}, 2e4);
