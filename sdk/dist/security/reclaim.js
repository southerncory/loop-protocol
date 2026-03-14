/**
 * Reclaim Module - ZK proofs for trustless capture verification
 */
export class ReclaimModule {
    constructor(connection) {
        this.connection = connection;
    }
    async generateCaptureProof(captureType, sessionData) {
        throw new Error('Reclaim integration not yet implemented - requires @reclaim/sdk');
    }
    async verifyProof(proof, expectedClaims) {
        throw new Error('Reclaim integration not yet implemented - requires @reclaim/sdk');
    }
    async submitVerifiedCapture(user, proof, captureType) {
        throw new Error('Reclaim integration not yet implemented - requires @reclaim/sdk');
    }
}
