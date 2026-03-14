/**
 * Insurance Capture Module - Peer-to-peer DeFi insurance pools
 */

import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import {
  ClaimType,
  ClaimVoteType,
  PoolMembership,
  ClaimSubmission,
  ClaimVote,
  InsuranceStats,
} from '../../types';
import type { Loop } from '../../loop';

export class InsuranceCapture {
  constructor(private readonly loop: Loop) {}

  async joinPool(
    user: PublicKey,
    poolId: string,
    coverage: BN,
    premium: BN
  ): Promise<PoolMembership> {
    throw new Error('InsuranceCapture.joinPool not yet implemented');
  }

  async fileClaim(
    user: PublicKey,
    poolId: string,
    claimType: ClaimType,
    evidence: string
  ): Promise<ClaimSubmission> {
    throw new Error('InsuranceCapture.fileClaim not yet implemented');
  }

  async voteOnClaim(
    user: PublicKey,
    claimId: string,
    vote: ClaimVoteType
  ): Promise<ClaimVote> {
    throw new Error('InsuranceCapture.voteOnClaim not yet implemented');
  }

  async claimPremiumReturn(
    user: PublicKey,
    poolIds: string[]
  ): Promise<string> {
    throw new Error('InsuranceCapture.claimPremiumReturn not yet implemented');
  }

  async getInsuranceStats(user: PublicKey): Promise<InsuranceStats> {
    throw new Error('InsuranceCapture.getInsuranceStats not yet implemented');
  }
}
