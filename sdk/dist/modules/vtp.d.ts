/**
 * VTP Module - Value Transfer Protocol (transfers, escrow, inheritance)
 *
 * Program ID: 4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj
 */
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { ReleaseCondition, Heir } from '../types';
import type { Loop } from '../loop';
export declare class VtpModule {
    private readonly loop;
    constructor(loop: Loop);
    getConfigAddress(): [PublicKey, number];
    getEscrowAddress(sender: PublicKey, recipient: PublicKey, createdAt: BN): [PublicKey, number];
    getInheritanceAddress(owner: PublicKey): [PublicKey, number];
    initialize(authority: PublicKey, feeRecipient: PublicKey): Promise<TransactionInstruction>;
    transfer(sender: PublicKey, recipient: PublicKey, amount: BN, memo: string | null, senderCredAccount: PublicKey, recipientCredAccount: PublicKey, feeAccount: PublicKey): Promise<TransactionInstruction>;
    batchTransfer(sender: PublicKey, recipients: PublicKey[], amounts: BN[], senderCredAccount: PublicKey): Promise<TransactionInstruction>;
    createEscrow(sender: PublicKey, recipient: PublicKey, amount: BN, releaseConditions: ReleaseCondition[], expiry: BN, senderCredAccount: PublicKey, escrowCredAccount: PublicKey, feeAccount: PublicKey): Promise<TransactionInstruction>;
    fulfillCondition(fulfiller: PublicKey, escrow: PublicKey, conditionIndex: number, proof: Uint8Array | null): Promise<TransactionInstruction>;
    releaseEscrow(releaser: PublicKey, escrow: PublicKey, escrowCredAccount: PublicKey, recipientCredAccount: PublicKey): Promise<TransactionInstruction>;
    cancelEscrow(canceller: PublicKey, escrow: PublicKey, escrowCredAccount: PublicKey, senderCredAccount: PublicKey): Promise<TransactionInstruction>;
    setupInheritance(owner: PublicKey, heirs: Heir[], inactivityThreshold: BN): Promise<TransactionInstruction>;
    inheritanceHeartbeat(owner: PublicKey): Promise<TransactionInstruction>;
    triggerInheritance(triggerer: PublicKey, inheritancePlan: PublicKey): Promise<TransactionInstruction>;
    executeInheritance(executor: PublicKey, inheritancePlan: PublicKey): Promise<TransactionInstruction>;
    arbiterCondition(arbiter: PublicKey): ReleaseCondition;
    timeCondition(timestamp: BN): ReleaseCondition;
    oracleCondition(oracle: PublicKey, dataHash: Uint8Array): ReleaseCondition;
    multiSigCondition(threshold: number, signers: PublicKey[]): ReleaseCondition;
    private createInstruction;
}
//# sourceMappingURL=vtp.d.ts.map