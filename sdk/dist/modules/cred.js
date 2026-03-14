/**
 * Cred Module - Stable value token (1 Cred = $1 USDC)
 *
 * Program ID: FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA
 */
import { TransactionInstruction, SystemProgram, } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { PROGRAM_IDS } from '../constants';
import { LoopPDA } from '../pda';
export class CredModule {
    constructor(loop) {
        this.loop = loop;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PDA Helpers
    // ─────────────────────────────────────────────────────────────────────────
    getConfigAddress() {
        return LoopPDA.credConfig();
    }
    getCaptureAuthAddress(moduleAddress) {
        return LoopPDA.captureAuth(moduleAddress);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Account Fetching
    // ─────────────────────────────────────────────────────────────────────────
    async getConfig() {
        const [configPda] = this.getConfigAddress();
        const accountInfo = await this.loop.connection.getAccountInfo(configPda);
        if (!accountInfo)
            return null;
        return this.deserializeCredConfig(accountInfo.data);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Instructions
    // ─────────────────────────────────────────────────────────────────────────
    async initialize(authority, usdcMint, credMint, reserveVault) {
        const [configPda] = this.getConfigAddress();
        return this.createInstruction('initialize', [{ pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: usdcMint, isSigner: false, isWritable: false },
            { pubkey: credMint, isSigner: false, isWritable: true },
            { pubkey: reserveVault, isSigner: false, isWritable: false },
            { pubkey: authority, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], {});
    }
    async wrap(user, amount, userUsdcAccount, userCredAccount, credMint, reserveVault) {
        const [configPda] = this.getConfigAddress();
        return this.createInstruction('wrap', [{ pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: credMint, isSigner: false, isWritable: true },
            { pubkey: reserveVault, isSigner: false, isWritable: true },
            { pubkey: userUsdcAccount, isSigner: false, isWritable: true },
            { pubkey: userCredAccount, isSigner: false, isWritable: true },
            { pubkey: user, isSigner: true, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], { amount });
    }
    async unwrap(user, amount, userCredAccount, userUsdcAccount, credMint, reserveVault) {
        const [configPda] = this.getConfigAddress();
        return this.createInstruction('unwrap', [{ pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: credMint, isSigner: false, isWritable: true },
            { pubkey: reserveVault, isSigner: false, isWritable: true },
            { pubkey: userCredAccount, isSigner: false, isWritable: true },
            { pubkey: userUsdcAccount, isSigner: false, isWritable: true },
            { pubkey: user, isSigner: true, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], { amount });
    }
    async captureMint(captureSigner, amount, captureType, destinationCredAccount, credMint, reserveVault, captureUsdcAccount) {
        const [configPda] = this.getConfigAddress();
        const [captureAuthPda] = this.getCaptureAuthAddress(captureSigner);
        return this.createInstruction('capture_mint', [{ pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: captureAuthPda, isSigner: false, isWritable: true },
            { pubkey: credMint, isSigner: false, isWritable: true },
            { pubkey: reserveVault, isSigner: false, isWritable: true },
            { pubkey: captureUsdcAccount, isSigner: false, isWritable: true },
            { pubkey: destinationCredAccount, isSigner: false, isWritable: true },
            { pubkey: captureSigner, isSigner: true, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], { amount, captureType });
    }
    async registerCaptureModule(authority, moduleAddress, captureType, moduleName) {
        const [configPda] = this.getConfigAddress();
        const [captureAuthPda] = this.getCaptureAuthAddress(moduleAddress);
        return this.createInstruction('register_capture_module', [{ pubkey: configPda, isSigner: false, isWritable: false },
            { pubkey: captureAuthPda, isSigner: false, isWritable: true },
            { pubkey: moduleAddress, isSigner: false, isWritable: false },
            { pubkey: authority, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { captureType, moduleName });
    }
    async getReserveStatus(reserveVault, credMint) {
        return {
            usdcReserve: new BN(0),
            credSupply: new BN(0),
            backingRatio: new BN(10000),
            totalMinted: new BN(0),
            totalBurned: new BN(0),
        };
    }
    createInstruction(name, accounts, data) {
        const discriminator = Buffer.alloc(8);
        const dataBuffer = Buffer.from(JSON.stringify(data));
        return new TransactionInstruction({
            keys: accounts,
            programId: PROGRAM_IDS.CRED,
            data: Buffer.concat([discriminator, dataBuffer]),
        });
    }
    deserializeCredConfig(data) {
        return {};
    }
}
