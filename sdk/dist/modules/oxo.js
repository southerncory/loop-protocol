/**
 * OXO Module - Protocol equity with veOXO staking and bonding curves
 *
 * Program ID: 3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z
 */
import { TransactionInstruction, SystemProgram, } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { PROGRAM_IDS, CONSTANTS } from '../constants';
import { LoopPDA } from '../pda';
export class OxoModule {
    constructor(loop) {
        this.loop = loop;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PDA Helpers
    // ─────────────────────────────────────────────────────────────────────────
    getConfigAddress() {
        return LoopPDA.oxoConfig();
    }
    getVePositionAddress(owner) {
        return LoopPDA.veOxoPosition(owner);
    }
    getBondingCurveAddress(agentMint) {
        return LoopPDA.bondingCurve(agentMint);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Account Fetching
    // ─────────────────────────────────────────────────────────────────────────
    async getConfig() {
        const [configPda] = this.getConfigAddress();
        const accountInfo = await this.loop.connection.getAccountInfo(configPda);
        if (!accountInfo)
            return null;
        return this.deserializeOxoConfig(accountInfo.data);
    }
    async getVePosition(owner) {
        const [positionPda] = this.getVePositionAddress(owner);
        const accountInfo = await this.loop.connection.getAccountInfo(positionPda);
        if (!accountInfo)
            return null;
        return this.deserializeVePosition(accountInfo.data);
    }
    async getBondingCurve(agentMint) {
        const [curvePda] = this.getBondingCurveAddress(agentMint);
        const accountInfo = await this.loop.connection.getAccountInfo(curvePda);
        if (!accountInfo)
            return null;
        return this.deserializeBondingCurve(accountInfo.data);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Instructions - veOXO Staking
    // ─────────────────────────────────────────────────────────────────────────
    async initialize(authority, oxoMint, treasury) {
        const [configPda, bump] = this.getConfigAddress();
        return this.createInstruction('initialize', [{ pubkey: authority, isSigner: true, isWritable: true },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: oxoMint, isSigner: false, isWritable: false },
            { pubkey: treasury, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { bump });
    }
    async lockOxo(owner, amount, lockSeconds, userOxoAccount, protocolOxoAccount) {
        const [configPda] = this.getConfigAddress();
        const [positionPda, bump] = this.getVePositionAddress(owner);
        return this.createInstruction('lock_oxo', [{ pubkey: owner, isSigner: true, isWritable: true },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: positionPda, isSigner: false, isWritable: true },
            { pubkey: userOxoAccount, isSigner: false, isWritable: true },
            { pubkey: protocolOxoAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { amount, lockSeconds, bump });
    }
    async extendLock(owner, additionalSeconds) {
        const [configPda] = this.getConfigAddress();
        const [positionPda] = this.getVePositionAddress(owner);
        return this.createInstruction('extend_lock', [{ pubkey: owner, isSigner: true, isWritable: false },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: positionPda, isSigner: false, isWritable: true }], { additionalSeconds });
    }
    async unlockOxo(owner, userOxoAccount, protocolOxoAccount) {
        const [configPda] = this.getConfigAddress();
        const [positionPda] = this.getVePositionAddress(owner);
        return this.createInstruction('unlock_oxo', [{ pubkey: owner, isSigner: true, isWritable: false },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: positionPda, isSigner: false, isWritable: true },
            { pubkey: userOxoAccount, isSigner: false, isWritable: true },
            { pubkey: protocolOxoAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], {});
    }
    async claimFeeShare(owner, feePoolAccount, userCredAccount) {
        const [configPda] = this.getConfigAddress();
        const [positionPda] = this.getVePositionAddress(owner);
        return this.createInstruction('claim_fee_share', [{ pubkey: owner, isSigner: true, isWritable: false },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: positionPda, isSigner: false, isWritable: true },
            { pubkey: feePoolAccount, isSigner: false, isWritable: true },
            { pubkey: userCredAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], {});
    }
    async getCurrentVeOxo(owner) {
        const position = await this.getVePosition(owner);
        if (!position)
            return new BN(0);
        return this.calculateDecayedVeOxo(position);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Instructions - Bonding Curves
    // ─────────────────────────────────────────────────────────────────────────
    async createAgentToken(creator, agentMint, name, symbol, uri, creatorOxoAccount, treasuryOxoAccount) {
        const [configPda] = this.getConfigAddress();
        const [curvePda, bump] = this.getBondingCurveAddress(agentMint);
        return this.createInstruction('create_agent_token', [{ pubkey: creator, isSigner: true, isWritable: true },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: curvePda, isSigner: false, isWritable: true },
            { pubkey: agentMint, isSigner: false, isWritable: true },
            { pubkey: creatorOxoAccount, isSigner: false, isWritable: true },
            { pubkey: treasuryOxoAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { name, symbol, uri, bump });
    }
    async buyAgentToken(buyer, agentMint, oxoAmount, buyerOxoAccount, buyerAgentAccount, curveOxoAccount) {
        const [curvePda] = this.getBondingCurveAddress(agentMint);
        return this.createInstruction('buy_agent_token', [{ pubkey: buyer, isSigner: true, isWritable: true },
            { pubkey: curvePda, isSigner: false, isWritable: true },
            { pubkey: agentMint, isSigner: false, isWritable: true },
            { pubkey: buyerOxoAccount, isSigner: false, isWritable: true },
            { pubkey: buyerAgentAccount, isSigner: false, isWritable: true },
            { pubkey: curveOxoAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], { oxoAmount });
    }
    async sellAgentToken(seller, agentMint, tokenAmount, sellerOxoAccount, sellerAgentAccount, curveOxoAccount) {
        const [curvePda] = this.getBondingCurveAddress(agentMint);
        return this.createInstruction('sell_agent_token', [{ pubkey: seller, isSigner: true, isWritable: true },
            { pubkey: curvePda, isSigner: false, isWritable: true },
            { pubkey: agentMint, isSigner: false, isWritable: true },
            { pubkey: sellerOxoAccount, isSigner: false, isWritable: true },
            { pubkey: sellerAgentAccount, isSigner: false, isWritable: true },
            { pubkey: curveOxoAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], { tokenAmount });
    }
    async depositFees(authority, amount, sourceAccount, feePoolAccount) {
        const [configPda] = this.getConfigAddress();
        return this.createInstruction('deposit_fees', [{ pubkey: authority, isSigner: true, isWritable: true },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: sourceAccount, isSigner: false, isWritable: true },
            { pubkey: feePoolAccount, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], { amount });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    calculateVeOxo(amount, lockSeconds) {
        const sixMonths = new BN(CONSTANTS.MIN_LOCK_SECONDS);
        const fourYears = new BN(CONSTANTS.MAX_LOCK_SECONDS);
        if (lockSeconds.lte(sixMonths)) {
            return amount.div(new BN(4));
        }
        if (lockSeconds.gte(fourYears)) {
            return amount.mul(new BN(2));
        }
        const range = fourYears.sub(sixMonths);
        const progress = lockSeconds.sub(sixMonths);
        const baseMultiplier = new BN(25);
        const additional = progress.mul(new BN(175)).div(range);
        const totalMultiplier = baseMultiplier.add(additional);
        return amount.mul(totalMultiplier).div(new BN(100));
    }
    calculateDecayedVeOxo(position) {
        const now = new BN(Math.floor(Date.now() / 1000));
        if (now.gte(position.unlockAt)) {
            return new BN(0);
        }
        if (now.lte(position.lockStart)) {
            return position.veOxoBalance;
        }
        const totalDuration = position.unlockAt.sub(position.lockStart);
        const timeRemaining = position.unlockAt.sub(now);
        return position.veOxoBalance.mul(timeRemaining).div(totalDuration);
    }
    createInstruction(name, accounts, data) {
        const discriminator = Buffer.alloc(8);
        const dataBuffer = Buffer.from(JSON.stringify(data));
        return new TransactionInstruction({
            keys: accounts,
            programId: PROGRAM_IDS.OXO,
            data: Buffer.concat([discriminator, dataBuffer]),
        });
    }
    deserializeOxoConfig(data) {
        return {};
    }
    deserializeVePosition(data) {
        return {};
    }
    deserializeBondingCurve(data) {
        return {};
    }
}
