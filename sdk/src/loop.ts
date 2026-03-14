/**
 * Loop Protocol SDK - Main Loop Class
 * 
 * Provides access to all Loop Protocol programs through submodules.
 */

import { Connection } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

import { PROGRAM_IDS, CONSTANTS } from './constants';
import { VaultModule } from './modules/vault';
import { CredModule } from './modules/cred';
import { OxoModule } from './modules/oxo';
import { VtpModule } from './modules/vtp';
import { AvpModule } from './modules/avp';
import {
  ReferralCaptureModule,
  AttentionCaptureModule,
  DataCaptureModule,
  ComputeCaptureModule,
  NetworkCaptureModule,
  SkillCaptureModule,
  LiquidityCapture,
  EnergyCapture,
  SocialCapture,
  InsuranceCapture,
} from './modules/capture';
import { ParaModule, SquadsModule, ReclaimModule, TeeModule } from './security';

// ============================================================================
// SDK CONFIG
// ============================================================================

export interface LoopConfig {
  connection: Connection;
  wallet?: anchor.Wallet;
}

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
  public readonly connection: Connection;
  public readonly wallet?: anchor.Wallet;

  /** Vault operations (loop-vault program) */
  public readonly vault: VaultModule;
  
  /** Cred token operations (loop-cred program) */
  public readonly cred: CredModule;
  
  /** OXO staking and bonding curves (loop-oxo program) */
  public readonly oxo: OxoModule;
  
  /** Value Transfer Protocol (loop-vtp program) */
  public readonly vtp: VtpModule;
  
  /** Agent Value Protocol (loop-avp program) */
  public readonly avp: AvpModule;

  /** Liquidity capture operations */
  public readonly liquidity: LiquidityCapture;

  /** Energy capture operations */
  public readonly energy: EnergyCapture;

  /** Social capture operations */
  public readonly social: SocialCapture;

  /** Insurance capture operations */
  public readonly insurance: InsuranceCapture;

  /** Compute Capture - Monetize computational resources */
  public readonly compute: ComputeCaptureModule;

  /** Network Capture - Monetize network participation */
  public readonly network: NetworkCaptureModule;

  /** Skill Capture - Monetize behavioral patterns and skills */
  public readonly skill: SkillCaptureModule;

  /** Referral Capture Module - Affiliate tracking and commissions */
  public readonly referral: ReferralCaptureModule;

  /** Attention Capture Module - Verified ad viewing rewards */
  public readonly attention: AttentionCaptureModule;

  /** Data Capture Module - User-controlled data monetization */
  public readonly data: DataCaptureModule;
  
  /** Para Module - Passkey authentication and session keys */
  public readonly para: ParaModule;

  /** Squads Module - Smart account policies */
  public readonly squads: SquadsModule;

  /** Reclaim Module - Zero-knowledge proof verification */
  public readonly reclaim: ReclaimModule;

  /** TEE Module - Trusted execution environment integration */
  public readonly tee: TeeModule;

  constructor(config: LoopConfig) {
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
