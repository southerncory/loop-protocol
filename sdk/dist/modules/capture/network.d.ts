/**
 * Network Capture Module - Monetize network participation
 */
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { NodeType, AttestationType, NetworkStats } from '../../types';
import type { Loop } from '../../loop';
export declare class NetworkCaptureModule {
    private readonly loop;
    constructor(loop: Loop);
    getNodeRegistrationAddress(operator: PublicKey): [PublicKey, number];
    getVoteAddress(voter: PublicKey, proposalId: string): [PublicKey, number];
    getAttestationAddress(attester: PublicKey, dataHash: Uint8Array): [PublicKey, number];
    registerNode(user: PublicKey, nodeType: NodeType, capabilities: string[]): Promise<TransactionInstruction>;
    submitVote(user: PublicKey, proposalId: string, vote: boolean, proof: Uint8Array): Promise<TransactionInstruction>;
    submitAttestation(user: PublicKey, dataHash: Uint8Array, attestationType: AttestationType): Promise<TransactionInstruction>;
    claimParticipationReward(user: PublicKey, activityIds: string[]): Promise<TransactionInstruction>;
    getNetworkStats(user: PublicKey): Promise<NetworkStats>;
    private createInstruction;
    private deserializeNetworkStats;
}
//# sourceMappingURL=network.d.ts.map