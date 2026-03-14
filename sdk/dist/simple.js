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
import { Connection, Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { Loop, CaptureType, PermissionLevel } from './index';
export { CaptureType, PermissionLevel };
// ============================================================================
// SIMPLIFIED SDK CLASS
// ============================================================================
/**
 * Simplified Loop SDK for elizaOS integration
 */
export class LoopSDK {
    constructor(config) {
        this.connection = new Connection(config.rpc, 'confirmed');
        this.wallet = config.wallet;
        this.loop = new Loop({ connection: this.connection });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Vault Operations
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Get or create a vault for the connected wallet
     */
    async getOrCreateVault(owner) {
        const vaultOwner = owner || this.wallet.publicKey;
        const [vaultAddress] = this.loop.vault.getVaultAddress(vaultOwner);
        const exists = await this.loop.vault.exists(vaultOwner);
        if (!exists) {
            const ix = await this.loop.vault.initializeVault(vaultOwner);
            const tx = new Transaction().add(ix);
            await this.sendTransaction(tx);
        }
        const vault = await this.loop.vault.getVault(vaultOwner);
        return { address: vaultAddress, vault };
    }
    /**
     * Get vault balance (liquid Cred)
     */
    async getVaultBalance(owner) {
        const vaultOwner = owner || this.wallet.publicKey;
        const vault = await this.loop.vault.getVault(vaultOwner);
        if (!vault)
            return 0;
        return vault.credBalance.toNumber();
    }
    /**
     * Get total vault value (liquid + stacked)
     */
    async getTotalVaultValue(owner) {
        const vaultOwner = owner || this.wallet.publicKey;
        const vault = await this.loop.vault.getVault(vaultOwner);
        if (!vault)
            return 0;
        return vault.credBalance.add(vault.stackedBalance).toNumber();
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Capture (Value Acquisition)
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Capture value into a vault (Shopping, Data, Presence, Attention)
     *
     * @param params.vault - Target vault address
     * @param params.amount - Amount in Cred (6 decimals, e.g., 1_000_000 = 1 Cred)
     * @param params.captureType - Type of capture
     * @param params.source - Source identifier (e.g., transaction ID)
     * @param params.metadata - Optional metadata (e.g., { a2aTaskId })
     */
    async capture(params) {
        // In production, this would:
        // 1. Verify capture module is authorized
        // 2. Call loop.vault.capture() with proper accounts
        // 3. Return transaction signature
        console.log(`[Loop] Capturing ${params.amount} Cred into vault ${params.vault.toBase58()}`);
        console.log(`[Loop] Type: ${CaptureType[params.captureType]}, Source: ${params.source}`);
        if (params.metadata) {
            console.log(`[Loop] Metadata:`, params.metadata);
        }
        // TODO: Implement full capture with authorized module
        // For demo, return mock signature
        return `capture_${Date.now()}_${params.source}`;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Stacking (Yield)
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Stack Cred for yield
     *
     * @param params.amount - Amount to stack (6 decimals)
     * @param params.durationDays - Lock duration (7-730 days)
     */
    async stack(params) {
        const owner = this.wallet.publicKey;
        const vault = await this.loop.vault.getVault(owner);
        if (!vault) {
            throw new Error('Vault not found. Call getOrCreateVault first.');
        }
        const balance = vault.credBalance.toNumber();
        if (balance < params.amount) {
            throw new Error(`Insufficient balance. Have ${balance}, need ${params.amount}`);
        }
        const apy = this.loop.vault.calculateApy(params.durationDays);
        console.log(`[Loop] Stacking ${params.amount} Cred for ${params.durationDays} days @ ${apy / 100}% APY`);
        // Use current timestamp as nonce for unique stack PDA
        const stackNonce = new BN(Date.now());
        const ix = await this.loop.vault.stack(owner, new BN(params.amount), params.durationDays, stackNonce);
        const tx = new Transaction().add(ix);
        const sig = await this.sendTransaction(tx);
        return sig;
    }
    /**
     * Calculate APY for a given duration
     */
    calculateApy(durationDays) {
        return this.loop.vault.calculateApy(durationDays);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Agent-Directed Savings Strategies
    // ─────────────────────────────────────────────────────────────────────────
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
    async setAutoStack(config) {
        const owner = this.wallet.publicKey;
        console.log(`[Loop] Configuring auto-stack: enabled=${config.enabled}, reinvestYield=${config.reinvestYield}`);
        console.log(`[Loop] Target stack ratio: ${config.targetStackRatio}%, min amount: ${config.minStackAmount}`);
        const ix = await this.loop.vault.setAutoStack(owner, {
            ...config,
            minStackAmount: new BN(config.minStackAmount),
        });
        const tx = new Transaction().add(ix);
        const sig = await this.sendTransaction(tx);
        return sig;
    }
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
    async grantAgentPermission(agent, level, dailyLimit = 0) {
        const owner = this.wallet.publicKey;
        const levelNames = ['None', 'Read', 'Capture', 'Guided', 'Autonomous'];
        console.log(`[Loop] Granting ${levelNames[level]} permission to agent ${agent.toBase58()}`);
        if (level === PermissionLevel.Guided) {
            console.log(`[Loop] Daily limit: ${dailyLimit}`);
        }
        const ix = await this.loop.vault.setAgentPermission(owner, agent, level, new BN(dailyLimit));
        const tx = new Transaction().add(ix);
        const sig = await this.sendTransaction(tx);
        return sig;
    }
    /**
     * Revoke an agent's permission to your vault
     *
     * Closes the permission PDA and returns rent to owner.
     *
     * @param agent - Agent's public key to revoke
     */
    async revokeAgentPermission(agent) {
        const owner = this.wallet.publicKey;
        console.log(`[Loop] Revoking permission for agent ${agent.toBase58()}`);
        const ix = await this.loop.vault.revokeAgentPermission(owner, agent);
        const tx = new Transaction().add(ix);
        const sig = await this.sendTransaction(tx);
        return sig;
    }
    /**
     * Agent: Stack funds on behalf of a user
     *
     * Requires Guided or Autonomous permission on the vault.
     *
     * @param vaultOwner - Owner of the target vault
     * @param amount - Amount to stack
     * @param durationDays - Lock duration
     */
    async agentStack(vaultOwner, amount, durationDays) {
        const agent = this.wallet.publicKey;
        const stackNonce = new BN(Date.now());
        console.log(`[Loop] Agent stacking ${amount} Cred for ${vaultOwner.toBase58()}`);
        console.log(`[Loop] Duration: ${durationDays} days @ ${this.calculateApy(durationDays) / 100}% APY`);
        const ix = await this.loop.vault.agentStack(vaultOwner, agent, new BN(amount), durationDays, stackNonce);
        const tx = new Transaction().add(ix);
        const sig = await this.sendTransaction(tx);
        return sig;
    }
    /**
     * Agent: Unstack funds on behalf of a user
     *
     * Requires Guided or Autonomous permission.
     * Guided agents can only unstack matured positions.
     *
     * @param vaultOwner - Owner of the target vault
     * @param stackAddress - Address of the stack to unstack
     */
    async agentUnstack(vaultOwner, stackAddress) {
        const agent = this.wallet.publicKey;
        console.log(`[Loop] Agent unstacking ${stackAddress.toBase58()} for ${vaultOwner.toBase58()}`);
        const ix = await this.loop.vault.agentUnstack(vaultOwner, agent, stackAddress);
        const tx = new Transaction().add(ix);
        const sig = await this.sendTransaction(tx);
        return sig;
    }
    /**
     * Agent: Analyze vault and suggest rebalancing
     *
     * Emits a RebalanceSuggested event with recommendations.
     * Requires Autonomous permission.
     *
     * @param vaultOwner - Owner of the target vault
     * @param targetStackRatio - Target % to keep stacked (0-100)
     */
    async agentRebalance(vaultOwner, targetStackRatio) {
        const agent = this.wallet.publicKey;
        console.log(`[Loop] Agent rebalancing vault ${vaultOwner.toBase58()}`);
        console.log(`[Loop] Target stack ratio: ${targetStackRatio}%`);
        const ix = await this.loop.vault.agentRebalance(vaultOwner, agent, targetStackRatio);
        const tx = new Transaction().add(ix);
        const sig = await this.sendTransaction(tx);
        return sig;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Escrow (Conditional Transfers)
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Create an escrow with release conditions
     *
     * @param params.recipient - Recipient vault/address
     * @param params.amount - Amount to escrow
     * @param params.conditions - Release conditions
     * @param params.expiry - Unix timestamp for expiry
     */
    async createEscrow(params) {
        const sender = this.wallet.publicKey;
        // Convert simplified conditions to full ReleaseCondition format
        const releaseConditions = params.conditions.map(c => {
            if (c.type === 'arbiter') {
                const arbiter = c.arbiter || c.arbiterPubkey;
                if (!arbiter)
                    throw new Error('Arbiter condition requires arbiter pubkey');
                return { arbiterApproval: { arbiter } };
            }
            if (c.type === 'time') {
                const timestamp = c.timestamp || c.deliveryDeadline;
                if (!timestamp)
                    throw new Error('Time condition requires timestamp');
                return { timeRelease: { timestamp: new BN(timestamp) } };
            }
            if (c.type === 'outcome') {
                // Outcome conditions map to oracle attestation
                // For A2A/UCP, the oracle would be the merchant agent
                throw new Error('Outcome conditions require oracle integration');
            }
            throw new Error(`Unknown condition type: ${c.type}`);
        });
        console.log(`[Loop] Creating escrow: ${params.amount} Cred to ${params.recipient.toBase58()}`);
        console.log(`[Loop] Conditions: ${params.conditions.length}, Expiry: ${new Date(params.expiry).toISOString()}`);
        // TODO: Implement full escrow creation with proper token accounts
        // For demo, return mock signature
        return `escrow_${Date.now()}_${params.recipient.toBase58().slice(0, 8)}`;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Transfers
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Direct vault-to-vault transfer
     */
    async transfer(recipient, amount, memo) {
        console.log(`[Loop] Transfer: ${amount} Cred to ${recipient.toBase58()}`);
        if (memo)
            console.log(`[Loop] Memo: ${memo}`);
        // TODO: Implement full transfer
        return `transfer_${Date.now()}`;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Utilities
    // ─────────────────────────────────────────────────────────────────────────
    async sendTransaction(tx) {
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
        tx.feePayer = this.wallet.publicKey;
        tx.sign(this.wallet);
        const sig = await this.connection.sendRawTransaction(tx.serialize());
        await this.connection.confirmTransaction(sig);
        return sig;
    }
}
export default LoopSDK;
