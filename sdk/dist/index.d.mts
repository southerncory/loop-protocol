import { PublicKey, Connection, TransactionInstruction } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';

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

declare const PROGRAM_IDS: {
    readonly VAULT: PublicKey;
    readonly CRED: PublicKey;
    readonly OXO: PublicKey;
    readonly VTP: PublicKey;
    readonly AVP: PublicKey;
};
declare const CONSTANTS: {
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
/** Type of value capture */
declare enum CaptureType {
    Shopping = 0,
    Data = 1,
    Presence = 2,
    Attention = 3,
    Referral = 4
}
/** Agent permission levels for vault access */
declare enum PermissionLevel {
    None = 0,
    Read = 1,
    Capture = 2,
    Guided = 3,
    Autonomous = 4
}
/** Escrow status */
declare enum EscrowStatus {
    Active = 0,
    Released = 1,
    Cancelled = 2,
    Disputed = 3
}
/** Agent type */
declare enum AgentType {
    Personal = 0,
    Service = 1
}
/** Agent status */
declare enum AgentStatus {
    Active = 0,
    Suspended = 1,
    Revoked = 2
}
/** On-chain Vault account data */
interface Vault {
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
interface StackRecord {
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
interface AgentPermission {
    vault: PublicKey;
    agent: PublicKey;
    level: PermissionLevel;
    dailyLimit: BN;
    dailyUsed: BN;
    lastReset: BN;
    bump: number;
}
/** Inheritance configuration */
interface InheritanceConfig {
    vault: PublicKey;
    heir: PublicKey;
    inactivityThreshold: BN;
    lastActivity: BN;
    triggered: boolean;
    bump: number;
}
/** Cred system configuration */
interface CredConfig {
    authority: PublicKey;
    usdcMint: PublicKey;
    credMint: PublicKey;
    reserveVault: PublicKey;
    totalMinted: BN;
    totalBurned: BN;
    bump: number;
}
/** Capture module authorization */
interface CaptureAuthority {
    moduleAddress: PublicKey;
    captureType: CaptureType;
    moduleName: string;
    totalCaptured: BN;
    isActive: boolean;
    registeredAt: BN;
    bump: number;
}
/** Reserve status response */
interface ReserveStatus {
    usdcReserve: BN;
    credSupply: BN;
    backingRatio: BN;
    totalMinted: BN;
    totalBurned: BN;
}
/** OXO protocol configuration */
interface OxoConfig {
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
interface VeOxoPosition {
    owner: PublicKey;
    oxoLocked: BN;
    veOxoBalance: BN;
    lockStart: BN;
    unlockAt: BN;
    lastClaim: BN;
    bump: number;
}
/** Agent token bonding curve */
interface BondingCurve {
    creator: PublicKey;
    agentMint: PublicKey;
    oxoReserve: BN;
    tokenSupply: BN;
    graduated: boolean;
    createdAt: BN;
    bump: number;
}
/** VTP configuration */
interface VtpConfig {
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
type ReleaseCondition = {
    arbiterApproval: {
        arbiter: PublicKey;
    };
} | {
    timeRelease: {
        timestamp: BN;
    };
} | {
    oracleAttestation: {
        oracle: PublicKey;
        dataHash: Uint8Array;
    };
} | {
    multiSig: {
        threshold: number;
        signers: PublicKey[];
    };
};
/** Escrow account */
interface Escrow {
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
interface Heir {
    address: PublicKey;
    percentage: number;
    name: string;
}
/** Inheritance plan */
interface InheritancePlan {
    owner: PublicKey;
    heirs: Heir[];
    inactivityThreshold: BN;
    lastActivity: BN;
    createdAt: BN;
    triggered: boolean;
    triggerTime: BN | null;
    bump: number;
}
/** 8-byte capability identifier */
type CapabilityId = Uint8Array;
/** Agent identity */
interface AgentIdentity {
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
    reputationScore: number;
    metadataUri: string | null;
    bump: number;
}
/** Tracked affiliate link */
interface TrackedLink {
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
interface ConversionRecord {
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
interface AffiliateStats {
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
/** User's ad profile and preferences */
interface AdProfile {
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
interface Ad {
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
interface AdPreferences {
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
interface ViewVerification {
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
/** Data type classification */
type DataType = 'location' | 'browsing' | 'purchase' | 'social' | 'health' | 'financial' | 'preferences' | 'demographics' | 'behavioral' | 'custom';
/** Data pricing configuration for a user */
interface DataPricingConfig {
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
interface DataLicenseTerms {
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
interface DataLicense {
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
interface DataStats {
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
/**
 * Referral Capture Module - Affiliate link tracking and commission distribution
 *
 * Enables users to earn Cred by referring purchases through tracked links.
 * Commissions are automatically captured to the affiliate's vault.
 */
declare class ReferralCaptureModule {
    private readonly loop;
    constructor(loop: Loop);
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
    trackLink(originalUrl: string, affiliateTag: string): Promise<TrackedLink>;
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
    registerConversion(linkId: string, amount: BN, proof: string): Promise<ConversionRecord>;
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
    claimCommission(user: PublicKey, conversionIds: string[]): Promise<string>;
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
    getAffiliateStats(user: PublicKey): Promise<AffiliateStats>;
}
/**
 * Attention Capture Module - Verified ad viewing with attention rewards
 *
 * Enables users to earn Cred by viewing verified advertisements.
 * Users control their ad preferences and minimum reward requirements.
 */
declare class AttentionCaptureModule {
    private readonly loop;
    constructor(loop: Loop);
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
    registerForAds(user: PublicKey, preferences: AdPreferences): Promise<AdProfile>;
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
    getAvailableAds(user: PublicKey): Promise<Ad[]>;
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
    verifyView(user: PublicKey, adId: string, viewProof: string): Promise<ViewVerification>;
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
    claimAttentionReward(user: PublicKey, viewIds: string[]): Promise<string>;
}
/**
 * Data Capture Module - User-controlled data licensing and monetization
 *
 * Enables users to set prices for their data and earn Cred when companies
 * license access. Users maintain full control and can revoke at any time.
 */
declare class DataCaptureModule {
    private readonly loop;
    constructor(loop: Loop);
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
    setDataPricing(user: PublicKey, dataTypes: DataType[], prices: Map<DataType, BN>): Promise<DataPricingConfig>;
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
    licenseData(user: PublicKey, buyer: PublicKey, dataType: DataType, terms: DataLicenseTerms): Promise<DataLicense>;
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
    revokeDataLicense(user: PublicKey, licenseId: string): Promise<string>;
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
    claimDataRevenue(user: PublicKey): Promise<string>;
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
    getDataStats(user: PublicKey): Promise<DataStats>;
}
interface LoopConfig {
    connection: Connection;
    wallet?: anchor.Wallet;
}
/**
 * Derive PDA addresses for all Loop Protocol accounts
 */
declare class LoopPDA {
    /** Derive vault PDA for an owner */
    static vault(owner: PublicKey): [PublicKey, number];
    /** Derive stack record PDA */
    static stackRecord(vault: PublicKey, stackIndex: BN): [PublicKey, number];
    /** Derive agent permission PDA */
    static agentPermission(vault: PublicKey, agent: PublicKey): [PublicKey, number];
    /** Derive vault inheritance config PDA */
    static vaultInheritance(vault: PublicKey): [PublicKey, number];
    /** Derive capture authority PDA */
    static captureAuthority(): [PublicKey, number];
    /** Derive cred config PDA */
    static credConfig(): [PublicKey, number];
    /** Derive capture auth PDA for a module */
    static captureAuth(moduleAddress: PublicKey): [PublicKey, number];
    /** Derive OXO config PDA */
    static oxoConfig(): [PublicKey, number];
    /** Derive veOXO position PDA */
    static veOxoPosition(owner: PublicKey): [PublicKey, number];
    /** Derive bonding curve PDA for agent token */
    static bondingCurve(agentMint: PublicKey): [PublicKey, number];
    /** Derive VTP config PDA */
    static vtpConfig(): [PublicKey, number];
    /** Derive escrow PDA */
    static escrow(sender: PublicKey, recipient: PublicKey, createdAt: BN): [PublicKey, number];
    /** Derive VTP inheritance plan PDA */
    static vtpInheritance(owner: PublicKey): [PublicKey, number];
    /** Derive agent identity PDA */
    static agentIdentity(agent: PublicKey): [PublicKey, number];
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
 */
declare class Loop {
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
    /** Referral Capture Module - Affiliate tracking and commissions */
    readonly referral: ReferralCaptureModule;
    /** Attention Capture Module - Verified ad viewing rewards */
    readonly attention: AttentionCaptureModule;
    /** Data Capture Module - User-controlled data monetization */
    readonly data: DataCaptureModule;
    constructor(config: LoopConfig);
    /** Get program IDs */
    get programIds(): {
        readonly VAULT: PublicKey;
        readonly CRED: PublicKey;
        readonly OXO: PublicKey;
        readonly VTP: PublicKey;
        readonly AVP: PublicKey;
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
/**
 * Vault Module - User-owned value storage with stacking
 *
 * Program ID: 76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7
 */
declare class VaultModule {
    private readonly loop;
    constructor(loop: Loop);
    /**
     * Get vault PDA for an owner
     * @param owner - Wallet address of vault owner
     */
    getVaultAddress(owner: PublicKey): [PublicKey, number];
    /**
     * Get stack record PDA
     * @param vault - Vault PDA
     * @param stackIndex - Index of the stack (based on stacked_balance at creation)
     */
    getStackAddress(vault: PublicKey, stackIndex: BN): [PublicKey, number];
    /**
     * Fetch vault account data
     * @param owner - Vault owner
     */
    getVault(owner: PublicKey): Promise<Vault | null>;
    /**
     * Check if vault exists
     * @param owner - Vault owner
     */
    exists(owner: PublicKey): Promise<boolean>;
    /**
     * Initialize a new vault for a user
     *
     * Seeds: ["vault", owner]
     *
     * @param owner - Owner's wallet (signer, payer)
     */
    initializeVault(owner: PublicKey): Promise<TransactionInstruction>;
    /**
     * Deposit Cred into vault
     *
     * @param owner - Vault owner (signer)
     * @param amount - Amount of Cred to deposit
     * @param userCredAccount - User's Cred token account
     * @param vaultCredAccount - Vault's Cred token account
     */
    deposit(owner: PublicKey, amount: BN, userCredAccount: PublicKey, vaultCredAccount: PublicKey): Promise<TransactionInstruction>;
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
    capture(vault: PublicKey, amount: BN, captureType: CaptureType, source: string, captureModule: PublicKey, credMint: PublicKey, vaultCredAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Stack Cred for yield
     *
     * @param owner - Vault owner (signer, payer)
     * @param amount - Amount to stack
     * @param durationDays - Lock duration in days (7-365)
     */
    stack(owner: PublicKey, amount: BN, durationDays: number): Promise<TransactionInstruction>;
    /**
     * Unstack (withdraw locked Cred)
     *
     * @param owner - Vault owner (signer)
     * @param stackAddress - Stack record address
     */
    unstack(owner: PublicKey, stackAddress: PublicKey): Promise<TransactionInstruction>;
    /**
     * Withdraw Cred from vault
     *
     * @param owner - Vault owner (signer)
     * @param amount - Amount to withdraw
     * @param userCredAccount - User's Cred token account (destination)
     * @param vaultCredAccount - Vault's Cred token account
     */
    withdraw(owner: PublicKey, amount: BN, userCredAccount: PublicKey, vaultCredAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Set agent permissions for vault
     *
     * @param owner - Vault owner (signer, payer)
     * @param agent - Agent pubkey to grant permission
     * @param permissionLevel - Level of access
     * @param dailyLimit - Maximum daily spend limit
     */
    setAgentPermission(owner: PublicKey, agent: PublicKey, permissionLevel: PermissionLevel, dailyLimit: BN): Promise<TransactionInstruction>;
    /**
     * Claim yield from stacking position
     *
     * @param owner - Vault owner (signer)
     * @param stackAddress - Stack record address
     */
    claimYield(owner: PublicKey, stackAddress: PublicKey): Promise<TransactionInstruction>;
    /**
     * Extract all value from vault (5% fee, liquidates all stacks)
     *
     * @param owner - Vault owner (signer)
     * @param userCredAccount - User's Cred account (destination)
     * @param vaultCredAccount - Vault's Cred account
     * @param feeAccount - Protocol fee account
     */
    extract(owner: PublicKey, userCredAccount: PublicKey, vaultCredAccount: PublicKey, feeAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Close vault (must be empty)
     *
     * @param owner - Vault owner (signer)
     */
    closeVault(owner: PublicKey): Promise<TransactionInstruction>;
    /**
     * Set heir for inheritance
     *
     * @param owner - Vault owner (signer, payer)
     * @param heir - Heir's pubkey
     * @param inactivityThresholdDays - Days of inactivity before heir can claim (min 30)
     */
    setHeir(owner: PublicKey, heir: PublicKey, inactivityThresholdDays: number): Promise<TransactionInstruction>;
    /**
     * Calculate APY for a given stacking duration
     * @param durationDays - Lock duration in days
     * @returns APY in basis points (100 = 1%)
     */
    calculateApy(durationDays: number): number;
    private createInstruction;
    private deserializeVault;
}
/**
 * Cred Module - Stable value token (1 Cred = $1 USDC)
 *
 * Program ID: FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA
 */
declare class CredModule {
    private readonly loop;
    constructor(loop: Loop);
    /** Get cred config PDA */
    getConfigAddress(): [PublicKey, number];
    /** Get capture authority PDA for a module */
    getCaptureAuthAddress(moduleAddress: PublicKey): [PublicKey, number];
    /** Fetch cred config */
    getConfig(): Promise<CredConfig | null>;
    /**
     * Initialize the Cred token system
     *
     * @param authority - Protocol authority (signer, payer)
     * @param usdcMint - USDC mint address
     * @param credMint - Cred mint address (must be initialized)
     * @param reserveVault - USDC reserve vault token account
     */
    initialize(authority: PublicKey, usdcMint: PublicKey, credMint: PublicKey, reserveVault: PublicKey): Promise<TransactionInstruction>;
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
    wrap(user: PublicKey, amount: BN, userUsdcAccount: PublicKey, userCredAccount: PublicKey, credMint: PublicKey, reserveVault: PublicKey): Promise<TransactionInstruction>;
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
    unwrap(user: PublicKey, amount: BN, userCredAccount: PublicKey, userUsdcAccount: PublicKey, credMint: PublicKey, reserveVault: PublicKey): Promise<TransactionInstruction>;
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
    captureMint(captureSigner: PublicKey, amount: BN, captureType: CaptureType, destinationCredAccount: PublicKey, credMint: PublicKey, reserveVault: PublicKey, captureUsdcAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Register a new capture module
     *
     * @param authority - Protocol authority (signer, payer)
     * @param moduleAddress - Address of the capture module
     * @param captureType - Type of capture this module handles
     * @param moduleName - Human-readable name (max 32 chars)
     */
    registerCaptureModule(authority: PublicKey, moduleAddress: PublicKey, captureType: CaptureType, moduleName: string): Promise<TransactionInstruction>;
    /**
     * Get reserve status (USDC backing vs Cred supply)
     *
     * @param reserveVault - USDC reserve token account
     * @param credMint - Cred mint
     */
    getReserveStatus(reserveVault: PublicKey, credMint: PublicKey): Promise<ReserveStatus>;
    private createInstruction;
    private deserializeCredConfig;
}
/**
 * OXO Module - Protocol equity with veOXO staking and bonding curves
 *
 * Program ID: 3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z
 */
declare class OxoModule {
    private readonly loop;
    constructor(loop: Loop);
    /** Get OXO config PDA */
    getConfigAddress(): [PublicKey, number];
    /** Get veOXO position PDA for an owner */
    getVePositionAddress(owner: PublicKey): [PublicKey, number];
    /** Get bonding curve PDA for an agent token */
    getBondingCurveAddress(agentMint: PublicKey): [PublicKey, number];
    /** Fetch OXO config */
    getConfig(): Promise<OxoConfig | null>;
    /** Fetch veOXO position */
    getVePosition(owner: PublicKey): Promise<VeOxoPosition | null>;
    /** Fetch bonding curve */
    getBondingCurve(agentMint: PublicKey): Promise<BondingCurve | null>;
    /**
     * Initialize OXO protocol
     *
     * @param authority - Protocol authority (signer, payer)
     * @param oxoMint - OXO token mint
     * @param treasury - Treasury account
     */
    initialize(authority: PublicKey, oxoMint: PublicKey, treasury: PublicKey): Promise<TransactionInstruction>;
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
    lockOxo(owner: PublicKey, amount: BN, lockSeconds: BN, userOxoAccount: PublicKey, protocolOxoAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Extend lock duration (increases veOXO)
     *
     * @param owner - Position owner (signer)
     * @param additionalSeconds - Additional seconds to add to lock
     */
    extendLock(owner: PublicKey, additionalSeconds: BN): Promise<TransactionInstruction>;
    /**
     * Withdraw OXO after lock expires
     *
     * @param owner - Position owner (signer)
     * @param userOxoAccount - User's OXO token account
     * @param protocolOxoAccount - Protocol's OXO token account
     */
    unlockOxo(owner: PublicKey, userOxoAccount: PublicKey, protocolOxoAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Claim fee share for veOXO holders
     *
     * @param owner - Position owner (signer)
     * @param feePoolAccount - Protocol fee pool Cred account
     * @param userCredAccount - User's Cred account
     */
    claimFeeShare(owner: PublicKey, feePoolAccount: PublicKey, userCredAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Get current decayed veOXO balance
     *
     * @param owner - Position owner
     */
    getCurrentVeOxo(owner: PublicKey): Promise<BN>;
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
    createAgentToken(creator: PublicKey, agentMint: PublicKey, name: string, symbol: string, uri: string, creatorOxoAccount: PublicKey, treasuryOxoAccount: PublicKey): Promise<TransactionInstruction>;
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
    buyAgentToken(buyer: PublicKey, agentMint: PublicKey, oxoAmount: BN, buyerOxoAccount: PublicKey, buyerAgentAccount: PublicKey, curveOxoAccount: PublicKey): Promise<TransactionInstruction>;
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
    sellAgentToken(seller: PublicKey, agentMint: PublicKey, tokenAmount: BN, sellerOxoAccount: PublicKey, sellerAgentAccount: PublicKey, curveOxoAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Deposit fees into fee pool (called by capture modules)
     *
     * @param authority - Fee depositor (signer)
     * @param amount - Amount to deposit
     * @param sourceAccount - Source Cred account
     * @param feePoolAccount - Protocol fee pool account
     */
    depositFees(authority: PublicKey, amount: BN, sourceAccount: PublicKey, feePoolAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Calculate veOXO for given OXO amount and lock duration
     *
     * @param amount - OXO amount
     * @param lockSeconds - Lock duration in seconds
     */
    calculateVeOxo(amount: BN, lockSeconds: BN): BN;
    /**
     * Calculate current decayed veOXO balance
     */
    calculateDecayedVeOxo(position: VeOxoPosition): BN;
    private createInstruction;
    private deserializeOxoConfig;
    private deserializeVePosition;
    private deserializeBondingCurve;
}
/**
 * VTP Module - Value Transfer Protocol (transfers, escrow, inheritance)
 *
 * Program ID: 4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj
 */
declare class VtpModule {
    private readonly loop;
    constructor(loop: Loop);
    /** Get VTP config PDA */
    getConfigAddress(): [PublicKey, number];
    /** Get escrow PDA */
    getEscrowAddress(sender: PublicKey, recipient: PublicKey, createdAt: BN): [PublicKey, number];
    /** Get inheritance plan PDA */
    getInheritanceAddress(owner: PublicKey): [PublicKey, number];
    /**
     * Initialize VTP config
     *
     * @param authority - Protocol authority (signer, payer)
     * @param feeRecipient - Address to receive transfer fees
     */
    initialize(authority: PublicKey, feeRecipient: PublicKey): Promise<TransactionInstruction>;
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
    transfer(sender: PublicKey, recipient: PublicKey, amount: BN, memo: string | null, senderCredAccount: PublicKey, recipientCredAccount: PublicKey, feeAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Batch transfer to multiple recipients
     *
     * @param sender - Sender (signer)
     * @param recipients - List of recipient pubkeys (max 10)
     * @param amounts - Corresponding amounts
     * @param senderCredAccount - Sender's Cred account
     */
    batchTransfer(sender: PublicKey, recipients: PublicKey[], amounts: BN[], senderCredAccount: PublicKey): Promise<TransactionInstruction>;
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
    createEscrow(sender: PublicKey, recipient: PublicKey, amount: BN, releaseConditions: ReleaseCondition[], expiry: BN, senderCredAccount: PublicKey, escrowCredAccount: PublicKey, feeAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Fulfill a condition (by arbiter or oracle)
     *
     * @param fulfiller - Condition fulfiller (signer)
     * @param escrow - Escrow account
     * @param conditionIndex - Index of condition to fulfill
     * @param proof - Optional proof data
     */
    fulfillCondition(fulfiller: PublicKey, escrow: PublicKey, conditionIndex: number, proof: Uint8Array | null): Promise<TransactionInstruction>;
    /**
     * Release escrow to recipient (all conditions must be met)
     *
     * @param releaser - Releaser (signer)
     * @param escrow - Escrow account
     * @param escrowCredAccount - Escrow Cred account
     * @param recipientCredAccount - Recipient's Cred account
     */
    releaseEscrow(releaser: PublicKey, escrow: PublicKey, escrowCredAccount: PublicKey, recipientCredAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Cancel escrow (returns funds to sender)
     *
     * @param canceller - Canceller (signer)
     * @param escrow - Escrow account
     * @param escrowCredAccount - Escrow Cred account
     * @param senderCredAccount - Sender's Cred account
     */
    cancelEscrow(canceller: PublicKey, escrow: PublicKey, escrowCredAccount: PublicKey, senderCredAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Set up inheritance plan
     *
     * @param owner - Vault owner (signer, payer)
     * @param heirs - List of heirs with percentages (must sum to 100)
     * @param inactivityThreshold - Seconds of inactivity before heir can claim (min 30 days)
     */
    setupInheritance(owner: PublicKey, heirs: Heir[], inactivityThreshold: BN): Promise<TransactionInstruction>;
    /**
     * Heartbeat to prove activity (prevents inheritance trigger)
     *
     * @param owner - Vault owner (signer)
     */
    inheritanceHeartbeat(owner: PublicKey): Promise<TransactionInstruction>;
    /**
     * Trigger inheritance (by heir after inactivity threshold)
     *
     * @param triggerer - Heir triggering inheritance (signer)
     * @param inheritancePlan - Inheritance plan account
     */
    triggerInheritance(triggerer: PublicKey, inheritancePlan: PublicKey): Promise<TransactionInstruction>;
    /**
     * Execute inheritance distribution
     *
     * @param executor - Executor (signer)
     * @param inheritancePlan - Inheritance plan account
     */
    executeInheritance(executor: PublicKey, inheritancePlan: PublicKey): Promise<TransactionInstruction>;
    /** Create an arbiter approval condition */
    arbiterCondition(arbiter: PublicKey): ReleaseCondition;
    /** Create a time release condition */
    timeCondition(timestamp: BN): ReleaseCondition;
    /** Create an oracle attestation condition */
    oracleCondition(oracle: PublicKey, dataHash: Uint8Array): ReleaseCondition;
    /** Create a multi-sig condition */
    multiSigCondition(threshold: number, signers: PublicKey[]): ReleaseCondition;
    private createInstruction;
}
/**
 * AVP Module - Agent Value Protocol (identity, capabilities, reputation)
 *
 * Program ID: H5c9xfPYcx6EtC8hpThshARtUR7tq1NfMJVrTx8z9Jcx
 */
declare class AvpModule {
    private readonly loop;
    constructor(loop: Loop);
    /** Get agent identity PDA */
    getAgentAddress(agent: PublicKey): [PublicKey, number];
    /** Fetch agent identity */
    getAgent(agent: PublicKey): Promise<AgentIdentity | null>;
    /** Check if agent is registered */
    isRegistered(agent: PublicKey): Promise<boolean>;
    /**
     * Register a Personal Agent (bound to one human)
     *
     * @param agent - Agent wallet (signer, payer)
     * @param principalHash - 32-byte hash of principal identity
     * @param metadataUri - Optional metadata URI (max 200 chars)
     */
    registerPersonalAgent(agent: PublicKey, principalHash: Uint8Array, metadataUri: string | null): Promise<TransactionInstruction>;
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
    registerServiceAgent(creator: PublicKey, agent: PublicKey, metadataUri: string | null, creatorOxoAccount: PublicKey): Promise<TransactionInstruction>;
    /**
     * Bind agent to a new principal
     *
     * @param agent - Agent (signer)
     * @param newPrincipalHash - New principal hash
     */
    bindAgent(agent: PublicKey, newPrincipalHash: Uint8Array): Promise<TransactionInstruction>;
    /**
     * Revoke agent authority (permanent)
     *
     * @param agent - Agent (signer)
     */
    revokeAgent(agent: PublicKey): Promise<TransactionInstruction>;
    /**
     * Suspend agent (can be unsuspended)
     *
     * @param authority - Agent or creator (signer)
     * @param agentIdentity - Agent identity account
     * @param reason - Reason for suspension (max 200 chars)
     */
    suspendAgent(authority: PublicKey, agentIdentity: PublicKey, reason: string): Promise<TransactionInstruction>;
    /**
     * Reactivate suspended agent
     *
     * @param authority - Agent or creator (signer)
     * @param agentIdentity - Agent identity account
     */
    reactivateAgent(authority: PublicKey, agentIdentity: PublicKey): Promise<TransactionInstruction>;
    /**
     * Declare capabilities the agent can perform
     *
     * @param agent - Agent (signer)
     * @param capabilities - List of 8-byte capability IDs (max 20)
     */
    declareCapabilities(agent: PublicKey, capabilities: CapabilityId[]): Promise<TransactionInstruction>;
    /**
     * Add stake (Service Agents only)
     *
     * @param creator - Service agent creator (signer)
     * @param agentIdentity - Agent identity account
     * @param amount - Amount of OXO to add
     */
    addStake(creator: PublicKey, agentIdentity: PublicKey, amount: BN): Promise<TransactionInstruction>;
    /**
     * Update reputation score (called by authorized module)
     *
     * @param authority - Protocol authority (signer)
     * @param agentIdentity - Agent identity account
     * @param delta - Reputation change (can be negative)
     */
    updateReputation(authority: PublicKey, agentIdentity: PublicKey, delta: number): Promise<TransactionInstruction>;
    /**
     * Update metadata URI
     *
     * @param agent - Agent (signer)
     * @param newUri - New metadata URI (max 200 chars)
     */
    updateMetadata(agent: PublicKey, newUri: string): Promise<TransactionInstruction>;
    /** Create a capability ID from a string */
    createCapabilityId(name: string): CapabilityId;
    /** Well-known capability IDs */
    static readonly CAPABILITIES: {
        CAPTURE_SHOPPING: Uint8Array<ArrayBuffer>;
        CAPTURE_DATA: Uint8Array<ArrayBuffer>;
        CAPTURE_PRESENCE: Uint8Array<ArrayBuffer>;
        CAPTURE_ATTENTION: Uint8Array<ArrayBuffer>;
        TRANSFER: Uint8Array<ArrayBuffer>;
        ESCROW: Uint8Array<ArrayBuffer>;
        STACK: Uint8Array<ArrayBuffer>;
    };
    private createInstruction;
    private deserializeAgentIdentity;
}

export { type Ad, type AdPreferences, type AdProfile, type AffiliateStats, type AgentIdentity, type AgentPermission, AgentStatus, AgentType, AttentionCaptureModule, AvpModule, type BondingCurve, CONSTANTS, type CapabilityId, type CaptureAuthority, CaptureType, type ConversionRecord, type CredConfig, CredModule, DataCaptureModule, type DataLicense, type DataLicenseTerms, type DataPricingConfig, type DataStats, type DataType, type Escrow, EscrowStatus, type Heir, type InheritanceConfig, type InheritancePlan, Loop, type LoopConfig, LoopPDA, type OxoConfig, OxoModule, PROGRAM_IDS, PermissionLevel, ReferralCaptureModule, type ReleaseCondition, type ReserveStatus, type StackRecord, type TrackedLink, type Vault, VaultModule, type VeOxoPosition, type ViewVerification, type VtpConfig, VtpModule, Loop as default };
