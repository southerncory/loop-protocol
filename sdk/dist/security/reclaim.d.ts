/**
 * Reclaim Module - ZK proofs for trustless capture verification
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { CaptureType, ZKProof, VerificationResult, CaptureResult } from '../types';
export declare class ReclaimModule {
    private connection;
    constructor(connection: Connection);
    generateCaptureProof(captureType: CaptureType, sessionData: Record<string, unknown>): Promise<ZKProof>;
    verifyProof(proof: ZKProof, expectedClaims: Record<string, unknown>): Promise<VerificationResult>;
    submitVerifiedCapture(user: PublicKey, proof: ZKProof, captureType: CaptureType): Promise<CaptureResult>;
}
//# sourceMappingURL=reclaim.d.ts.map