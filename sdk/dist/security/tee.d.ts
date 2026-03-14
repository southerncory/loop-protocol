/**
 * TEE Module - Trusted Execution Environment integration
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { EnclaveAttestation, VerificationResult, AgentRegistration } from '../types';
export declare class TeeModule {
    private connection;
    constructor(connection: Connection);
    getEnclaveAttestation(enclaveId: string): Promise<EnclaveAttestation>;
    verifyEnclaveCode(attestation: EnclaveAttestation, expectedHash: string): Promise<VerificationResult>;
    registerTrustedAgent(user: PublicKey, attestation: EnclaveAttestation): Promise<AgentRegistration>;
}
//# sourceMappingURL=tee.d.ts.map