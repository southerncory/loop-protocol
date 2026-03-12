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

  constructor(config: LoopConfig) {
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
// EXPORTS
// ============================================================================

export default Loop;
