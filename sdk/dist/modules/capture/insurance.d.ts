/**
 * Insurance Capture Module - Peer-to-peer DeFi insurance pools
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { ClaimType, ClaimVoteType, PoolMembership, ClaimSubmission, ClaimVote, InsuranceStats } from '../../types';
import type { Loop } from '../../loop';
export declare class InsuranceCapture {
    private readonly loop;
    constructor(loop: Loop);
    joinPool(user: PublicKey, poolId: string, coverage: BN, premium: BN): Promise<PoolMembership>;
    fileClaim(user: PublicKey, poolId: string, claimType: ClaimType, evidence: string): Promise<ClaimSubmission>;
    voteOnClaim(user: PublicKey, claimId: string, vote: ClaimVoteType): Promise<ClaimVote>;
    claimPremiumReturn(user: PublicKey, poolIds: string[]): Promise<string>;
    getInsuranceStats(user: PublicKey): Promise<InsuranceStats>;
}
//# sourceMappingURL=insurance.d.ts.map