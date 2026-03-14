/**
 * Loop Protocol Constants
 * Program IDs, protocol constants, and enums
 */

import { PublicKey } from '@solana/web3.js';

// ============================================================================
// PROGRAM IDS (Devnet - March 2026)
// ============================================================================

export const PROGRAM_IDS = {
  // All deployed to devnet ✅ (March 14, 2026)
  VAULT: new PublicKey('59TcVKRtME1mzGUL4xfpjMfhstGqoCEoZTTySpAeuZXZ'),
  CRED: new PublicKey('4THszk4dzFAkrcRXB2bXhrLunc74qmc6AUbzRGsGVETH'),
  OXO: new PublicKey('AidgmTgrbV7UMTLzyDM1MhQLzkrGZMFGTdgHVd3dVC7R'),
  VTP: new PublicKey('3mP7L31af6MV6FnqWG6E78JELNuizWDwBK3rC3g3WjSK'),
  AVP: new PublicKey('FE3ZJBqVcqP6ar2pnndMghgNb3pi4mrjhVoAS7x4BVCA'),
  SHOPPING: new PublicKey('FSqRkH7nkGHP3VpHwFE667PVAfLKfSGaPMgTrXpJZJoJ'),
} as const;

// ============================================================================
// CONSTANTS
// ============================================================================

export const CONSTANTS = {
  // Vault
  EXTRACTION_FEE_BPS: 500, // 5%
  
  // OXO
  OXO_TOTAL_SUPPLY: 1_000_000_000_000_000, // 1B with 6 decimals
  MIN_LOCK_SECONDS: 15_552_000, // 6 months
  MAX_LOCK_SECONDS: 126_144_000, // 4 years
  GRADUATION_THRESHOLD: 25_000_000_000, // 25,000 OXO
  AGENT_CREATION_FEE: 500_000_000, // 500 OXO
  
  // VTP
  TRANSFER_FEE_BPS: 10, // 0.1%
  ESCROW_FEE_BPS: 25, // 0.25%
  MAX_ARBITERS: 5,
  MAX_CONDITIONS: 10,
  
  // AVP
  MIN_SERVICE_AGENT_STAKE: 500_000_000, // 500 OXO
  MAX_CAPABILITIES: 20,
  MAX_METADATA_LEN: 200,
} as const;

// ============================================================================
// ENUMS (matching Rust)
// ============================================================================

/** Type of value capture */
export enum CaptureType {
  Shopping = 0,
  Data = 1,
  Presence = 2,
  Attention = 3,
  Referral = 4,
}

/** Agent permission levels for vault access */
export enum PermissionLevel {
  None = 0,
  Read = 1,
  Capture = 2,
  Guided = 3,
  Autonomous = 4,
}

/** Escrow status */
export enum EscrowStatus {
  Active = 0,
  Released = 1,
  Cancelled = 2,
  Disputed = 3,
}

/** Agent type */
export enum AgentType {
  Personal = 0,
  Service = 1,
}

/** Agent status */
export enum AgentStatus {
  Active = 0,
  Suspended = 1,
  Revoked = 2,
}
