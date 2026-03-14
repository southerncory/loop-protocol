import { PublicKey } from "@solana/web3.js";

/**
 * Loop Protocol - Devnet Program IDs
 * Deployed: 2026-03-13
 */
export const DEVNET_PROGRAM_IDS = {
  VAULT: new PublicKey("59TcVKRtME1mzGUL4xfpjMfhstGqoCEoZTTySpAeuZXZ"),
  CRED: new PublicKey("4THszk4dzFAkrcRXB2bXhrLunc74qmc6AUbzRGsGVETH"),
  OXO: new PublicKey("AidgmTgrbV7UMTLzyDM1MhQLzkrGZMFGTdgHVd3dVC7R"),
  VTP: new PublicKey("7gyZ8f2Jxj8qoGsmscZoPnBSrV5Uc5qvvYbUU3Q4hb6J"),
  AVP: new PublicKey("HeDBNqswFHMzStd5hJnoC7aZkkS5vNucxuNNgrokuRAF"),
  // Pending: SHOPPING (needs ~2.6 SOL)
} as const;

export const DEVNET_RPC = "https://api.devnet.solana.com";
