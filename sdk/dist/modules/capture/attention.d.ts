/**
 * Attention Capture Module - Verified ad viewing with attention rewards
 */
import { PublicKey } from '@solana/web3.js';
import { AdProfile, Ad, AdPreferences, ViewVerification } from '../../types';
import type { Loop } from '../../loop';
export declare class AttentionCaptureModule {
    private readonly loop;
    constructor(loop: Loop);
    registerForAds(user: PublicKey, preferences: AdPreferences): Promise<AdProfile>;
    getAvailableAds(user: PublicKey): Promise<Ad[]>;
    verifyView(user: PublicKey, adId: string, viewProof: string): Promise<ViewVerification>;
    claimAttentionReward(user: PublicKey, viewIds: string[]): Promise<string>;
}
//# sourceMappingURL=attention.d.ts.map