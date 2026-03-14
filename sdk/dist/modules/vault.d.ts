/**
 * Vault Module - User-owned value storage with stacking
 *
 * Program ID: 76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7
 */
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { Vault, CaptureType, PermissionLevel } from '../types';
import type { Loop } from '../loop';
export declare class VaultModule {
    private readonly loop;
    constructor(loop: Loop);
    getVaultAddress(owner: PublicKey): [PublicKey, number];
    getStackAddress(vault: PublicKey, stackIndex: BN): [PublicKey, number];
    getVault(owner: PublicKey): Promise<Vault | null>;
    exists(owner: PublicKey): Promise<boolean>;
    initializeVault(owner: PublicKey): Promise<TransactionInstruction>;
    deposit(owner: PublicKey, amount: BN, userCredAccount: PublicKey, vaultCredAccount: PublicKey): Promise<TransactionInstruction>;
    capture(vault: PublicKey, amount: BN, captureType: CaptureType, source: string, captureModule: PublicKey, credMint: PublicKey, vaultCredAccount: PublicKey): Promise<TransactionInstruction>;
    stack(owner: PublicKey, amount: BN, durationDays: number, stackNonce: BN): Promise<TransactionInstruction>;
    unstack(owner: PublicKey, stackAddress: PublicKey): Promise<TransactionInstruction>;
    withdraw(owner: PublicKey, amount: BN, userCredAccount: PublicKey, vaultCredAccount: PublicKey): Promise<TransactionInstruction>;
    setAgentPermission(owner: PublicKey, agent: PublicKey, permissionLevel: PermissionLevel, dailyLimit: BN): Promise<TransactionInstruction>;
    claimYield(owner: PublicKey, stackAddress: PublicKey): Promise<TransactionInstruction>;
    extract(owner: PublicKey, userCredAccount: PublicKey, vaultCredAccount: PublicKey, feeAccount: PublicKey): Promise<TransactionInstruction>;
    closeVault(owner: PublicKey): Promise<TransactionInstruction>;
    setHeir(owner: PublicKey, heir: PublicKey, inactivityThresholdDays: number): Promise<TransactionInstruction>;
    /** Get auto-stack settings PDA for a vault */
    getAutoStackSettingsAddress(vault: PublicKey): [PublicKey, number];
    /** Configure auto-stacking preferences for a vault */
    setAutoStack(owner: PublicKey, config: {
        enabled: boolean;
        minDurationDays: number;
        reinvestYield: boolean;
        reinvestCaptures: boolean;
        targetStackRatio: number;
        minStackAmount: BN;
    }): Promise<TransactionInstruction>;
    /** Revoke agent permission (closes PDA, returns rent to owner) */
    revokeAgentPermission(owner: PublicKey, agent: PublicKey): Promise<TransactionInstruction>;
    /** Agent-authorized stacking operation */
    agentStack(vaultOwner: PublicKey, agent: PublicKey, amount: BN, durationDays: number, stackNonce: BN): Promise<TransactionInstruction>;
    /** Agent-authorized unstacking operation */
    agentUnstack(vaultOwner: PublicKey, agent: PublicKey, stackAddress: PublicKey): Promise<TransactionInstruction>;
    /** Agent rebalance analysis and suggestion */
    agentRebalance(vaultOwner: PublicKey, agent: PublicKey, targetStackRatio: number): Promise<TransactionInstruction>;
    /** Execute auto-restacking on a matured stack */
    executeAutoRestack(vaultOwner: PublicKey, oldStackAddress: PublicKey, newStackNonce: BN, cranker: PublicKey): Promise<TransactionInstruction>;
    calculateApy(durationDays: number): number;
    private createInstruction;
    private deserializeVault;
}
//# sourceMappingURL=vault.d.ts.map