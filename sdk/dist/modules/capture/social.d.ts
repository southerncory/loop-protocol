/**
 * Social Capture Module - Monetize social capital and connections
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { IntroTerms, IntroOutcome, IntroRequest, IntroCompletion, ReputationStake, SocialStats } from '../../types';
import type { Loop } from '../../loop';
export declare class SocialCapture {
    private readonly loop;
    constructor(loop: Loop);
    facilitateIntro(user: PublicKey, fromContact: PublicKey, toContact: PublicKey, terms: IntroTerms): Promise<IntroRequest>;
    completeIntro(user: PublicKey, introId: string, outcome: {
        type: IntroOutcome;
        dealValue?: BN;
    }): Promise<IntroCompletion>;
    stakeReputation(user: PublicKey, targetUser: PublicKey, amount: BN): Promise<ReputationStake>;
    claimSocialRevenue(user: PublicKey): Promise<string>;
    getSocialStats(user: PublicKey): Promise<SocialStats>;
}
//# sourceMappingURL=social.d.ts.map