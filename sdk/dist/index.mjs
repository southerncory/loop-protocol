// src/index.ts
import {
  PublicKey,
  TransactionInstruction,
  SystemProgram
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
var PROGRAM_IDS = {
  VAULT: new PublicKey("76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7"),
  CRED: new PublicKey("FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA"),
  OXO: new PublicKey("3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z"),
  VTP: new PublicKey("4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj"),
  AVP: new PublicKey("H5c9xfPYcx6EtC8hpThshARtUR7tq1NfMJVrTx8z9Jcx")
};
var CONSTANTS = {
  // Vault
  EXTRACTION_FEE_BPS: 500,
  // 5%
  // OXO
  OXO_TOTAL_SUPPLY: 1e15,
  // 1B with 6 decimals
  MIN_LOCK_SECONDS: 15552e3,
  // 6 months
  MAX_LOCK_SECONDS: 126144e3,
  // 4 years
  GRADUATION_THRESHOLD: 25e9,
  // 25,000 OXO
  AGENT_CREATION_FEE: 5e8,
  // 500 OXO
  // VTP
  TRANSFER_FEE_BPS: 10,
  // 0.1%
  ESCROW_FEE_BPS: 25,
  // 0.25%
  MAX_ARBITERS: 5,
  MAX_CONDITIONS: 10,
  // AVP
  MIN_SERVICE_AGENT_STAKE: 5e8,
  // 500 OXO
  MAX_CAPABILITIES: 20,
  MAX_METADATA_LEN: 200
};
var CaptureType = /* @__PURE__ */ ((CaptureType2) => {
  CaptureType2[CaptureType2["Shopping"] = 0] = "Shopping";
  CaptureType2[CaptureType2["Data"] = 1] = "Data";
  CaptureType2[CaptureType2["Presence"] = 2] = "Presence";
  CaptureType2[CaptureType2["Attention"] = 3] = "Attention";
  CaptureType2[CaptureType2["Referral"] = 4] = "Referral";
  return CaptureType2;
})(CaptureType || {});
var PermissionLevel = /* @__PURE__ */ ((PermissionLevel2) => {
  PermissionLevel2[PermissionLevel2["None"] = 0] = "None";
  PermissionLevel2[PermissionLevel2["Read"] = 1] = "Read";
  PermissionLevel2[PermissionLevel2["Capture"] = 2] = "Capture";
  PermissionLevel2[PermissionLevel2["Guided"] = 3] = "Guided";
  PermissionLevel2[PermissionLevel2["Autonomous"] = 4] = "Autonomous";
  return PermissionLevel2;
})(PermissionLevel || {});
var EscrowStatus = /* @__PURE__ */ ((EscrowStatus2) => {
  EscrowStatus2[EscrowStatus2["Active"] = 0] = "Active";
  EscrowStatus2[EscrowStatus2["Released"] = 1] = "Released";
  EscrowStatus2[EscrowStatus2["Cancelled"] = 2] = "Cancelled";
  EscrowStatus2[EscrowStatus2["Disputed"] = 3] = "Disputed";
  return EscrowStatus2;
})(EscrowStatus || {});
var AgentType = /* @__PURE__ */ ((AgentType2) => {
  AgentType2[AgentType2["Personal"] = 0] = "Personal";
  AgentType2[AgentType2["Service"] = 1] = "Service";
  return AgentType2;
})(AgentType || {});
var AgentStatus = /* @__PURE__ */ ((AgentStatus2) => {
  AgentStatus2[AgentStatus2["Active"] = 0] = "Active";
  AgentStatus2[AgentStatus2["Suspended"] = 1] = "Suspended";
  AgentStatus2[AgentStatus2["Revoked"] = 2] = "Revoked";
  return AgentStatus2;
})(AgentStatus || {});
var ReferralCaptureModule = class {
  constructor(loop) {
    this.loop = loop;
  }
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
  async trackLink(originalUrl, affiliateTag) {
    throw new Error("Not yet implemented: trackLink");
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
  async registerConversion(linkId, amount, proof) {
    throw new Error("Not yet implemented: registerConversion");
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
  async claimCommission(user, conversionIds) {
    throw new Error("Not yet implemented: claimCommission");
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
  async getAffiliateStats(user) {
    throw new Error("Not yet implemented: getAffiliateStats");
  }
};
var AttentionCaptureModule = class {
  constructor(loop) {
    this.loop = loop;
  }
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
  async registerForAds(user, preferences) {
    throw new Error("Not yet implemented: registerForAds");
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
  async getAvailableAds(user) {
    throw new Error("Not yet implemented: getAvailableAds");
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
  async verifyView(user, adId, viewProof) {
    throw new Error("Not yet implemented: verifyView");
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
  async claimAttentionReward(user, viewIds) {
    throw new Error("Not yet implemented: claimAttentionReward");
  }
};
var DataCaptureModule = class {
  constructor(loop) {
    this.loop = loop;
  }
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
  async setDataPricing(user, dataTypes, prices) {
    throw new Error("Not yet implemented: setDataPricing");
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
  async licenseData(user, buyer, dataType, terms) {
    throw new Error("Not yet implemented: licenseData");
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
  async revokeDataLicense(user, licenseId) {
    throw new Error("Not yet implemented: revokeDataLicense");
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
  async claimDataRevenue(user) {
    throw new Error("Not yet implemented: claimDataRevenue");
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
  async getDataStats(user) {
    throw new Error("Not yet implemented: getDataStats");
  }
};
var TaskStatus = /* @__PURE__ */ ((TaskStatus2) => {
  TaskStatus2[TaskStatus2["Pending"] = 0] = "Pending";
  TaskStatus2[TaskStatus2["Completed"] = 1] = "Completed";
  TaskStatus2[TaskStatus2["Failed"] = 2] = "Failed";
  TaskStatus2[TaskStatus2["Disputed"] = 3] = "Disputed";
  return TaskStatus2;
})(TaskStatus || {});
var NodeType = /* @__PURE__ */ ((NodeType2) => {
  NodeType2[NodeType2["Validator"] = 0] = "Validator";
  NodeType2[NodeType2["Relay"] = 1] = "Relay";
  NodeType2[NodeType2["Oracle"] = 2] = "Oracle";
  NodeType2[NodeType2["Storage"] = 3] = "Storage";
  NodeType2[NodeType2["Compute"] = 4] = "Compute";
  return NodeType2;
})(NodeType || {});
var AttestationType = /* @__PURE__ */ ((AttestationType2) => {
  AttestationType2[AttestationType2["DataIntegrity"] = 0] = "DataIntegrity";
  AttestationType2[AttestationType2["PriceOracle"] = 1] = "PriceOracle";
  AttestationType2[AttestationType2["IdentityVerification"] = 2] = "IdentityVerification";
  AttestationType2[AttestationType2["EventWitness"] = 3] = "EventWitness";
  return AttestationType2;
})(AttestationType || {});
var SkillType = /* @__PURE__ */ ((SkillType2) => {
  SkillType2[SkillType2["Trading"] = 0] = "Trading";
  SkillType2[SkillType2["ContentCreation"] = 1] = "ContentCreation";
  SkillType2[SkillType2["DataAnalysis"] = 2] = "DataAnalysis";
  SkillType2[SkillType2["CustomerService"] = 3] = "CustomerService";
  SkillType2[SkillType2["CodeGeneration"] = 4] = "CodeGeneration";
  SkillType2[SkillType2["LanguageTranslation"] = 5] = "LanguageTranslation";
  SkillType2[SkillType2["ImageRecognition"] = 6] = "ImageRecognition";
  SkillType2[SkillType2["Custom"] = 7] = "Custom";
  return SkillType2;
})(SkillType || {});
var AnonymizationLevel = /* @__PURE__ */ ((AnonymizationLevel2) => {
  AnonymizationLevel2[AnonymizationLevel2["None"] = 0] = "None";
  AnonymizationLevel2[AnonymizationLevel2["Basic"] = 1] = "Basic";
  AnonymizationLevel2[AnonymizationLevel2["Differential"] = 2] = "Differential";
  AnonymizationLevel2[AnonymizationLevel2["Federated"] = 3] = "Federated";
  return AnonymizationLevel2;
})(AnonymizationLevel || {});
var LoopPDA = class {
  // ─────────────────────────────────────────────────────────────────────────
  // Vault PDAs
  // ─────────────────────────────────────────────────────────────────────────
  /** Derive vault PDA for an owner */
  static vault(owner) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }
  /** Derive stack record PDA */
  static stackRecord(vault, stackIndex) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("stack"), vault.toBuffer(), stackIndex.toArrayLike(Buffer, "le", 8)],
      PROGRAM_IDS.VAULT
    );
  }
  /** Derive agent permission PDA */
  static agentPermission(vault, agent) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("agent_perm"), vault.toBuffer(), agent.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }
  /** Derive vault inheritance config PDA */
  static vaultInheritance(vault) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("inheritance"), vault.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }
  /** Derive capture authority PDA */
  static captureAuthority() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("capture_authority")],
      PROGRAM_IDS.VAULT
    );
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Cred PDAs
  // ─────────────────────────────────────────────────────────────────────────
  /** Derive cred config PDA */
  static credConfig() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("cred_config")],
      PROGRAM_IDS.CRED
    );
  }
  /** Derive capture auth PDA for a module */
  static captureAuth(moduleAddress) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("capture_auth"), moduleAddress.toBuffer()],
      PROGRAM_IDS.CRED
    );
  }
  // ─────────────────────────────────────────────────────────────────────────
  // OXO PDAs
  // ─────────────────────────────────────────────────────────────────────────
  /** Derive OXO config PDA */
  static oxoConfig() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_IDS.OXO
    );
  }
  /** Derive veOXO position PDA */
  static veOxoPosition(owner) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("ve_position"), owner.toBuffer()],
      PROGRAM_IDS.OXO
    );
  }
  /** Derive bonding curve PDA for agent token */
  static bondingCurve(agentMint) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), agentMint.toBuffer()],
      PROGRAM_IDS.OXO
    );
  }
  // ─────────────────────────────────────────────────────────────────────────
  // VTP PDAs
  // ─────────────────────────────────────────────────────────────────────────
  /** Derive VTP config PDA */
  static vtpConfig() {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vtp_config")],
      PROGRAM_IDS.VTP
    );
  }
  /** Derive escrow PDA */
  static escrow(sender, recipient, createdAt) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        sender.toBuffer(),
        recipient.toBuffer(),
        createdAt.toArrayLike(Buffer, "le", 8)
      ],
      PROGRAM_IDS.VTP
    );
  }
  /** Derive VTP inheritance plan PDA */
  static vtpInheritance(owner) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("inheritance"), owner.toBuffer()],
      PROGRAM_IDS.VTP
    );
  }
  // ─────────────────────────────────────────────────────────────────────────
  // AVP PDAs
  // ─────────────────────────────────────────────────────────────────────────
  /** Derive agent identity PDA */
  static agentIdentity(agent) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), agent.toBuffer()],
      PROGRAM_IDS.AVP
    );
  }
};
var Loop = class {
  constructor(config) {
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
};
var VaultModule = class {
  constructor(loop) {
    this.loop = loop;
  }
  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Get vault PDA for an owner
   * @param owner - Wallet address of vault owner
   */
  getVaultAddress(owner) {
    return LoopPDA.vault(owner);
  }
  /**
   * Get stack record PDA
   * @param vault - Vault PDA
   * @param stackIndex - Index of the stack (based on stacked_balance at creation)
   */
  getStackAddress(vault, stackIndex) {
    return LoopPDA.stackRecord(vault, stackIndex);
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Account Fetching
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Fetch vault account data
   * @param owner - Vault owner
   */
  async getVault(owner) {
    const [vaultPda] = this.getVaultAddress(owner);
    const accountInfo = await this.loop.connection.getAccountInfo(vaultPda);
    if (!accountInfo) return null;
    return this.deserializeVault(accountInfo.data);
  }
  /**
   * Check if vault exists
   * @param owner - Vault owner
   */
  async exists(owner) {
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
  async initializeVault(owner) {
    const [vaultPda, bump] = this.getVaultAddress(owner);
    return this.createInstruction(
      "initialize_vault",
      [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
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
  async deposit(owner, amount, userCredAccount, vaultCredAccount) {
    const [vaultPda] = this.getVaultAddress(owner);
    return this.createInstruction(
      "deposit",
      [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: userCredAccount, isSigner: false, isWritable: true },
        { pubkey: vaultCredAccount, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async capture(vault, amount, captureType, source, captureModule, credMint, vaultCredAccount) {
    const [captureAuthority, captureAuthBump] = LoopPDA.captureAuthority();
    return this.createInstruction(
      "capture",
      [
        { pubkey: vault, isSigner: false, isWritable: true },
        { pubkey: captureAuthority, isSigner: false, isWritable: false },
        // capture_config account would be needed
        { pubkey: credMint, isSigner: false, isWritable: true },
        { pubkey: vaultCredAccount, isSigner: false, isWritable: true },
        { pubkey: captureModule, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async stack(owner, amount, durationDays) {
    const [vaultPda] = this.getVaultAddress(owner);
    const vault = await this.getVault(owner);
    const stackIndex = vault?.stackedBalance || new BN(0);
    const [stackPda, stackBump] = this.getStackAddress(vaultPda, stackIndex);
    return this.createInstruction(
      "stack",
      [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: stackPda, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      { amount, durationDays }
    );
  }
  /**
   * Unstack (withdraw locked Cred)
   * 
   * @param owner - Vault owner (signer)
   * @param stackAddress - Stack record address
   */
  async unstack(owner, stackAddress) {
    const [vaultPda] = this.getVaultAddress(owner);
    return this.createInstruction(
      "unstack",
      [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: stackAddress, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false }
      ],
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
  async withdraw(owner, amount, userCredAccount, vaultCredAccount) {
    const [vaultPda] = this.getVaultAddress(owner);
    return this.createInstruction(
      "withdraw",
      [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: vaultCredAccount, isSigner: false, isWritable: true },
        { pubkey: userCredAccount, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async setAgentPermission(owner, agent, permissionLevel, dailyLimit) {
    const [vaultPda] = this.getVaultAddress(owner);
    const [permPda, permBump] = LoopPDA.agentPermission(vaultPda, agent);
    return this.createInstruction(
      "set_agent_permission",
      [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: permPda, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      { agent, permissionLevel, dailyLimit }
    );
  }
  /**
   * Claim yield from stacking position
   * 
   * @param owner - Vault owner (signer)
   * @param stackAddress - Stack record address
   */
  async claimYield(owner, stackAddress) {
    const [vaultPda] = this.getVaultAddress(owner);
    return this.createInstruction(
      "claim_yield",
      [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: stackAddress, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false }
      ],
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
  async extract(owner, userCredAccount, vaultCredAccount, feeAccount) {
    const [vaultPda] = this.getVaultAddress(owner);
    return this.createInstruction(
      "extract",
      [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: vaultCredAccount, isSigner: false, isWritable: true },
        { pubkey: userCredAccount, isSigner: false, isWritable: true },
        { pubkey: feeAccount, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      {}
    );
  }
  /**
   * Close vault (must be empty)
   * 
   * @param owner - Vault owner (signer)
   */
  async closeVault(owner) {
    const [vaultPda] = this.getVaultAddress(owner);
    return this.createInstruction(
      "close_vault",
      [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: true }
      ],
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
  async setHeir(owner, heir, inactivityThresholdDays) {
    const [vaultPda] = this.getVaultAddress(owner);
    const [inheritancePda, inheritanceBump] = LoopPDA.vaultInheritance(vaultPda);
    return this.createInstruction(
      "set_heir",
      [
        { pubkey: vaultPda, isSigner: false, isWritable: false },
        { pubkey: inheritancePda, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
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
  calculateApy(durationDays) {
    if (durationDays >= 365) return 2e3;
    if (durationDays >= 180) return 1800;
    if (durationDays >= 90) return 1500;
    if (durationDays >= 30) return 1e3;
    if (durationDays >= 14) return 700;
    if (durationDays >= 7) return 500;
    return 200;
  }
  createInstruction(name, accounts, data) {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.VAULT,
      data: Buffer.concat([discriminator, dataBuffer])
    });
  }
  deserializeVault(data) {
    return {};
  }
};
var CredModule = class {
  constructor(loop) {
    this.loop = loop;
  }
  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────
  /** Get cred config PDA */
  getConfigAddress() {
    return LoopPDA.credConfig();
  }
  /** Get capture authority PDA for a module */
  getCaptureAuthAddress(moduleAddress) {
    return LoopPDA.captureAuth(moduleAddress);
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Account Fetching
  // ─────────────────────────────────────────────────────────────────────────
  /** Fetch cred config */
  async getConfig() {
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
  async initialize(authority, usdcMint, credMint, reserveVault) {
    const [configPda, bump] = this.getConfigAddress();
    return this.createInstruction(
      "initialize",
      [
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: usdcMint, isSigner: false, isWritable: false },
        { pubkey: credMint, isSigner: false, isWritable: true },
        { pubkey: reserveVault, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async wrap(user, amount, userUsdcAccount, userCredAccount, credMint, reserveVault) {
    const [configPda] = this.getConfigAddress();
    return this.createInstruction(
      "wrap",
      [
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: credMint, isSigner: false, isWritable: true },
        { pubkey: reserveVault, isSigner: false, isWritable: true },
        { pubkey: userUsdcAccount, isSigner: false, isWritable: true },
        { pubkey: userCredAccount, isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async unwrap(user, amount, userCredAccount, userUsdcAccount, credMint, reserveVault) {
    const [configPda] = this.getConfigAddress();
    return this.createInstruction(
      "unwrap",
      [
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: credMint, isSigner: false, isWritable: true },
        { pubkey: reserveVault, isSigner: false, isWritable: true },
        { pubkey: userCredAccount, isSigner: false, isWritable: true },
        { pubkey: userUsdcAccount, isSigner: false, isWritable: true },
        { pubkey: user, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async captureMint(captureSigner, amount, captureType, destinationCredAccount, credMint, reserveVault, captureUsdcAccount) {
    const [configPda] = this.getConfigAddress();
    const [captureAuthPda] = this.getCaptureAuthAddress(captureSigner);
    return this.createInstruction(
      "capture_mint",
      [
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: captureAuthPda, isSigner: false, isWritable: true },
        { pubkey: credMint, isSigner: false, isWritable: true },
        { pubkey: reserveVault, isSigner: false, isWritable: true },
        { pubkey: captureUsdcAccount, isSigner: false, isWritable: true },
        { pubkey: destinationCredAccount, isSigner: false, isWritable: true },
        { pubkey: captureSigner, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async registerCaptureModule(authority, moduleAddress, captureType, moduleName) {
    const [configPda] = this.getConfigAddress();
    const [captureAuthPda, bump] = this.getCaptureAuthAddress(moduleAddress);
    return this.createInstruction(
      "register_capture_module",
      [
        { pubkey: configPda, isSigner: false, isWritable: false },
        { pubkey: captureAuthPda, isSigner: false, isWritable: true },
        { pubkey: moduleAddress, isSigner: false, isWritable: false },
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      { captureType, moduleName }
    );
  }
  /**
   * Get reserve status (USDC backing vs Cred supply)
   * 
   * @param reserveVault - USDC reserve token account
   * @param credMint - Cred mint
   */
  async getReserveStatus(reserveVault, credMint) {
    const [configPda] = this.getConfigAddress();
    return {
      usdcReserve: new BN(0),
      credSupply: new BN(0),
      backingRatio: new BN(1e4),
      // 100%
      totalMinted: new BN(0),
      totalBurned: new BN(0)
    };
  }
  createInstruction(name, accounts, data) {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.CRED,
      data: Buffer.concat([discriminator, dataBuffer])
    });
  }
  deserializeCredConfig(data) {
    return {};
  }
};
var OxoModule = class {
  constructor(loop) {
    this.loop = loop;
  }
  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────
  /** Get OXO config PDA */
  getConfigAddress() {
    return LoopPDA.oxoConfig();
  }
  /** Get veOXO position PDA for an owner */
  getVePositionAddress(owner) {
    return LoopPDA.veOxoPosition(owner);
  }
  /** Get bonding curve PDA for an agent token */
  getBondingCurveAddress(agentMint) {
    return LoopPDA.bondingCurve(agentMint);
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Account Fetching
  // ─────────────────────────────────────────────────────────────────────────
  /** Fetch OXO config */
  async getConfig() {
    const [configPda] = this.getConfigAddress();
    const accountInfo = await this.loop.connection.getAccountInfo(configPda);
    if (!accountInfo) return null;
    return this.deserializeOxoConfig(accountInfo.data);
  }
  /** Fetch veOXO position */
  async getVePosition(owner) {
    const [positionPda] = this.getVePositionAddress(owner);
    const accountInfo = await this.loop.connection.getAccountInfo(positionPda);
    if (!accountInfo) return null;
    return this.deserializeVePosition(accountInfo.data);
  }
  /** Fetch bonding curve */
  async getBondingCurve(agentMint) {
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
  async initialize(authority, oxoMint, treasury) {
    const [configPda, bump] = this.getConfigAddress();
    return this.createInstruction(
      "initialize",
      [
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: oxoMint, isSigner: false, isWritable: false },
        { pubkey: treasury, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
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
  async lockOxo(owner, amount, lockSeconds, userOxoAccount, protocolOxoAccount) {
    const [configPda] = this.getConfigAddress();
    const [positionPda, bump] = this.getVePositionAddress(owner);
    return this.createInstruction(
      "lock_oxo",
      [
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: positionPda, isSigner: false, isWritable: true },
        { pubkey: userOxoAccount, isSigner: false, isWritable: true },
        { pubkey: protocolOxoAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      { amount, lockSeconds, bump }
    );
  }
  /**
   * Extend lock duration (increases veOXO)
   * 
   * @param owner - Position owner (signer)
   * @param additionalSeconds - Additional seconds to add to lock
   */
  async extendLock(owner, additionalSeconds) {
    const [configPda] = this.getConfigAddress();
    const [positionPda] = this.getVePositionAddress(owner);
    return this.createInstruction(
      "extend_lock",
      [
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: positionPda, isSigner: false, isWritable: true }
      ],
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
  async unlockOxo(owner, userOxoAccount, protocolOxoAccount) {
    const [configPda] = this.getConfigAddress();
    const [positionPda] = this.getVePositionAddress(owner);
    return this.createInstruction(
      "unlock_oxo",
      [
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: positionPda, isSigner: false, isWritable: true },
        { pubkey: userOxoAccount, isSigner: false, isWritable: true },
        { pubkey: protocolOxoAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async claimFeeShare(owner, feePoolAccount, userCredAccount) {
    const [configPda] = this.getConfigAddress();
    const [positionPda] = this.getVePositionAddress(owner);
    return this.createInstruction(
      "claim_fee_share",
      [
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: positionPda, isSigner: false, isWritable: true },
        { pubkey: feePoolAccount, isSigner: false, isWritable: true },
        { pubkey: userCredAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      {}
    );
  }
  /**
   * Get current decayed veOXO balance
   * 
   * @param owner - Position owner
   */
  async getCurrentVeOxo(owner) {
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
  async createAgentToken(creator, agentMint, name, symbol, uri, creatorOxoAccount, treasuryOxoAccount) {
    const [configPda] = this.getConfigAddress();
    const [curvePda, bump] = this.getBondingCurveAddress(agentMint);
    return this.createInstruction(
      "create_agent_token",
      [
        { pubkey: creator, isSigner: true, isWritable: true },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: curvePda, isSigner: false, isWritable: true },
        { pubkey: agentMint, isSigner: false, isWritable: true },
        { pubkey: creatorOxoAccount, isSigner: false, isWritable: true },
        { pubkey: treasuryOxoAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
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
  async buyAgentToken(buyer, agentMint, oxoAmount, buyerOxoAccount, buyerAgentAccount, curveOxoAccount) {
    const [curvePda] = this.getBondingCurveAddress(agentMint);
    return this.createInstruction(
      "buy_agent_token",
      [
        { pubkey: buyer, isSigner: true, isWritable: true },
        { pubkey: curvePda, isSigner: false, isWritable: true },
        { pubkey: agentMint, isSigner: false, isWritable: true },
        { pubkey: buyerOxoAccount, isSigner: false, isWritable: true },
        { pubkey: buyerAgentAccount, isSigner: false, isWritable: true },
        { pubkey: curveOxoAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async sellAgentToken(seller, agentMint, tokenAmount, sellerOxoAccount, sellerAgentAccount, curveOxoAccount) {
    const [curvePda] = this.getBondingCurveAddress(agentMint);
    return this.createInstruction(
      "sell_agent_token",
      [
        { pubkey: seller, isSigner: true, isWritable: true },
        { pubkey: curvePda, isSigner: false, isWritable: true },
        { pubkey: agentMint, isSigner: false, isWritable: true },
        { pubkey: sellerOxoAccount, isSigner: false, isWritable: true },
        { pubkey: sellerAgentAccount, isSigner: false, isWritable: true },
        { pubkey: curveOxoAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async depositFees(authority, amount, sourceAccount, feePoolAccount) {
    const [configPda] = this.getConfigAddress();
    return this.createInstruction(
      "deposit_fees",
      [
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: sourceAccount, isSigner: false, isWritable: true },
        { pubkey: feePoolAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  calculateVeOxo(amount, lockSeconds) {
    const sixMonths = new BN(CONSTANTS.MIN_LOCK_SECONDS);
    const fourYears = new BN(CONSTANTS.MAX_LOCK_SECONDS);
    if (lockSeconds.lte(sixMonths)) {
      return amount.div(new BN(4));
    }
    if (lockSeconds.gte(fourYears)) {
      return amount.mul(new BN(2));
    }
    const range = fourYears.sub(sixMonths);
    const progress = lockSeconds.sub(sixMonths);
    const baseMultiplier = new BN(25);
    const additional = progress.mul(new BN(175)).div(range);
    const totalMultiplier = baseMultiplier.add(additional);
    return amount.mul(totalMultiplier).div(new BN(100));
  }
  /**
   * Calculate current decayed veOXO balance
   */
  calculateDecayedVeOxo(position) {
    const now = new BN(Math.floor(Date.now() / 1e3));
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
  createInstruction(name, accounts, data) {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.OXO,
      data: Buffer.concat([discriminator, dataBuffer])
    });
  }
  deserializeOxoConfig(data) {
    return {};
  }
  deserializeVePosition(data) {
    return {};
  }
  deserializeBondingCurve(data) {
    return {};
  }
};
var VtpModule = class {
  constructor(loop) {
    this.loop = loop;
  }
  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────
  /** Get VTP config PDA */
  getConfigAddress() {
    return LoopPDA.vtpConfig();
  }
  /** Get escrow PDA */
  getEscrowAddress(sender, recipient, createdAt) {
    return LoopPDA.escrow(sender, recipient, createdAt);
  }
  /** Get inheritance plan PDA */
  getInheritanceAddress(owner) {
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
  async initialize(authority, feeRecipient) {
    const [configPda, bump] = this.getConfigAddress();
    return this.createInstruction(
      "initialize",
      [
        { pubkey: authority, isSigner: true, isWritable: true },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: feeRecipient, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
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
  async transfer(sender, recipient, amount, memo, senderCredAccount, recipientCredAccount, feeAccount) {
    const [configPda] = this.getConfigAddress();
    return this.createInstruction(
      "transfer",
      [
        { pubkey: sender, isSigner: true, isWritable: true },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: recipient, isSigner: false, isWritable: false },
        { pubkey: senderCredAccount, isSigner: false, isWritable: true },
        { pubkey: recipientCredAccount, isSigner: false, isWritable: true },
        { pubkey: feeAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async batchTransfer(sender, recipients, amounts, senderCredAccount) {
    const [configPda] = this.getConfigAddress();
    return this.createInstruction(
      "batch_transfer",
      [
        { pubkey: sender, isSigner: true, isWritable: true },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: senderCredAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      { recipients: recipients.map((r) => r.toBase58()), amounts: amounts.map((a) => a.toString()) }
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
  async createEscrow(sender, recipient, amount, releaseConditions, expiry, senderCredAccount, escrowCredAccount, feeAccount) {
    const [configPda] = this.getConfigAddress();
    const now = new BN(Math.floor(Date.now() / 1e3));
    const [escrowPda, bump] = this.getEscrowAddress(sender, recipient, now);
    return this.createInstruction(
      "create_escrow",
      [
        { pubkey: sender, isSigner: true, isWritable: true },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: recipient, isSigner: false, isWritable: false },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: senderCredAccount, isSigner: false, isWritable: true },
        { pubkey: escrowCredAccount, isSigner: false, isWritable: true },
        { pubkey: feeAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
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
  async fulfillCondition(fulfiller, escrow, conditionIndex, proof) {
    return this.createInstruction(
      "fulfill_condition",
      [
        { pubkey: fulfiller, isSigner: true, isWritable: false },
        { pubkey: escrow, isSigner: false, isWritable: true }
      ],
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
  async releaseEscrow(releaser, escrow, escrowCredAccount, recipientCredAccount) {
    const [configPda] = this.getConfigAddress();
    return this.createInstruction(
      "release_escrow",
      [
        { pubkey: releaser, isSigner: true, isWritable: false },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: escrow, isSigner: false, isWritable: true },
        { pubkey: escrowCredAccount, isSigner: false, isWritable: true },
        { pubkey: recipientCredAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async cancelEscrow(canceller, escrow, escrowCredAccount, senderCredAccount) {
    const [configPda] = this.getConfigAddress();
    return this.createInstruction(
      "cancel_escrow",
      [
        { pubkey: canceller, isSigner: true, isWritable: false },
        { pubkey: configPda, isSigner: false, isWritable: true },
        { pubkey: escrow, isSigner: false, isWritable: true },
        { pubkey: escrowCredAccount, isSigner: false, isWritable: true },
        { pubkey: senderCredAccount, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
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
  async setupInheritance(owner, heirs, inactivityThreshold) {
    const [inheritancePda, bump] = this.getInheritanceAddress(owner);
    return this.createInstruction(
      "setup_inheritance",
      [
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: inheritancePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      { heirs, inactivityThreshold, bump }
    );
  }
  /**
   * Heartbeat to prove activity (prevents inheritance trigger)
   * 
   * @param owner - Vault owner (signer)
   */
  async inheritanceHeartbeat(owner) {
    const [inheritancePda] = this.getInheritanceAddress(owner);
    return this.createInstruction(
      "inheritance_heartbeat",
      [
        { pubkey: owner, isSigner: true, isWritable: false },
        { pubkey: inheritancePda, isSigner: false, isWritable: true }
      ],
      {}
    );
  }
  /**
   * Trigger inheritance (by heir after inactivity threshold)
   * 
   * @param triggerer - Heir triggering inheritance (signer)
   * @param inheritancePlan - Inheritance plan account
   */
  async triggerInheritance(triggerer, inheritancePlan) {
    return this.createInstruction(
      "trigger_inheritance",
      [
        { pubkey: triggerer, isSigner: true, isWritable: false },
        { pubkey: inheritancePlan, isSigner: false, isWritable: true }
      ],
      {}
    );
  }
  /**
   * Execute inheritance distribution
   * 
   * @param executor - Executor (signer)
   * @param inheritancePlan - Inheritance plan account
   */
  async executeInheritance(executor, inheritancePlan) {
    return this.createInstruction(
      "execute_inheritance",
      [
        { pubkey: executor, isSigner: true, isWritable: false },
        { pubkey: inheritancePlan, isSigner: false, isWritable: true }
      ],
      {}
    );
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  /** Create an arbiter approval condition */
  arbiterCondition(arbiter) {
    return { arbiterApproval: { arbiter } };
  }
  /** Create a time release condition */
  timeCondition(timestamp) {
    return { timeRelease: { timestamp } };
  }
  /** Create an oracle attestation condition */
  oracleCondition(oracle, dataHash) {
    return { oracleAttestation: { oracle, dataHash } };
  }
  /** Create a multi-sig condition */
  multiSigCondition(threshold, signers) {
    return { multiSig: { threshold, signers } };
  }
  createInstruction(name, accounts, data) {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.VTP,
      data: Buffer.concat([discriminator, dataBuffer])
    });
  }
};
var AvpModule = class {
  constructor(loop) {
    this.loop = loop;
  }
  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────
  /** Get agent identity PDA */
  getAgentAddress(agent) {
    return LoopPDA.agentIdentity(agent);
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Account Fetching
  // ─────────────────────────────────────────────────────────────────────────
  /** Fetch agent identity */
  async getAgent(agent) {
    const [identityPda] = this.getAgentAddress(agent);
    const accountInfo = await this.loop.connection.getAccountInfo(identityPda);
    if (!accountInfo) return null;
    return this.deserializeAgentIdentity(accountInfo.data);
  }
  /** Check if agent is registered */
  async isRegistered(agent) {
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
  async registerPersonalAgent(agent, principalHash, metadataUri) {
    const [identityPda, bump] = this.getAgentAddress(agent);
    return this.createInstruction(
      "register_personal_agent",
      [
        { pubkey: agent, isSigner: true, isWritable: true },
        { pubkey: identityPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
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
  async registerServiceAgent(creator, agent, metadataUri, creatorOxoAccount) {
    const [identityPda, bump] = this.getAgentAddress(agent);
    return this.createInstruction(
      "register_service_agent",
      [
        { pubkey: creator, isSigner: true, isWritable: true },
        { pubkey: agent, isSigner: false, isWritable: false },
        { pubkey: identityPda, isSigner: false, isWritable: true },
        { pubkey: creatorOxoAccount, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
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
  async bindAgent(agent, newPrincipalHash) {
    const [identityPda] = this.getAgentAddress(agent);
    return this.createInstruction(
      "bind_agent",
      [
        { pubkey: agent, isSigner: true, isWritable: false },
        { pubkey: identityPda, isSigner: false, isWritable: true }
      ],
      { newPrincipalHash: Array.from(newPrincipalHash) }
    );
  }
  /**
   * Revoke agent authority (permanent)
   * 
   * @param agent - Agent (signer)
   */
  async revokeAgent(agent) {
    const [identityPda] = this.getAgentAddress(agent);
    return this.createInstruction(
      "revoke_agent",
      [
        { pubkey: agent, isSigner: true, isWritable: false },
        { pubkey: identityPda, isSigner: false, isWritable: true }
      ],
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
  async suspendAgent(authority, agentIdentity, reason) {
    return this.createInstruction(
      "suspend_agent",
      [
        { pubkey: authority, isSigner: true, isWritable: false },
        { pubkey: agentIdentity, isSigner: false, isWritable: true }
      ],
      { reason }
    );
  }
  /**
   * Reactivate suspended agent
   * 
   * @param authority - Agent or creator (signer)
   * @param agentIdentity - Agent identity account
   */
  async reactivateAgent(authority, agentIdentity) {
    return this.createInstruction(
      "reactivate_agent",
      [
        { pubkey: authority, isSigner: true, isWritable: false },
        { pubkey: agentIdentity, isSigner: false, isWritable: true }
      ],
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
  async declareCapabilities(agent, capabilities) {
    const [identityPda] = this.getAgentAddress(agent);
    return this.createInstruction(
      "declare_capabilities",
      [
        { pubkey: agent, isSigner: true, isWritable: false },
        { pubkey: identityPda, isSigner: false, isWritable: true }
      ],
      { capabilities: capabilities.map((c) => Array.from(c)) }
    );
  }
  /**
   * Add stake (Service Agents only)
   * 
   * @param creator - Service agent creator (signer)
   * @param agentIdentity - Agent identity account
   * @param amount - Amount of OXO to add
   */
  async addStake(creator, agentIdentity, amount) {
    return this.createInstruction(
      "add_stake",
      [
        { pubkey: creator, isSigner: true, isWritable: false },
        { pubkey: agentIdentity, isSigner: false, isWritable: true }
      ],
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
  async updateReputation(authority, agentIdentity, delta) {
    return this.createInstruction(
      "update_reputation",
      [
        { pubkey: authority, isSigner: true, isWritable: false },
        { pubkey: agentIdentity, isSigner: false, isWritable: true }
      ],
      { delta }
    );
  }
  /**
   * Update metadata URI
   * 
   * @param agent - Agent (signer)
   * @param newUri - New metadata URI (max 200 chars)
   */
  async updateMetadata(agent, newUri) {
    const [identityPda] = this.getAgentAddress(agent);
    return this.createInstruction(
      "update_metadata",
      [
        { pubkey: agent, isSigner: true, isWritable: false },
        { pubkey: identityPda, isSigner: false, isWritable: true }
      ],
      { newUri }
    );
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  /** Create a capability ID from a string */
  createCapabilityId(name) {
    const bytes = new Uint8Array(8);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(name);
    bytes.set(encoded.slice(0, 8));
    return bytes;
  }
  createInstruction(name, accounts, data) {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.AVP,
      data: Buffer.concat([discriminator, dataBuffer])
    });
  }
  deserializeAgentIdentity(data) {
    return {};
  }
};
/** Well-known capability IDs */
AvpModule.CAPABILITIES = {
  CAPTURE_SHOPPING: new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0]),
  CAPTURE_DATA: new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0]),
  CAPTURE_PRESENCE: new Uint8Array([3, 0, 0, 0, 0, 0, 0, 0]),
  CAPTURE_ATTENTION: new Uint8Array([4, 0, 0, 0, 0, 0, 0, 0]),
  TRANSFER: new Uint8Array([16, 0, 0, 0, 0, 0, 0, 0]),
  ESCROW: new Uint8Array([17, 0, 0, 0, 0, 0, 0, 0]),
  STACK: new Uint8Array([32, 0, 0, 0, 0, 0, 0, 0])
};
var ComputeCaptureModule = class {
  constructor(loop) {
    this.loop = loop;
  }
  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Get resource profile PDA for a provider
   * @param provider - Provider's public key
   */
  getResourceProfileAddress(provider) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("compute_profile"), provider.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }
  /**
   * Get task acceptance PDA
   * @param provider - Provider's public key
   * @param taskId - Task identifier
   */
  getTaskAcceptanceAddress(provider, taskId) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("task_accept"), provider.toBuffer(), Buffer.from(taskId)],
      PROGRAM_IDS.VAULT
    );
  }
  /**
   * Get task submission PDA
   * @param provider - Provider's public key
   * @param taskId - Task identifier
   */
  getTaskSubmissionAddress(provider, taskId) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("task_submit"), provider.toBuffer(), Buffer.from(taskId)],
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
  async registerResources(user, resources) {
    const [profilePda, bump] = this.getResourceProfileAddress(user);
    return this.createInstruction(
      "register_compute_resources",
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: profilePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      {
        cpuCores: resources.cpu,
        gpuUnits: resources.gpu,
        storageGb: resources.storage,
        bandwidthMbps: resources.bandwidth,
        bump
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
  async acceptTask(user, taskId, bid) {
    const [profilePda] = this.getResourceProfileAddress(user);
    const [acceptancePda, bump] = this.getTaskAcceptanceAddress(user, taskId);
    return this.createInstruction(
      "accept_compute_task",
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: profilePda, isSigner: false, isWritable: true },
        { pubkey: acceptancePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
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
  async submitTaskResult(user, taskId, resultHash, proof) {
    const [acceptancePda] = this.getTaskAcceptanceAddress(user, taskId);
    const [submissionPda, bump] = this.getTaskSubmissionAddress(user, taskId);
    return this.createInstruction(
      "submit_task_result",
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: acceptancePda, isSigner: false, isWritable: true },
        { pubkey: submissionPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      {
        taskId,
        resultHash: Array.from(resultHash),
        proof: Array.from(proof),
        bump
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
  async claimComputeReward(user, taskIds) {
    const [profilePda] = this.getResourceProfileAddress(user);
    const [vaultPda] = LoopPDA.vault(user);
    return this.createInstruction(
      "claim_compute_reward",
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: profilePda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
  async getComputeStats(user) {
    const [profilePda] = this.getResourceProfileAddress(user);
    const accountInfo = await this.loop.connection.getAccountInfo(profilePda);
    if (!accountInfo) {
      return {
        totalTasks: new BN(0),
        totalRewards: new BN(0),
        successRate: 0,
        avgCompletionTime: new BN(0),
        reputationScore: 0,
        activeTasks: 0
      };
    }
    return this.deserializeComputeStats(accountInfo.data);
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  createInstruction(name, accounts, data) {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.VAULT,
      data: Buffer.concat([discriminator, dataBuffer])
    });
  }
  deserializeComputeStats(data) {
    return {
      totalTasks: new BN(0),
      totalRewards: new BN(0),
      successRate: 0,
      avgCompletionTime: new BN(0),
      reputationScore: 0,
      activeTasks: 0
    };
  }
};
var NetworkCaptureModule = class {
  constructor(loop) {
    this.loop = loop;
  }
  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Get node registration PDA
   * @param operator - Node operator's public key
   */
  getNodeRegistrationAddress(operator) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("network_node"), operator.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }
  /**
   * Get vote submission PDA
   * @param voter - Voter's public key
   * @param proposalId - Proposal identifier
   */
  getVoteAddress(voter, proposalId) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), voter.toBuffer(), Buffer.from(proposalId)],
      PROGRAM_IDS.VAULT
    );
  }
  /**
   * Get attestation PDA
   * @param attester - Attester's public key
   * @param dataHash - Hash of attested data
   */
  getAttestationAddress(attester, dataHash) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("attestation"), attester.toBuffer(), dataHash.slice(0, 32)],
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
  async registerNode(user, nodeType, capabilities) {
    const [nodePda, bump] = this.getNodeRegistrationAddress(user);
    return this.createInstruction(
      "register_network_node",
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: nodePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
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
  async submitVote(user, proposalId, vote, proof) {
    const [nodePda] = this.getNodeRegistrationAddress(user);
    const [votePda, bump] = this.getVoteAddress(user, proposalId);
    const [vePositionPda] = LoopPDA.veOxoPosition(user);
    return this.createInstruction(
      "submit_network_vote",
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: nodePda, isSigner: false, isWritable: true },
        { pubkey: votePda, isSigner: false, isWritable: true },
        { pubkey: vePositionPda, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
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
  async submitAttestation(user, dataHash, attestationType) {
    const [nodePda] = this.getNodeRegistrationAddress(user);
    const [attestationPda, bump] = this.getAttestationAddress(user, dataHash);
    return this.createInstruction(
      "submit_attestation",
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: nodePda, isSigner: false, isWritable: true },
        { pubkey: attestationPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
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
  async claimParticipationReward(user, activityIds) {
    const [nodePda] = this.getNodeRegistrationAddress(user);
    const [vaultPda] = LoopPDA.vault(user);
    return this.createInstruction(
      "claim_participation_reward",
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: nodePda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
  async getNetworkStats(user) {
    const [nodePda] = this.getNodeRegistrationAddress(user);
    const accountInfo = await this.loop.connection.getAccountInfo(nodePda);
    if (!accountInfo) {
      return {
        totalVotes: new BN(0),
        totalAttestations: new BN(0),
        participationRewards: new BN(0),
        uptimePercentage: 0,
        currentStreak: 0,
        slashCount: 0
      };
    }
    return this.deserializeNetworkStats(accountInfo.data);
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  createInstruction(name, accounts, data) {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.VAULT,
      data: Buffer.concat([discriminator, dataBuffer])
    });
  }
  deserializeNetworkStats(data) {
    return {
      totalVotes: new BN(0),
      totalAttestations: new BN(0),
      participationRewards: new BN(0),
      uptimePercentage: 0,
      currentStreak: 0,
      slashCount: 0
    };
  }
};
var SkillCaptureModule = class {
  constructor(loop) {
    this.loop = loop;
  }
  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Get behavior model PDA
   * @param owner - Model owner's public key
   * @param modelId - Model identifier
   */
  getBehaviorModelAddress(owner, modelId) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("behavior_model"), owner.toBuffer(), Buffer.from(modelId)],
      PROGRAM_IDS.VAULT
    );
  }
  /**
   * Get skill license PDA
   * @param licensor - License issuer's public key
   * @param licenseId - License identifier
   */
  getSkillLicenseAddress(licensor, licenseId) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("skill_license"), licensor.toBuffer(), Buffer.from(licenseId)],
      PROGRAM_IDS.VAULT
    );
  }
  /**
   * Get skill stats PDA
   * @param owner - Owner's public key
   */
  getSkillStatsAddress(owner) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("skill_stats"), owner.toBuffer()],
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
  async exportBehaviorModel(user, skillType, anonymizationLevel) {
    const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [modelPda, bump] = this.getBehaviorModelAddress(user, modelId);
    const [statsPda] = this.getSkillStatsAddress(user);
    return this.createInstruction(
      "export_behavior_model",
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: modelPda, isSigner: false, isWritable: true },
        { pubkey: statsPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
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
  async licenseSkill(user, buyer, modelId, terms) {
    const licenseId = `lic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [modelPda] = this.getBehaviorModelAddress(user, modelId);
    const [licensePda, bump] = this.getSkillLicenseAddress(user, licenseId);
    const [statsPda] = this.getSkillStatsAddress(user);
    return this.createInstruction(
      "license_skill",
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: buyer, isSigner: false, isWritable: true },
        { pubkey: modelPda, isSigner: false, isWritable: true },
        { pubkey: licensePda, isSigner: false, isWritable: true },
        { pubkey: statsPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      {
        modelId,
        licenseId,
        duration: terms.duration.toString(),
        price: terms.price.toString(),
        usageLimit: terms.usageLimit.toString(),
        allowSublicense: terms.allowSublicense,
        commercialUse: terms.commercialUse,
        bump
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
  async revokeSkillLicense(user, licenseId) {
    const [licensePda] = this.getSkillLicenseAddress(user, licenseId);
    const [statsPda] = this.getSkillStatsAddress(user);
    return this.createInstruction(
      "revoke_skill_license",
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: licensePda, isSigner: false, isWritable: true },
        { pubkey: statsPda, isSigner: false, isWritable: true }
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
  async claimSkillRevenue(user) {
    const [statsPda] = this.getSkillStatsAddress(user);
    const [vaultPda] = LoopPDA.vault(user);
    return this.createInstruction(
      "claim_skill_revenue",
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: statsPda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
  async getSkillStats(user) {
    const [statsPda] = this.getSkillStatsAddress(user);
    const accountInfo = await this.loop.connection.getAccountInfo(statsPda);
    if (!accountInfo) {
      return {
        totalModels: new BN(0),
        totalLicenses: new BN(0),
        totalRevenue: new BN(0),
        activeLicenses: 0,
        avgLicensePrice: new BN(0),
        topSkillType: 7 /* Custom */
      };
    }
    return this.deserializeSkillStats(accountInfo.data);
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  createInstruction(name, accounts, data) {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new TransactionInstruction({
      keys: accounts,
      programId: PROGRAM_IDS.VAULT,
      data: Buffer.concat([discriminator, dataBuffer])
    });
  }
  deserializeSkillStats(data) {
    return {
      totalModels: new BN(0),
      totalLicenses: new BN(0),
      totalRevenue: new BN(0),
      activeLicenses: 0,
      avgLicensePrice: new BN(0),
      topSkillType: 7 /* Custom */
    };
  }
};
var index_default = Loop;
var LiquidityStrategy = /* @__PURE__ */ ((LiquidityStrategy2) => {
  LiquidityStrategy2[LiquidityStrategy2["Conservative"] = 0] = "Conservative";
  LiquidityStrategy2[LiquidityStrategy2["Balanced"] = 1] = "Balanced";
  LiquidityStrategy2[LiquidityStrategy2["Aggressive"] = 2] = "Aggressive";
  LiquidityStrategy2[LiquidityStrategy2["Custom"] = 3] = "Custom";
  return LiquidityStrategy2;
})(LiquidityStrategy || {});
var RiskTolerance = /* @__PURE__ */ ((RiskTolerance2) => {
  RiskTolerance2[RiskTolerance2["Low"] = 0] = "Low";
  RiskTolerance2[RiskTolerance2["Medium"] = 1] = "Medium";
  RiskTolerance2[RiskTolerance2["High"] = 2] = "High";
  return RiskTolerance2;
})(RiskTolerance || {});
var PositionStatus = /* @__PURE__ */ ((PositionStatus2) => {
  PositionStatus2[PositionStatus2["Active"] = 0] = "Active";
  PositionStatus2[PositionStatus2["Rebalancing"] = 1] = "Rebalancing";
  PositionStatus2[PositionStatus2["Withdrawing"] = 2] = "Withdrawing";
  PositionStatus2[PositionStatus2["Closed"] = 3] = "Closed";
  return PositionStatus2;
})(PositionStatus || {});
var DeviceType = /* @__PURE__ */ ((DeviceType2) => {
  DeviceType2[DeviceType2["SolarPanel"] = 0] = "SolarPanel";
  DeviceType2[DeviceType2["Battery"] = 1] = "Battery";
  DeviceType2[DeviceType2["EVCharger"] = 2] = "EVCharger";
  DeviceType2[DeviceType2["SmartThermostat"] = 3] = "SmartThermostat";
  DeviceType2[DeviceType2["SmartMeter"] = 4] = "SmartMeter";
  DeviceType2[DeviceType2["HeatPump"] = 5] = "HeatPump";
  return DeviceType2;
})(DeviceType || {});
var ArbitrageAction = /* @__PURE__ */ ((ArbitrageAction2) => {
  ArbitrageAction2[ArbitrageAction2["Store"] = 0] = "Store";
  ArbitrageAction2[ArbitrageAction2["Discharge"] = 1] = "Discharge";
  ArbitrageAction2[ArbitrageAction2["ShiftLoad"] = 2] = "ShiftLoad";
  ArbitrageAction2[ArbitrageAction2["SellToGrid"] = 3] = "SellToGrid";
  return ArbitrageAction2;
})(ArbitrageAction || {});
var IntroOutcome = /* @__PURE__ */ ((IntroOutcome2) => {
  IntroOutcome2[IntroOutcome2["Connected"] = 0] = "Connected";
  IntroOutcome2[IntroOutcome2["DealClosed"] = 1] = "DealClosed";
  IntroOutcome2[IntroOutcome2["Declined"] = 2] = "Declined";
  IntroOutcome2[IntroOutcome2["Expired"] = 3] = "Expired";
  return IntroOutcome2;
})(IntroOutcome || {});
var ClaimType = /* @__PURE__ */ ((ClaimType2) => {
  ClaimType2[ClaimType2["SmartContractFailure"] = 0] = "SmartContractFailure";
  ClaimType2[ClaimType2["StablecoinDepeg"] = 1] = "StablecoinDepeg";
  ClaimType2[ClaimType2["ProtocolInsolvency"] = 2] = "ProtocolInsolvency";
  ClaimType2[ClaimType2["OracleManipulation"] = 3] = "OracleManipulation";
  ClaimType2[ClaimType2["GovernanceAttack"] = 4] = "GovernanceAttack";
  return ClaimType2;
})(ClaimType || {});
var ClaimVoteType = /* @__PURE__ */ ((ClaimVoteType2) => {
  ClaimVoteType2[ClaimVoteType2["Approve"] = 0] = "Approve";
  ClaimVoteType2[ClaimVoteType2["Reject"] = 1] = "Reject";
  ClaimVoteType2[ClaimVoteType2["Abstain"] = 2] = "Abstain";
  return ClaimVoteType2;
})(ClaimVoteType || {});
var ClaimStatus = /* @__PURE__ */ ((ClaimStatus2) => {
  ClaimStatus2[ClaimStatus2["Pending"] = 0] = "Pending";
  ClaimStatus2[ClaimStatus2["Voting"] = 1] = "Voting";
  ClaimStatus2[ClaimStatus2["Approved"] = 2] = "Approved";
  ClaimStatus2[ClaimStatus2["Rejected"] = 3] = "Rejected";
  ClaimStatus2[ClaimStatus2["PaidOut"] = 4] = "PaidOut";
  return ClaimStatus2;
})(ClaimStatus || {});
var LiquidityCapture = class {
  constructor(loop) {
    this.loop = loop;
  }
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
  async deployCapital(user, amount, strategy, riskTolerance) {
    throw new Error("LiquidityCapture.deployCapital not yet implemented");
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
  async rebalance(user, positionId, newStrategy) {
    throw new Error("LiquidityCapture.rebalance not yet implemented");
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
  async withdrawCapital(user, positionId, amount) {
    throw new Error("LiquidityCapture.withdrawCapital not yet implemented");
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
  async claimYield(user, positionIds) {
    throw new Error("LiquidityCapture.claimYield not yet implemented");
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
  async getLiquidityStats(user) {
    throw new Error("LiquidityCapture.getLiquidityStats not yet implemented");
  }
};
var EnergyCapture = class {
  constructor(loop) {
    this.loop = loop;
  }
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
  async registerDevice(user, deviceType, capabilities) {
    throw new Error("EnergyCapture.registerDevice not yet implemented");
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
  async reportEnergyUsage(user, deviceId, usage, gridPrices) {
    throw new Error("EnergyCapture.reportEnergyUsage not yet implemented");
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
  async executeArbitrage(user, deviceId, action) {
    throw new Error("EnergyCapture.executeArbitrage not yet implemented");
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
  async claimEnergyRevenue(user, periodIds) {
    throw new Error("EnergyCapture.claimEnergyRevenue not yet implemented");
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
  async getEnergyStats(user) {
    throw new Error("EnergyCapture.getEnergyStats not yet implemented");
  }
};
var SocialCapture = class {
  constructor(loop) {
    this.loop = loop;
  }
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
  async facilitateIntro(user, fromContact, toContact, terms) {
    throw new Error("SocialCapture.facilitateIntro not yet implemented");
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
  async completeIntro(user, introId, outcome) {
    throw new Error("SocialCapture.completeIntro not yet implemented");
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
  async stakeReputation(user, targetUser, amount) {
    throw new Error("SocialCapture.stakeReputation not yet implemented");
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
  async claimSocialRevenue(user) {
    throw new Error("SocialCapture.claimSocialRevenue not yet implemented");
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
  async getSocialStats(user) {
    throw new Error("SocialCapture.getSocialStats not yet implemented");
  }
};
var InsuranceCapture = class {
  constructor(loop) {
    this.loop = loop;
  }
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
  async joinPool(user, poolId, coverage, premium) {
    throw new Error("InsuranceCapture.joinPool not yet implemented");
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
  async fileClaim(user, poolId, claimType, evidence) {
    throw new Error("InsuranceCapture.fileClaim not yet implemented");
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
  async voteOnClaim(user, claimId, vote) {
    throw new Error("InsuranceCapture.voteOnClaim not yet implemented");
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
  async claimPremiumReturn(user, poolIds) {
    throw new Error("InsuranceCapture.claimPremiumReturn not yet implemented");
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
  async getInsuranceStats(user) {
    throw new Error("InsuranceCapture.getInsuranceStats not yet implemented");
  }
};
var ParaIntegration = class {
  constructor(connection) {
    this.connection = connection;
  }
  /**
   * Create a new passkey-protected wallet
   */
  async createPasskeyWallet(userId, deviceInfo) {
    throw new Error("Para integration not yet implemented - requires @para-sdk/solana");
  }
  /**
   * Get a scoped session key for agent operations
   */
  async getSessionKey(userId, permissions, expirySeconds) {
    throw new Error("Para integration not yet implemented - requires @para-sdk/solana");
  }
  /**
   * Sign a transaction using passkey biometrics
   */
  async signWithPasskey(userId, transaction) {
    throw new Error("Para integration not yet implemented - requires @para-sdk/solana");
  }
  /**
   * Revoke an active session key
   */
  async revokeSession(userId, sessionKeyId) {
    throw new Error("Para integration not yet implemented - requires @para-sdk/solana");
  }
  /**
   * List all active sessions for a user
   */
  async listActiveSessions(userId) {
    throw new Error("Para integration not yet implemented - requires @para-sdk/solana");
  }
};
var SquadsIntegration = class {
  constructor(connection) {
    this.connection = connection;
  }
  /**
   * Create a Squads smart account with multi-sig
   */
  async createSmartAccount(owner, config) {
    throw new Error("Squads integration not yet implemented - requires @sqds/sdk");
  }
  /**
   * Set spending policy for an agent
   */
  async setAgentPolicy(account, agentKey, policy) {
    throw new Error("Squads integration not yet implemented - requires @sqds/sdk");
  }
  /**
   * Propose a transaction for multi-sig approval
   */
  async proposeTransaction(account, transaction) {
    throw new Error("Squads integration not yet implemented - requires @sqds/sdk");
  }
  /**
   * Approve a pending transaction proposal
   */
  async approveTransaction(account, proposalId) {
    throw new Error("Squads integration not yet implemented - requires @sqds/sdk");
  }
  /**
   * Execute an approved transaction
   */
  async executeTransaction(account, proposalId) {
    throw new Error("Squads integration not yet implemented - requires @sqds/sdk");
  }
  /**
   * Emergency pause an agent's access
   */
  async pauseAgent(account, agentKey) {
    throw new Error("Squads integration not yet implemented - requires @sqds/sdk");
  }
};
var ReclaimIntegration = class {
  constructor(connection) {
    this.connection = connection;
  }
  /**
   * Generate a ZK proof of value capture (e.g., purchase on Amazon)
   */
  async generateCaptureProof(captureType, sessionData) {
    throw new Error("Reclaim integration not yet implemented - requires @reclaim/sdk");
  }
  /**
   * Verify a ZK proof and extract claims
   */
  async verifyProof(proof, expectedClaims) {
    throw new Error("Reclaim integration not yet implemented - requires @reclaim/sdk");
  }
  /**
   * Submit a verified capture to mint rewards
   */
  async submitVerifiedCapture(user, proof, captureType) {
    throw new Error("Reclaim integration not yet implemented - requires @reclaim/sdk");
  }
};
var TEEIntegration = class {
  constructor(connection) {
    this.connection = connection;
  }
  /**
   * Get attestation document from an enclave
   */
  async getEnclaveAttestation(enclaveId) {
    throw new Error("TEE integration not yet implemented - requires AWS Nitro SDK");
  }
  /**
   * Verify enclave is running expected code
   */
  async verifyEnclaveCode(attestation, expectedHash) {
    throw new Error("TEE integration not yet implemented - requires AWS Nitro SDK");
  }
  /**
   * Register a trusted agent with verified attestation
   */
  async registerTrustedAgent(user, attestation) {
    throw new Error("TEE integration not yet implemented - requires AWS Nitro SDK");
  }
};
export {
  AgentStatus,
  AgentType,
  AnonymizationLevel,
  ArbitrageAction,
  AttentionCaptureModule,
  AttestationType,
  AvpModule,
  CONSTANTS,
  CaptureType,
  ClaimStatus,
  ClaimType,
  ClaimVoteType,
  ComputeCaptureModule,
  CredModule,
  DataCaptureModule,
  DeviceType,
  EnergyCapture,
  EscrowStatus,
  InsuranceCapture,
  IntroOutcome,
  LiquidityCapture,
  LiquidityStrategy,
  Loop,
  LoopPDA,
  NetworkCaptureModule,
  NodeType,
  OxoModule,
  PROGRAM_IDS,
  ParaIntegration,
  PermissionLevel,
  PositionStatus,
  ReclaimIntegration,
  ReferralCaptureModule,
  RiskTolerance,
  SkillCaptureModule,
  SkillType,
  SocialCapture,
  SquadsIntegration,
  TEEIntegration,
  TaskStatus,
  VaultModule,
  VtpModule,
  index_default as default
};
