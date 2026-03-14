/**
 * Referral Capture Module - Affiliate link tracking and commission distribution
 */
export class ReferralCaptureModule {
    constructor(loop) {
        this.loop = loop;
    }
    async trackLink(originalUrl, affiliateTag) {
        throw new Error('Not yet implemented: trackLink');
    }
    async registerConversion(linkId, amount, proof) {
        throw new Error('Not yet implemented: registerConversion');
    }
    async claimCommission(user, conversionIds) {
        throw new Error('Not yet implemented: claimCommission');
    }
    async getAffiliateStats(user) {
        throw new Error('Not yet implemented: getAffiliateStats');
    }
}
