import { PublicKey, Connection, TransactionInstruction, Transaction } from '@solana/web3.js';
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
/** Resource profile for compute providers */
interface ResourceProfile {
    provider: PublicKey;
    cpuCores: number;
    gpuUnits: number;
    storageGb: number;
    bandwidthMbps: number;
    registeredAt: BN;
    isAvailable: boolean;
    tasksCompleted: BN;
    rewardsEarned: BN;
    bump: number;
}
/** Resource specification for registration */
interface ResourceSpec {
    cpu: number;
    gpu: number;
    storage: number;
    bandwidth: number;
}
/** Task acceptance record */
interface TaskAcceptance {
    taskId: string;
    provider: PublicKey;
    bidAmount: BN;
    acceptedAt: BN;
    deadline: BN;
    status: TaskStatus;
    bump: number;
}
/** Task status enum */
declare enum TaskStatus {
    Pending = 0,
    Completed = 1,
    Failed = 2,
    Disputed = 3
}
/** Task submission record */
interface TaskSubmission {
    taskId: string;
    provider: PublicKey;
    resultHash: Uint8Array;
    proof: Uint8Array;
    submittedAt: BN;
    isVerified: boolean;
    rewardClaimed: boolean;
    bump: number;
}
/** Compute statistics for a provider */
interface ComputeStats {
    totalTasks: BN;
    totalRewards: BN;
    successRate: number;
    avgCompletionTime: BN;
    reputationScore: number;
    activeTasks: number;
}
/** Node registration record */
interface NodeRegistration {
    operator: PublicKey;
    nodeType: NodeType;
    capabilities: string[];
    registeredAt: BN;
    isActive: boolean;
    totalUptime: BN;
    lastSeen: BN;
    bump: number;
}
/** Node type enum */
declare enum NodeType {
    Validator = 0,
    Relay = 1,
    Oracle = 2,
    Storage = 3,
    Compute = 4
}
/** Vote submission record */
interface VoteSubmission {
    voter: PublicKey;
    proposalId: string;
    vote: boolean;
    weight: BN;
    proof: Uint8Array;
    votedAt: BN;
    bump: number;
}
/** Attestation record */
interface Attestation {
    attester: PublicKey;
    dataHash: Uint8Array;
    attestationType: AttestationType;
    attestedAt: BN;
    expiresAt: BN | null;
    isValid: boolean;
    bump: number;
}
/** Attestation type enum */
declare enum AttestationType {
    DataIntegrity = 0,
    PriceOracle = 1,
    IdentityVerification = 2,
    EventWitness = 3
}
/** Network statistics for a node */
interface NetworkStats {
    totalVotes: BN;
    totalAttestations: BN;
    participationRewards: BN;
    uptimePercentage: number;
    currentStreak: number;
    slashCount: number;
}
/** Exported behavior model */
interface BehaviorModel {
    owner: PublicKey;
    modelId: string;
    skillType: SkillType;
    anonymizationLevel: AnonymizationLevel;
    modelHash: Uint8Array;
    createdAt: BN;
    version: number;
    isLicensable: boolean;
    minLicensePrice: BN;
    totalRevenue: BN;
    bump: number;
}
/** Skill type enum */
declare enum SkillType {
    Trading = 0,
    ContentCreation = 1,
    DataAnalysis = 2,
    CustomerService = 3,
    CodeGeneration = 4,
    LanguageTranslation = 5,
    ImageRecognition = 6,
    Custom = 7
}
/** Anonymization level for behavior models */
declare enum AnonymizationLevel {
    None = 0,
    Basic = 1,
    Differential = 2,
    Federated = 3
}
/** Skill license record */
interface SkillLicense {
    licenseId: string;
    licensor: PublicKey;
    licensee: PublicKey;
    modelId: string;
    termsHash: Uint8Array;
    pricePaid: BN;
    startedAt: BN;
    expiresAt: BN | null;
    isActive: boolean;
    usageCount: BN;
    usageLimit: BN | null;
    bump: number;
}
/** License terms */
interface LicenseTerms {
    duration: BN;
    price: BN;
    usageLimit: BN;
    allowSublicense: boolean;
    commercialUse: boolean;
}
/** Skill statistics for a user */
interface SkillStats {
    totalModels: BN;
    totalLicenses: BN;
    totalRevenue: BN;
    activeLicenses: number;
    avgLicensePrice: BN;
    topSkillType: SkillType;
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
declare class ComputeCaptureModule {
    private readonly loop;
    constructor(loop: Loop);
    /**
     * Get resource profile PDA for a provider
     * @param provider - Provider's public key
     */
    getResourceProfileAddress(provider: PublicKey): [PublicKey, number];
    /**
     * Get task acceptance PDA
     * @param provider - Provider's public key
     * @param taskId - Task identifier
     */
    getTaskAcceptanceAddress(provider: PublicKey, taskId: string): [PublicKey, number];
    /**
     * Get task submission PDA
     * @param provider - Provider's public key
     * @param taskId - Task identifier
     */
    getTaskSubmissionAddress(provider: PublicKey, taskId: string): [PublicKey, number];
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
    registerResources(user: PublicKey, resources: ResourceSpec): Promise<TransactionInstruction>;
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
    acceptTask(user: PublicKey, taskId: string, bid: BN): Promise<TransactionInstruction>;
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
    submitTaskResult(user: PublicKey, taskId: string, resultHash: Uint8Array, proof: Uint8Array): Promise<TransactionInstruction>;
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
    claimComputeReward(user: PublicKey, taskIds: string[]): Promise<TransactionInstruction>;
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
    getComputeStats(user: PublicKey): Promise<ComputeStats>;
    private createInstruction;
    private deserializeComputeStats;
}
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
declare class NetworkCaptureModule {
    private readonly loop;
    constructor(loop: Loop);
    /**
     * Get node registration PDA
     * @param operator - Node operator's public key
     */
    getNodeRegistrationAddress(operator: PublicKey): [PublicKey, number];
    /**
     * Get vote submission PDA
     * @param voter - Voter's public key
     * @param proposalId - Proposal identifier
     */
    getVoteAddress(voter: PublicKey, proposalId: string): [PublicKey, number];
    /**
     * Get attestation PDA
     * @param attester - Attester's public key
     * @param dataHash - Hash of attested data
     */
    getAttestationAddress(attester: PublicKey, dataHash: Uint8Array): [PublicKey, number];
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
    registerNode(user: PublicKey, nodeType: NodeType, capabilities: string[]): Promise<TransactionInstruction>;
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
    submitVote(user: PublicKey, proposalId: string, vote: boolean, proof: Uint8Array): Promise<TransactionInstruction>;
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
    submitAttestation(user: PublicKey, dataHash: Uint8Array, attestationType: AttestationType): Promise<TransactionInstruction>;
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
    claimParticipationReward(user: PublicKey, activityIds: string[]): Promise<TransactionInstruction>;
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
    getNetworkStats(user: PublicKey): Promise<NetworkStats>;
    private createInstruction;
    private deserializeNetworkStats;
}
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
declare class SkillCaptureModule {
    private readonly loop;
    constructor(loop: Loop);
    /**
     * Get behavior model PDA
     * @param owner - Model owner's public key
     * @param modelId - Model identifier
     */
    getBehaviorModelAddress(owner: PublicKey, modelId: string): [PublicKey, number];
    /**
     * Get skill license PDA
     * @param licensor - License issuer's public key
     * @param licenseId - License identifier
     */
    getSkillLicenseAddress(licensor: PublicKey, licenseId: string): [PublicKey, number];
    /**
     * Get skill stats PDA
     * @param owner - Owner's public key
     */
    getSkillStatsAddress(owner: PublicKey): [PublicKey, number];
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
    exportBehaviorModel(user: PublicKey, skillType: SkillType, anonymizationLevel: AnonymizationLevel): Promise<TransactionInstruction>;
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
    licenseSkill(user: PublicKey, buyer: PublicKey, modelId: string, terms: LicenseTerms): Promise<TransactionInstruction>;
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
    revokeSkillLicense(user: PublicKey, licenseId: string): Promise<TransactionInstruction>;
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
    claimSkillRevenue(user: PublicKey): Promise<TransactionInstruction>;
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
    getSkillStats(user: PublicKey): Promise<SkillStats>;
    private createInstruction;
    private deserializeSkillStats;
}

/** Strategy type for liquidity deployment */
declare enum LiquidityStrategy {
    Conservative = 0,
    Balanced = 1,
    Aggressive = 2,
    Custom = 3
}
/** Risk tolerance level */
declare enum RiskTolerance {
    Low = 0,
    Medium = 1,
    High = 2
}
/** Position status */
declare enum PositionStatus {
    Active = 0,
    Rebalancing = 1,
    Withdrawing = 2,
    Closed = 3
}
/** Deployed capital position */
interface DeploymentPosition {
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
interface RebalanceResult {
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
interface WithdrawalResult {
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
interface LiquidityStats {
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
/** Type of energy device */
declare enum DeviceType {
    SolarPanel = 0,
    Battery = 1,
    EVCharger = 2,
    SmartThermostat = 3,
    SmartMeter = 4,
    HeatPump = 5
}
/** Device capabilities */
interface DeviceCapabilities {
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
declare enum ArbitrageAction {
    /** Store energy during low prices */
    Store = 0,
    /** Discharge during high prices */
    Discharge = 1,
    /** Shift load to cheaper period */
    ShiftLoad = 2,
    /** Sell back to grid */
    SellToGrid = 3
}
/** Device registration result */
interface DeviceRegistration {
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
interface UsageReport {
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
interface ArbitrageExecution {
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
interface EnergyStats {
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
/** Introduction terms */
interface IntroTerms {
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
declare enum IntroOutcome {
    /** Intro was accepted and connected */
    Connected = 0,
    /** Deal was closed */
    DealClosed = 1,
    /** Intro was declined */
    Declined = 2,
    /** Intro expired */
    Expired = 3
}
/** Introduction request result */
interface IntroRequest {
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
interface IntroCompletion {
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
interface ReputationStake {
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
interface SocialStats {
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
/** Claim type categories */
declare enum ClaimType {
    /** Smart contract bug/hack */
    SmartContractFailure = 0,
    /** Stablecoin depeg event */
    StablecoinDepeg = 1,
    /** Protocol insolvency */
    ProtocolInsolvency = 2,
    /** Oracle manipulation */
    OracleManipulation = 3,
    /** Governance attack */
    GovernanceAttack = 4
}
/** Vote on a claim */
declare enum ClaimVoteType {
    /** Approve the claim */
    Approve = 0,
    /** Reject the claim */
    Reject = 1,
    /** Abstain from voting */
    Abstain = 2
}
/** Claim status */
declare enum ClaimStatus {
    /** Claim is pending review */
    Pending = 0,
    /** Claim is being voted on */
    Voting = 1,
    /** Claim was approved */
    Approved = 2,
    /** Claim was rejected */
    Rejected = 3,
    /** Claim was paid out */
    PaidOut = 4
}
/** Pool membership result */
interface PoolMembership {
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
interface ClaimSubmission {
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
interface ClaimVote {
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
interface InsuranceStats {
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
/**
 * Liquidity Capture Module - Deploy and manage capital in yield strategies
 *
 * Captures value from DeFi liquidity provision, lending, and yield farming.
 * Supports multiple strategies with varying risk/reward profiles.
 */
declare class LiquidityCapture {
    private readonly loop;
    constructor(loop: Loop);
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
    deployCapital(user: PublicKey, amount: BN, strategy: LiquidityStrategy, riskTolerance: RiskTolerance): Promise<DeploymentPosition>;
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
    rebalance(user: PublicKey, positionId: string, newStrategy: LiquidityStrategy): Promise<RebalanceResult>;
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
    withdrawCapital(user: PublicKey, positionId: string, amount: BN | null): Promise<WithdrawalResult>;
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
    claimYield(user: PublicKey, positionIds: string[]): Promise<string>;
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
    getLiquidityStats(user: PublicKey): Promise<LiquidityStats>;
}
/**
 * Energy Capture Module - Monetize distributed energy resources
 *
 * Captures value from:
 * - Solar generation and grid sales
 * - Battery arbitrage (buy low, sell high)
 * - EV charging optimization
 * - Demand response participation
 */
declare class EnergyCapture {
    private readonly loop;
    constructor(loop: Loop);
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
    registerDevice(user: PublicKey, deviceType: DeviceType, capabilities: DeviceCapabilities): Promise<DeviceRegistration>;
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
    reportEnergyUsage(user: PublicKey, deviceId: string, usage: {
        generated: BN;
        consumed: BN;
    }, gridPrices: {
        buyPrice: BN;
        sellPrice: BN;
    }): Promise<UsageReport>;
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
    executeArbitrage(user: PublicKey, deviceId: string, action: ArbitrageAction): Promise<ArbitrageExecution>;
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
    claimEnergyRevenue(user: PublicKey, periodIds: string[]): Promise<string>;
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
    getEnergyStats(user: PublicKey): Promise<EnergyStats>;
}
/**
 * Social Capture Module - Monetize social capital and connections
 *
 * Captures value from:
 * - Professional introductions with deal-based fees
 * - Reputation staking and vouching
 * - Network effect monetization
 */
declare class SocialCapture {
    private readonly loop;
    constructor(loop: Loop);
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
    facilitateIntro(user: PublicKey, fromContact: PublicKey, toContact: PublicKey, terms: IntroTerms): Promise<IntroRequest>;
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
    completeIntro(user: PublicKey, introId: string, outcome: {
        type: IntroOutcome;
        dealValue?: BN;
    }): Promise<IntroCompletion>;
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
    stakeReputation(user: PublicKey, targetUser: PublicKey, amount: BN): Promise<ReputationStake>;
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
    claimSocialRevenue(user: PublicKey): Promise<string>;
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
    getSocialStats(user: PublicKey): Promise<SocialStats>;
}
/**
 * Insurance Capture Module - Peer-to-peer DeFi insurance pools
 *
 * Captures value from:
 * - Insurance premium collection
 * - Claims processing and governance
 * - Premium returns for no-claim periods
 */
declare class InsuranceCapture {
    private readonly loop;
    constructor(loop: Loop);
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
    joinPool(user: PublicKey, poolId: string, coverage: BN, premium: BN): Promise<PoolMembership>;
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
    fileClaim(user: PublicKey, poolId: string, claimType: ClaimType, evidence: string): Promise<ClaimSubmission>;
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
    voteOnClaim(user: PublicKey, claimId: string, vote: ClaimVoteType): Promise<ClaimVote>;
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
    claimPremiumReturn(user: PublicKey, poolIds: string[]): Promise<string>;
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
    getInsuranceStats(user: PublicKey): Promise<InsuranceStats>;
}
interface DeviceInfo {
    deviceId: string;
    deviceType: 'mobile' | 'desktop' | 'hardware';
    platform: string;
    biometricCapable: boolean;
}
interface PasskeyWallet {
    userId: string;
    walletAddress: PublicKey;
    deviceId: string;
    createdAt: number;
    lastUsed: number;
}
interface SessionKeyPermissions {
    canCapture: boolean;
    canStack: boolean;
    canTransfer: boolean;
    maxTransferAmount: number;
    allowedPrograms: PublicKey[];
}
interface SessionKey {
    keyId: string;
    publicKey: PublicKey;
    permissions: SessionKeyPermissions;
    expiresAt: number;
    createdAt: number;
}
interface SessionInfo {
    keyId: string;
    deviceInfo: DeviceInfo;
    permissions: SessionKeyPermissions;
    expiresAt: number;
    lastActivity: number;
    isActive: boolean;
}
interface SignedTransaction {
    transaction: Transaction;
    signature: string;
    signedAt: number;
}
interface SmartAccountConfig {
    threshold: number;
    members: {
        pubkey: PublicKey;
        weight: number;
    }[];
    timeLockSeconds: number;
}
interface SmartAccount {
    address: PublicKey;
    config: SmartAccountConfig;
    createdAt: number;
}
interface AgentPolicy {
    dailyLimit: number;
    allowedInstructions: string[];
    timelock: number;
    requiresApproval: boolean;
}
interface PolicyConfig {
    account: PublicKey;
    agentKey: PublicKey;
    policy: AgentPolicy;
    setAt: number;
}
interface Proposal {
    proposalId: string;
    account: PublicKey;
    transaction: Transaction;
    proposer: PublicKey;
    approvals: PublicKey[];
    status: 'pending' | 'approved' | 'executed' | 'rejected';
    createdAt: number;
    expiresAt: number;
}
interface ApprovalResult {
    proposalId: string;
    approver: PublicKey;
    newApprovalCount: number;
    thresholdMet: boolean;
}
interface ZKProof {
    proofId: string;
    captureType: CaptureType;
    claims: Record<string, unknown>;
    proof: string;
    publicInputs: string[];
    generatedAt: number;
}
interface VerificationResult {
    valid: boolean;
    claims: Record<string, unknown>;
    verifiedAt: number;
    error?: string;
}
interface CaptureResult {
    captureId: string;
    user: PublicKey;
    captureType: CaptureType;
    amount: number;
    proof: ZKProof;
    transactionSignature: string;
}
interface EnclaveAttestation {
    enclaveId: string;
    codeHash: string;
    timestamp: number;
    signature: string;
    awsAttestationDoc?: string;
}
interface AgentRegistration {
    agentId: string;
    user: PublicKey;
    attestation: EnclaveAttestation;
    capabilities: string[];
    registeredAt: number;
}
/**
 * Para Integration - Passkey-based seedless authentication
 */
declare class ParaIntegration {
    private connection;
    constructor(connection: Connection);
    /**
     * Create a new passkey-protected wallet
     */
    createPasskeyWallet(userId: string, deviceInfo: DeviceInfo): Promise<PasskeyWallet>;
    /**
     * Get a scoped session key for agent operations
     */
    getSessionKey(userId: string, permissions: SessionKeyPermissions, expirySeconds: number): Promise<SessionKey>;
    /**
     * Sign a transaction using passkey biometrics
     */
    signWithPasskey(userId: string, transaction: Transaction): Promise<SignedTransaction>;
    /**
     * Revoke an active session key
     */
    revokeSession(userId: string, sessionKeyId: string): Promise<string>;
    /**
     * List all active sessions for a user
     */
    listActiveSessions(userId: string): Promise<SessionInfo[]>;
}
/**
 * Squads Integration - Programmable custody and policies
 */
declare class SquadsIntegration {
    private connection;
    constructor(connection: Connection);
    /**
     * Create a Squads smart account with multi-sig
     */
    createSmartAccount(owner: PublicKey, config: SmartAccountConfig): Promise<SmartAccount>;
    /**
     * Set spending policy for an agent
     */
    setAgentPolicy(account: PublicKey, agentKey: PublicKey, policy: AgentPolicy): Promise<PolicyConfig>;
    /**
     * Propose a transaction for multi-sig approval
     */
    proposeTransaction(account: PublicKey, transaction: Transaction): Promise<Proposal>;
    /**
     * Approve a pending transaction proposal
     */
    approveTransaction(account: PublicKey, proposalId: string): Promise<ApprovalResult>;
    /**
     * Execute an approved transaction
     */
    executeTransaction(account: PublicKey, proposalId: string): Promise<string>;
    /**
     * Emergency pause an agent's access
     */
    pauseAgent(account: PublicKey, agentKey: PublicKey): Promise<string>;
}
/**
 * Reclaim Integration - ZK proofs for trustless capture verification
 */
declare class ReclaimIntegration {
    private connection;
    constructor(connection: Connection);
    /**
     * Generate a ZK proof of value capture (e.g., purchase on Amazon)
     */
    generateCaptureProof(captureType: CaptureType, sessionData: Record<string, unknown>): Promise<ZKProof>;
    /**
     * Verify a ZK proof and extract claims
     */
    verifyProof(proof: ZKProof, expectedClaims: Record<string, unknown>): Promise<VerificationResult>;
    /**
     * Submit a verified capture to mint rewards
     */
    submitVerifiedCapture(user: PublicKey, proof: ZKProof, captureType: CaptureType): Promise<CaptureResult>;
}
/**
 * TEE Integration - Trusted Execution Environment attestation
 */
declare class TEEIntegration {
    private connection;
    constructor(connection: Connection);
    /**
     * Get attestation document from an enclave
     */
    getEnclaveAttestation(enclaveId: string): Promise<EnclaveAttestation>;
    /**
     * Verify enclave is running expected code
     */
    verifyEnclaveCode(attestation: EnclaveAttestation, expectedHash: string): Promise<VerificationResult>;
    /**
     * Register a trusted agent with verified attestation
     */
    registerTrustedAgent(user: PublicKey, attestation: EnclaveAttestation): Promise<AgentRegistration>;
}

export { type Ad, type AdPreferences, type AdProfile, type AffiliateStats, type AgentIdentity, type AgentPermission, type AgentPolicy, type AgentRegistration, AgentStatus, AgentType, AnonymizationLevel, type ApprovalResult, ArbitrageAction, type ArbitrageExecution, AttentionCaptureModule, type Attestation, AttestationType, AvpModule, type BehaviorModel, type BondingCurve, CONSTANTS, type CapabilityId, type CaptureAuthority, type CaptureResult, CaptureType, ClaimStatus, type ClaimSubmission, ClaimType, type ClaimVote, ClaimVoteType, ComputeCaptureModule, type ComputeStats, type ConversionRecord, type CredConfig, CredModule, DataCaptureModule, type DataLicense, type DataLicenseTerms, type DataPricingConfig, type DataStats, type DataType, type DeploymentPosition, type DeviceCapabilities, type DeviceInfo, type DeviceRegistration, DeviceType, type EnclaveAttestation, EnergyCapture, type EnergyStats, type Escrow, EscrowStatus, type Heir, type InheritanceConfig, type InheritancePlan, InsuranceCapture, type InsuranceStats, type IntroCompletion, IntroOutcome, type IntroRequest, type IntroTerms, type LicenseTerms, LiquidityCapture, type LiquidityStats, LiquidityStrategy, Loop, type LoopConfig, LoopPDA, NetworkCaptureModule, type NetworkStats, type NodeRegistration, NodeType, type OxoConfig, OxoModule, PROGRAM_IDS, ParaIntegration, type PasskeyWallet, PermissionLevel, type PolicyConfig, type PoolMembership, PositionStatus, type Proposal, type RebalanceResult, ReclaimIntegration, ReferralCaptureModule, type ReleaseCondition, type ReputationStake, type ReserveStatus, type ResourceProfile, type ResourceSpec, RiskTolerance, type SessionInfo, type SessionKey, type SessionKeyPermissions, type SignedTransaction, SkillCaptureModule, type SkillLicense, type SkillStats, SkillType, type SmartAccount, type SmartAccountConfig, SocialCapture, type SocialStats, SquadsIntegration, type StackRecord, TEEIntegration, type TaskAcceptance, TaskStatus, type TaskSubmission, type TrackedLink, type UsageReport, type Vault, VaultModule, type VeOxoPosition, type VerificationResult, type ViewVerification, type VoteSubmission, type VtpConfig, VtpModule, type WithdrawalResult, type ZKProof, Loop as default };
