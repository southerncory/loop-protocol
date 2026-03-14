/**
 * AVP Types - Agent Value Protocol
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
/** Agent type */
export declare enum AgentType {
    Personal = 0,
    Service = 1
}
/** Agent status */
export declare enum AgentStatus {
    Active = 0,
    Suspended = 1,
    Revoked = 2
}
/** 8-byte capability identifier */
export type CapabilityId = Uint8Array;
/** Agent identity */
export interface AgentIdentity {
    agentPubkey: PublicKey;
    agentType: AgentType;
    createdAt: BN;
    principalHash: Uint8Array | null;
    bindingTimestamp: BN | null;
    creator: PublicKey | null;
    capabilities: CapabilityId[];
    stakeAmount: BN;
    stakeLockedUntil: BN;
    status: AgentStatus;
    reputationScore: number;
    metadataUri: string | null;
    bump: number;
}
//# sourceMappingURL=avp.d.ts.map