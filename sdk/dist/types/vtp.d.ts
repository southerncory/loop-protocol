/**
 * VTP Types - Value Transfer Protocol
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
/** Escrow status */
export declare enum EscrowStatus {
    Active = 0,
    Released = 1,
    Cancelled = 2,
    Disputed = 3
}
/** VTP configuration */
export interface VtpConfig {
    authority: PublicKey;
    feeRecipient: PublicKey;
    totalTransfers: BN;
    totalVolume: BN;
    totalEscrows: BN;
    activeEscrows: BN;
    bump: number;
    initializedAt: BN;
}
/** Release condition for escrow */
export type ReleaseCondition = {
    arbiterApproval: {
        arbiter: PublicKey;
    };
} | {
    timeRelease: {
        timestamp: BN;
    };
} | {
    oracleAttestation: {
        oracle: PublicKey;
        dataHash: Uint8Array;
    };
} | {
    multiSig: {
        threshold: number;
        signers: PublicKey[];
    };
};
/** Escrow account */
export interface Escrow {
    sender: PublicKey;
    recipient: PublicKey;
    amount: BN;
    createdAt: BN;
    expiry: BN;
    status: EscrowStatus;
    conditions: ReleaseCondition[];
    conditionsMet: boolean[];
    bump: number;
}
/** Heir for inheritance */
export interface Heir {
    address: PublicKey;
    percentage: number;
    name: string;
}
/** Inheritance plan */
export interface InheritancePlan {
    owner: PublicKey;
    heirs: Heir[];
    inactivityThreshold: BN;
    lastActivity: BN;
    createdAt: BN;
    triggered: boolean;
    triggerTime: BN | null;
    bump: number;
}
//# sourceMappingURL=vtp.d.ts.map