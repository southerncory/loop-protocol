/**
 * Compute Capture Module - Monetize computational resources
 */
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { ResourceSpec, ComputeStats } from '../../types';
import type { Loop } from '../../loop';
export declare class ComputeCaptureModule {
    private readonly loop;
    constructor(loop: Loop);
    getResourceProfileAddress(provider: PublicKey): [PublicKey, number];
    getTaskAcceptanceAddress(provider: PublicKey, taskId: string): [PublicKey, number];
    getTaskSubmissionAddress(provider: PublicKey, taskId: string): [PublicKey, number];
    registerResources(user: PublicKey, resources: ResourceSpec): Promise<TransactionInstruction>;
    acceptTask(user: PublicKey, taskId: string, bid: BN): Promise<TransactionInstruction>;
    submitTaskResult(user: PublicKey, taskId: string, resultHash: Uint8Array, proof: Uint8Array): Promise<TransactionInstruction>;
    claimComputeReward(user: PublicKey, taskIds: string[]): Promise<TransactionInstruction>;
    getComputeStats(user: PublicKey): Promise<ComputeStats>;
    private createInstruction;
    private deserializeComputeStats;
}
//# sourceMappingURL=compute.d.ts.map