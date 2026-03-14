/**
 * Referral Capture Module - Affiliate link tracking and commission distribution
 */

import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { TrackedLink, ConversionRecord, AffiliateStats } from '../../types';
import type { Loop } from '../../loop';

export class ReferralCaptureModule {
  constructor(private readonly loop: Loop) {}

  async trackLink(originalUrl: string, affiliateTag: string): Promise<TrackedLink> {
    throw new Error('Not yet implemented: trackLink');
  }

  async registerConversion(
    linkId: string,
    amount: BN,
    proof: string
  ): Promise<ConversionRecord> {
    throw new Error('Not yet implemented: registerConversion');
  }

  async claimCommission(
    user: PublicKey,
    conversionIds: string[]
  ): Promise<string> {
    throw new Error('Not yet implemented: claimCommission');
  }

  async getAffiliateStats(user: PublicKey): Promise<AffiliateStats> {
    throw new Error('Not yet implemented: getAffiliateStats');
  }
}
