/**
 * Loop Protocol SDK
 * 
 * Value capture infrastructure for AI agents.
 * Any agent can integrate Loop to capture value from user activities
 * and store it in user-owned vaults.
 * 
 * @example
 * ```typescript
 * import { Loop } from '@loop-protocol/sdk';
 * 
 * // Initialize
 * const loop = new Loop({ rpcUrl: 'https://api.mainnet-beta.solana.com' });
 * 
 * // Register user vault
 * const vault = await loop.register(userWallet);
 * 
 * // Connect shopping capture
 * await loop.capture.shopping.connect({ cardToken: '...' });
 * 
 * // Check balance
 * const balance = await loop.vault.balance(vault);
 * ```
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

// ============================================================================
// TYPES
// ============================================================================

export interface LoopConfig {
  rpcUrl: string;
  vaultProgramId?: string;
  credProgramId?: string;
  credMint?: string;
  usdcMint?: string;
}

export interface VaultBalance {
  liquid: number;      // Available Cred
  stacked: number;     // Locked Cred
  pendingYield: number;
  oxo: number;
  totalCaptured: number;
  totalWithdrawn: number;
}

export interface StackInfo {
  id: string;
  amount: number;
  startTime: Date;
  endTime: Date;
  apyBasisPoints: number;
  isActive: boolean;
  projectedYield: number;
}

export interface CaptureEvent {
  type: CaptureType;
  amount: number;
  source: string;
  timestamp: Date;
  txId: string;
}

export enum CaptureType {
  Shopping = 'shopping',
  Data = 'data',
  Presence = 'presence',
  Attention = 'attention',
}

export enum PermissionLevel {
  None = 'none',
  Read = 'read',
  Capture = 'capture',
  Guided = 'guided',
  Autonomous = 'autonomous',
}

export interface AgentPermission {
  agent: string;
  level: PermissionLevel;
  dailyLimit: number;
  dailyUsed: number;
}

export interface ShoppingCaptureConfig {
  cardToken?: string;
  plaidToken?: string;
  merchantIds?: string[];
}

export interface DataCaptureConfig {
  categories: ('shopping' | 'location' | 'browsing' | 'health')[];
  anonymizationLevel: 'full' | 'partial' | 'none';
  minPricePerRecord: number;
}

export interface PresenceCaptureConfig {
  enableLocation: boolean;
  venueTypes?: string[];
  radius?: number; // meters
}

export interface AttentionCaptureConfig {
  contentTypes: ('ads' | 'surveys' | 'content' | 'learn')[];
  dailyLimit?: number; // minutes
  minPayment?: number;
}

// ============================================================================
// MAIN SDK CLASS
// ============================================================================

export class Loop {
  private connection: Connection;
  private config: Required<LoopConfig>;
  
  public vault: VaultModule;
  public capture: CaptureModules;
  public transfer: TransferModule;
  
  constructor(config: LoopConfig) {
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    this.config = {
      rpcUrl: config.rpcUrl,
      vaultProgramId: config.vaultProgramId || 'LoopVau1tXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      credProgramId: config.credProgramId || 'LoopCredXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      credMint: config.credMint || 'CredXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      usdcMint: config.usdcMint || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
    };
    
    this.vault = new VaultModule(this.connection, this.config);
    this.capture = new CaptureModules(this.connection, this.config);
    this.transfer = new TransferModule(this.connection, this.config);
  }

  /**
   * Register a new user vault
   * Creates an on-chain vault for storing captured value
   */
  async register(owner: PublicKey): Promise<string> {
    const vaultAddress = await this.vault.getVaultAddress(owner);
    
    // Check if vault already exists
    const exists = await this.vault.exists(owner);
    if (exists) {
      return vaultAddress.toBase58();
    }
    
    // Create vault (would need actual transaction signing)
    // This is a placeholder - real implementation requires wallet signing
    console.log(`Creating vault for ${owner.toBase58()}`);
    
    return vaultAddress.toBase58();
  }

  /**
   * Get protocol statistics
   */
  async getStats(): Promise<{
    totalVaults: number;
    totalValueCaptured: number;
    totalStacked: number;
    activeCaptures: number;
  }> {
    // Would query on-chain data
    return {
      totalVaults: 0,
      totalValueCaptured: 0,
      totalStacked: 0,
      activeCaptures: 0,
    };
  }
}

// ============================================================================
// VAULT MODULE
// ============================================================================

class VaultModule {
  constructor(
    private connection: Connection,
    private config: Required<LoopConfig>
  ) {}

  /**
   * Get vault PDA address for an owner
   */
  async getVaultAddress(owner: PublicKey): Promise<PublicKey> {
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), owner.toBuffer()],
      new PublicKey(this.config.vaultProgramId)
    );
    return vaultPda;
  }

  /**
   * Check if vault exists
   */
  async exists(owner: PublicKey): Promise<boolean> {
    const vaultAddress = await this.getVaultAddress(owner);
    const accountInfo = await this.connection.getAccountInfo(vaultAddress);
    return accountInfo !== null;
  }

  /**
   * Get vault balance
   */
  async balance(owner: PublicKey): Promise<VaultBalance> {
    const vaultAddress = await this.getVaultAddress(owner);
    const accountInfo = await this.connection.getAccountInfo(vaultAddress);
    
    if (!accountInfo) {
      return {
        liquid: 0,
        stacked: 0,
        pendingYield: 0,
        oxo: 0,
        totalCaptured: 0,
        totalWithdrawn: 0,
      };
    }
    
    // Parse account data (would need proper deserialization)
    // Placeholder implementation
    return {
      liquid: 0,
      stacked: 0,
      pendingYield: 0,
      oxo: 0,
      totalCaptured: 0,
      totalWithdrawn: 0,
    };
  }

  /**
   * Stack Cred for yield
   */
  async stack(
    owner: PublicKey,
    amount: number,
    durationDays: number
  ): Promise<{ stackId: string; apy: number; endDate: Date }> {
    // Calculate APY based on duration
    const apy = this.calculateApy(durationDays);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);
    
    // Would create stack transaction
    console.log(`Stacking ${amount} Cred for ${durationDays} days at ${apy / 100}% APY`);
    
    return {
      stackId: 'stack_' + Date.now(),
      apy,
      endDate,
    };
  }

  /**
   * Unstack (withdraw locked Cred)
   */
  async unstack(owner: PublicKey, stackId: string): Promise<{
    principal: number;
    yieldEarned: number;
    penalty: number;
    isEarly: boolean;
  }> {
    // Would execute unstack transaction
    console.log(`Unstacking ${stackId}`);
    
    return {
      principal: 0,
      yieldEarned: 0,
      penalty: 0,
      isEarly: false,
    };
  }

  /**
   * Get all stacks for a vault
   */
  async getStacks(owner: PublicKey): Promise<StackInfo[]> {
    // Would query on-chain stack records
    return [];
  }

  /**
   * Withdraw Cred to external address
   */
  async withdraw(
    owner: PublicKey,
    amount: number,
    destination: PublicKey
  ): Promise<string> {
    // Would execute withdraw transaction
    console.log(`Withdrawing ${amount} Cred to ${destination.toBase58()}`);
    return 'tx_' + Date.now();
  }

  /**
   * Set agent permissions
   */
  async setAgentPermission(
    owner: PublicKey,
    agent: PublicKey,
    level: PermissionLevel,
    dailyLimit: number
  ): Promise<void> {
    console.log(`Setting ${level} permission for agent ${agent.toBase58()}`);
  }

  /**
   * Get agent permissions
   */
  async getAgentPermission(
    owner: PublicKey,
    agent: PublicKey
  ): Promise<AgentPermission | null> {
    // Would query on-chain permission
    return null;
  }

  private calculateApy(durationDays: number): number {
    if (durationDays >= 365) return 2000; // 20%
    if (durationDays >= 180) return 1800; // 18%
    if (durationDays >= 90) return 1500;  // 15%
    if (durationDays >= 30) return 1000;  // 10%
    if (durationDays >= 14) return 700;   // 7%
    if (durationDays >= 7) return 500;    // 5%
    return 200; // 2%
  }
}

// ============================================================================
// CAPTURE MODULES
// ============================================================================

class CaptureModules {
  public shopping: ShoppingCapture;
  public data: DataCapture;
  public presence: PresenceCapture;
  public attention: AttentionCapture;
  
  constructor(
    private connection: Connection,
    private config: Required<LoopConfig>
  ) {
    this.shopping = new ShoppingCapture(connection, config);
    this.data = new DataCapture(connection, config);
    this.presence = new PresenceCapture(connection, config);
    this.attention = new AttentionCapture(connection, config);
  }

  /**
   * Get capture history
   */
  async history(
    owner: PublicKey,
    options?: {
      type?: CaptureType;
      from?: Date;
      to?: Date;
      limit?: number;
    }
  ): Promise<CaptureEvent[]> {
    // Would query on-chain capture events
    return [];
  }

  /**
   * Get capture statistics
   */
  async stats(owner: PublicKey): Promise<{
    totalCaptured: number;
    byType: Record<CaptureType, number>;
    thisMonth: number;
    lastMonth: number;
  }> {
    return {
      totalCaptured: 0,
      byType: {
        [CaptureType.Shopping]: 0,
        [CaptureType.Data]: 0,
        [CaptureType.Presence]: 0,
        [CaptureType.Attention]: 0,
      },
      thisMonth: 0,
      lastMonth: 0,
    };
  }
}

// ============================================================================
// SHOPPING CAPTURE
// ============================================================================

class ShoppingCapture {
  constructor(
    private connection: Connection,
    private config: Required<LoopConfig>
  ) {}

  /**
   * Connect shopping capture (card linking)
   */
  async connect(options: ShoppingCaptureConfig): Promise<void> {
    if (options.cardToken) {
      console.log('Connecting card via CLO provider...');
      // Would call Kard/Figg API to link card
    }
    if (options.plaidToken) {
      console.log('Connecting bank via Plaid...');
      // Would call Plaid API to link account
    }
  }

  /**
   * Disconnect shopping capture
   */
  async disconnect(): Promise<void> {
    console.log('Disconnecting shopping capture...');
  }

  /**
   * Get connected payment methods
   */
  async getConnectedMethods(): Promise<{
    cards: { last4: string; brand: string }[];
    banks: { name: string; mask: string }[];
  }> {
    return { cards: [], banks: [] };
  }

  /**
   * Manually trigger capture for a transaction
   */
  async captureTransaction(
    owner: PublicKey,
    transaction: {
      merchantId: string;
      amount: number;
      timestamp: Date;
    }
  ): Promise<{ capturedAmount: number; txId: string }> {
    console.log(`Capturing shopping value: ${transaction.amount} from ${transaction.merchantId}`);
    return { capturedAmount: 0, txId: 'tx_' + Date.now() };
  }
}

// ============================================================================
// DATA CAPTURE
// ============================================================================

class DataCapture {
  constructor(
    private connection: Connection,
    private config: Required<LoopConfig>
  ) {}

  /**
   * Connect data capture with permissions
   */
  async connect(options: DataCaptureConfig): Promise<void> {
    console.log(`Connecting data capture for categories: ${options.categories.join(', ')}`);
  }

  /**
   * Disconnect data capture
   */
  async disconnect(): Promise<void> {
    console.log('Disconnecting data capture...');
  }

  /**
   * Get data sharing settings
   */
  async getSettings(): Promise<DataCaptureConfig | null> {
    return null;
  }

  /**
   * Get pending data offers
   */
  async getPendingOffers(): Promise<{
    id: string;
    buyer: string;
    dataType: string;
    pricePerRecord: number;
    estimatedEarnings: number;
  }[]> {
    return [];
  }

  /**
   * Accept a data offer
   */
  async acceptOffer(offerId: string): Promise<{ txId: string; earnings: number }> {
    console.log(`Accepting data offer: ${offerId}`);
    return { txId: 'tx_' + Date.now(), earnings: 0 };
  }
}

// ============================================================================
// PRESENCE CAPTURE
// ============================================================================

class PresenceCapture {
  constructor(
    private connection: Connection,
    private config: Required<LoopConfig>
  ) {}

  /**
   * Connect presence capture (enable location)
   */
  async connect(options: PresenceCaptureConfig): Promise<void> {
    console.log('Connecting presence capture...');
  }

  /**
   * Disconnect presence capture
   */
  async disconnect(): Promise<void> {
    console.log('Disconnecting presence capture...');
  }

  /**
   * Check in at a venue
   */
  async checkIn(
    owner: PublicKey,
    venue: { id: string; lat: number; lng: number }
  ): Promise<{ captured: boolean; amount: number; txId?: string }> {
    console.log(`Checking in at venue ${venue.id}`);
    return { captured: false, amount: 0 };
  }

  /**
   * Get nearby venues with rewards
   */
  async getNearbyVenues(
    lat: number,
    lng: number,
    radiusMeters: number
  ): Promise<{
    id: string;
    name: string;
    distance: number;
    rewardAmount: number;
  }[]> {
    return [];
  }
}

// ============================================================================
// ATTENTION CAPTURE
// ============================================================================

class AttentionCapture {
  constructor(
    private connection: Connection,
    private config: Required<LoopConfig>
  ) {}

  /**
   * Connect attention capture
   */
  async connect(options: AttentionCaptureConfig): Promise<void> {
    console.log(`Connecting attention capture for: ${options.contentTypes.join(', ')}`);
  }

  /**
   * Disconnect attention capture
   */
  async disconnect(): Promise<void> {
    console.log('Disconnecting attention capture...');
  }

  /**
   * Get available attention opportunities
   */
  async getOpportunities(): Promise<{
    id: string;
    type: string;
    duration: number; // seconds
    payment: number;
    description: string;
  }[]> {
    return [];
  }

  /**
   * Start an attention session
   */
  async startSession(opportunityId: string): Promise<{ sessionId: string }> {
    console.log(`Starting attention session: ${opportunityId}`);
    return { sessionId: 'session_' + Date.now() };
  }

  /**
   * Complete an attention session
   */
  async completeSession(sessionId: string): Promise<{
    captured: boolean;
    amount: number;
    txId?: string;
  }> {
    console.log(`Completing attention session: ${sessionId}`);
    return { captured: false, amount: 0 };
  }
}

// ============================================================================
// TRANSFER MODULE (VTP)
// ============================================================================

class TransferModule {
  constructor(
    private connection: Connection,
    private config: Required<LoopConfig>
  ) {}

  /**
   * Transfer Cred to another vault
   */
  async send(
    from: PublicKey,
    to: PublicKey,
    amount: number
  ): Promise<string> {
    console.log(`Transferring ${amount} Cred from ${from.toBase58()} to ${to.toBase58()}`);
    return 'tx_' + Date.now();
  }

  /**
   * Get transfer history
   */
  async history(
    owner: PublicKey,
    options?: {
      direction?: 'sent' | 'received' | 'all';
      from?: Date;
      to?: Date;
      limit?: number;
    }
  ): Promise<{
    id: string;
    direction: 'sent' | 'received';
    counterparty: string;
    amount: number;
    timestamp: Date;
  }[]> {
    return [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  VaultModule,
  CaptureModules,
  ShoppingCapture,
  DataCapture,
  PresenceCapture,
  AttentionCapture,
  TransferModule,
};

export default Loop;
