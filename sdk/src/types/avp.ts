/**
 * Loop Protocol - AVP Types
 */

import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { AgentType, AgentStatus } from '../constants';

/** 8-byte capability identifier */
export type CapabilityId = Uint8Array;

/** Agent identity */
export interface AgentIdentity {
  agentPubkey: PublicKey;
  agentType: AgentType;
  createdAt: BN;
  principalHash: Uint8Array | null;
  bindingTimestamp: BN | null;
  creator: PublicKey | null;
  capabilities: CapabilityId[];
  stakeAmount: BN;
  stakeLockedUntil: BN;
  status: AgentStatus;
  reputationScore: number; // 0-10000 basis points
  metadataUri: string | null;
  bump: number;
}
