/**
 * Loop Protocol SDK - Main Loop Class
 *
 * Provides access to all Loop Protocol programs through submodules.
 */
import { PROGRAM_IDS, CONSTANTS } from './constants';
import { VaultModule } from './modules/vault';
import { CredModule } from './modules/cred';
import { OxoModule } from './modules/oxo';
import { VtpModule } from './modules/vtp';
import { AvpModule } from './modules/avp';
import { ReferralCaptureModule, AttentionCaptureModule, DataCaptureModule, ComputeCaptureModule, NetworkCaptureModule, SkillCaptureModule, LiquidityCapture, EnergyCapture, SocialCapture, InsuranceCapture, } from './modules/capture';
import { ParaModule, SquadsModule, ReclaimModule, TeeModule } from './security';
// ============================================================================
// MAIN LOOP CLASS
// ============================================================================
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
export class Loop {
    constructor(config) {
        this.connection = config.connection;
        this.wallet = config.wallet;
        // Core modules
        this.vault = new VaultModule(this);
        this.cred = new CredModule(this);
        this.oxo = new OxoModule(this);
        this.vtp = new VtpModule(this);
        this.avp = new AvpModule(this);
        // Capture modules
        this.liquidity = new LiquidityCapture(this);
        this.energy = new EnergyCapture(this);
        this.social = new SocialCapture(this);
        this.insurance = new InsuranceCapture(this);
        this.compute = new ComputeCaptureModule(this);
        this.network = new NetworkCaptureModule(this);
        this.skill = new SkillCaptureModule(this);
        this.referral = new ReferralCaptureModule(this);
        this.attention = new AttentionCaptureModule(this);
        this.data = new DataCaptureModule(this);
        // Security modules
        this.para = new ParaModule(this.connection);
        this.squads = new SquadsModule(this.connection);
        this.reclaim = new ReclaimModule(this.connection);
        this.tee = new TeeModule(this.connection);
    }
    /** Get program IDs */
    get programIds() {
        return PROGRAM_IDS;
    }
    /** Get protocol constants */
    get constants() {
        return CONSTANTS;
    }
}
export default Loop;
