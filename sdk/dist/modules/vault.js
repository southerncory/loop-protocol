/**
 * Vault Module - User-owned value storage with stacking
 *
 * Program ID: 76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7
 */
import { PublicKey, TransactionInstruction, SystemProgram, } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PROGRAM_IDS } from '../constants';
import { LoopPDA } from '../pda';
export class VaultModule {
    constructor(loop) {
        this.loop = loop;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PDA Helpers
    // ─────────────────────────────────────────────────────────────────────────
    getVaultAddress(owner) {
        return LoopPDA.vault(owner);
    }
    getStackAddress(vault, stackIndex) {
        return LoopPDA.stackRecord(vault, stackIndex);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Account Fetching
    // ─────────────────────────────────────────────────────────────────────────
    async getVault(owner) {
        const [vaultPda] = this.getVaultAddress(owner);
        const accountInfo = await this.loop.connection.getAccountInfo(vaultPda);
        if (!accountInfo)
            return null;
        return this.deserializeVault(accountInfo.data);
    }
    async exists(owner) {
        const [vaultPda] = this.getVaultAddress(owner);
        const accountInfo = await this.loop.connection.getAccountInfo(vaultPda);
        return accountInfo !== null;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Instructions
    // ─────────────────────────────────────────────────────────────────────────
    async initializeVault(owner) {
        const [vaultPda, bump] = this.getVaultAddress(owner);
        return this.createInstruction('initialize_vault', [{ pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { bump });
    }
    async deposit(owner, amount, userCredAccount, vaultCredAccount) {
        const [vaultPda] = this.getVaultAddress(owner);
        return this.createInstruction('deposit', [{ pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: userCredAccount, isSigner: false, isWritable: true },
            { pubkey: vaultCredAccount, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], { amount });
    }
    async capture(vault, amount, captureType, source, captureModule, credMint, vaultCredAccount) {
        const [captureAuthority] = LoopPDA.captureAuthority();
        return this.createInstruction('capture', [{ pubkey: vault, isSigner: false, isWritable: true },
            { pubkey: captureAuthority, isSigner: false, isWritable: false },
            { pubkey: credMint, isSigner: false, isWritable: true },
            { pubkey: vaultCredAccount, isSigner: false, isWritable: true },
            { pubkey: captureModule, isSigner: true, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], { amount, captureType, source });
    }
    async stack(owner, amount, durationDays, stackNonce) {
        const [vaultPda] = this.getVaultAddress(owner);
        const [stackPda] = this.getStackAddress(vaultPda, stackNonce);
        return this.createInstruction('stack', [{ pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: stackPda, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { amount, durationDays, stackNonce });
    }
    async unstack(owner, stackAddress) {
        const [vaultPda] = this.getVaultAddress(owner);
        return this.createInstruction('unstack', [{ pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: stackAddress, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: false }], {});
    }
    async withdraw(owner, amount, userCredAccount, vaultCredAccount) {
        const [vaultPda] = this.getVaultAddress(owner);
        return this.createInstruction('withdraw', [{ pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: vaultCredAccount, isSigner: false, isWritable: true },
            { pubkey: userCredAccount, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], { amount });
    }
    async setAgentPermission(owner, agent, permissionLevel, dailyLimit) {
        const [vaultPda] = this.getVaultAddress(owner);
        const [permPda] = LoopPDA.agentPermission(vaultPda, agent);
        return this.createInstruction('set_agent_permission', [{ pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: permPda, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { agent, permissionLevel, dailyLimit });
    }
    async claimYield(owner, stackAddress) {
        const [vaultPda] = this.getVaultAddress(owner);
        return this.createInstruction('claim_yield', [{ pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: stackAddress, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: false }], {});
    }
    async extract(owner, userCredAccount, vaultCredAccount, feeAccount) {
        const [vaultPda] = this.getVaultAddress(owner);
        return this.createInstruction('extract', [{ pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: vaultCredAccount, isSigner: false, isWritable: true },
            { pubkey: userCredAccount, isSigner: false, isWritable: true },
            { pubkey: feeAccount, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }], {});
    }
    async closeVault(owner) {
        const [vaultPda] = this.getVaultAddress(owner);
        return this.createInstruction('close_vault', [{ pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: true }], {});
    }
    async setHeir(owner, heir, inactivityThresholdDays) {
        const [vaultPda] = this.getVaultAddress(owner);
        const [inheritancePda] = LoopPDA.vaultInheritance(vaultPda);
        return this.createInstruction('set_heir', [{ pubkey: vaultPda, isSigner: false, isWritable: false },
            { pubkey: inheritancePda, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { heir, inactivityThresholdDays });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Agent-Directed Savings Strategies
    // ─────────────────────────────────────────────────────────────────────────
    /** Get auto-stack settings PDA for a vault */
    getAutoStackSettingsAddress(vault) {
        return PublicKey.findProgramAddressSync([Buffer.from('auto_stack'), vault.toBuffer()], PROGRAM_IDS.VAULT);
    }
    /** Configure auto-stacking preferences for a vault */
    async setAutoStack(owner, config) {
        const [vaultPda] = this.getVaultAddress(owner);
        const [autoStackPda] = this.getAutoStackSettingsAddress(vaultPda);
        return this.createInstruction('set_auto_stack', [{ pubkey: vaultPda, isSigner: false, isWritable: false },
            { pubkey: autoStackPda, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { config });
    }
    /** Revoke agent permission (closes PDA, returns rent to owner) */
    async revokeAgentPermission(owner, agent) {
        const [vaultPda] = this.getVaultAddress(owner);
        const [permPda] = LoopPDA.agentPermission(vaultPda, agent);
        return this.createInstruction('revoke_agent_permission', [{ pubkey: vaultPda, isSigner: false, isWritable: false },
            { pubkey: permPda, isSigner: false, isWritable: true },
            { pubkey: owner, isSigner: true, isWritable: true }], {});
    }
    /** Agent-authorized stacking operation */
    async agentStack(vaultOwner, agent, amount, durationDays, stackNonce) {
        const [vaultPda] = this.getVaultAddress(vaultOwner);
        const [permPda] = LoopPDA.agentPermission(vaultPda, agent);
        const [stackPda] = this.getStackAddress(vaultPda, stackNonce);
        return this.createInstruction('agent_stack', [{ pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: permPda, isSigner: false, isWritable: true },
            { pubkey: stackPda, isSigner: false, isWritable: true },
            { pubkey: agent, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { amount, durationDays, stackNonce });
    }
    /** Agent-authorized unstacking operation */
    async agentUnstack(vaultOwner, agent, stackAddress) {
        const [vaultPda] = this.getVaultAddress(vaultOwner);
        const [permPda] = LoopPDA.agentPermission(vaultPda, agent);
        return this.createInstruction('agent_unstack', [{ pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: permPda, isSigner: false, isWritable: false },
            { pubkey: stackAddress, isSigner: false, isWritable: true },
            { pubkey: agent, isSigner: true, isWritable: false }], {});
    }
    /** Agent rebalance analysis and suggestion */
    async agentRebalance(vaultOwner, agent, targetStackRatio) {
        const [vaultPda] = this.getVaultAddress(vaultOwner);
        const [permPda] = LoopPDA.agentPermission(vaultPda, agent);
        return this.createInstruction('agent_rebalance', [{ pubkey: vaultPda, isSigner: false, isWritable: false },
            { pubkey: permPda, isSigner: false, isWritable: false },
            { pubkey: agent, isSigner: true, isWritable: false }], { targetStackRatio });
    }
    /** Execute auto-restacking on a matured stack */
    async executeAutoRestack(vaultOwner, oldStackAddress, newStackNonce, cranker) {
        const [vaultPda] = this.getVaultAddress(vaultOwner);
        const [autoStackPda] = this.getAutoStackSettingsAddress(vaultPda);
        const [newStackPda] = this.getStackAddress(vaultPda, newStackNonce);
        return this.createInstruction('execute_auto_restack', [{ pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: autoStackPda, isSigner: false, isWritable: false },
            { pubkey: oldStackAddress, isSigner: false, isWritable: true },
            { pubkey: newStackPda, isSigner: false, isWritable: true },
            { pubkey: cranker, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { newStackNonce });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    calculateApy(durationDays) {
        if (durationDays >= 365)
            return 2000;
        if (durationDays >= 180)
            return 1800;
        if (durationDays >= 90)
            return 1500;
        if (durationDays >= 30)
            return 1000;
        if (durationDays >= 14)
            return 700;
        if (durationDays >= 7)
            return 500;
        return 200;
    }
    createInstruction(name, accounts, data) {
        const discriminator = Buffer.alloc(8);
        const dataBuffer = Buffer.from(JSON.stringify(data));
        return new TransactionInstruction({
            keys: accounts,
            programId: PROGRAM_IDS.VAULT,
            data: Buffer.concat([discriminator, dataBuffer]),
        });
    }
    deserializeVault(data) {
        return {};
    }
}
