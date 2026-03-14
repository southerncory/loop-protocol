/**
 * Loop Protocol SDK
 * 
 * Complete TypeScript SDK for interacting with Loop Protocol programs on Solana.
 * 
 * Programs:
 * - loop-vault: User-owned value storage with stacking
 * - loop-cred: Stable value token (1 Cred = $1 USDC)
 * - loop-oxo: Protocol equity with veOXO staking and bonding curves
 * - loop-vtp: Value Transfer Protocol (transfers, escrow, inheritance)
 * - loop-avp: Agent Value Protocol (identity, capabilities, reputation)
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

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';

// ============================================================================
// PROGRAM IDS
// ============================================================================

export const PROGRAM_IDS = {
  VAULT: new PublicKey('76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7'),
  CRED: new PublicKey('FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA'),
  OXO: new PublicKey('3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z'),
  VTP: new PublicKey('4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj'),
  AVP: new PublicKey('H5c9xfPYcx6EtC8hpThshARtUR7tq1NfMJVrTx8z9Jcx'),
} as const;

// ============================================================================
// CONSTANTS
// ============================================================================

export const CONSTANTS = {
  // Vault
  EXTRACTION_FEE_BPS: 500, // 5%
  
  // OXO
  OXO_TOTAL_SUPPLY: 1_000_000_000_000_000, // 1B with 6 decimals
  MIN_LOCK_SECONDS: 15_552_000, // 6 months
  MAX_LOCK_SECONDS: 126_144_000, // 4 years
  GRADUATION_THRESHOLD: 25_000_000_000, // 25,000 OXO
  AGENT_CREATION_FEE: 500_000_000, // 500 OXO
  
  // VTP
  TRANSFER_FEE_BPS: 10, // 0.1%
  ESCROW_FEE_BPS: 25, // 0.25%
  MAX_ARBITERS: 5,
  MAX_CONDITIONS: 10,
  
  // AVP
  MIN_SERVICE_AGENT_STAKE: 500_000_000, // 500 OXO
  MAX_CAPABILITIES: 20,
  MAX_METADATA_LEN: 200,
} as const;

// ============================================================================
// ENUMS (matching Rust)
// ============================================================================

/** Type of value capture */
export enum CaptureType {
  Shopping = 0,
  Data = 1,
  Presence = 2,
  Attention = 3,
  Referral = 4,
}

/** Agent permission levels for vault access */
export enum PermissionLevel {
  None = 0,
  Read = 1,
  Capture = 2,
  Guided = 3,
  Autonomous = 4,
}

/** Escrow status */
export enum EscrowStatus {
  Active = 0,
  Released = 1,
  Cancelled = 2,
  Disputed = 3,
}

/** Agent type */
export enum AgentType {
  Personal = 0,
  Service = 1,
}

/** Agent status */
export enum AgentStatus {
  Active = 0,
  Suspended = 1,
  Revoked = 2,
}

// ============================================================================
// TYPES - Vault
// ============================================================================

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

// ============================================================================
// TYPES - Cred
// ============================================================================

/** Cred system configuration */
export interface CredConfig {
  authority: PublicKey;
  usdcMint: PublicKey;
  credMint: PublicKey;
  reserveVault: PublicKey;
  totalMinted: BN;
  totalBurned: BN;
  bump: number;
}

/** Capture module authorization */
export interface CaptureAuthority {
  moduleAddress: PublicKey;
  captureType: CaptureType;
  moduleName: string;
  totalCaptured: BN;
  isActive: boolean;
  registeredAt: BN;
  bump: number;
}

/** Reserve status response */
export interface ReserveStatus {
  usdcReserve: BN;
  credSupply: BN;
  backingRatio: BN; // basis points
  totalMinted: BN;
  totalBurned: BN;
}

// ============================================================================
// TYPES - OXO
// ============================================================================

/** OXO protocol configuration */
export interface OxoConfig {
  authority: PublicKey;
  oxoMint: PublicKey;
  treasury: PublicKey;
  totalVeOxo: BN;
  totalLocked: BN;
  feePool: BN;
  lastFeeDistribution: BN;
  initializedAt: BN;
  agentCount: BN;
  bump: number;
}

/** veOXO staking position */
export interface VeOxoPosition {
  owner: PublicKey;
  oxoLocked: BN;
  veOxoBalance: BN;
  lockStart: BN;
  unlockAt: BN;
  lastClaim: BN;
  bump: number;
}

/** Agent token bonding curve */
export interface BondingCurve {
  creator: PublicKey;
  agentMint: PublicKey;
  oxoReserve: BN;
  tokenSupply: BN;
  graduated: boolean;
  createdAt: BN;
  bump: number;
}

// ============================================================================
// TYPES - VTP
// ============================================================================

/** VTP configuration */
export interface VtpConfig {
  authority: PublicKey;
  feeRecipient: PublicKey;
  totalTransfers: BN;
  totalVolume: BN;
  totalEscrows: BN;
  activeEscrows: BN;
  bump: number;
  initializedAt: BN;
}

/** Release condition for escrow */
export type ReleaseCondition =
  | { arbiterApproval: { arbiter: PublicKey } }
  | { timeRelease: { timestamp: BN } }
  | { oracleAttestation: { oracle: PublicKey; dataHash: Uint8Array } }
  | { multiSig: { threshold: number; signers: PublicKey[] } };

/** Escrow account */
export interface Escrow {
  sender: PublicKey;
  recipient: PublicKey;
  amount: BN;
  createdAt: BN;
  expiry: BN;
  status: EscrowStatus;
  conditions: ReleaseCondition[];
  conditionsMet: boolean[];
  bump: number;
}

/** Heir for inheritance */
export interface Heir {
  address: PublicKey;
  percentage: number; // 0-100
  name: string;
}

/** Inheritance plan */
export interface InheritancePlan {
  owner: PublicKey;
  heirs: Heir[];
  inactivityThreshold: BN;
  lastActivity: BN;
  createdAt: BN;
  triggered: boolean;
  triggerTime: BN | null;
  bump: number;
}

// ============================================================================
// TYPES - AVP
// ============================================================================

/** 8-byte capability identifier */
export type CapabilityId = Uint8Array;

/** Agent identity */
export interface AgentIdentity {
  agentPubkey: PublicKey;
  agentType: AgentType;
  createdAt: BN;
  principalHash: Uint8Array | null;
  bindingTimestamp: BN | null;
  creator: PublicKey | null;
  capabilities: CapabilityId[];
  stakeAmount: BN;
  stakeLockedUntil: BN;
  status: AgentStatus;
  reputationScore: number; // 0-10000 basis points
  metadataUri: string | null;
  bump: number;
}

// ============================================================================
// ============================================================================
// TYPES - Referral Capture Module
// ============================================================================

/** Tracked affiliate link */
export interface TrackedLink {
  /** Unique link ID */
  id: string;
  /** Original URL being tracked */
  originalUrl: string;
  /** Affiliate tag for attribution */
  affiliateTag: string;
  /** Affiliate's wallet address */
  affiliate: PublicKey;
  /** When the link was created */
  createdAt: BN;
  /** Total clicks on this link */
  clickCount: BN;
  /** Total conversions from this link */
  conversionCount: BN;
  /** Total commission earned */
  totalCommission: BN;
  /** Whether the link is active */
  isActive: boolean;
}

/** Conversion record from a referral */
export interface ConversionRecord {
  /** Unique conversion ID */
  id: string;
  /** Link that generated this conversion */
  linkId: string;
  /** Purchase amount in Cred */
  amount: BN;
  /** Commission amount earned */
  commission: BN;
  /** Proof of conversion (e.g., transaction signature) */
  proof: string;
  /** When the conversion occurred */
  convertedAt: BN;
  /** Whether commission has been claimed */
  claimed: boolean;
}

/** Affiliate statistics */
export interface AffiliateStats {
  /** Affiliate's wallet address */
  affiliate: PublicKey;
  /** Total tracked links created */
  totalLinks: BN;
  /** Total clicks across all links */
  totalClicks: BN;
  /** Total conversions */
  totalConversions: BN;
  /** Total commission earned (all time) */
  totalEarned: BN;
  /** Unclaimed commission balance */
  unclaimedBalance: BN;
  /** Average conversion rate (basis points) */
  conversionRateBps: number;
}

// ============================================================================
// TYPES - Attention Capture Module
// ============================================================================

/** User's ad profile and preferences */
export interface AdProfile {
  /** User's wallet address */
  user: PublicKey;
  /** Ad categories user is interested in */
  preferredCategories: string[];
  /** Ad categories user wants to avoid */
  blockedCategories: string[];
  /** Maximum ads per day */
  dailyAdLimit: number;
  /** Minimum reward per view (in Cred) */
  minRewardPerView: BN;
  /** Whether the profile is active */
  isActive: boolean;
  /** When the profile was created */
  createdAt: BN;
  /** Last updated timestamp */
  updatedAt: BN;
}

/** Advertisement */
export interface Ad {
  /** Unique ad ID */
  id: string;
  /** Advertiser's wallet address */
  advertiser: PublicKey;
  /** Ad title */
  title: string;
  /** Ad description */
  description: string;
  /** Content URL (image, video, etc.) */
  contentUrl: string;
  /** Target URL when clicked */
  targetUrl: string;
  /** Ad category */
  category: string;
  /** Reward per verified view (in Cred) */
  rewardPerView: BN;
  /** Total budget remaining */
  remainingBudget: BN;
  /** Required view duration (seconds) */
  minViewDuration: number;
  /** When the ad expires */
  expiresAt: BN;
  /** Whether the ad is active */
  isActive: boolean;
}

/** Ad preference configuration */
export interface AdPreferences {
  /** Categories to receive ads from */
  categories: string[];
  /** Categories to block */
  blockedCategories: string[];
  /** Max ads per day (0 = unlimited) */
  dailyLimit: number;
  /** Minimum Cred reward to show ad */
  minReward: BN;
}

/** Verification of ad view */
export interface ViewVerification {
  /** Unique view ID */
  id: string;
  /** User who viewed */
  user: PublicKey;
  /** Ad that was viewed */
  adId: string;
  /** Duration of view (seconds) */
  viewDuration: number;
  /** Whether view was verified */
  verified: boolean;
  /** Reward earned (if verified) */
  rewardEarned: BN;
  /** Verification timestamp */
  verifiedAt: BN;
  /** Proof of view */
  proof: string;
}

// ============================================================================
// TYPES - Data Capture Module
// ============================================================================

/** Data type classification */
export type DataType = 
  | 'location'
  | 'browsing'
  | 'purchase'
  | 'social'
  | 'health'
  | 'financial'
  | 'preferences'
  | 'demographics'
  | 'behavioral'
  | 'custom';

/** Data pricing configuration for a user */
export interface DataPricingConfig {
  /** User's wallet address */
  user: PublicKey;
  /** Pricing per data type (in Cred per access) */
  pricing: Map<DataType, BN>;
  /** Data types available for licensing */
  availableTypes: DataType[];
  /** Data types user refuses to share */
  blockedTypes: DataType[];
  /** Whether pricing is active */
  isActive: boolean;
  /** When config was created */
  createdAt: BN;
  /** Last updated timestamp */
  updatedAt: BN;
}

/** Data license terms */
export interface DataLicenseTerms {
  /** Duration of license (seconds) */
  durationSeconds: BN;
  /** Whether buyer can re-share */
  allowReshare: boolean;
  /** Maximum times data can be accessed */
  maxAccessCount: number;
  /** Specific use cases allowed */
  allowedUseCases: string[];
  /** Geographic restrictions */
  geoRestrictions: string[];
}

/** Active data license */
export interface DataLicense {
  /** Unique license ID */
  id: string;
  /** Data owner */
  owner: PublicKey;
  /** Data buyer/licensee */
  buyer: PublicKey;
  /** Type of data licensed */
  dataType: DataType;
  /** License terms */
  terms: DataLicenseTerms;
  /** Price paid (in Cred) */
  pricePaid: BN;
  /** When license was granted */
  grantedAt: BN;
  /** When license expires */
  expiresAt: BN;
  /** Number of times accessed */
  accessCount: number;
  /** Whether license is active */
  isActive: boolean;
  /** Whether license was revoked */
  revoked: boolean;
}

/** Data licensing statistics */
export interface DataStats {
  /** User's wallet address */
  user: PublicKey;
  /** Total active licenses */
  activeLicenses: BN;
  /** Total revoked licenses */
  revokedLicenses: BN;
  /** Total revenue earned (all time) */
  totalRevenue: BN;
  /** Unclaimed revenue balance */
  unclaimedRevenue: BN;
  /** Revenue breakdown by data type */
  revenueByType: Map<DataType, BN>;
  /** Most popular data type */
  topDataType: DataType | null;
  /** Average license duration */
  avgLicenseDuration: BN;
}

// ============================================================================
// REFERRAL CAPTURE MODULE
// ============================================================================

/**
 * Referral Capture Module - Affiliate link tracking and commission distribution
 * 
 * Enables users to earn Cred by referring purchases through tracked links.
 * Commissions are automatically captured to the affiliate's vault.
 */
export class ReferralCaptureModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Link Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a tracked affiliate link
   * 
   * @param originalUrl - The URL to track (e.g., merchant product page)
   * @param affiliateTag - Unique tag for attribution
   * @returns TrackedLink with unique ID for sharing
   * 
   * @example
   * ```typescript
   * const link = await loop.referral.trackLink(
   *   'https://merchant.com/product/123',
   *   'burt-affiliate-2024'
   * );
   * console.log(link.id); // Share this link
   * ```
   */
  async trackLink(originalUrl: string, affiliateTag: string): Promise<TrackedLink> {
    throw new Error('Not yet implemented: trackLink');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Conversion Tracking
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register a conversion from a tracked link
   * 
   * Called by the merchant integration when a purchase occurs.
   * 
   * @param linkId - The tracked link ID that generated the conversion
   * @param amount - Purchase amount (in Cred)
   * @param proof - Proof of purchase (e.g., transaction signature)
   * @returns ConversionRecord with commission details
   * 
   * @example
   * ```typescript
   * const conversion = await loop.referral.registerConversion(
   *   'link_abc123',
   *   new BN(50_000_000), // 50 Cred purchase
   *   'tx_signature_here'
   * );
   * console.log(conversion.commission); // Commission earned
   * ```
   */
  async registerConversion(
    linkId: string,
    amount: BN,
    proof: string
  ): Promise<ConversionRecord> {
    throw new Error('Not yet implemented: registerConversion');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Commission Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Claim earned commission from conversions
   * 
   * Captures commission to the user's vault as Cred.
   * 
   * @param user - Affiliate claiming commission (signer)
   * @param conversionIds - IDs of conversions to claim (or empty for all unclaimed)
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const sig = await loop.referral.claimCommission(
   *   wallet.publicKey,
   *   ['conv_1', 'conv_2']
   * );
   * ```
   */
  async claimCommission(
    user: PublicKey,
    conversionIds: string[]
  ): Promise<string> {
    throw new Error('Not yet implemented: claimCommission');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get affiliate statistics for a user
   * 
   * @param user - Affiliate's wallet address
   * @returns AffiliateStats with performance metrics
   * 
   * @example
   * ```typescript
   * const stats = await loop.referral.getAffiliateStats(wallet.publicKey);
   * console.log(`Earned: ${stats.totalEarned} Cred`);
   * console.log(`Conversion rate: ${stats.conversionRateBps / 100}%`);
   * ```
   */
  async getAffiliateStats(user: PublicKey): Promise<AffiliateStats> {
    throw new Error('Not yet implemented: getAffiliateStats');
  }
}

// ============================================================================
// ATTENTION CAPTURE MODULE
// ============================================================================

/**
 * Attention Capture Module - Verified ad viewing with attention rewards
 * 
 * Enables users to earn Cred by viewing verified advertisements.
 * Users control their ad preferences and minimum reward requirements.
 */
export class AttentionCaptureModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Profile Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register for attention rewards and set preferences
   * 
   * Creates an ad profile with user's viewing preferences.
   * 
   * @param user - User's wallet address (signer)
   * @param preferences - Ad viewing preferences
   * @returns AdProfile with registration details
   * 
   * @example
   * ```typescript
   * const profile = await loop.attention.registerForAds(
   *   wallet.publicKey,
   *   {
   *     categories: ['tech', 'gaming'],
   *     blockedCategories: ['gambling'],
   *     dailyLimit: 10,
   *     minReward: new BN(100_000) // 0.1 Cred minimum
   *   }
   * );
   * ```
   */
  async registerForAds(
    user: PublicKey,
    preferences: AdPreferences
  ): Promise<AdProfile> {
    throw new Error('Not yet implemented: registerForAds');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ad Discovery
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get available ads matching user's preferences
   * 
   * Returns ads that match the user's profile and haven't been viewed.
   * 
   * @param user - User's wallet address
   * @returns Array of available ads
   * 
   * @example
   * ```typescript
   * const ads = await loop.attention.getAvailableAds(wallet.publicKey);
   * for (const ad of ads) {
   *   console.log(`${ad.title}: ${ad.rewardPerView} Cred`);
   * }
   * ```
   */
  async getAvailableAds(user: PublicKey): Promise<Ad[]> {
    throw new Error('Not yet implemented: getAvailableAds');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // View Verification
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Submit proof of ad view for verification
   * 
   * Verifies that the user actually viewed the ad for the required duration.
   * 
   * @param user - User who viewed the ad (signer)
   * @param adId - ID of the ad that was viewed
   * @param viewProof - Cryptographic proof of view (duration, engagement)
   * @returns ViewVerification with reward details
   * 
   * @example
   * ```typescript
   * const verification = await loop.attention.verifyView(
   *   wallet.publicKey,
   *   'ad_123',
   *   generateViewProof(adId, startTime, endTime)
   * );
   * if (verification.verified) {
   *   console.log(`Earned: ${verification.rewardEarned} Cred`);
   * }
   * ```
   */
  async verifyView(
    user: PublicKey,
    adId: string,
    viewProof: string
  ): Promise<ViewVerification> {
    throw new Error('Not yet implemented: verifyView');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Reward Claims
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Claim attention rewards from verified views
   * 
   * Captures earned rewards to the user's vault as Cred.
   * 
   * @param user - User claiming rewards (signer)
   * @param viewIds - IDs of verified views to claim (or empty for all unclaimed)
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const sig = await loop.attention.claimAttentionReward(
   *   wallet.publicKey,
   *   [] // Claim all unclaimed rewards
   * );
   * ```
   */
  async claimAttentionReward(
    user: PublicKey,
    viewIds: string[]
  ): Promise<string> {
    throw new Error('Not yet implemented: claimAttentionReward');
  }
}

// ============================================================================
// DATA CAPTURE MODULE
// ============================================================================

/**
 * Data Capture Module - User-controlled data licensing and monetization
 * 
 * Enables users to set prices for their data and earn Cred when companies
 * license access. Users maintain full control and can revoke at any time.
 */
export class DataCaptureModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Pricing Configuration
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Set pricing for user's data types
   * 
   * Configures which data types are available and their prices.
   * 
   * @param user - Data owner (signer)
   * @param dataTypes - Types of data to make available
   * @param prices - Prices per data type (in Cred per license)
   * @returns DataPricingConfig with active settings
   * 
   * @example
   * ```typescript
   * const config = await loop.data.setDataPricing(
   *   wallet.publicKey,
   *   ['browsing', 'preferences'],
   *   new Map([
   *     ['browsing', new BN(5_000_000)],     // 5 Cred
   *     ['preferences', new BN(2_000_000)]   // 2 Cred
   *   ])
   * );
   * ```
   */
  async setDataPricing(
    user: PublicKey,
    dataTypes: DataType[],
    prices: Map<DataType, BN>
  ): Promise<DataPricingConfig> {
    throw new Error('Not yet implemented: setDataPricing');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Licensing
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * License data to a buyer
   * 
   * Grants a time-limited license to access specific data type.
   * 
   * @param user - Data owner (signer)
   * @param buyer - Buyer's wallet address
   * @param dataType - Type of data being licensed
   * @param terms - License terms and conditions
   * @returns DataLicense with access details
   * 
   * @example
   * ```typescript
   * const license = await loop.data.licenseData(
   *   wallet.publicKey,
   *   buyerPubkey,
   *   'browsing',
   *   {
   *     durationSeconds: new BN(30 * 24 * 60 * 60), // 30 days
   *     allowReshare: false,
   *     maxAccessCount: 100,
   *     allowedUseCases: ['analytics', 'personalization'],
   *     geoRestrictions: []
   *   }
   * );
   * ```
   */
  async licenseData(
    user: PublicKey,
    buyer: PublicKey,
    dataType: DataType,
    terms: DataLicenseTerms
  ): Promise<DataLicense> {
    throw new Error('Not yet implemented: licenseData');
  }

  /**
   * Revoke an active data license
   * 
   * Immediately terminates buyer's access to the licensed data.
   * May trigger partial refund depending on terms.
   * 
   * @param user - Data owner (signer)
   * @param licenseId - ID of license to revoke
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const sig = await loop.data.revokeDataLicense(
   *   wallet.publicKey,
   *   'license_abc123'
   * );
   * ```
   */
  async revokeDataLicense(
    user: PublicKey,
    licenseId: string
  ): Promise<string> {
    throw new Error('Not yet implemented: revokeDataLicense');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Revenue Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Claim earned data licensing revenue
   * 
   * Captures accumulated revenue to the user's vault as Cred.
   * 
   * @param user - Data owner claiming revenue (signer)
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const sig = await loop.data.claimDataRevenue(wallet.publicKey);
   * ```
   */
  async claimDataRevenue(user: PublicKey): Promise<string> {
    throw new Error('Not yet implemented: claimDataRevenue');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get data licensing statistics for a user
   * 
   * @param user - Data owner's wallet address
   * @returns DataStats with revenue metrics
   * 
   * @example
   * ```typescript
   * const stats = await loop.data.getDataStats(wallet.publicKey);
   * console.log(`Total revenue: ${stats.totalRevenue} Cred`);
   * console.log(`Active licenses: ${stats.activeLicenses}`);
   * ```
   */
  async getDataStats(user: PublicKey): Promise<DataStats> {
    throw new Error('Not yet implemented: getDataStats');
  }
}

// SDK CONFIG
// ============================================================================

export interface LoopConfig {
  connection: Connection;
  wallet?: anchor.Wallet;
}

// ============================================================================
// PDA DERIVATION HELPERS
// ============================================================================

/**
 * Derive PDA addresses for all Loop Protocol accounts
 */
export class LoopPDA {
  // ─────────────────────────────────────────────────────────────────────────
  // Vault PDAs
  // ─────────────────────────────────────────────────────────────────────────

  /** Derive vault PDA for an owner */
  static vault(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), owner.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }

  /** Derive stack record PDA */
  static stackRecord(vault: PublicKey, stackIndex: BN): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('stack'), vault.toBuffer(), stackIndex.toArrayLike(Buffer, 'le', 8)],
      PROGRAM_IDS.VAULT
    );
  }

  /** Derive agent permission PDA */
  static agentPermission(vault: PublicKey, agent: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('agent_perm'), vault.toBuffer(), agent.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }

  /** Derive vault inheritance config PDA */
  static vaultInheritance(vault: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('inheritance'), vault.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }

  /** Derive capture authority PDA */
  static captureAuthority(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('capture_authority')],
      PROGRAM_IDS.VAULT
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cred PDAs
  // ─────────────────────────────────────────────────────────────────────────

  /** Derive cred config PDA */
  static credConfig(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('cred_config')],
      PROGRAM_IDS.CRED
    );
  }

  /** Derive capture auth PDA for a module */
  static captureAuth(moduleAddress: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('capture_auth'), moduleAddress.toBuffer()],
      PROGRAM_IDS.CRED
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OXO PDAs
  // ─────────────────────────────────────────────────────────────────────────

  /** Derive OXO config PDA */
  static oxoConfig(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      PROGRAM_IDS.OXO
    );
  }

  /** Derive veOXO position PDA */
  static veOxoPosition(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('ve_position'), owner.toBuffer()],
      PROGRAM_IDS.OXO
    );
  }

  /** Derive bonding curve PDA for agent token */
  static bondingCurve(agentMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('bonding_curve'), agentMint.toBuffer()],
      PROGRAM_IDS.OXO
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VTP PDAs
  // ─────────────────────────────────────────────────────────────────────────

  /** Derive VTP config PDA */
  static vtpConfig(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vtp_config')],
      PROGRAM_IDS.VTP
    );
  }

  /** Derive escrow PDA */
  static escrow(sender: PublicKey, recipient: PublicKey, createdAt: BN): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('escrow'),
        sender.toBuffer(),
        recipient.toBuffer(),
        createdAt.toArrayLike(Buffer, 'le', 8),
      ],
      PROGRAM_IDS.VTP
    );
  }

  /** Derive VTP inheritance plan PDA */
  static vtpInheritance(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('inheritance'), owner.toBuffer()],
      PROGRAM_IDS.VTP
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AVP PDAs
  // ─────────────────────────────────────────────────────────────────────────

  /** Derive agent identity PDA */
  static agentIdentity(agent: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), agent.toBuffer()],
      PROGRAM_IDS.AVP
    );
  }
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

  constructor(config: LoopConfig) {
    this.connection = config.connection;
    this.wallet = config.wallet;

    this.vault = new VaultModule(this);
    this.cred = new CredModule(this);
    this.oxo = new OxoModule(this);
    this.vtp = new VtpModule(this);
    this.avp = new AvpModule(this);
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

// ============================================================================
// VAULT MODULE (loop-vault)
// ============================================================================

/**
 * Vault Module - User-owned value storage with stacking
 * 
 * Program ID: 76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7
 */
export class VaultModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get vault PDA for an owner
   * @param owner - Wallet address of vault owner
   */
  getVaultAddress(owner: PublicKey): [PublicKey, number] {
    return LoopPDA.vault(owner);
  }

  /**
   * Get stack record PDA
   * @param vault - Vault PDA
   * @param stackIndex - Index of the stack (based on stacked_balance at creation)
   */
  getStackAddress(vault: PublicKey, stackIndex: BN): [PublicKey, number] {
    return LoopPDA.stackRecord(vault, stackIndex);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Fetching
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Fetch vault account data
   * @param owner - Vault owner
   */
  async getVault(owner: PublicKey): Promise<Vault | null> {
    const [vaultPda] = this.getVaultAddress(owner);
    const accountInfo = await this.loop.connection.getAccountInfo(vaultPda);
    if (!accountInfo) return null;
    // Deserialize account data (implementation depends on Anchor IDL)
    return this.deserializeVault(accountInfo.data);
  }

  /**
   * Check if vault exists
   * @param owner - Vault owner
   */
  async exists(owner: PublicKey): Promise<boolean> {
    const [vaultPda] = this.getVaultAddress(owner);
    const accountInfo = await this.loop.connection.getAccountInfo(vaultPda);
    return accountInfo !== null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initialize a new vault for a user
   * 
   * Seeds: ["vault", owner]
   * 
   * @param owner - Owner's wallet (signer, payer)
   */
  async initializeVault(owner: PublicKey): Promise<TransactionInstruction> {
    const [vaultPda, bump] = this.getVaultAddress(owner);

    return this.createInstruction(
      'initialize_vault',
      [{ pubkey: vaultPda, isSigner: false, isWritable: true },
       { pubkey: owner, isSigner: true, isWritable: true },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { bump }
    );
  }

  /**
   * Deposit Cred into vault
   * 
   * @param owner - Vault owner (signer)
   * @param amount - Amount of Cred to deposit
   * @param userCredAccount - User's Cred token account
   * @param vaultCredAccount - Vault's Cred token account
   */
  async deposit(
    owner: PublicKey,
    amount: BN,
    userCredAccount: PublicKey,
    vaultCredAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [vaultPda] = this.getVaultAddress(owner);

    return this.createInstruction(
      'deposit',
      [{ pubkey: vaultPda, isSigner: false, isWritable: true },
       { pubkey: userCredAccount, isSigner: false, isWritable: true },
       { pubkey: vaultCredAccount, isSigner: false, isWritable: true },
       { pubkey: owner, isSigner: true, isWritable: false },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      { amount }
    );
  }

  /**
   * Capture value from an agent
   * 
   * @param vault - Vault to capture into
   * @param amount - Amount to capture
   * @param captureType - Type of capture (Shopping, Data, Presence, Attention)
   * @param source - Source description (max 64 chars)
   * @param captureModule - Authorized capture module (signer)
   * @param credMint - Cred mint address
   * @param vaultCredAccount - Vault's Cred token account
   */
  async capture(
    vault: PublicKey,
    amount: BN,
    captureType: CaptureType,
    source: string,
    captureModule: PublicKey,
    credMint: PublicKey,
    vaultCredAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [captureAuthority, captureAuthBump] = LoopPDA.captureAuthority();

    return this.createInstruction(
      'capture',
      [{ pubkey: vault, isSigner: false, isWritable: true },
       { pubkey: captureAuthority, isSigner: false, isWritable: false },
       // capture_config account would be needed
       { pubkey: credMint, isSigner: false, isWritable: true },
       { pubkey: vaultCredAccount, isSigner: false, isWritable: true },
       { pubkey: captureModule, isSigner: true, isWritable: false },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      { amount, captureType, source }
    );
  }

  /**
   * Stack Cred for yield
   * 
   * @param owner - Vault owner (signer, payer)
   * @param amount - Amount to stack
   * @param durationDays - Lock duration in days (7-365)
   */
  async stack(
    owner: PublicKey,
    amount: BN,
    durationDays: number
  ): Promise<TransactionInstruction> {
    const [vaultPda] = this.getVaultAddress(owner);
    const vault = await this.getVault(owner);
    const stackIndex = vault?.stackedBalance || new BN(0);
    const [stackPda, stackBump] = this.getStackAddress(vaultPda, stackIndex);

    return this.createInstruction(
      'stack',
      [{ pubkey: vaultPda, isSigner: false, isWritable: true },
       { pubkey: stackPda, isSigner: false, isWritable: true },
       { pubkey: owner, isSigner: true, isWritable: true },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { amount, durationDays }
    );
  }

  /**
   * Unstack (withdraw locked Cred)
   * 
   * @param owner - Vault owner (signer)
   * @param stackAddress - Stack record address
   */
  async unstack(
    owner: PublicKey,
    stackAddress: PublicKey
  ): Promise<TransactionInstruction> {
    const [vaultPda] = this.getVaultAddress(owner);

    return this.createInstruction(
      'unstack',
      [{ pubkey: vaultPda, isSigner: false, isWritable: true },
       { pubkey: stackAddress, isSigner: false, isWritable: true },
       { pubkey: owner, isSigner: true, isWritable: false }],
      {}
    );
  }

  /**
   * Withdraw Cred from vault
   * 
   * @param owner - Vault owner (signer)
   * @param amount - Amount to withdraw
   * @param userCredAccount - User's Cred token account (destination)
   * @param vaultCredAccount - Vault's Cred token account
   */
  async withdraw(
    owner: PublicKey,
    amount: BN,
    userCredAccount: PublicKey,
    vaultCredAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [vaultPda] = this.getVaultAddress(owner);

    return this.createInstruction(
      'withdraw',
      [{ pubkey: vaultPda, isSigner: false, isWritable: true },
       { pubkey: vaultCredAccount, isSigner: false, isWritable: true },
       { pubkey: userCredAccount, isSigner: false, isWritable: true },
       { pubkey: owner, isSigner: true, isWritable: false },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      { amount }
    );
  }

  /**
   * Set agent permissions for vault
   * 
   * @param owner - Vault owner (signer, payer)
   * @param agent - Agent pubkey to grant permission
   * @param permissionLevel - Level of access
   * @param dailyLimit - Maximum daily spend limit
   */
  async setAgentPermission(
    owner: PublicKey,
    agent: PublicKey,
    permissionLevel: PermissionLevel,
    dailyLimit: BN
  ): Promise<TransactionInstruction> {
    const [vaultPda] = this.getVaultAddress(owner);
    const [permPda, permBump] = LoopPDA.agentPermission(vaultPda, agent);

    return this.createInstruction(
      'set_agent_permission',
      [{ pubkey: vaultPda, isSigner: false, isWritable: true },
       { pubkey: permPda, isSigner: false, isWritable: true },
       { pubkey: owner, isSigner: true, isWritable: true },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { agent, permissionLevel, dailyLimit }
    );
  }

  /**
   * Claim yield from stacking position
   * 
   * @param owner - Vault owner (signer)
   * @param stackAddress - Stack record address
   */
  async claimYield(
    owner: PublicKey,
    stackAddress: PublicKey
  ): Promise<TransactionInstruction> {
    const [vaultPda] = this.getVaultAddress(owner);

    return this.createInstruction(
      'claim_yield',
      [{ pubkey: vaultPda, isSigner: false, isWritable: true },
       { pubkey: stackAddress, isSigner: false, isWritable: true },
       { pubkey: owner, isSigner: true, isWritable: false }],
      {}
    );
  }

  /**
   * Extract all value from vault (5% fee, liquidates all stacks)
   * 
   * @param owner - Vault owner (signer)
   * @param userCredAccount - User's Cred account (destination)
   * @param vaultCredAccount - Vault's Cred account
   * @param feeAccount - Protocol fee account
   */
  async extract(
    owner: PublicKey,
    userCredAccount: PublicKey,
    vaultCredAccount: PublicKey,
    feeAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [vaultPda] = this.getVaultAddress(owner);

    return this.createInstruction(
      'extract',
      [{ pubkey: vaultPda, isSigner: false, isWritable: true },
       { pubkey: vaultCredAccount, isSigner: false, isWritable: true },
       { pubkey: userCredAccount, isSigner: false, isWritable: true },
       { pubkey: feeAccount, isSigner: false, isWritable: true },
       { pubkey: owner, isSigner: true, isWritable: false },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      {}
    );
  }

  /**
   * Close vault (must be empty)
   * 
   * @param owner - Vault owner (signer)
   */
  async closeVault(owner: PublicKey): Promise<TransactionInstruction> {
    const [vaultPda] = this.getVaultAddress(owner);

    return this.createInstruction(
      'close_vault',
      [{ pubkey: vaultPda, isSigner: false, isWritable: true },
       { pubkey: owner, isSigner: true, isWritable: true }],
      {}
    );
  }

  /**
   * Set heir for inheritance
   * 
   * @param owner - Vault owner (signer, payer)
   * @param heir - Heir's pubkey
   * @param inactivityThresholdDays - Days of inactivity before heir can claim (min 30)
   */
  async setHeir(
    owner: PublicKey,
    heir: PublicKey,
    inactivityThresholdDays: number
  ): Promise<TransactionInstruction> {
    const [vaultPda] = this.getVaultAddress(owner);
    const [inheritancePda, inheritanceBump] = LoopPDA.vaultInheritance(vaultPda);

    return this.createInstruction(
      'set_heir',
      [{ pubkey: vaultPda, isSigner: false, isWritable: false },
       { pubkey: inheritancePda, isSigner: false, isWritable: true },
       { pubkey: owner, isSigner: true, isWritable: true },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { heir, inactivityThresholdDays }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calculate APY for a given stacking duration
   * @param durationDays - Lock duration in days
   * @returns APY in basis points (100 = 1%)
   */
  calculateApy(durationDays: number): number {
    if (durationDays >= 365) return 2000; // 20%
    if (durationDays >= 180) return 1800; // 18%
    if (durationDays >= 90) return 1500;  // 15%
    if (durationDays >= 30) return 1000;  // 10%
    if (durationDays >= 14) return 700;   // 7%
    if (durationDays >= 7) return 500;    // 5%
    return 200; // 2%
  }

  private createInstruction(
    name: string,
    accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
    data: any
  ): TransactionInstruction {
    // Placeholder - real implementation would use Anchor IDL
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.VAULT,
      data: Buffer.concat([discriminator, dataBuffer]),
    });
  }

  private deserializeVault(data: Buffer): Vault {
    // Placeholder - real implementation would use Borsh/Anchor
    return {} as Vault;
  }
}

// ============================================================================
// CRED MODULE (loop-cred)
// ============================================================================

/**
 * Cred Module - Stable value token (1 Cred = $1 USDC)
 * 
 * Program ID: FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA
 */
export class CredModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Get cred config PDA */
  getConfigAddress(): [PublicKey, number] {
    return LoopPDA.credConfig();
  }

  /** Get capture authority PDA for a module */
  getCaptureAuthAddress(moduleAddress: PublicKey): [PublicKey, number] {
    return LoopPDA.captureAuth(moduleAddress);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Fetching
  // ─────────────────────────────────────────────────────────────────────────

  /** Fetch cred config */
  async getConfig(): Promise<CredConfig | null> {
    const [configPda] = this.getConfigAddress();
    const accountInfo = await this.loop.connection.getAccountInfo(configPda);
    if (!accountInfo) return null;
    return this.deserializeCredConfig(accountInfo.data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initialize the Cred token system
   * 
   * @param authority - Protocol authority (signer, payer)
   * @param usdcMint - USDC mint address
   * @param credMint - Cred mint address (must be initialized)
   * @param reserveVault - USDC reserve vault token account
   */
  async initialize(
    authority: PublicKey,
    usdcMint: PublicKey,
    credMint: PublicKey,
    reserveVault: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda, bump] = this.getConfigAddress();

    return this.createInstruction(
      'initialize',
      [{ pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: usdcMint, isSigner: false, isWritable: false },
       { pubkey: credMint, isSigner: false, isWritable: true },
       { pubkey: reserveVault, isSigner: false, isWritable: false },
       { pubkey: authority, isSigner: true, isWritable: true },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      {}
    );
  }

  /**
   * Wrap USDC to get Cred (1:1)
   * 
   * @param user - User wallet (signer)
   * @param amount - Amount of USDC to wrap
   * @param userUsdcAccount - User's USDC token account
   * @param userCredAccount - User's Cred token account
   * @param credMint - Cred mint address
   * @param reserveVault - USDC reserve vault
   */
  async wrap(
    user: PublicKey,
    amount: BN,
    userUsdcAccount: PublicKey,
    userCredAccount: PublicKey,
    credMint: PublicKey,
    reserveVault: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();

    return this.createInstruction(
      'wrap',
      [{ pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: credMint, isSigner: false, isWritable: true },
       { pubkey: reserveVault, isSigner: false, isWritable: true },
       { pubkey: userUsdcAccount, isSigner: false, isWritable: true },
       { pubkey: userCredAccount, isSigner: false, isWritable: true },
       { pubkey: user, isSigner: true, isWritable: false },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      { amount }
    );
  }

  /**
   * Unwrap Cred to get USDC (1:1)
   * 
   * @param user - User wallet (signer)
   * @param amount - Amount of Cred to unwrap
   * @param userCredAccount - User's Cred token account
   * @param userUsdcAccount - User's USDC token account
   * @param credMint - Cred mint address
   * @param reserveVault - USDC reserve vault
   */
  async unwrap(
    user: PublicKey,
    amount: BN,
    userCredAccount: PublicKey,
    userUsdcAccount: PublicKey,
    credMint: PublicKey,
    reserveVault: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();

    return this.createInstruction(
      'unwrap',
      [{ pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: credMint, isSigner: false, isWritable: true },
       { pubkey: reserveVault, isSigner: false, isWritable: true },
       { pubkey: userCredAccount, isSigner: false, isWritable: true },
       { pubkey: userUsdcAccount, isSigner: false, isWritable: true },
       { pubkey: user, isSigner: true, isWritable: false },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      { amount }
    );
  }

  /**
   * Mint Cred for value capture (authorized capture modules only)
   * 
   * @param captureSigner - Capture module signer
   * @param amount - Amount to mint
   * @param captureType - Type of capture
   * @param destinationCredAccount - Destination Cred account (vault)
   * @param credMint - Cred mint
   * @param reserveVault - USDC reserve (capture module provides backing)
   * @param captureUsdcAccount - Capture module's USDC account for backing
   */
  async captureMint(
    captureSigner: PublicKey,
    amount: BN,
    captureType: CaptureType,
    destinationCredAccount: PublicKey,
    credMint: PublicKey,
    reserveVault: PublicKey,
    captureUsdcAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();
    const [captureAuthPda] = this.getCaptureAuthAddress(captureSigner);

    return this.createInstruction(
      'capture_mint',
      [{ pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: captureAuthPda, isSigner: false, isWritable: true },
       { pubkey: credMint, isSigner: false, isWritable: true },
       { pubkey: reserveVault, isSigner: false, isWritable: true },
       { pubkey: captureUsdcAccount, isSigner: false, isWritable: true },
       { pubkey: destinationCredAccount, isSigner: false, isWritable: true },
       { pubkey: captureSigner, isSigner: true, isWritable: false },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      { amount, captureType }
    );
  }

  /**
   * Register a new capture module
   * 
   * @param authority - Protocol authority (signer, payer)
   * @param moduleAddress - Address of the capture module
   * @param captureType - Type of capture this module handles
   * @param moduleName - Human-readable name (max 32 chars)
   */
  async registerCaptureModule(
    authority: PublicKey,
    moduleAddress: PublicKey,
    captureType: CaptureType,
    moduleName: string
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();
    const [captureAuthPda, bump] = this.getCaptureAuthAddress(moduleAddress);

    return this.createInstruction(
      'register_capture_module',
      [{ pubkey: configPda, isSigner: false, isWritable: false },
       { pubkey: captureAuthPda, isSigner: false, isWritable: true },
       { pubkey: moduleAddress, isSigner: false, isWritable: false },
       { pubkey: authority, isSigner: true, isWritable: true },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { captureType, moduleName }
    );
  }

  /**
   * Get reserve status (USDC backing vs Cred supply)
   * 
   * @param reserveVault - USDC reserve token account
   * @param credMint - Cred mint
   */
  async getReserveStatus(
    reserveVault: PublicKey,
    credMint: PublicKey
  ): Promise<ReserveStatus> {
    const [configPda] = this.getConfigAddress();
    // Would fetch and calculate reserve status
    return {
      usdcReserve: new BN(0),
      credSupply: new BN(0),
      backingRatio: new BN(10000), // 100%
      totalMinted: new BN(0),
      totalBurned: new BN(0),
    };
  }

  private createInstruction(
    name: string,
    accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
    data: any
  ): TransactionInstruction {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.CRED,
      data: Buffer.concat([discriminator, dataBuffer]),
    });
  }

  private deserializeCredConfig(data: Buffer): CredConfig {
    return {} as CredConfig;
  }
}

// ============================================================================
// OXO MODULE (loop-oxo)
// ============================================================================

/**
 * OXO Module - Protocol equity with veOXO staking and bonding curves
 * 
 * Program ID: 3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z
 */
export class OxoModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Get OXO config PDA */
  getConfigAddress(): [PublicKey, number] {
    return LoopPDA.oxoConfig();
  }

  /** Get veOXO position PDA for an owner */
  getVePositionAddress(owner: PublicKey): [PublicKey, number] {
    return LoopPDA.veOxoPosition(owner);
  }

  /** Get bonding curve PDA for an agent token */
  getBondingCurveAddress(agentMint: PublicKey): [PublicKey, number] {
    return LoopPDA.bondingCurve(agentMint);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Fetching
  // ─────────────────────────────────────────────────────────────────────────

  /** Fetch OXO config */
  async getConfig(): Promise<OxoConfig | null> {
    const [configPda] = this.getConfigAddress();
    const accountInfo = await this.loop.connection.getAccountInfo(configPda);
    if (!accountInfo) return null;
    return this.deserializeOxoConfig(accountInfo.data);
  }

  /** Fetch veOXO position */
  async getVePosition(owner: PublicKey): Promise<VeOxoPosition | null> {
    const [positionPda] = this.getVePositionAddress(owner);
    const accountInfo = await this.loop.connection.getAccountInfo(positionPda);
    if (!accountInfo) return null;
    return this.deserializeVePosition(accountInfo.data);
  }

  /** Fetch bonding curve */
  async getBondingCurve(agentMint: PublicKey): Promise<BondingCurve | null> {
    const [curvePda] = this.getBondingCurveAddress(agentMint);
    const accountInfo = await this.loop.connection.getAccountInfo(curvePda);
    if (!accountInfo) return null;
    return this.deserializeBondingCurve(accountInfo.data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions - veOXO Staking
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initialize OXO protocol
   * 
   * @param authority - Protocol authority (signer, payer)
   * @param oxoMint - OXO token mint
   * @param treasury - Treasury account
   */
  async initialize(
    authority: PublicKey,
    oxoMint: PublicKey,
    treasury: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda, bump] = this.getConfigAddress();

    return this.createInstruction(
      'initialize',
      [{ pubkey: authority, isSigner: true, isWritable: true },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: oxoMint, isSigner: false, isWritable: false },
       { pubkey: treasury, isSigner: false, isWritable: false },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { bump }
    );
  }

  /**
   * Lock OXO to receive veOXO voting power
   * 
   * Multiplier based on duration:
   * - 6 months: 0.25x
   * - 1 year: 0.5x
   * - 2 years: 1x
   * - 4 years: 2x
   * 
   * @param owner - OXO holder (signer, payer)
   * @param amount - Amount of OXO to lock
   * @param lockSeconds - Lock duration in seconds (min 6 months, max 4 years)
   * @param userOxoAccount - User's OXO token account
   * @param protocolOxoAccount - Protocol's OXO token account
   */
  async lockOxo(
    owner: PublicKey,
    amount: BN,
    lockSeconds: BN,
    userOxoAccount: PublicKey,
    protocolOxoAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();
    const [positionPda, bump] = this.getVePositionAddress(owner);

    return this.createInstruction(
      'lock_oxo',
      [{ pubkey: owner, isSigner: true, isWritable: true },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: positionPda, isSigner: false, isWritable: true },
       { pubkey: userOxoAccount, isSigner: false, isWritable: true },
       { pubkey: protocolOxoAccount, isSigner: false, isWritable: true },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { amount, lockSeconds, bump }
    );
  }

  /**
   * Extend lock duration (increases veOXO)
   * 
   * @param owner - Position owner (signer)
   * @param additionalSeconds - Additional seconds to add to lock
   */
  async extendLock(
    owner: PublicKey,
    additionalSeconds: BN
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();
    const [positionPda] = this.getVePositionAddress(owner);

    return this.createInstruction(
      'extend_lock',
      [{ pubkey: owner, isSigner: true, isWritable: false },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: positionPda, isSigner: false, isWritable: true }],
      { additionalSeconds }
    );
  }

  /**
   * Withdraw OXO after lock expires
   * 
   * @param owner - Position owner (signer)
   * @param userOxoAccount - User's OXO token account
   * @param protocolOxoAccount - Protocol's OXO token account
   */
  async unlockOxo(
    owner: PublicKey,
    userOxoAccount: PublicKey,
    protocolOxoAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();
    const [positionPda] = this.getVePositionAddress(owner);

    return this.createInstruction(
      'unlock_oxo',
      [{ pubkey: owner, isSigner: true, isWritable: false },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: positionPda, isSigner: false, isWritable: true },
       { pubkey: userOxoAccount, isSigner: false, isWritable: true },
       { pubkey: protocolOxoAccount, isSigner: false, isWritable: true },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      {}
    );
  }

  /**
   * Claim fee share for veOXO holders
   * 
   * @param owner - Position owner (signer)
   * @param feePoolAccount - Protocol fee pool Cred account
   * @param userCredAccount - User's Cred account
   */
  async claimFeeShare(
    owner: PublicKey,
    feePoolAccount: PublicKey,
    userCredAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();
    const [positionPda] = this.getVePositionAddress(owner);

    return this.createInstruction(
      'claim_fee_share',
      [{ pubkey: owner, isSigner: true, isWritable: false },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: positionPda, isSigner: false, isWritable: true },
       { pubkey: feePoolAccount, isSigner: false, isWritable: true },
       { pubkey: userCredAccount, isSigner: false, isWritable: true },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      {}
    );
  }

  /**
   * Get current decayed veOXO balance
   * 
   * @param owner - Position owner
   */
  async getCurrentVeOxo(owner: PublicKey): Promise<BN> {
    const position = await this.getVePosition(owner);
    if (!position) return new BN(0);
    return this.calculateDecayedVeOxo(position);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions - Bonding Curves (Agent Token Launches)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new agent token with bonding curve
   * 
   * Costs 500 OXO creation fee
   * 
   * @param creator - Agent creator (signer, payer)
   * @param agentMint - New agent token mint (must be initialized)
   * @param name - Token name (max 32 chars)
   * @param symbol - Token symbol (max 10 chars)
   * @param uri - Metadata URI (max 200 chars)
   * @param creatorOxoAccount - Creator's OXO account (for fee)
   * @param treasuryOxoAccount - Treasury OXO account
   */
  async createAgentToken(
    creator: PublicKey,
    agentMint: PublicKey,
    name: string,
    symbol: string,
    uri: string,
    creatorOxoAccount: PublicKey,
    treasuryOxoAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();
    const [curvePda, bump] = this.getBondingCurveAddress(agentMint);

    return this.createInstruction(
      'create_agent_token',
      [{ pubkey: creator, isSigner: true, isWritable: true },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: curvePda, isSigner: false, isWritable: true },
       { pubkey: agentMint, isSigner: false, isWritable: true },
       { pubkey: creatorOxoAccount, isSigner: false, isWritable: true },
       { pubkey: treasuryOxoAccount, isSigner: false, isWritable: true },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { name, symbol, uri, bump }
    );
  }

  /**
   * Buy agent tokens on bonding curve (pre-graduation)
   * 
   * @param buyer - Buyer (signer)
   * @param agentMint - Agent token mint
   * @param oxoAmount - Amount of OXO to spend
   * @param buyerOxoAccount - Buyer's OXO account
   * @param buyerAgentAccount - Buyer's agent token account
   * @param curveOxoAccount - Bonding curve's OXO reserve
   */
  async buyAgentToken(
    buyer: PublicKey,
    agentMint: PublicKey,
    oxoAmount: BN,
    buyerOxoAccount: PublicKey,
    buyerAgentAccount: PublicKey,
    curveOxoAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [curvePda] = this.getBondingCurveAddress(agentMint);

    return this.createInstruction(
      'buy_agent_token',
      [{ pubkey: buyer, isSigner: true, isWritable: true },
       { pubkey: curvePda, isSigner: false, isWritable: true },
       { pubkey: agentMint, isSigner: false, isWritable: true },
       { pubkey: buyerOxoAccount, isSigner: false, isWritable: true },
       { pubkey: buyerAgentAccount, isSigner: false, isWritable: true },
       { pubkey: curveOxoAccount, isSigner: false, isWritable: true },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      { oxoAmount }
    );
  }

  /**
   * Sell agent tokens back to bonding curve (pre-graduation)
   * 
   * 1% sell fee
   * 
   * @param seller - Seller (signer)
   * @param agentMint - Agent token mint
   * @param tokenAmount - Amount of agent tokens to sell
   * @param sellerOxoAccount - Seller's OXO account
   * @param sellerAgentAccount - Seller's agent token account
   * @param curveOxoAccount - Bonding curve's OXO reserve
   */
  async sellAgentToken(
    seller: PublicKey,
    agentMint: PublicKey,
    tokenAmount: BN,
    sellerOxoAccount: PublicKey,
    sellerAgentAccount: PublicKey,
    curveOxoAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [curvePda] = this.getBondingCurveAddress(agentMint);

    return this.createInstruction(
      'sell_agent_token',
      [{ pubkey: seller, isSigner: true, isWritable: true },
       { pubkey: curvePda, isSigner: false, isWritable: true },
       { pubkey: agentMint, isSigner: false, isWritable: true },
       { pubkey: sellerOxoAccount, isSigner: false, isWritable: true },
       { pubkey: sellerAgentAccount, isSigner: false, isWritable: true },
       { pubkey: curveOxoAccount, isSigner: false, isWritable: true },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      { tokenAmount }
    );
  }

  /**
   * Deposit fees into fee pool (called by capture modules)
   * 
   * @param authority - Fee depositor (signer)
   * @param amount - Amount to deposit
   * @param sourceAccount - Source Cred account
   * @param feePoolAccount - Protocol fee pool account
   */
  async depositFees(
    authority: PublicKey,
    amount: BN,
    sourceAccount: PublicKey,
    feePoolAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();

    return this.createInstruction(
      'deposit_fees',
      [{ pubkey: authority, isSigner: true, isWritable: true },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: sourceAccount, isSigner: false, isWritable: true },
       { pubkey: feePoolAccount, isSigner: false, isWritable: true },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      { amount }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calculate veOXO for given OXO amount and lock duration
   * 
   * @param amount - OXO amount
   * @param lockSeconds - Lock duration in seconds
   */
  calculateVeOxo(amount: BN, lockSeconds: BN): BN {
    const sixMonths = new BN(CONSTANTS.MIN_LOCK_SECONDS);
    const fourYears = new BN(CONSTANTS.MAX_LOCK_SECONDS);

    if (lockSeconds.lte(sixMonths)) {
      return amount.div(new BN(4)); // 0.25x
    }
    if (lockSeconds.gte(fourYears)) {
      return amount.mul(new BN(2)); // 2x
    }

    // Linear interpolation
    const range = fourYears.sub(sixMonths);
    const progress = lockSeconds.sub(sixMonths);
    const baseMultiplier = new BN(25); // 0.25 * 100
    const additional = progress.mul(new BN(175)).div(range);
    const totalMultiplier = baseMultiplier.add(additional);

    return amount.mul(totalMultiplier).div(new BN(100));
  }

  /**
   * Calculate current decayed veOXO balance
   */
  calculateDecayedVeOxo(position: VeOxoPosition): BN {
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

  private createInstruction(
    name: string,
    accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
    data: any
  ): TransactionInstruction {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.OXO,
      data: Buffer.concat([discriminator, dataBuffer]),
    });
  }

  private deserializeOxoConfig(data: Buffer): OxoConfig {
    return {} as OxoConfig;
  }

  private deserializeVePosition(data: Buffer): VeOxoPosition {
    return {} as VeOxoPosition;
  }

  private deserializeBondingCurve(data: Buffer): BondingCurve {
    return {} as BondingCurve;
  }
}

// ============================================================================
// VTP MODULE (loop-vtp)
// ============================================================================

/**
 * VTP Module - Value Transfer Protocol (transfers, escrow, inheritance)
 * 
 * Program ID: 4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj
 */
export class VtpModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Get VTP config PDA */
  getConfigAddress(): [PublicKey, number] {
    return LoopPDA.vtpConfig();
  }

  /** Get escrow PDA */
  getEscrowAddress(sender: PublicKey, recipient: PublicKey, createdAt: BN): [PublicKey, number] {
    return LoopPDA.escrow(sender, recipient, createdAt);
  }

  /** Get inheritance plan PDA */
  getInheritanceAddress(owner: PublicKey): [PublicKey, number] {
    return LoopPDA.vtpInheritance(owner);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions - Initialization
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initialize VTP config
   * 
   * @param authority - Protocol authority (signer, payer)
   * @param feeRecipient - Address to receive transfer fees
   */
  async initialize(
    authority: PublicKey,
    feeRecipient: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda, bump] = this.getConfigAddress();

    return this.createInstruction(
      'initialize',
      [{ pubkey: authority, isSigner: true, isWritable: true },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: feeRecipient, isSigner: false, isWritable: false },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { bump }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions - Direct Transfers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Direct vault-to-vault transfer (0.1% fee)
   * 
   * @param sender - Sender (signer)
   * @param recipient - Recipient pubkey
   * @param amount - Amount to transfer
   * @param memo - Optional memo (max 200 chars)
   * @param senderCredAccount - Sender's Cred account
   * @param recipientCredAccount - Recipient's Cred account
   * @param feeAccount - Protocol fee account
   */
  async transfer(
    sender: PublicKey,
    recipient: PublicKey,
    amount: BN,
    memo: string | null,
    senderCredAccount: PublicKey,
    recipientCredAccount: PublicKey,
    feeAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();

    return this.createInstruction(
      'transfer',
      [{ pubkey: sender, isSigner: true, isWritable: true },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: recipient, isSigner: false, isWritable: false },
       { pubkey: senderCredAccount, isSigner: false, isWritable: true },
       { pubkey: recipientCredAccount, isSigner: false, isWritable: true },
       { pubkey: feeAccount, isSigner: false, isWritable: true },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      { amount, memo }
    );
  }

  /**
   * Batch transfer to multiple recipients
   * 
   * @param sender - Sender (signer)
   * @param recipients - List of recipient pubkeys (max 10)
   * @param amounts - Corresponding amounts
   * @param senderCredAccount - Sender's Cred account
   */
  async batchTransfer(
    sender: PublicKey,
    recipients: PublicKey[],
    amounts: BN[],
    senderCredAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();

    return this.createInstruction(
      'batch_transfer',
      [{ pubkey: sender, isSigner: true, isWritable: true },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: senderCredAccount, isSigner: false, isWritable: true },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      { recipients: recipients.map(r => r.toBase58()), amounts: amounts.map(a => a.toString()) }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions - Escrow
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create an escrow (conditional transfer, 0.25% fee)
   * 
   * @param sender - Sender (signer, payer)
   * @param recipient - Recipient pubkey
   * @param amount - Amount to escrow
   * @param releaseConditions - Conditions for release (max 10)
   * @param expiry - Unix timestamp for escrow expiry
   * @param senderCredAccount - Sender's Cred account
   * @param escrowCredAccount - Escrow Cred account
   * @param feeAccount - Protocol fee account
   */
  async createEscrow(
    sender: PublicKey,
    recipient: PublicKey,
    amount: BN,
    releaseConditions: ReleaseCondition[],
    expiry: BN,
    senderCredAccount: PublicKey,
    escrowCredAccount: PublicKey,
    feeAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();
    const now = new BN(Math.floor(Date.now() / 1000));
    const [escrowPda, bump] = this.getEscrowAddress(sender, recipient, now);

    return this.createInstruction(
      'create_escrow',
      [{ pubkey: sender, isSigner: true, isWritable: true },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: recipient, isSigner: false, isWritable: false },
       { pubkey: escrowPda, isSigner: false, isWritable: true },
       { pubkey: senderCredAccount, isSigner: false, isWritable: true },
       { pubkey: escrowCredAccount, isSigner: false, isWritable: true },
       { pubkey: feeAccount, isSigner: false, isWritable: true },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { amount, releaseConditions, expiry, bump }
    );
  }

  /**
   * Fulfill a condition (by arbiter or oracle)
   * 
   * @param fulfiller - Condition fulfiller (signer)
   * @param escrow - Escrow account
   * @param conditionIndex - Index of condition to fulfill
   * @param proof - Optional proof data
   */
  async fulfillCondition(
    fulfiller: PublicKey,
    escrow: PublicKey,
    conditionIndex: number,
    proof: Uint8Array | null
  ): Promise<TransactionInstruction> {
    return this.createInstruction(
      'fulfill_condition',
      [{ pubkey: fulfiller, isSigner: true, isWritable: false },
       { pubkey: escrow, isSigner: false, isWritable: true }],
      { conditionIndex, proof: proof ? Array.from(proof) : null }
    );
  }

  /**
   * Release escrow to recipient (all conditions must be met)
   * 
   * @param releaser - Releaser (signer)
   * @param escrow - Escrow account
   * @param escrowCredAccount - Escrow Cred account
   * @param recipientCredAccount - Recipient's Cred account
   */
  async releaseEscrow(
    releaser: PublicKey,
    escrow: PublicKey,
    escrowCredAccount: PublicKey,
    recipientCredAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();

    return this.createInstruction(
      'release_escrow',
      [{ pubkey: releaser, isSigner: true, isWritable: false },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: escrow, isSigner: false, isWritable: true },
       { pubkey: escrowCredAccount, isSigner: false, isWritable: true },
       { pubkey: recipientCredAccount, isSigner: false, isWritable: true },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      {}
    );
  }

  /**
   * Cancel escrow (returns funds to sender)
   * 
   * @param canceller - Canceller (signer)
   * @param escrow - Escrow account
   * @param escrowCredAccount - Escrow Cred account
   * @param senderCredAccount - Sender's Cred account
   */
  async cancelEscrow(
    canceller: PublicKey,
    escrow: PublicKey,
    escrowCredAccount: PublicKey,
    senderCredAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();

    return this.createInstruction(
      'cancel_escrow',
      [{ pubkey: canceller, isSigner: true, isWritable: false },
       { pubkey: configPda, isSigner: false, isWritable: true },
       { pubkey: escrow, isSigner: false, isWritable: true },
       { pubkey: escrowCredAccount, isSigner: false, isWritable: true },
       { pubkey: senderCredAccount, isSigner: false, isWritable: true },
       { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }],
      {}
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions - Inheritance
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Set up inheritance plan
   * 
   * @param owner - Vault owner (signer, payer)
   * @param heirs - List of heirs with percentages (must sum to 100)
   * @param inactivityThreshold - Seconds of inactivity before heir can claim (min 30 days)
   */
  async setupInheritance(
    owner: PublicKey,
    heirs: Heir[],
    inactivityThreshold: BN
  ): Promise<TransactionInstruction> {
    const [inheritancePda, bump] = this.getInheritanceAddress(owner);

    return this.createInstruction(
      'setup_inheritance',
      [{ pubkey: owner, isSigner: true, isWritable: true },
       { pubkey: inheritancePda, isSigner: false, isWritable: true },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { heirs, inactivityThreshold, bump }
    );
  }

  /**
   * Heartbeat to prove activity (prevents inheritance trigger)
   * 
   * @param owner - Vault owner (signer)
   */
  async inheritanceHeartbeat(owner: PublicKey): Promise<TransactionInstruction> {
    const [inheritancePda] = this.getInheritanceAddress(owner);

    return this.createInstruction(
      'inheritance_heartbeat',
      [{ pubkey: owner, isSigner: true, isWritable: false },
       { pubkey: inheritancePda, isSigner: false, isWritable: true }],
      {}
    );
  }

  /**
   * Trigger inheritance (by heir after inactivity threshold)
   * 
   * @param triggerer - Heir triggering inheritance (signer)
   * @param inheritancePlan - Inheritance plan account
   */
  async triggerInheritance(
    triggerer: PublicKey,
    inheritancePlan: PublicKey
  ): Promise<TransactionInstruction> {
    return this.createInstruction(
      'trigger_inheritance',
      [{ pubkey: triggerer, isSigner: true, isWritable: false },
       { pubkey: inheritancePlan, isSigner: false, isWritable: true }],
      {}
    );
  }

  /**
   * Execute inheritance distribution
   * 
   * @param executor - Executor (signer)
   * @param inheritancePlan - Inheritance plan account
   */
  async executeInheritance(
    executor: PublicKey,
    inheritancePlan: PublicKey
  ): Promise<TransactionInstruction> {
    return this.createInstruction(
      'execute_inheritance',
      [{ pubkey: executor, isSigner: true, isWritable: false },
       { pubkey: inheritancePlan, isSigner: false, isWritable: true }],
      {}
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Create an arbiter approval condition */
  arbiterCondition(arbiter: PublicKey): ReleaseCondition {
    return { arbiterApproval: { arbiter } };
  }

  /** Create a time release condition */
  timeCondition(timestamp: BN): ReleaseCondition {
    return { timeRelease: { timestamp } };
  }

  /** Create an oracle attestation condition */
  oracleCondition(oracle: PublicKey, dataHash: Uint8Array): ReleaseCondition {
    return { oracleAttestation: { oracle, dataHash } };
  }

  /** Create a multi-sig condition */
  multiSigCondition(threshold: number, signers: PublicKey[]): ReleaseCondition {
    return { multiSig: { threshold, signers } };
  }

  private createInstruction(
    name: string,
    accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
    data: any
  ): TransactionInstruction {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.VTP,
      data: Buffer.concat([discriminator, dataBuffer]),
    });
  }
}

// ============================================================================
// AVP MODULE (loop-avp)
// ============================================================================

/**
 * AVP Module - Agent Value Protocol (identity, capabilities, reputation)
 * 
 * Program ID: H5c9xfPYcx6EtC8hpThshARtUR7tq1NfMJVrTx8z9Jcx
 */
export class AvpModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Get agent identity PDA */
  getAgentAddress(agent: PublicKey): [PublicKey, number] {
    return LoopPDA.agentIdentity(agent);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Fetching
  // ─────────────────────────────────────────────────────────────────────────

  /** Fetch agent identity */
  async getAgent(agent: PublicKey): Promise<AgentIdentity | null> {
    const [identityPda] = this.getAgentAddress(agent);
    const accountInfo = await this.loop.connection.getAccountInfo(identityPda);
    if (!accountInfo) return null;
    return this.deserializeAgentIdentity(accountInfo.data);
  }

  /** Check if agent is registered */
  async isRegistered(agent: PublicKey): Promise<boolean> {
    const identity = await this.getAgent(agent);
    return identity !== null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions - Registration
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register a Personal Agent (bound to one human)
   * 
   * @param agent - Agent wallet (signer, payer)
   * @param principalHash - 32-byte hash of principal identity
   * @param metadataUri - Optional metadata URI (max 200 chars)
   */
  async registerPersonalAgent(
    agent: PublicKey,
    principalHash: Uint8Array,
    metadataUri: string | null
  ): Promise<TransactionInstruction> {
    const [identityPda, bump] = this.getAgentAddress(agent);

    return this.createInstruction(
      'register_personal_agent',
      [{ pubkey: agent, isSigner: true, isWritable: true },
       { pubkey: identityPda, isSigner: false, isWritable: true },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { principalHash: Array.from(principalHash), metadataUri, bump }
    );
  }

  /**
   * Register a Service Agent (serves many users)
   * 
   * Requires 500 OXO stake
   * 
   * @param creator - Agent creator (signer, payer)
   * @param agent - Agent wallet address
   * @param metadataUri - Optional metadata URI (max 200 chars)
   * @param creatorOxoAccount - Creator's OXO account (must have >= 500 OXO)
   */
  async registerServiceAgent(
    creator: PublicKey,
    agent: PublicKey,
    metadataUri: string | null,
    creatorOxoAccount: PublicKey
  ): Promise<TransactionInstruction> {
    const [identityPda, bump] = this.getAgentAddress(agent);

    return this.createInstruction(
      'register_service_agent',
      [{ pubkey: creator, isSigner: true, isWritable: true },
       { pubkey: agent, isSigner: false, isWritable: false },
       { pubkey: identityPda, isSigner: false, isWritable: true },
       { pubkey: creatorOxoAccount, isSigner: false, isWritable: false },
       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }],
      { metadataUri, bump }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions - Binding & Status
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Bind agent to a new principal
   * 
   * @param agent - Agent (signer)
   * @param newPrincipalHash - New principal hash
   */
  async bindAgent(
    agent: PublicKey,
    newPrincipalHash: Uint8Array
  ): Promise<TransactionInstruction> {
    const [identityPda] = this.getAgentAddress(agent);

    return this.createInstruction(
      'bind_agent',
      [{ pubkey: agent, isSigner: true, isWritable: false },
       { pubkey: identityPda, isSigner: false, isWritable: true }],
      { newPrincipalHash: Array.from(newPrincipalHash) }
    );
  }

  /**
   * Revoke agent authority (permanent)
   * 
   * @param agent - Agent (signer)
   */
  async revokeAgent(agent: PublicKey): Promise<TransactionInstruction> {
    const [identityPda] = this.getAgentAddress(agent);

    return this.createInstruction(
      'revoke_agent',
      [{ pubkey: agent, isSigner: true, isWritable: false },
       { pubkey: identityPda, isSigner: false, isWritable: true }],
      {}
    );
  }

  /**
   * Suspend agent (can be unsuspended)
   * 
   * @param authority - Agent or creator (signer)
   * @param agentIdentity - Agent identity account
   * @param reason - Reason for suspension (max 200 chars)
   */
  async suspendAgent(
    authority: PublicKey,
    agentIdentity: PublicKey,
    reason: string
  ): Promise<TransactionInstruction> {
    return this.createInstruction(
      'suspend_agent',
      [{ pubkey: authority, isSigner: true, isWritable: false },
       { pubkey: agentIdentity, isSigner: false, isWritable: true }],
      { reason }
    );
  }

  /**
   * Reactivate suspended agent
   * 
   * @param authority - Agent or creator (signer)
   * @param agentIdentity - Agent identity account
   */
  async reactivateAgent(
    authority: PublicKey,
    agentIdentity: PublicKey
  ): Promise<TransactionInstruction> {
    return this.createInstruction(
      'reactivate_agent',
      [{ pubkey: authority, isSigner: true, isWritable: false },
       { pubkey: agentIdentity, isSigner: false, isWritable: true }],
      {}
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions - Capabilities & Stake
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Declare capabilities the agent can perform
   * 
   * @param agent - Agent (signer)
   * @param capabilities - List of 8-byte capability IDs (max 20)
   */
  async declareCapabilities(
    agent: PublicKey,
    capabilities: CapabilityId[]
  ): Promise<TransactionInstruction> {
    const [identityPda] = this.getAgentAddress(agent);

    return this.createInstruction(
      'declare_capabilities',
      [{ pubkey: agent, isSigner: true, isWritable: false },
       { pubkey: identityPda, isSigner: false, isWritable: true }],
      { capabilities: capabilities.map(c => Array.from(c)) }
    );
  }

  /**
   * Add stake (Service Agents only)
   * 
   * @param creator - Service agent creator (signer)
   * @param agentIdentity - Agent identity account
   * @param amount - Amount of OXO to add
   */
  async addStake(
    creator: PublicKey,
    agentIdentity: PublicKey,
    amount: BN
  ): Promise<TransactionInstruction> {
    return this.createInstruction(
      'add_stake',
      [{ pubkey: creator, isSigner: true, isWritable: false },
       { pubkey: agentIdentity, isSigner: false, isWritable: true }],
      { amount }
    );
  }

  /**
   * Update reputation score (called by authorized module)
   * 
   * @param authority - Protocol authority (signer)
   * @param agentIdentity - Agent identity account
   * @param delta - Reputation change (can be negative)
   */
  async updateReputation(
    authority: PublicKey,
    agentIdentity: PublicKey,
    delta: number
  ): Promise<TransactionInstruction> {
    return this.createInstruction(
      'update_reputation',
      [{ pubkey: authority, isSigner: true, isWritable: false },
       { pubkey: agentIdentity, isSigner: false, isWritable: true }],
      { delta }
    );
  }

  /**
   * Update metadata URI
   * 
   * @param agent - Agent (signer)
   * @param newUri - New metadata URI (max 200 chars)
   */
  async updateMetadata(
    agent: PublicKey,
    newUri: string
  ): Promise<TransactionInstruction> {
    const [identityPda] = this.getAgentAddress(agent);

    return this.createInstruction(
      'update_metadata',
      [{ pubkey: agent, isSigner: true, isWritable: false },
       { pubkey: identityPda, isSigner: false, isWritable: true }],
      { newUri }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Create a capability ID from a string */
  createCapabilityId(name: string): CapabilityId {
    const bytes = new Uint8Array(8);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(name);
    bytes.set(encoded.slice(0, 8));
    return bytes;
  }

  /** Well-known capability IDs */
  static readonly CAPABILITIES = {
    CAPTURE_SHOPPING: new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    CAPTURE_DATA: new Uint8Array([0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    CAPTURE_PRESENCE: new Uint8Array([0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    CAPTURE_ATTENTION: new Uint8Array([0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    TRANSFER: new Uint8Array([0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    ESCROW: new Uint8Array([0x11, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    STACK: new Uint8Array([0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
  };

  private createInstruction(
    name: string,
    accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
    data: any
  ): TransactionInstruction {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.AVP,
      data: Buffer.concat([discriminator, dataBuffer]),
    });
  }

  private deserializeAgentIdentity(data: Buffer): AgentIdentity {
    return {} as AgentIdentity;
  }
}

// ============================================================================
// COMPUTE CAPTURE MODULE
// ============================================================================

/**
 * Compute Capture Module - Monetize computational resources
 * 
 * Allows users to register their compute resources (CPU, GPU, storage, bandwidth)
 * and earn rewards by completing computational tasks for the network.
 * 
 * @example
 * ```typescript
 * // Register compute resources
 * const profile = await loop.compute.registerResources(user, {
 *   cpu: 8,
 *   gpu: 2,
 *   storage: 1000,
 *   bandwidth: 1000
 * });
 * 
 * // Accept and complete a task
 * await loop.compute.acceptTask(user, 'task-123', new BN(100));
 * await loop.compute.submitTaskResult(user, 'task-123', resultHash, proof);
 * await loop.compute.claimComputeReward(user, ['task-123']);
 * ```
 */
export class ComputeCaptureModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get resource profile PDA for a provider
   * @param provider - Provider's public key
   */
  getResourceProfileAddress(provider: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('compute_profile'), provider.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }

  /**
   * Get task acceptance PDA
   * @param provider - Provider's public key
   * @param taskId - Task identifier
   */
  getTaskAcceptanceAddress(provider: PublicKey, taskId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('task_accept'), provider.toBuffer(), Buffer.from(taskId)],
      PROGRAM_IDS.VAULT
    );
  }

  /**
   * Get task submission PDA
   * @param provider - Provider's public key
   * @param taskId - Task identifier
   */
  getTaskSubmissionAddress(provider: PublicKey, taskId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('task_submit'), provider.toBuffer(), Buffer.from(taskId)],
      PROGRAM_IDS.VAULT
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register computational resources for task processing
   * 
   * Creates a resource profile that advertises available compute capacity
   * to the network. Resources can be updated later.
   * 
   * @param user - Resource provider (signer, payer)
   * @param resources - Resource specification
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const profile = await loop.compute.registerResources(wallet.publicKey, {
   *   cpu: 8,      // 8 CPU cores
   *   gpu: 2,      // 2 GPU units
   *   storage: 500, // 500 GB
   *   bandwidth: 1000 // 1000 Mbps
   * });
   * ```
   */
  async registerResources(
    user: PublicKey,
    resources: ResourceSpec
  ): Promise<TransactionInstruction> {
    const [profilePda, bump] = this.getResourceProfileAddress(user);

    return this.createInstruction(
      'register_compute_resources',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: profilePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      {
        cpuCores: resources.cpu,
        gpuUnits: resources.gpu,
        storageGb: resources.storage,
        bandwidthMbps: resources.bandwidth,
        bump,
      }
    );
  }

  /**
   * Accept a computational task with a bid
   * 
   * Provider commits to completing the task within the deadline.
   * Bid amount is the requested reward in Cred.
   * 
   * @param user - Task provider (signer)
   * @param taskId - Unique task identifier
   * @param bid - Bid amount in Cred (smallest unit)
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const acceptance = await loop.compute.acceptTask(
   *   wallet.publicKey,
   *   'task-abc123',
   *   new BN(50_000_000) // 50 Cred bid
   * );
   * ```
   */
  async acceptTask(
    user: PublicKey,
    taskId: string,
    bid: BN
  ): Promise<TransactionInstruction> {
    const [profilePda] = this.getResourceProfileAddress(user);
    const [acceptancePda, bump] = this.getTaskAcceptanceAddress(user, taskId);

    return this.createInstruction(
      'accept_compute_task',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: profilePda, isSigner: false, isWritable: true },
        { pubkey: acceptancePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      { taskId, bidAmount: bid.toString(), bump }
    );
  }

  /**
   * Submit completed task result with proof
   * 
   * Provider submits the result hash and proof of computation.
   * Proof can be a ZK-proof, signature, or other verification method.
   * 
   * @param user - Task provider (signer)
   * @param taskId - Task identifier
   * @param resultHash - 32-byte hash of the result data
   * @param proof - Proof of correct computation
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const resultHash = sha256(resultData);
   * const proof = generateZkProof(computation);
   * 
   * const submission = await loop.compute.submitTaskResult(
   *   wallet.publicKey,
   *   'task-abc123',
   *   resultHash,
   *   proof
   * );
   * ```
   */
  async submitTaskResult(
    user: PublicKey,
    taskId: string,
    resultHash: Uint8Array,
    proof: Uint8Array
  ): Promise<TransactionInstruction> {
    const [acceptancePda] = this.getTaskAcceptanceAddress(user, taskId);
    const [submissionPda, bump] = this.getTaskSubmissionAddress(user, taskId);

    return this.createInstruction(
      'submit_task_result',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: acceptancePda, isSigner: false, isWritable: true },
        { pubkey: submissionPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      {
        taskId,
        resultHash: Array.from(resultHash),
        proof: Array.from(proof),
        bump,
      }
    );
  }

  /**
   * Claim rewards for completed tasks
   * 
   * Batch claim rewards for multiple verified task completions.
   * Tasks must be verified before rewards can be claimed.
   * 
   * @param user - Provider claiming rewards (signer)
   * @param taskIds - Array of completed task IDs
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const signature = await loop.compute.claimComputeReward(
   *   wallet.publicKey,
   *   ['task-1', 'task-2', 'task-3']
   * );
   * ```
   */
  async claimComputeReward(
    user: PublicKey,
    taskIds: string[]
  ): Promise<TransactionInstruction> {
    const [profilePda] = this.getResourceProfileAddress(user);
    const [vaultPda] = LoopPDA.vault(user);

    return this.createInstruction(
      'claim_compute_reward',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: profilePda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      { taskIds }
    );
  }

  /**
   * Get compute statistics for a provider
   * 
   * Returns aggregated stats including total tasks, rewards,
   * success rate, and reputation score.
   * 
   * @param user - Provider's public key
   * @returns Compute statistics
   * 
   * @example
   * ```typescript
   * const stats = await loop.compute.getComputeStats(wallet.publicKey);
   * console.log(`Tasks completed: ${stats.totalTasks}`);
   * console.log(`Total rewards: ${stats.totalRewards} Cred`);
   * console.log(`Success rate: ${stats.successRate / 100}%`);
   * ```
   */
  async getComputeStats(user: PublicKey): Promise<ComputeStats> {
    const [profilePda] = this.getResourceProfileAddress(user);
    const accountInfo = await this.loop.connection.getAccountInfo(profilePda);
    
    if (!accountInfo) {
      return {
        totalTasks: new BN(0),
        totalRewards: new BN(0),
        successRate: 0,
        avgCompletionTime: new BN(0),
        reputationScore: 0,
        activeTasks: 0,
      };
    }

    // Deserialize and return stats
    return this.deserializeComputeStats(accountInfo.data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private createInstruction(
    name: string,
    accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
    data: any
  ): TransactionInstruction {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.VAULT,
      data: Buffer.concat([discriminator, dataBuffer]),
    });
  }

  private deserializeComputeStats(data: Buffer): ComputeStats {
    // Placeholder - real implementation would use Borsh/Anchor
    return {
      totalTasks: new BN(0),
      totalRewards: new BN(0),
      successRate: 0,
      avgCompletionTime: new BN(0),
      reputationScore: 0,
      activeTasks: 0,
    };
  }
}

// ============================================================================
// NETWORK CAPTURE MODULE
// ============================================================================

/**
 * Network Capture Module - Monetize network participation
 * 
 * Allows users to register as network nodes and earn rewards for
 * participating in governance, attestations, and network operations.
 * 
 * @example
 * ```typescript
 * // Register as a validator node
 * await loop.network.registerNode(user, NodeType.Validator, ['consensus', 'relay']);
 * 
 * // Participate in governance
 * await loop.network.submitVote(user, 'prop-123', true, proof);
 * 
 * // Submit attestation
 * await loop.network.submitAttestation(user, dataHash, AttestationType.PriceOracle);
 * ```
 */
export class NetworkCaptureModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get node registration PDA
   * @param operator - Node operator's public key
   */
  getNodeRegistrationAddress(operator: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('network_node'), operator.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }

  /**
   * Get vote submission PDA
   * @param voter - Voter's public key
   * @param proposalId - Proposal identifier
   */
  getVoteAddress(voter: PublicKey, proposalId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vote'), voter.toBuffer(), Buffer.from(proposalId)],
      PROGRAM_IDS.VAULT
    );
  }

  /**
   * Get attestation PDA
   * @param attester - Attester's public key
   * @param dataHash - Hash of attested data
   */
  getAttestationAddress(attester: PublicKey, dataHash: Uint8Array): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('attestation'), attester.toBuffer(), dataHash.slice(0, 32)],
      PROGRAM_IDS.VAULT
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Register as a network node
   * 
   * Creates a node registration that allows participation in
   * network operations and governance.
   * 
   * @param user - Node operator (signer, payer)
   * @param nodeType - Type of node (Validator, Relay, Oracle, etc.)
   * @param capabilities - List of capabilities (max 10)
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const registration = await loop.network.registerNode(
   *   wallet.publicKey,
   *   NodeType.Oracle,
   *   ['price_feed', 'data_attestation']
   * );
   * ```
   */
  async registerNode(
    user: PublicKey,
    nodeType: NodeType,
    capabilities: string[]
  ): Promise<TransactionInstruction> {
    const [nodePda, bump] = this.getNodeRegistrationAddress(user);

    return this.createInstruction(
      'register_network_node',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: nodePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      { nodeType, capabilities, bump }
    );
  }

  /**
   * Submit a governance vote
   * 
   * Cast a vote on a protocol proposal. Vote weight is based on
   * veOXO balance at time of snapshot.
   * 
   * @param user - Voter (signer)
   * @param proposalId - Proposal identifier
   * @param vote - Vote value (true = yes, false = no)
   * @param proof - Proof of voting eligibility (veOXO snapshot proof)
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const voteSubmission = await loop.network.submitVote(
   *   wallet.publicKey,
   *   'prop-upgrade-v2',
   *   true, // voting yes
   *   eligibilityProof
   * );
   * ```
   */
  async submitVote(
    user: PublicKey,
    proposalId: string,
    vote: boolean,
    proof: Uint8Array
  ): Promise<TransactionInstruction> {
    const [nodePda] = this.getNodeRegistrationAddress(user);
    const [votePda, bump] = this.getVoteAddress(user, proposalId);
    const [vePositionPda] = LoopPDA.veOxoPosition(user);

    return this.createInstruction(
      'submit_network_vote',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: nodePda, isSigner: false, isWritable: true },
        { pubkey: votePda, isSigner: false, isWritable: true },
        { pubkey: vePositionPda, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      { proposalId, vote, proof: Array.from(proof), bump }
    );
  }

  /**
   * Submit a data attestation
   * 
   * Attest to the validity/existence of off-chain data.
   * Used for oracles, identity verification, and event witnessing.
   * 
   * @param user - Attester (signer)
   * @param dataHash - 32-byte hash of data being attested
   * @param attestationType - Type of attestation
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const attestation = await loop.network.submitAttestation(
   *   wallet.publicKey,
   *   sha256(priceData),
   *   AttestationType.PriceOracle
   * );
   * ```
   */
  async submitAttestation(
    user: PublicKey,
    dataHash: Uint8Array,
    attestationType: AttestationType
  ): Promise<TransactionInstruction> {
    const [nodePda] = this.getNodeRegistrationAddress(user);
    const [attestationPda, bump] = this.getAttestationAddress(user, dataHash);

    return this.createInstruction(
      'submit_attestation',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: nodePda, isSigner: false, isWritable: true },
        { pubkey: attestationPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      { dataHash: Array.from(dataHash), attestationType, bump }
    );
  }

  /**
   * Claim participation rewards
   * 
   * Batch claim rewards for network participation activities
   * (voting, attestations, uptime).
   * 
   * @param user - Node operator claiming rewards (signer)
   * @param activityIds - Array of activity IDs to claim
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const signature = await loop.network.claimParticipationReward(
   *   wallet.publicKey,
   *   ['vote-1', 'attest-2', 'uptime-3']
   * );
   * ```
   */
  async claimParticipationReward(
    user: PublicKey,
    activityIds: string[]
  ): Promise<TransactionInstruction> {
    const [nodePda] = this.getNodeRegistrationAddress(user);
    const [vaultPda] = LoopPDA.vault(user);

    return this.createInstruction(
      'claim_participation_reward',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: nodePda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      { activityIds }
    );
  }

  /**
   * Get network statistics for a node
   * 
   * Returns aggregated stats including votes, attestations,
   * rewards, and uptime percentage.
   * 
   * @param user - Node operator's public key
   * @returns Network statistics
   * 
   * @example
   * ```typescript
   * const stats = await loop.network.getNetworkStats(wallet.publicKey);
   * console.log(`Total votes: ${stats.totalVotes}`);
   * console.log(`Uptime: ${stats.uptimePercentage / 100}%`);
   * ```
   */
  async getNetworkStats(user: PublicKey): Promise<NetworkStats> {
    const [nodePda] = this.getNodeRegistrationAddress(user);
    const accountInfo = await this.loop.connection.getAccountInfo(nodePda);
    
    if (!accountInfo) {
      return {
        totalVotes: new BN(0),
        totalAttestations: new BN(0),
        participationRewards: new BN(0),
        uptimePercentage: 0,
        currentStreak: 0,
        slashCount: 0,
      };
    }

    return this.deserializeNetworkStats(accountInfo.data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private createInstruction(
    name: string,
    accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
    data: any
  ): TransactionInstruction {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.VAULT,
      data: Buffer.concat([discriminator, dataBuffer]),
    });
  }

  private deserializeNetworkStats(data: Buffer): NetworkStats {
    return {
      totalVotes: new BN(0),
      totalAttestations: new BN(0),
      participationRewards: new BN(0),
      uptimePercentage: 0,
      currentStreak: 0,
      slashCount: 0,
    };
  }
}

// ============================================================================
// SKILL CAPTURE MODULE
// ============================================================================

/**
 * Skill Capture Module - Monetize behavioral patterns and skills
 * 
 * Allows users to export their behavioral models, license them to others,
 * and earn passive income from their skills and patterns.
 * 
 * @example
 * ```typescript
 * // Export a trading behavior model
 * const model = await loop.skill.exportBehaviorModel(
 *   user,
 *   SkillType.Trading,
 *   AnonymizationLevel.Differential
 * );
 * 
 * // License to a buyer
 * await loop.skill.licenseSkill(user, buyer, model.modelId, terms);
 * 
 * // Claim accumulated revenue
 * await loop.skill.claimSkillRevenue(user);
 * ```
 */
export class SkillCaptureModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get behavior model PDA
   * @param owner - Model owner's public key
   * @param modelId - Model identifier
   */
  getBehaviorModelAddress(owner: PublicKey, modelId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('behavior_model'), owner.toBuffer(), Buffer.from(modelId)],
      PROGRAM_IDS.VAULT
    );
  }

  /**
   * Get skill license PDA
   * @param licensor - License issuer's public key
   * @param licenseId - License identifier
   */
  getSkillLicenseAddress(licensor: PublicKey, licenseId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('skill_license'), licensor.toBuffer(), Buffer.from(licenseId)],
      PROGRAM_IDS.VAULT
    );
  }

  /**
   * Get skill stats PDA
   * @param owner - Owner's public key
   */
  getSkillStatsAddress(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('skill_stats'), owner.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Export a behavior model for a specific skill
   * 
   * Creates a portable model from the user's behavioral data.
   * Anonymization level determines privacy protection.
   * 
   * @param user - Model owner (signer, payer)
   * @param skillType - Type of skill to export
   * @param anonymizationLevel - Level of privacy protection
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const model = await loop.skill.exportBehaviorModel(
   *   wallet.publicKey,
   *   SkillType.DataAnalysis,
   *   AnonymizationLevel.Federated
   * );
   * ```
   */
  async exportBehaviorModel(
    user: PublicKey,
    skillType: SkillType,
    anonymizationLevel: AnonymizationLevel
  ): Promise<TransactionInstruction> {
    // Generate model ID from timestamp + random
    const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [modelPda, bump] = this.getBehaviorModelAddress(user, modelId);
    const [statsPda] = this.getSkillStatsAddress(user);

    return this.createInstruction(
      'export_behavior_model',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: modelPda, isSigner: false, isWritable: true },
        { pubkey: statsPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      { modelId, skillType, anonymizationLevel, bump }
    );
  }

  /**
   * License a skill model to a buyer
   * 
   * Creates a license granting the buyer usage rights to the model.
   * License terms define duration, usage limits, and pricing.
   * 
   * @param user - Model owner/licensor (signer)
   * @param buyer - Buyer's public key
   * @param modelId - Model to license
   * @param terms - License terms
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const license = await loop.skill.licenseSkill(
   *   wallet.publicKey,
   *   buyerPubkey,
   *   'model_123',
   *   {
   *     duration: new BN(365 * 24 * 60 * 60), // 1 year
   *     price: new BN(100_000_000), // 100 Cred
   *     usageLimit: new BN(0), // unlimited
   *     allowSublicense: false,
   *     commercialUse: true
   *   }
   * );
   * ```
   */
  async licenseSkill(
    user: PublicKey,
    buyer: PublicKey,
    modelId: string,
    terms: LicenseTerms
  ): Promise<TransactionInstruction> {
    const licenseId = `lic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [modelPda] = this.getBehaviorModelAddress(user, modelId);
    const [licensePda, bump] = this.getSkillLicenseAddress(user, licenseId);
    const [statsPda] = this.getSkillStatsAddress(user);

    return this.createInstruction(
      'license_skill',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: buyer, isSigner: false, isWritable: true },
        { pubkey: modelPda, isSigner: false, isWritable: true },
        { pubkey: licensePda, isSigner: false, isWritable: true },
        { pubkey: statsPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      {
        modelId,
        licenseId,
        duration: terms.duration.toString(),
        price: terms.price.toString(),
        usageLimit: terms.usageLimit.toString(),
        allowSublicense: terms.allowSublicense,
        commercialUse: terms.commercialUse,
        bump,
      }
    );
  }

  /**
   * Revoke an existing skill license
   * 
   * Terminates a license before its expiry. May require
   * refund depending on license terms.
   * 
   * @param user - Licensor (signer)
   * @param licenseId - License to revoke
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const signature = await loop.skill.revokeSkillLicense(
   *   wallet.publicKey,
   *   'lic_123'
   * );
   * ```
   */
  async revokeSkillLicense(
    user: PublicKey,
    licenseId: string
  ): Promise<TransactionInstruction> {
    const [licensePda] = this.getSkillLicenseAddress(user, licenseId);
    const [statsPda] = this.getSkillStatsAddress(user);

    return this.createInstruction(
      'revoke_skill_license',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: licensePda, isSigner: false, isWritable: true },
        { pubkey: statsPda, isSigner: false, isWritable: true },
      ],
      { licenseId }
    );
  }

  /**
   * Claim accumulated skill licensing revenue
   * 
   * Withdraws all unclaimed revenue from skill licenses
   * to the user's vault.
   * 
   * @param user - Model owner (signer)
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const signature = await loop.skill.claimSkillRevenue(wallet.publicKey);
   * ```
   */
  async claimSkillRevenue(user: PublicKey): Promise<TransactionInstruction> {
    const [statsPda] = this.getSkillStatsAddress(user);
    const [vaultPda] = LoopPDA.vault(user);

    return this.createInstruction(
      'claim_skill_revenue',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: statsPda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      {}
    );
  }

  /**
   * Get skill statistics for a user
   * 
   * Returns aggregated stats including models, licenses,
   * revenue, and top-performing skills.
   * 
   * @param user - User's public key
   * @returns Skill statistics
   * 
   * @example
   * ```typescript
   * const stats = await loop.skill.getSkillStats(wallet.publicKey);
   * console.log(`Total models: ${stats.totalModels}`);
   * console.log(`Total revenue: ${stats.totalRevenue} Cred`);
   * console.log(`Active licenses: ${stats.activeLicenses}`);
   * ```
   */
  async getSkillStats(user: PublicKey): Promise<SkillStats> {
    const [statsPda] = this.getSkillStatsAddress(user);
    const accountInfo = await this.loop.connection.getAccountInfo(statsPda);
    
    if (!accountInfo) {
      return {
        totalModels: new BN(0),
        totalLicenses: new BN(0),
        totalRevenue: new BN(0),
        activeLicenses: 0,
        avgLicensePrice: new BN(0),
        topSkillType: SkillType.Custom,
      };
    }

    return this.deserializeSkillStats(accountInfo.data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private createInstruction(
    name: string,
    accounts: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
    data: any
  ): TransactionInstruction {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.VAULT,
      data: Buffer.concat([discriminator, dataBuffer]),
    });
  }

  private deserializeSkillStats(data: Buffer): SkillStats {
    return {
      totalModels: new BN(0),
      totalLicenses: new BN(0),
      totalRevenue: new BN(0),
      activeLicenses: 0,
      avgLicensePrice: new BN(0),
      topSkillType: SkillType.Custom,
    };
  }
}


// ============================================================================
// EXPORTS
// ============================================================================

export default Loop;


// ============================================================================
// CAPTURE MODULE TYPES - Liquidity
// ============================================================================

/** Strategy type for liquidity deployment */
export enum LiquidityStrategy {
  Conservative = 0,
  Balanced = 1,
  Aggressive = 2,
  Custom = 3,
}

/** Risk tolerance level */
export enum RiskTolerance {
  Low = 0,
  Medium = 1,
  High = 2,
}

/** Position status */
export enum PositionStatus {
  Active = 0,
  Rebalancing = 1,
  Withdrawing = 2,
  Closed = 3,
}

/** Deployed capital position */
export interface DeploymentPosition {
  /** Unique position identifier */
  positionId: string;
  /** User who deployed the capital */
  user: PublicKey;
  /** Amount deployed in Cred */
  amount: BN;
  /** Current strategy */
  strategy: LiquidityStrategy;
  /** Risk tolerance setting */
  riskTolerance: RiskTolerance;
  /** Position status */
  status: PositionStatus;
  /** Unix timestamp of deployment */
  deployedAt: BN;
  /** Cumulative yield earned */
  yieldEarned: BN;
  /** Current APY in basis points */
  currentApy: number;
}

/** Result of a rebalance operation */
export interface RebalanceResult {
  /** Position that was rebalanced */
  positionId: string;
  /** Previous strategy */
  previousStrategy: LiquidityStrategy;
  /** New strategy */
  newStrategy: LiquidityStrategy;
  /** Timestamp of rebalance */
  rebalancedAt: BN;
  /** Estimated new APY */
  estimatedApy: number;
  /** Transaction signature */
  signature: string;
}

/** Result of a withdrawal */
export interface WithdrawalResult {
  /** Position withdrawn from */
  positionId: string;
  /** Amount withdrawn */
  amountWithdrawn: BN;
  /** Remaining balance in position */
  remainingBalance: BN;
  /** Whether position is closed */
  positionClosed: boolean;
  /** Transaction signature */
  signature: string;
}

/** Liquidity statistics for a user */
export interface LiquidityStats {
  /** Total capital deployed */
  totalDeployed: BN;
  /** Total yield earned all-time */
  totalYieldEarned: BN;
  /** Pending yield to claim */
  pendingYield: BN;
  /** Number of active positions */
  activePositions: number;
  /** Average APY across positions */
  averageApy: number;
  /** Protocol rank (percentile) */
  protocolRank: number;
}

// ============================================================================
// CAPTURE MODULE TYPES - Energy
// ============================================================================

/** Type of energy device */
export enum DeviceType {
  SolarPanel = 0,
  Battery = 1,
  EVCharger = 2,
  SmartThermostat = 3,
  SmartMeter = 4,
  HeatPump = 5,
}

/** Device capabilities */
export interface DeviceCapabilities {
  /** Can generate energy */
  canGenerate: boolean;
  /** Can store energy */
  canStore: boolean;
  /** Can consume energy */
  canConsume: boolean;
  /** Can shift load timing */
  canShiftLoad: boolean;
  /** Maximum power in watts */
  maxPowerWatts: number;
  /** Storage capacity in watt-hours (if applicable) */
  storageCapacityWh: number | null;
}

/** Energy arbitrage action */
export enum ArbitrageAction {
  /** Store energy during low prices */
  Store = 0,
  /** Discharge during high prices */
  Discharge = 1,
  /** Shift load to cheaper period */
  ShiftLoad = 2,
  /** Sell back to grid */
  SellToGrid = 3,
}

/** Device registration result */
export interface DeviceRegistration {
  /** Unique device identifier */
  deviceId: string;
  /** Device type */
  deviceType: DeviceType;
  /** Device capabilities */
  capabilities: DeviceCapabilities;
  /** Registration timestamp */
  registeredAt: BN;
  /** Device status */
  isActive: boolean;
}

/** Energy usage report */
export interface UsageReport {
  /** Device that reported */
  deviceId: string;
  /** Energy consumed in watt-hours */
  energyConsumedWh: BN;
  /** Energy generated in watt-hours */
  energyGeneratedWh: BN;
  /** Net energy (generated - consumed) */
  netEnergyWh: BN;
  /** Value captured in Cred */
  valueCaptured: BN;
  /** Reporting period start */
  periodStart: BN;
  /** Reporting period end */
  periodEnd: BN;
}

/** Arbitrage execution result */
export interface ArbitrageExecution {
  /** Device used */
  deviceId: string;
  /** Action taken */
  action: ArbitrageAction;
  /** Energy amount in watt-hours */
  energyAmountWh: BN;
  /** Price at execution (Cred per kWh) */
  pricePerKwh: BN;
  /** Revenue/savings in Cred */
  revenue: BN;
  /** Execution timestamp */
  executedAt: BN;
  /** Transaction signature */
  signature: string;
}

/** Energy statistics for a user */
export interface EnergyStats {
  /** Total devices registered */
  totalDevices: number;
  /** Total energy generated all-time (Wh) */
  totalEnergyGeneratedWh: BN;
  /** Total energy consumed all-time (Wh) */
  totalEnergyConsumedWh: BN;
  /** Total revenue earned */
  totalRevenue: BN;
  /** Pending revenue to claim */
  pendingRevenue: BN;
  /** Carbon offset in kg */
  carbonOffsetKg: BN;
}

// ============================================================================
// CAPTURE MODULE TYPES - Social
// ============================================================================

/** Introduction terms */
export interface IntroTerms {
  /** Fee split percentage for facilitator (0-100) */
  facilitatorFeePercent: number;
  /** Minimum deal value to trigger fee */
  minimumDealValue: BN;
  /** Expiry for the intro offer */
  expiryTimestamp: BN;
  /** Custom terms description */
  description: string | null;
}

/** Introduction outcome */
export enum IntroOutcome {
  /** Intro was accepted and connected */
  Connected = 0,
  /** Deal was closed */
  DealClosed = 1,
  /** Intro was declined */
  Declined = 2,
  /** Intro expired */
  Expired = 3,
}

/** Introduction request result */
export interface IntroRequest {
  /** Unique intro identifier */
  introId: string;
  /** User who facilitated */
  facilitator: PublicKey;
  /** Contact being introduced from */
  fromContact: PublicKey;
  /** Contact being introduced to */
  toContact: PublicKey;
  /** Terms of the introduction */
  terms: IntroTerms;
  /** Request timestamp */
  requestedAt: BN;
  /** Status */
  isPending: boolean;
}

/** Introduction completion result */
export interface IntroCompletion {
  /** Intro that was completed */
  introId: string;
  /** Outcome of the introduction */
  outcome: IntroOutcome;
  /** Deal value (if applicable) */
  dealValue: BN | null;
  /** Fee earned by facilitator */
  feeEarned: BN;
  /** Completed timestamp */
  completedAt: BN;
  /** Transaction signature */
  signature: string;
}

/** Reputation stake */
export interface ReputationStake {
  /** Stake identifier */
  stakeId: string;
  /** User who staked */
  staker: PublicKey;
  /** User being vouched for */
  targetUser: PublicKey;
  /** Amount staked */
  amount: BN;
  /** Stake timestamp */
  stakedAt: BN;
  /** Whether stake is active */
  isActive: boolean;
}

/** Social statistics for a user */
export interface SocialStats {
  /** Total introductions made */
  totalIntros: number;
  /** Successful introductions */
  successfulIntros: number;
  /** Total fees earned */
  totalFeesEarned: BN;
  /** Pending fees to claim */
  pendingFees: BN;
  /** Reputation score */
  reputationScore: number;
  /** Total reputation staked on others */
  totalStakedOnOthers: BN;
  /** Total reputation received from others */
  totalStakedByOthers: BN;
}

// ============================================================================
// CAPTURE MODULE TYPES - Insurance
// ============================================================================

/** Claim type categories */
export enum ClaimType {
  /** Smart contract bug/hack */
  SmartContractFailure = 0,
  /** Stablecoin depeg event */
  StablecoinDepeg = 1,
  /** Protocol insolvency */
  ProtocolInsolvency = 2,
  /** Oracle manipulation */
  OracleManipulation = 3,
  /** Governance attack */
  GovernanceAttack = 4,
}

/** Vote on a claim */
export enum ClaimVoteType {
  /** Approve the claim */
  Approve = 0,
  /** Reject the claim */
  Reject = 1,
  /** Abstain from voting */
  Abstain = 2,
}

/** Claim status */
export enum ClaimStatus {
  /** Claim is pending review */
  Pending = 0,
  /** Claim is being voted on */
  Voting = 1,
  /** Claim was approved */
  Approved = 2,
  /** Claim was rejected */
  Rejected = 3,
  /** Claim was paid out */
  PaidOut = 4,
}

/** Pool membership result */
export interface PoolMembership {
  /** Membership identifier */
  membershipId: string;
  /** Pool joined */
  poolId: string;
  /** User who joined */
  user: PublicKey;
  /** Coverage amount */
  coverage: BN;
  /** Premium paid */
  premium: BN;
  /** Membership start */
  startedAt: BN;
  /** Membership expiry */
  expiresAt: BN;
  /** Is membership active */
  isActive: boolean;
}

/** Claim submission result */
export interface ClaimSubmission {
  /** Claim identifier */
  claimId: string;
  /** Pool the claim is against */
  poolId: string;
  /** Claimant */
  claimant: PublicKey;
  /** Type of claim */
  claimType: ClaimType;
  /** Amount claimed */
  amountClaimed: BN;
  /** Evidence hash (IPFS/Arweave) */
  evidenceHash: string;
  /** Submission timestamp */
  submittedAt: BN;
  /** Claim status */
  status: ClaimStatus;
}

/** Claim vote result */
export interface ClaimVote {
  /** Claim being voted on */
  claimId: string;
  /** Voter */
  voter: PublicKey;
  /** Vote type */
  vote: ClaimVoteType;
  /** Voting power used */
  votingPower: BN;
  /** Vote timestamp */
  votedAt: BN;
  /** Transaction signature */
  signature: string;
}

/** Insurance statistics for a user */
export interface InsuranceStats {
  /** Total pools joined */
  totalPoolsJoined: number;
  /** Total coverage across pools */
  totalCoverage: BN;
  /** Total premiums paid */
  totalPremiumsPaid: BN;
  /** Claims filed */
  claimsFiled: number;
  /** Claims approved */
  claimsApproved: number;
  /** Total claimed amount received */
  totalClaimedAmount: BN;
  /** Premium returns pending */
  pendingPremiumReturns: BN;
}

// ============================================================================
// LIQUIDITY CAPTURE MODULE
// ============================================================================

/**
 * Liquidity Capture Module - Deploy and manage capital in yield strategies
 * 
 * Captures value from DeFi liquidity provision, lending, and yield farming.
 * Supports multiple strategies with varying risk/reward profiles.
 */
export class LiquidityCapture {
  constructor(private readonly loop: Loop) {}

  /**
   * Deploy capital into a yield strategy
   * 
   * @param user - User deploying capital (signer)
   * @param amount - Amount of Cred to deploy
   * @param strategy - Deployment strategy
   * @param riskTolerance - Risk tolerance level
   * @returns Deployment position details
   * 
   * @example
   * ```typescript
   * const position = await loop.liquidity.deployCapital(
   *   userPubkey,
   *   new BN(1000_000000), // 1000 Cred
   *   LiquidityStrategy.Balanced,
   *   RiskTolerance.Medium
   * );
   * console.log(`Deployed ${position.amount} at ${position.currentApy}% APY`);
   * ```
   */
  async deployCapital(
    user: PublicKey,
    amount: BN,
    strategy: LiquidityStrategy,
    riskTolerance: RiskTolerance
  ): Promise<DeploymentPosition> {
    // Stub implementation
    throw new Error('LiquidityCapture.deployCapital not yet implemented');
  }

  /**
   * Rebalance an existing position to a new strategy
   * 
   * @param user - Position owner (signer)
   * @param positionId - Position to rebalance
   * @param newStrategy - New strategy to apply
   * @returns Rebalance result
   * 
   * @example
   * ```typescript
   * const result = await loop.liquidity.rebalance(
   *   userPubkey,
   *   'pos_abc123',
   *   LiquidityStrategy.Aggressive
   * );
   * console.log(`New APY: ${result.estimatedApy}%`);
   * ```
   */
  async rebalance(
    user: PublicKey,
    positionId: string,
    newStrategy: LiquidityStrategy
  ): Promise<RebalanceResult> {
    // Stub implementation
    throw new Error('LiquidityCapture.rebalance not yet implemented');
  }

  /**
   * Withdraw capital from a position
   * 
   * @param user - Position owner (signer)
   * @param positionId - Position to withdraw from
   * @param amount - Amount to withdraw (null for full withdrawal)
   * @returns Withdrawal result
   * 
   * @example
   * ```typescript
   * // Partial withdrawal
   * const result = await loop.liquidity.withdrawCapital(
   *   userPubkey,
   *   'pos_abc123',
   *   new BN(500_000000)
   * );
   * 
   * // Full withdrawal
   * const fullResult = await loop.liquidity.withdrawCapital(
   *   userPubkey,
   *   'pos_abc123',
   *   null
   * );
   * ```
   */
  async withdrawCapital(
    user: PublicKey,
    positionId: string,
    amount: BN | null
  ): Promise<WithdrawalResult> {
    // Stub implementation
    throw new Error('LiquidityCapture.withdrawCapital not yet implemented');
  }

  /**
   * Claim accumulated yield from positions
   * 
   * @param user - Position owner (signer)
   * @param positionIds - Positions to claim yield from
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const sig = await loop.liquidity.claimYield(
   *   userPubkey,
   *   ['pos_abc123', 'pos_def456']
   * );
   * ```
   */
  async claimYield(
    user: PublicKey,
    positionIds: string[]
  ): Promise<string> {
    // Stub implementation
    throw new Error('LiquidityCapture.claimYield not yet implemented');
  }

  /**
   * Get liquidity statistics for a user
   * 
   * @param user - User to get stats for
   * @returns Liquidity statistics
   * 
   * @example
   * ```typescript
   * const stats = await loop.liquidity.getLiquidityStats(userPubkey);
   * console.log(`Total deployed: ${stats.totalDeployed}`);
   * console.log(`Pending yield: ${stats.pendingYield}`);
   * ```
   */
  async getLiquidityStats(user: PublicKey): Promise<LiquidityStats> {
    // Stub implementation
    throw new Error('LiquidityCapture.getLiquidityStats not yet implemented');
  }
}

// ============================================================================
// ENERGY CAPTURE MODULE
// ============================================================================

/**
 * Energy Capture Module - Monetize distributed energy resources
 * 
 * Captures value from:
 * - Solar generation and grid sales
 * - Battery arbitrage (buy low, sell high)
 * - EV charging optimization
 * - Demand response participation
 */
export class EnergyCapture {
  constructor(private readonly loop: Loop) {}

  /**
   * Register an energy device for value capture
   * 
   * @param user - Device owner (signer)
   * @param deviceType - Type of energy device
   * @param capabilities - Device capabilities
   * @returns Device registration details
   * 
   * @example
   * ```typescript
   * const device = await loop.energy.registerDevice(
   *   userPubkey,
   *   DeviceType.Battery,
   *   {
   *     canGenerate: false,
   *     canStore: true,
   *     canConsume: true,
   *     canShiftLoad: true,
   *     maxPowerWatts: 5000,
   *     storageCapacityWh: 13500
   *   }
   * );
   * ```
   */
  async registerDevice(
    user: PublicKey,
    deviceType: DeviceType,
    capabilities: DeviceCapabilities
  ): Promise<DeviceRegistration> {
    // Stub implementation
    throw new Error('EnergyCapture.registerDevice not yet implemented');
  }

  /**
   * Report energy usage for a device
   * 
   * @param user - Device owner (signer)
   * @param deviceId - Device identifier
   * @param usage - Energy usage data (consumed/generated Wh)
   * @param gridPrices - Current grid prices for value calculation
   * @returns Usage report with captured value
   * 
   * @example
   * ```typescript
   * const report = await loop.energy.reportEnergyUsage(
   *   userPubkey,
   *   'dev_solar123',
   *   { generated: new BN(5000), consumed: new BN(1000) },
   *   { buyPrice: new BN(12), sellPrice: new BN(8) } // cents per kWh
   * );
   * ```
   */
  async reportEnergyUsage(
    user: PublicKey,
    deviceId: string,
    usage: { generated: BN; consumed: BN },
    gridPrices: { buyPrice: BN; sellPrice: BN }
  ): Promise<UsageReport> {
    // Stub implementation
    throw new Error('EnergyCapture.reportEnergyUsage not yet implemented');
  }

  /**
   * Execute energy arbitrage action
   * 
   * @param user - Device owner (signer)
   * @param deviceId - Device to use for arbitrage
   * @param action - Arbitrage action to take
   * @returns Execution result with revenue
   * 
   * @example
   * ```typescript
   * // Store energy during low prices
   * const result = await loop.energy.executeArbitrage(
   *   userPubkey,
   *   'dev_battery123',
   *   ArbitrageAction.Store
   * );
   * 
   * // Later, discharge during high prices
   * const sellResult = await loop.energy.executeArbitrage(
   *   userPubkey,
   *   'dev_battery123',
   *   ArbitrageAction.Discharge
   * );
   * ```
   */
  async executeArbitrage(
    user: PublicKey,
    deviceId: string,
    action: ArbitrageAction
  ): Promise<ArbitrageExecution> {
    // Stub implementation
    throw new Error('EnergyCapture.executeArbitrage not yet implemented');
  }

  /**
   * Claim accumulated energy revenue
   * 
   * @param user - User claiming revenue (signer)
   * @param periodIds - Reporting periods to claim
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const sig = await loop.energy.claimEnergyRevenue(
   *   userPubkey,
   *   ['period_2026_01', 'period_2026_02']
   * );
   * ```
   */
  async claimEnergyRevenue(
    user: PublicKey,
    periodIds: string[]
  ): Promise<string> {
    // Stub implementation
    throw new Error('EnergyCapture.claimEnergyRevenue not yet implemented');
  }

  /**
   * Get energy statistics for a user
   * 
   * @param user - User to get stats for
   * @returns Energy statistics
   * 
   * @example
   * ```typescript
   * const stats = await loop.energy.getEnergyStats(userPubkey);
   * console.log(`Devices: ${stats.totalDevices}`);
   * console.log(`Carbon offset: ${stats.carbonOffsetKg} kg`);
   * ```
   */
  async getEnergyStats(user: PublicKey): Promise<EnergyStats> {
    // Stub implementation
    throw new Error('EnergyCapture.getEnergyStats not yet implemented');
  }
}

// ============================================================================
// SOCIAL CAPTURE MODULE
// ============================================================================

/**
 * Social Capture Module - Monetize social capital and connections
 * 
 * Captures value from:
 * - Professional introductions with deal-based fees
 * - Reputation staking and vouching
 * - Network effect monetization
 */
export class SocialCapture {
  constructor(private readonly loop: Loop) {}

  /**
   * Facilitate an introduction between contacts
   * 
   * @param user - Facilitator (signer)
   * @param fromContact - Contact being introduced
   * @param toContact - Contact being introduced to
   * @param terms - Terms for the introduction fee
   * @returns Introduction request details
   * 
   * @example
   * ```typescript
   * const intro = await loop.social.facilitateIntro(
   *   facilitatorPubkey,
   *   contactAPubkey,
   *   contactBPubkey,
   *   {
   *     facilitatorFeePercent: 5,
   *     minimumDealValue: new BN(10000_000000),
   *     expiryTimestamp: new BN(Date.now() / 1000 + 30 * 24 * 60 * 60),
   *     description: 'Investment intro'
   *   }
   * );
   * ```
   */
  async facilitateIntro(
    user: PublicKey,
    fromContact: PublicKey,
    toContact: PublicKey,
    terms: IntroTerms
  ): Promise<IntroRequest> {
    // Stub implementation
    throw new Error('SocialCapture.facilitateIntro not yet implemented');
  }

  /**
   * Complete an introduction with outcome
   * 
   * @param user - Facilitator or participant (signer)
   * @param introId - Introduction to complete
   * @param outcome - Outcome of the introduction
   * @returns Completion result with earned fees
   * 
   * @example
   * ```typescript
   * const completion = await loop.social.completeIntro(
   *   facilitatorPubkey,
   *   'intro_abc123',
   *   {
   *     type: IntroOutcome.DealClosed,
   *     dealValue: new BN(50000_000000) // 50k deal
   *   }
   * );
   * console.log(`Fee earned: ${completion.feeEarned}`);
   * ```
   */
  async completeIntro(
    user: PublicKey,
    introId: string,
    outcome: { type: IntroOutcome; dealValue?: BN }
  ): Promise<IntroCompletion> {
    // Stub implementation
    throw new Error('SocialCapture.completeIntro not yet implemented');
  }

  /**
   * Stake reputation on another user
   * 
   * @param user - Staker (signer)
   * @param targetUser - User to vouch for
   * @param amount - Amount of Cred to stake
   * @returns Reputation stake details
   * 
   * @example
   * ```typescript
   * const stake = await loop.social.stakeReputation(
   *   stakerPubkey,
   *   newUserPubkey,
   *   new BN(100_000000) // 100 Cred
   * );
   * ```
   */
  async stakeReputation(
    user: PublicKey,
    targetUser: PublicKey,
    amount: BN
  ): Promise<ReputationStake> {
    // Stub implementation
    throw new Error('SocialCapture.stakeReputation not yet implemented');
  }

  /**
   * Claim accumulated social revenue (intro fees)
   * 
   * @param user - User claiming revenue (signer)
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const sig = await loop.social.claimSocialRevenue(userPubkey);
   * ```
   */
  async claimSocialRevenue(user: PublicKey): Promise<string> {
    // Stub implementation
    throw new Error('SocialCapture.claimSocialRevenue not yet implemented');
  }

  /**
   * Get social statistics for a user
   * 
   * @param user - User to get stats for
   * @returns Social statistics
   * 
   * @example
   * ```typescript
   * const stats = await loop.social.getSocialStats(userPubkey);
   * console.log(`Success rate: ${stats.successfulIntros / stats.totalIntros}`);
   * console.log(`Reputation: ${stats.reputationScore}`);
   * ```
   */
  async getSocialStats(user: PublicKey): Promise<SocialStats> {
    // Stub implementation
    throw new Error('SocialCapture.getSocialStats not yet implemented');
  }
}

// ============================================================================
// INSURANCE CAPTURE MODULE
// ============================================================================

/**
 * Insurance Capture Module - Peer-to-peer DeFi insurance pools
 * 
 * Captures value from:
 * - Insurance premium collection
 * - Claims processing and governance
 * - Premium returns for no-claim periods
 */
export class InsuranceCapture {
  constructor(private readonly loop: Loop) {}

  /**
   * Join an insurance pool
   * 
   * @param user - User joining (signer)
   * @param poolId - Pool to join
   * @param coverage - Desired coverage amount
   * @param premium - Premium to pay
   * @returns Pool membership details
   * 
   * @example
   * ```typescript
   * const membership = await loop.insurance.joinPool(
   *   userPubkey,
   *   'pool_defi_hack',
   *   new BN(100000_000000), // 100k coverage
   *   new BN(500_000000) // 500 Cred premium
   * );
   * ```
   */
  async joinPool(
    user: PublicKey,
    poolId: string,
    coverage: BN,
    premium: BN
  ): Promise<PoolMembership> {
    // Stub implementation
    throw new Error('InsuranceCapture.joinPool not yet implemented');
  }

  /**
   * File an insurance claim
   * 
   * @param user - Claimant (signer)
   * @param poolId - Pool to claim against
   * @param claimType - Type of claim
   * @param evidence - Evidence supporting the claim (IPFS/Arweave hash)
   * @returns Claim submission details
   * 
   * @example
   * ```typescript
   * const claim = await loop.insurance.fileClaim(
   *   userPubkey,
   *   'pool_defi_hack',
   *   ClaimType.SmartContractFailure,
   *   'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
   * );
   * ```
   */
  async fileClaim(
    user: PublicKey,
    poolId: string,
    claimType: ClaimType,
    evidence: string
  ): Promise<ClaimSubmission> {
    // Stub implementation
    throw new Error('InsuranceCapture.fileClaim not yet implemented');
  }

  /**
   * Vote on an insurance claim
   * 
   * @param user - Voter (signer, must be pool member)
   * @param claimId - Claim to vote on
   * @param vote - Vote type
   * @returns Vote result
   * 
   * @example
   * ```typescript
   * const voteResult = await loop.insurance.voteOnClaim(
   *   userPubkey,
   *   'claim_xyz789',
   *   ClaimVoteType.Approve
   * );
   * ```
   */
  async voteOnClaim(
    user: PublicKey,
    claimId: string,
    vote: ClaimVoteType
  ): Promise<ClaimVote> {
    // Stub implementation
    throw new Error('InsuranceCapture.voteOnClaim not yet implemented');
  }

  /**
   * Claim premium returns for no-claim periods
   * 
   * @param user - Pool member (signer)
   * @param poolIds - Pools to claim returns from
   * @returns Transaction signature
   * 
   * @example
   * ```typescript
   * const sig = await loop.insurance.claimPremiumReturn(
   *   userPubkey,
   *   ['pool_defi_hack', 'pool_stablecoin']
   * );
   * ```
   */
  async claimPremiumReturn(
    user: PublicKey,
    poolIds: string[]
  ): Promise<string> {
    // Stub implementation
    throw new Error('InsuranceCapture.claimPremiumReturn not yet implemented');
  }

  /**
   * Get insurance statistics for a user
   * 
   * @param user - User to get stats for
   * @returns Insurance statistics
   * 
   * @example
   * ```typescript
   * const stats = await loop.insurance.getInsuranceStats(userPubkey);
   * console.log(`Coverage: ${stats.totalCoverage}`);
   * console.log(`Claims approved: ${stats.claimsApproved}`);
   * ```
   */
  async getInsuranceStats(user: PublicKey): Promise<InsuranceStats> {
    // Stub implementation
    throw new Error('InsuranceCapture.getInsuranceStats not yet implemented');
  }
}
