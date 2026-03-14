/**
 * AVP Module - Agent Value Protocol (identity, capabilities, reputation)
 *
 * Program ID: H5c9xfPYcx6EtC8hpThshARtUR7tq1NfMJVrTx8z9Jcx
 */
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { AgentIdentity, CapabilityId } from '../types';
import type { Loop } from '../loop';
export declare class AvpModule {
    private readonly loop;
    constructor(loop: Loop);
    getAgentAddress(agent: PublicKey): [PublicKey, number];
    getAgent(agent: PublicKey): Promise<AgentIdentity | null>;
    isRegistered(agent: PublicKey): Promise<boolean>;
    registerPersonalAgent(agent: PublicKey, principalHash: Uint8Array, metadataUri: string | null): Promise<TransactionInstruction>;
    registerServiceAgent(creator: PublicKey, agent: PublicKey, metadataUri: string | null, creatorOxoAccount: PublicKey): Promise<TransactionInstruction>;
    bindAgent(agent: PublicKey, newPrincipalHash: Uint8Array): Promise<TransactionInstruction>;
    revokeAgent(agent: PublicKey): Promise<TransactionInstruction>;
    suspendAgent(authority: PublicKey, agentIdentity: PublicKey, reason: string): Promise<TransactionInstruction>;
    reactivateAgent(authority: PublicKey, agentIdentity: PublicKey): Promise<TransactionInstruction>;
    declareCapabilities(agent: PublicKey, capabilities: CapabilityId[]): Promise<TransactionInstruction>;
    addStake(creator: PublicKey, agentIdentity: PublicKey, amount: BN): Promise<TransactionInstruction>;
    updateReputation(authority: PublicKey, agentIdentity: PublicKey, delta: number): Promise<TransactionInstruction>;
    updateMetadata(agent: PublicKey, newUri: string): Promise<TransactionInstruction>;
    createCapabilityId(name: string): CapabilityId;
    static readonly CAPABILITIES: {
        CAPTURE_SHOPPING: Uint8Array<ArrayBuffer>;
        CAPTURE_DATA: Uint8Array<ArrayBuffer>;
        CAPTURE_PRESENCE: Uint8Array<ArrayBuffer>;
        CAPTURE_ATTENTION: Uint8Array<ArrayBuffer>;
        TRANSFER: Uint8Array<ArrayBuffer>;
        ESCROW: Uint8Array<ArrayBuffer>;
        STACK: Uint8Array<ArrayBuffer>;
    };
    private createInstruction;
    private deserializeAgentIdentity;
}
//# sourceMappingURL=avp.d.ts.map