/**
 * Attention Capture Module - Verified ad viewing with attention rewards
 */

import { PublicKey } from '@solana/web3.js';
import { AdProfile, Ad, AdPreferences, ViewVerification } from '../../types';
import type { Loop } from '../../loop';

export class AttentionCaptureModule {
  constructor(private readonly loop: Loop) {}

  async registerForAds(
    user: PublicKey,
    preferences: AdPreferences
  ): Promise<AdProfile> {
    throw new Error('Not yet implemented: registerForAds');
  }

  async getAvailableAds(user: PublicKey): Promise<Ad[]> {
    throw new Error('Not yet implemented: getAvailableAds');
  }

  async verifyView(
    user: PublicKey,
    adId: string,
    viewProof: string
  ): Promise<ViewVerification> {
    throw new Error('Not yet implemented: verifyView');
  }

  async claimAttentionReward(
    user: PublicKey,
    viewIds: string[]
  ): Promise<string> {
    throw new Error('Not yet implemented: claimAttentionReward');
  }
}
