"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AgentStatus: () => AgentStatus,
  AgentType: () => AgentType,
  AvpModule: () => AvpModule,
  CONSTANTS: () => CONSTANTS,
  CaptureType: () => CaptureType,
  CredModule: () => CredModule,
  EscrowStatus: () => EscrowStatus,
  Loop: () => Loop,
  LoopPDA: () => LoopPDA,
  OxoModule: () => OxoModule,
  PROGRAM_IDS: () => PROGRAM_IDS,
  PermissionLevel: () => PermissionLevel,
  VaultModule: () => VaultModule,
  VtpModule: () => VtpModule,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_web3 = require("@solana/web3.js");
var import_spl_token = require("@solana/spl-token");
var import_anchor = require("@coral-xyz/anchor");
var PROGRAM_IDS = {
  VAULT: new import_web3.PublicKey("76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7"),
  CRED: new import_web3.PublicKey("FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA"),
  OXO: new import_web3.PublicKey("3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z"),
  VTP: new import_web3.PublicKey("4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj"),
  AVP: new import_web3.PublicKey("H5c9xfPYcx6EtC8hpThshARtUR7tq1NfMJVrTx8z9Jcx")
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
var LoopPDA = class {
  // ─────────────────────────────────────────────────────────────────────────
  // Vault PDAs
  // ─────────────────────────────────────────────────────────────────────────
  /** Derive vault PDA for an owner */
  static vault(owner) {
    return import_web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }
  /** Derive stack record PDA */
  static stackRecord(vault, stackIndex) {
    return import_web3.PublicKey.findProgramAddressSync(
      [Buffer.from("stack"), vault.toBuffer(), stackIndex.toArrayLike(Buffer, "le", 8)],
      PROGRAM_IDS.VAULT
    );
  }
  /** Derive agent permission PDA */
  static agentPermission(vault, agent) {
    return import_web3.PublicKey.findProgramAddressSync(
      [Buffer.from("agent_perm"), vault.toBuffer(), agent.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }
  /** Derive vault inheritance config PDA */
  static vaultInheritance(vault) {
    return import_web3.PublicKey.findProgramAddressSync(
      [Buffer.from("inheritance"), vault.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }
  /** Derive capture authority PDA */
  static captureAuthority() {
    return import_web3.PublicKey.findProgramAddressSync(
      [Buffer.from("capture_authority")],
      PROGRAM_IDS.VAULT
    );
  }
  // ─────────────────────────────────────────────────────────────────────────
  // Cred PDAs
  // ─────────────────────────────────────────────────────────────────────────
  /** Derive cred config PDA */
  static credConfig() {
    return import_web3.PublicKey.findProgramAddressSync(
      [Buffer.from("cred_config")],
      PROGRAM_IDS.CRED
    );
  }
  /** Derive capture auth PDA for a module */
  static captureAuth(moduleAddress) {
    return import_web3.PublicKey.findProgramAddressSync(
      [Buffer.from("capture_auth"), moduleAddress.toBuffer()],
      PROGRAM_IDS.CRED
    );
  }
  // ─────────────────────────────────────────────────────────────────────────
  // OXO PDAs
  // ─────────────────────────────────────────────────────────────────────────
  /** Derive OXO config PDA */
  static oxoConfig() {
    return import_web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_IDS.OXO
    );
  }
  /** Derive veOXO position PDA */
  static veOxoPosition(owner) {
    return import_web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ve_position"), owner.toBuffer()],
      PROGRAM_IDS.OXO
    );
  }
  /** Derive bonding curve PDA for agent token */
  static bondingCurve(agentMint) {
    return import_web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), agentMint.toBuffer()],
      PROGRAM_IDS.OXO
    );
  }
  // ─────────────────────────────────────────────────────────────────────────
  // VTP PDAs
  // ─────────────────────────────────────────────────────────────────────────
  /** Derive VTP config PDA */
  static vtpConfig() {
    return import_web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vtp_config")],
      PROGRAM_IDS.VTP
    );
  }
  /** Derive escrow PDA */
  static escrow(sender, recipient, createdAt) {
    return import_web3.PublicKey.findProgramAddressSync(
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
    return import_web3.PublicKey.findProgramAddressSync(
      [Buffer.from("inheritance"), owner.toBuffer()],
      PROGRAM_IDS.VTP
    );
  }
  // ─────────────────────────────────────────────────────────────────────────
  // AVP PDAs
  // ─────────────────────────────────────────────────────────────────────────
  /** Derive agent identity PDA */
  static agentIdentity(agent) {
    return import_web3.PublicKey.findProgramAddressSync(
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
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
    const stackIndex = vault?.stackedBalance || new import_anchor.BN(0);
    const [stackPda, stackBump] = this.getStackAddress(vaultPda, stackIndex);
    return this.createInstruction(
      "stack",
      [
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: stackPda, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
    return new import_web3.TransactionInstruction({
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
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
      usdcReserve: new import_anchor.BN(0),
      credSupply: new import_anchor.BN(0),
      backingRatio: new import_anchor.BN(1e4),
      // 100%
      totalMinted: new import_anchor.BN(0),
      totalBurned: new import_anchor.BN(0)
    };
  }
  createInstruction(name, accounts, data) {
    const discriminator = Buffer.alloc(8);
    const dataBuffer = Buffer.from(JSON.stringify(data));
    return new import_web3.TransactionInstruction({
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
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
    if (!position) return new import_anchor.BN(0);
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
    const sixMonths = new import_anchor.BN(CONSTANTS.MIN_LOCK_SECONDS);
    const fourYears = new import_anchor.BN(CONSTANTS.MAX_LOCK_SECONDS);
    if (lockSeconds.lte(sixMonths)) {
      return amount.div(new import_anchor.BN(4));
    }
    if (lockSeconds.gte(fourYears)) {
      return amount.mul(new import_anchor.BN(2));
    }
    const range = fourYears.sub(sixMonths);
    const progress = lockSeconds.sub(sixMonths);
    const baseMultiplier = new import_anchor.BN(25);
    const additional = progress.mul(new import_anchor.BN(175)).div(range);
    const totalMultiplier = baseMultiplier.add(additional);
    return amount.mul(totalMultiplier).div(new import_anchor.BN(100));
  }
  /**
   * Calculate current decayed veOXO balance
   */
  calculateDecayedVeOxo(position) {
    const now = new import_anchor.BN(Math.floor(Date.now() / 1e3));
    if (now.gte(position.unlockAt)) {
      return new import_anchor.BN(0);
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
    return new import_web3.TransactionInstruction({
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
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
    const now = new import_anchor.BN(Math.floor(Date.now() / 1e3));
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_spl_token.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
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
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
    return new import_web3.TransactionInstruction({
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
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
        { pubkey: import_web3.SystemProgram.programId, isSigner: false, isWritable: false }
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
    return new import_web3.TransactionInstruction({
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
var index_default = Loop;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentStatus,
  AgentType,
  AvpModule,
  CONSTANTS,
  CaptureType,
  CredModule,
  EscrowStatus,
  Loop,
  LoopPDA,
  OxoModule,
  PROGRAM_IDS,
  PermissionLevel,
  VaultModule,
  VtpModule
});
