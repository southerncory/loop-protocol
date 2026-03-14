/**
 * Capture Module Types
 * 
 * Types for all value capture modules:
 * - Referral
 * - Attention
 * - Data
 * - Compute
 * - Network
 * - Skill
 * - Liquidity
 * - Energy
 * - Social
 * - Insurance
 */

import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// ============================================================================
// REFERRAL CAPTURE
// ============================================================================

/** Tracked affiliate link */
export interface TrackedLink {
  id: string;
  originalUrl: string;
  affiliateTag: string;
  affiliate: PublicKey;
  createdAt: BN;
  clickCount: BN;
  conversionCount: BN;
  totalCommission: BN;
  isActive: boolean;
}

/** Conversion record from a referral */
export interface ConversionRecord {
  id: string;
  linkId: string;
  amount: BN;
  commission: BN;
  proof: string;
  convertedAt: BN;
  claimed: boolean;
}

/** Affiliate statistics */
export interface AffiliateStats {
  affiliate: PublicKey;
  totalLinks: BN;
  totalClicks: BN;
  totalConversions: BN;
  totalEarned: BN;
  unclaimedBalance: BN;
  conversionRateBps: number;
}

// ============================================================================
// ATTENTION CAPTURE
// ============================================================================

/** User's ad profile and preferences */
export interface AdProfile {
  user: PublicKey;
  preferredCategories: string[];
  blockedCategories: string[];
  dailyAdLimit: number;
  minRewardPerView: BN;
  isActive: boolean;
  createdAt: BN;
  updatedAt: BN;
}

/** Advertisement */
export interface Ad {
  id: string;
  advertiser: PublicKey;
  title: string;
  description: string;
  contentUrl: string;
  targetUrl: string;
  category: string;
  rewardPerView: BN;
  remainingBudget: BN;
  minViewDuration: number;
  expiresAt: BN;
  isActive: boolean;
}

/** Ad preference configuration */
export interface AdPreferences {
  categories: string[];
  blockedCategories: string[];
  dailyLimit: number;
  minReward: BN;
}

/** Verification of ad view */
export interface ViewVerification {
  id: string;
  user: PublicKey;
  adId: string;
  viewDuration: number;
  verified: boolean;
  rewardEarned: BN;
  verifiedAt: BN;
  proof: string;
}

// ============================================================================
// DATA CAPTURE
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
  user: PublicKey;
  pricing: Map<DataType, BN>;
  availableTypes: DataType[];
  blockedTypes: DataType[];
  isActive: boolean;
  createdAt: BN;
  updatedAt: BN;
}

/** Data license terms */
export interface DataLicenseTerms {
  durationSeconds: BN;
  allowReshare: boolean;
  maxAccessCount: number;
  allowedUseCases: string[];
  geoRestrictions: string[];
}

/** Active data license */
export interface DataLicense {
  id: string;
  owner: PublicKey;
  buyer: PublicKey;
  dataType: DataType;
  terms: DataLicenseTerms;
  pricePaid: BN;
  grantedAt: BN;
  expiresAt: BN;
  accessCount: number;
  isActive: boolean;
  revoked: boolean;
}

/** Data licensing statistics */
export interface DataStats {
  user: PublicKey;
  activeLicenses: BN;
  revokedLicenses: BN;
  totalRevenue: BN;
  unclaimedRevenue: BN;
  revenueByType: Map<DataType, BN>;
  topDataType: DataType | null;
  avgLicenseDuration: BN;
}

// ============================================================================
// COMPUTE CAPTURE
// ============================================================================

/** Resource profile for compute providers */
export interface ResourceProfile {
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
export interface ResourceSpec {
  cpu: number;
  gpu: number;
  storage: number;
  bandwidth: number;
}

/** Task status enum */
export enum TaskStatus {
  Pending = 0,
  Completed = 1,
  Failed = 2,
  Disputed = 3,
}

/** Task acceptance record */
export interface TaskAcceptance {
  taskId: string;
  provider: PublicKey;
  bidAmount: BN;
  acceptedAt: BN;
  deadline: BN;
  status: TaskStatus;
  bump: number;
}

/** Task submission record */
export interface TaskSubmission {
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
export interface ComputeStats {
  totalTasks: BN;
  totalRewards: BN;
  successRate: number;
  avgCompletionTime: BN;
  reputationScore: number;
  activeTasks: number;
}

// ============================================================================
// NETWORK CAPTURE
// ============================================================================

/** Node type enum */
export enum NodeType {
  Validator = 0,
  Relay = 1,
  Oracle = 2,
  Storage = 3,
  Compute = 4,
}

/** Node registration record */
export interface NodeRegistration {
  operator: PublicKey;
  nodeType: NodeType;
  capabilities: string[];
  registeredAt: BN;
  isActive: boolean;
  totalUptime: BN;
  lastSeen: BN;
  bump: number;
}

/** Vote submission record */
export interface VoteSubmission {
  voter: PublicKey;
  proposalId: string;
  vote: boolean;
  weight: BN;
  proof: Uint8Array;
  votedAt: BN;
  bump: number;
}

/** Attestation type enum */
export enum AttestationType {
  DataIntegrity = 0,
  PriceOracle = 1,
  IdentityVerification = 2,
  EventWitness = 3,
}

/** Attestation record */
export interface Attestation {
  attester: PublicKey;
  dataHash: Uint8Array;
  attestationType: AttestationType;
  attestedAt: BN;
  expiresAt: BN | null;
  isValid: boolean;
  bump: number;
}

/** Network statistics for a node */
export interface NetworkStats {
  totalVotes: BN;
  totalAttestations: BN;
  participationRewards: BN;
  uptimePercentage: number;
  currentStreak: number;
  slashCount: number;
}

// ============================================================================
// SKILL CAPTURE
// ============================================================================

/** Skill type enum */
export enum SkillType {
  Trading = 0,
  ContentCreation = 1,
  DataAnalysis = 2,
  CustomerService = 3,
  CodeGeneration = 4,
  LanguageTranslation = 5,
  ImageRecognition = 6,
  Custom = 7,
}

/** Anonymization level for behavior models */
export enum AnonymizationLevel {
  None = 0,
  Basic = 1,
  Differential = 2,
  Federated = 3,
}

/** Exported behavior model */
export interface BehaviorModel {
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

/** Skill license record */
export interface SkillLicense {
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
export interface LicenseTerms {
  duration: BN;
  price: BN;
  usageLimit: BN;
  allowSublicense: boolean;
  commercialUse: boolean;
}

/** Skill statistics for a user */
export interface SkillStats {
  totalModels: BN;
  totalLicenses: BN;
  totalRevenue: BN;
  activeLicenses: number;
  avgLicensePrice: BN;
  topSkillType: SkillType;
}

// ============================================================================
// LIQUIDITY CAPTURE
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
  positionId: string;
  user: PublicKey;
  amount: BN;
  strategy: LiquidityStrategy;
  riskTolerance: RiskTolerance;
  status: PositionStatus;
  deployedAt: BN;
  yieldEarned: BN;
  currentApy: number;
}

/** Result of a rebalance operation */
export interface RebalanceResult {
  positionId: string;
  previousStrategy: LiquidityStrategy;
  newStrategy: LiquidityStrategy;
  rebalancedAt: BN;
  estimatedApy: number;
  signature: string;
}

/** Result of a withdrawal */
export interface WithdrawalResult {
  positionId: string;
  amountWithdrawn: BN;
  remainingBalance: BN;
  positionClosed: boolean;
  signature: string;
}

/** Liquidity statistics for a user */
export interface LiquidityStats {
  totalDeployed: BN;
  totalYieldEarned: BN;
  pendingYield: BN;
  activePositions: number;
  averageApy: number;
  protocolRank: number;
}

// ============================================================================
// ENERGY CAPTURE
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
  canGenerate: boolean;
  canStore: boolean;
  canConsume: boolean;
  canShiftLoad: boolean;
  maxPowerWatts: number;
  storageCapacityWh: number | null;
}

/** Energy arbitrage action */
export enum ArbitrageAction {
  Store = 0,
  Discharge = 1,
  ShiftLoad = 2,
  SellToGrid = 3,
}

/** Device registration result */
export interface DeviceRegistration {
  deviceId: string;
  deviceType: DeviceType;
  capabilities: DeviceCapabilities;
  registeredAt: BN;
  isActive: boolean;
}

/** Energy usage report */
export interface UsageReport {
  deviceId: string;
  energyConsumedWh: BN;
  energyGeneratedWh: BN;
  netEnergyWh: BN;
  valueCaptured: BN;
  periodStart: BN;
  periodEnd: BN;
}

/** Arbitrage execution result */
export interface ArbitrageExecution {
  deviceId: string;
  action: ArbitrageAction;
  energyAmountWh: BN;
  pricePerKwh: BN;
  revenue: BN;
  executedAt: BN;
  signature: string;
}

/** Energy statistics for a user */
export interface EnergyStats {
  totalDevices: number;
  totalEnergyGeneratedWh: BN;
  totalEnergyConsumedWh: BN;
  totalRevenue: BN;
  pendingRevenue: BN;
  carbonOffsetKg: BN;
}

// ============================================================================
// SOCIAL CAPTURE
// ============================================================================

/** Introduction terms */
export interface IntroTerms {
  facilitatorFeePercent: number;
  minimumDealValue: BN;
  expiryTimestamp: BN;
  description: string | null;
}

/** Introduction outcome */
export enum IntroOutcome {
  Connected = 0,
  DealClosed = 1,
  Declined = 2,
  Expired = 3,
}

/** Introduction request result */
export interface IntroRequest {
  introId: string;
  facilitator: PublicKey;
  fromContact: PublicKey;
  toContact: PublicKey;
  terms: IntroTerms;
  requestedAt: BN;
  isPending: boolean;
}

/** Introduction completion result */
export interface IntroCompletion {
  introId: string;
  outcome: IntroOutcome;
  dealValue: BN | null;
  feeEarned: BN;
  completedAt: BN;
  signature: string;
}

/** Reputation stake */
export interface ReputationStake {
  stakeId: string;
  staker: PublicKey;
  targetUser: PublicKey;
  amount: BN;
  stakedAt: BN;
  isActive: boolean;
}

/** Social statistics for a user */
export interface SocialStats {
  totalIntros: number;
  successfulIntros: number;
  totalFeesEarned: BN;
  pendingFees: BN;
  reputationScore: number;
  totalStakedOnOthers: BN;
  totalStakedByOthers: BN;
}

// ============================================================================
// INSURANCE CAPTURE
// ============================================================================

/** Claim type categories */
export enum ClaimType {
  SmartContractFailure = 0,
  StablecoinDepeg = 1,
  ProtocolInsolvency = 2,
  OracleManipulation = 3,
  GovernanceAttack = 4,
}

/** Vote on a claim */
export enum ClaimVoteType {
  Approve = 0,
  Reject = 1,
  Abstain = 2,
}

/** Claim status */
export enum ClaimStatus {
  Pending = 0,
  Voting = 1,
  Approved = 2,
  Rejected = 3,
  PaidOut = 4,
}

/** Pool membership result */
export interface PoolMembership {
  membershipId: string;
  poolId: string;
  user: PublicKey;
  coverage: BN;
  premium: BN;
  startedAt: BN;
  expiresAt: BN;
  isActive: boolean;
}

/** Claim submission result */
export interface ClaimSubmission {
  claimId: string;
  poolId: string;
  claimant: PublicKey;
  claimType: ClaimType;
  amountClaimed: BN;
  evidenceHash: string;
  submittedAt: BN;
  status: ClaimStatus;
}

/** Claim vote result */
export interface ClaimVote {
  claimId: string;
  voter: PublicKey;
  vote: ClaimVoteType;
  votingPower: BN;
  votedAt: BN;
  signature: string;
}

/** Insurance statistics for a user */
export interface InsuranceStats {
  totalPoolsJoined: number;
  totalCoverage: BN;
  totalPremiumsPaid: BN;
  claimsFiled: number;
  claimsApproved: number;
  totalClaimedAmount: BN;
  pendingPremiumReturns: BN;
}
