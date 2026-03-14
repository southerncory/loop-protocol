/**
 * Loop Protocol Constants
 * Program IDs, protocol constants, and enums
 */

import { PublicKey } from '@solana/web3.js';

// ============================================================================
// PROGRAM IDS
// ============================================================================

export const PROGRAM_IDS = {
  VAULT: new PublicKey('76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7'),
  CRED: new PublicKey('FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA'),
  OXO: new PublicKey('3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z'),
  VTP: new PublicKey('4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj'),
  AVP: new PublicKey('H5c9xfPYcx6EtC8hpThshARtUR7tq1NfMJVrTx8z9Jcx'),
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
