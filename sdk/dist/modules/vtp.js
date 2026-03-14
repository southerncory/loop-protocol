/**
 * VTP Module - Value Transfer Protocol (transfers, escrow, inheritance)
 *
 * Program ID: 4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj
 */
import { TransactionInstruction, SystemProgram, } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { PROGRAM_IDS } from '../constants';
import { LoopPDA } from '../pda';
export class VtpModule {
    constructor(loop) {
        this.loop = loop;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PDA Helpers
    // ─────────────────────────────────────────────────────────────────────────
    getConfigAddress() {
        return LoopPDA.vtpConfig();
    }
    getEscrowAddress(sender, recipient, createdAt) {
        return LoopPDA.escrow(sender, recipient, createdAt);
    }
    getInheritanceAddress(owner) {
        return LoopPDA.vtpInheritance(owner);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Instructions - Initialization
    // ─────────────────────────────────────────────────────────────────────────
    async initialize(authority, feeRecipient) {
        const [configPda, bump] = this.getConfigAddress();
        return this.createInstruction('initialize', [{ pubkey: authority, isSigner: true, isWritable: true },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: feeRecipient, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { bump });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Instructions - Direct Transfers
    // ─────────────────────────────────────────────────────────────────────────
    async transfer(sender, recipient, amount, memo, senderCredAccount, recipientCredAccount, feeAccount) {
        const [configPda] = this.getConfigAddress();
        return this.createInstruction('transfer', [{ pubkey: sender, isSigner: true, isWritable: true },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: recipient, isSigner: false, isWritable: false },
            { pubkey: senderCredAccount, isSigner: false, isWritable: true },
            { pubkey: recipientCredAccount, isSigner: false, isWritable: true },
            { pubkey: feeAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], { amount, memo });
    }
    async batchTransfer(sender, recipients, amounts, senderCredAccount) {
        const [configPda] = this.getConfigAddress();
        return this.createInstruction('batch_transfer', [{ pubkey: sender, isSigner: true, isWritable: true },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: senderCredAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], { recipients: recipients.map(r => r.toBase58()), amounts: amounts.map(a => a.toString()) });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Instructions - Escrow
    // ─────────────────────────────────────────────────────────────────────────
    async createEscrow(sender, recipient, amount, releaseConditions, expiry, senderCredAccount, escrowCredAccount, feeAccount) {
        const [configPda] = this.getConfigAddress();
        const now = new BN(Math.floor(Date.now() / 1000));
        const [escrowPda, bump] = this.getEscrowAddress(sender, recipient, now);
        return this.createInstruction('create_escrow', [{ pubkey: sender, isSigner: true, isWritable: true },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: recipient, isSigner: false, isWritable: false },
            { pubkey: escrowPda, isSigner: false, isWritable: true },
            { pubkey: senderCredAccount, isSigner: false, isWritable: true },
            { pubkey: escrowCredAccount, isSigner: false, isWritable: true },
            { pubkey: feeAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { amount, releaseConditions, expiry, bump });
    }
    async fulfillCondition(fulfiller, escrow, conditionIndex, proof) {
        return this.createInstruction('fulfill_condition', [{ pubkey: fulfiller, isSigner: true, isWritable: false },
            { pubkey: escrow, isSigner: false, isWritable: true }], { conditionIndex, proof: proof ? Array.from(proof) : null });
    }
    async releaseEscrow(releaser, escrow, escrowCredAccount, recipientCredAccount) {
        const [configPda] = this.getConfigAddress();
        return this.createInstruction('release_escrow', [{ pubkey: releaser, isSigner: true, isWritable: false },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: escrow, isSigner: false, isWritable: true },
            { pubkey: escrowCredAccount, isSigner: false, isWritable: true },
            { pubkey: recipientCredAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], {});
    }
    async cancelEscrow(canceller, escrow, escrowCredAccount, senderCredAccount) {
        const [configPda] = this.getConfigAddress();
        return this.createInstruction('cancel_escrow', [{ pubkey: canceller, isSigner: true, isWritable: false },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: escrow, isSigner: false, isWritable: true },
            { pubkey: escrowCredAccount, isSigner: false, isWritable: true },
            { pubkey: senderCredAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], {});
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Instructions - Inheritance
    // ─────────────────────────────────────────────────────────────────────────
    async setupInheritance(owner, heirs, inactivityThreshold) {
        const [inheritancePda, bump] = this.getInheritanceAddress(owner);
        return this.createInstruction('setup_inheritance', [{ pubkey: owner, isSigner: true, isWritable: true },
            { pubkey: inheritancePda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { heirs, inactivityThreshold, bump });
    }
    async inheritanceHeartbeat(owner) {
        const [inheritancePda] = this.getInheritanceAddress(owner);
        return this.createInstruction('inheritance_heartbeat', [{ pubkey: owner, isSigner: true, isWritable: false },
            { pubkey: inheritancePda, isSigner: false, isWritable: true }], {});
    }
    async triggerInheritance(triggerer, inheritancePlan) {
        return this.createInstruction('trigger_inheritance', [{ pubkey: triggerer, isSigner: true, isWritable: false },
            { pubkey: inheritancePlan, isSigner: false, isWritable: true }], {});
    }
    async executeInheritance(executor, inheritancePlan) {
        return this.createInstruction('execute_inheritance', [{ pubkey: executor, isSigner: true, isWritable: false },
            { pubkey: inheritancePlan, isSigner: false, isWritable: true }], {});
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    arbiterCondition(arbiter) {
        return { arbiterApproval: { arbiter } };
    }
    timeCondition(timestamp) {
        return { timeRelease: { timestamp } };
    }
    oracleCondition(oracle, dataHash) {
        return { oracleAttestation: { oracle, dataHash } };
    }
    multiSigCondition(threshold, signers) {
        return { multiSig: { threshold, signers } };
    }
    createInstruction(name, accounts, data) {
        const discriminator = Buffer.alloc(8);
        const dataBuffer = Buffer.from(JSON.stringify(data));
        return new TransactionInstruction({
            keys: accounts,
            programId: PROGRAM_IDS.VTP,
            data: Buffer.concat([discriminator, dataBuffer]),
        });
    }
}
