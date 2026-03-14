/**
 * Loop Protocol - Simplified SDK Interface
 *
 * This wrapper provides the simplified interface expected by elizaOS agents.
 * Maps directly to the full SDK modules under the hood.
 *
 * @example
 * ```typescript
 * import { LoopSDK, CaptureType } from '@loop-protocol/sdk/simple';
 *
 * const loop = new LoopSDK({ rpc: 'http://localhost:8899', wallet });
 *
 * await loop.capture({ vault, amount, captureType, source });
 * await loop.stack({ amount: 50_000_000, durationDays: 90 });
 * await loop.createEscrow({ recipient, amount, conditions, expiry });
 * ```
 */
import { PublicKey, Keypair } from '@solana/web3.js';
import { CaptureType, PermissionLevel, Vault } from './index';
export { CaptureType, PermissionLevel };
export interface LoopSDKConfig {
    rpc: string;
    wallet: Keypair;
}
export interface CaptureParams {
    vault: PublicKey;
    amount: number;
    captureType: CaptureType;
    source: string;
    metadata?: Record<string, any>;
}
export interface StackParams {
    amount: number;
    durationDays: number;
}
export interface EscrowCondition {
    type: 'arbiter' | 'time' | 'outcome';
    arbiter?: PublicKey;
    arbiterPubkey?: PublicKey;
    timestamp?: number;
    deliveryDeadline?: number;
    outcome?: string;
}
export interface CreateEscrowParams {
    recipient: PublicKey;
    amount: number;
    conditions: EscrowCondition[];
    expiry: number;
}
/**
 * Simplified Loop SDK for elizaOS integration
 */
export declare class LoopSDK {
    private loop;
    private wallet;
    private connection;
    constructor(config: LoopSDKConfig);
    /**
     * Get or create a vault for the connected wallet
     */
    getOrCreateVault(owner?: PublicKey): Promise<{
        address: PublicKey;
        vault: Vault | null;
    }>;
    /**
     * Get vault balance (liquid Cred)
     */
    getVaultBalance(owner?: PublicKey): Promise<number>;
    /**
     * Get total vault value (liquid + stacked)
     */
    getTotalVaultValue(owner?: PublicKey): Promise<number>;
    /**
     * Capture value into a vault (Shopping, Data, Presence, Attention)
     *
     * @param params.vault - Target vault address
     * @param params.amount - Amount in Cred (6 decimals, e.g., 1_000_000 = 1 Cred)
     * @param params.captureType - Type of capture
     * @param params.source - Source identifier (e.g., transaction ID)
     * @param params.metadata - Optional metadata (e.g., { a2aTaskId })
     */
    capture(params: CaptureParams): Promise<string>;
    /**
     * Stack Cred for yield
     *
     * @param params.amount - Amount to stack (6 decimals)
     * @param params.durationDays - Lock duration (7-730 days)
     */
    stack(params: StackParams): Promise<string>;
    /**
     * Calculate APY for a given duration
     */
    calculateApy(durationDays: number): number;
    /**
     * Configure auto-stacking preferences
     *
     * Enables automated wealth-building by auto-reinvesting yields
     * and captures into new stacking positions.
     *
     * @param enabled - Whether auto-stacking is active
     * @param minDurationDays - Minimum lock duration for auto-stacks (7-730)
     * @param reinvestYield - Auto-reinvest yield from matured stacks
     * @param reinvestCaptures - Auto-stack incoming value captures
     * @param targetStackRatio - Target % of vault to keep stacked (0-100)
     * @param minStackAmount - Minimum amount to trigger auto-stack
     */
    setAutoStack(config: {
        enabled: boolean;
        minDurationDays: number;
        reinvestYield: boolean;
        reinvestCaptures: boolean;
        targetStackRatio: number;
        minStackAmount: number;
    }): Promise<string>;
    /**
     * Grant an agent permission to manage your vault
     *
     * Permission levels:
     * - Read: View vault balances only
     * - Capture: Can capture value into your vault
     * - Guided: Can stack/unstack with daily limits (no early withdrawal)
     * - Autonomous: Full control over stacking strategy
     *
     * @param agent - Agent's public key
     * @param level - Permission level (0-4)
     * @param dailyLimit - Maximum daily amount agent can move (for Guided)
     */
    grantAgentPermission(agent: PublicKey, level: PermissionLevel, dailyLimit?: number): Promise<string>;
    /**
     * Revoke an agent's permission to your vault
     *
     * Closes the permission PDA and returns rent to owner.
     *
     * @param agent - Agent's public key to revoke
     */
    revokeAgentPermission(agent: PublicKey): Promise<string>;
    /**
     * Agent: Stack funds on behalf of a user
     *
     * Requires Guided or Autonomous permission on the vault.
     *
     * @param vaultOwner - Owner of the target vault
     * @param amount - Amount to stack
     * @param durationDays - Lock duration
     */
    agentStack(vaultOwner: PublicKey, amount: number, durationDays: number): Promise<string>;
    /**
     * Agent: Unstack funds on behalf of a user
     *
     * Requires Guided or Autonomous permission.
     * Guided agents can only unstack matured positions.
     *
     * @param vaultOwner - Owner of the target vault
     * @param stackAddress - Address of the stack to unstack
     */
    agentUnstack(vaultOwner: PublicKey, stackAddress: PublicKey): Promise<string>;
    /**
     * Agent: Analyze vault and suggest rebalancing
     *
     * Emits a RebalanceSuggested event with recommendations.
     * Requires Autonomous permission.
     *
     * @param vaultOwner - Owner of the target vault
     * @param targetStackRatio - Target % to keep stacked (0-100)
     */
    agentRebalance(vaultOwner: PublicKey, targetStackRatio: number): Promise<string>;
    /**
     * Create an escrow with release conditions
     *
     * @param params.recipient - Recipient vault/address
     * @param params.amount - Amount to escrow
     * @param params.conditions - Release conditions
     * @param params.expiry - Unix timestamp for expiry
     */
    createEscrow(params: CreateEscrowParams): Promise<string>;
    /**
     * Direct vault-to-vault transfer
     */
    transfer(recipient: PublicKey, amount: number, memo?: string): Promise<string>;
    private sendTransaction;
}
export default LoopSDK;
//# sourceMappingURL=simple.d.ts.map