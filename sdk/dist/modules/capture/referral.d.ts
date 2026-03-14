/**
 * Referral Capture Module - Affiliate link tracking and commission distribution
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { TrackedLink, ConversionRecord, AffiliateStats } from '../../types';
import type { Loop } from '../../loop';
export declare class ReferralCaptureModule {
    private readonly loop;
    constructor(loop: Loop);
    trackLink(originalUrl: string, affiliateTag: string): Promise<TrackedLink>;
    registerConversion(linkId: string, amount: BN, proof: string): Promise<ConversionRecord>;
    claimCommission(user: PublicKey, conversionIds: string[]): Promise<string>;
    getAffiliateStats(user: PublicKey): Promise<AffiliateStats>;
}
//# sourceMappingURL=referral.d.ts.map