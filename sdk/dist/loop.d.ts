/**
 * Loop Protocol SDK - Main Loop Class
 *
 * Provides access to all Loop Protocol programs through submodules.
 */
import { Connection } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { VaultModule } from './modules/vault';
import { CredModule } from './modules/cred';
import { OxoModule } from './modules/oxo';
import { VtpModule } from './modules/vtp';
import { AvpModule } from './modules/avp';
import { ReferralCaptureModule, AttentionCaptureModule, DataCaptureModule, ComputeCaptureModule, NetworkCaptureModule, SkillCaptureModule, LiquidityCapture, EnergyCapture, SocialCapture, InsuranceCapture } from './modules/capture';
import { ParaModule, SquadsModule, ReclaimModule, TeeModule } from './security';
export interface LoopConfig {
    connection: Connection;
    wallet?: anchor.Wallet;
}
/**
 * Main Loop Protocol SDK class
 *
 * Provides access to all Loop Protocol programs through submodules:
 * - `loop.vault` - Vault operations
 * - `loop.cred` - Cred token operations
 * - `loop.oxo` - OXO staking and bonding curves
 * - `loop.vtp` - Transfers, escrow, inheritance
 * - `loop.avp` - Agent identity and capabilities
 *
 * @example
 * ```typescript
 * import { Loop } from '@loop-protocol/sdk';
 *
 * const loop = new Loop({ connection });
 *
 * // Initialize vault
 * const tx = await loop.vault.initializeVault(owner);
 *
 * // Wrap USDC to Cred
 * await loop.cred.wrap(user, amount);
 *
 * // Lock OXO for veOXO
 * await loop.oxo.lockOxo(owner, amount, lockSeconds);
 * ```
 */
export declare class Loop {
    readonly connection: Connection;
    readonly wallet?: anchor.Wallet;
    /** Vault operations (loop-vault program) */
    readonly vault: VaultModule;
    /** Cred token operations (loop-cred program) */
    readonly cred: CredModule;
    /** OXO staking and bonding curves (loop-oxo program) */
    readonly oxo: OxoModule;
    /** Value Transfer Protocol (loop-vtp program) */
    readonly vtp: VtpModule;
    /** Agent Value Protocol (loop-avp program) */
    readonly avp: AvpModule;
    /** Liquidity capture operations */
    readonly liquidity: LiquidityCapture;
    /** Energy capture operations */
    readonly energy: EnergyCapture;
    /** Social capture operations */
    readonly social: SocialCapture;
    /** Insurance capture operations */
    readonly insurance: InsuranceCapture;
    /** Compute Capture - Monetize computational resources */
    readonly compute: ComputeCaptureModule;
    /** Network Capture - Monetize network participation */
    readonly network: NetworkCaptureModule;
    /** Skill Capture - Monetize behavioral patterns and skills */
    readonly skill: SkillCaptureModule;
    /** Referral Capture Module - Affiliate tracking and commissions */
    readonly referral: ReferralCaptureModule;
    /** Attention Capture Module - Verified ad viewing rewards */
    readonly attention: AttentionCaptureModule;
    /** Data Capture Module - User-controlled data monetization */
    readonly data: DataCaptureModule;
    /** Para Module - Passkey authentication and session keys */
    readonly para: ParaModule;
    /** Squads Module - Smart account policies */
    readonly squads: SquadsModule;
    /** Reclaim Module - Zero-knowledge proof verification */
    readonly reclaim: ReclaimModule;
    /** TEE Module - Trusted execution environment integration */
    readonly tee: TeeModule;
    constructor(config: LoopConfig);
    /** Get program IDs */
    get programIds(): {
        readonly VAULT: anchor.web3.PublicKey;
        readonly CRED: anchor.web3.PublicKey;
        readonly OXO: anchor.web3.PublicKey;
        readonly VTP: anchor.web3.PublicKey;
        readonly AVP: anchor.web3.PublicKey;
    };
    /** Get protocol constants */
    get constants(): {
        readonly EXTRACTION_FEE_BPS: 500;
        readonly OXO_TOTAL_SUPPLY: 1000000000000000;
        readonly MIN_LOCK_SECONDS: 15552000;
        readonly MAX_LOCK_SECONDS: 126144000;
        readonly GRADUATION_THRESHOLD: 25000000000;
        readonly AGENT_CREATION_FEE: 500000000;
        readonly TRANSFER_FEE_BPS: 10;
        readonly ESCROW_FEE_BPS: 25;
        readonly MAX_ARBITERS: 5;
        readonly MAX_CONDITIONS: 10;
        readonly MIN_SERVICE_AGENT_STAKE: 500000000;
        readonly MAX_CAPABILITIES: 20;
        readonly MAX_METADATA_LEN: 200;
    };
}
export default Loop;
//# sourceMappingURL=loop.d.ts.map