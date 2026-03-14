/**
 * Vault Types
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
/** Type of value capture */
export declare enum CaptureType {
    Shopping = 0,
    Data = 1,
    Presence = 2,
    Attention = 3,
    Referral = 4
}
/** Agent permission levels for vault access */
export declare enum PermissionLevel {
    None = 0,
    Read = 1,
    Capture = 2,
    Guided = 3,
    Autonomous = 4
}
/** On-chain Vault account data */
export interface Vault {
    owner: PublicKey;
    credBalance: BN;
    stackedBalance: BN;
    pendingYield: BN;
    oxoBalance: BN;
    createdAt: BN;
    lastYieldClaim: BN;
    bump: number;
    totalCaptured: BN;
    totalWithdrawn: BN;
}
/** Stack (locked Cred) record */
export interface StackRecord {
    vault: PublicKey;
    amount: BN;
    startTime: BN;
    endTime: BN;
    apyBasisPoints: number;
    claimedYield: BN;
    isActive: boolean;
    bump: number;
}
/** Agent permission configuration */
export interface AgentPermission {
    vault: PublicKey;
    agent: PublicKey;
    level: PermissionLevel;
    dailyLimit: BN;
    dailyUsed: BN;
    lastReset: BN;
    bump: number;
}
/** Inheritance configuration */
export interface InheritanceConfig {
    vault: PublicKey;
    heir: PublicKey;
    inactivityThreshold: BN;
    lastActivity: BN;
    triggered: boolean;
    bump: number;
}
//# sourceMappingURL=vault.d.ts.map