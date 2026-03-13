import { PublicKey } from "@solana/web3.js";

/**
 * Loop Protocol - Devnet Program IDs
 * Deployed: 2026-03-13
 */
export const DEVNET_PROGRAM_IDS = {
  VAULT: new PublicKey("59TcVKRtME1mzGUL4xfpjMfhstGqoCEoZTTySpAeuZXZ"),
  CRED: new PublicKey("4THszk4dzFAkrcRXB2bXhrLunc74qmc6AUbzRGsGVETH"),
  OXO: new PublicKey("AidgmTgrbV7UMTLzyDM1MhQLzkrGZMFGTdgHVd3dVC7R"),
  // Pending deployment (need devnet SOL):
  // VTP: new PublicKey("..."),
  // AVP: new PublicKey("..."),
  // SHOPPING: new PublicKey("..."),
} as const;

export const DEVNET_RPC = "https://api.devnet.solana.com";
