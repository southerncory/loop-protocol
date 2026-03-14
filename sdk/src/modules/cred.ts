/**
 * Cred Module - Stable value token (1 Cred = $1 USDC)
 * 
 * Program ID: FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA
 */

import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';

import { PROGRAM_IDS } from '../constants';
import { LoopPDA } from '../pda';
import { CredConfig, CaptureType, ReserveStatus } from '../types';
import type { Loop } from '../loop';

export class CredModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────

  getConfigAddress(): [PublicKey, number] {
    return LoopPDA.credConfig();
  }

  getCaptureAuthAddress(moduleAddress: PublicKey): [PublicKey, number] {
    return LoopPDA.captureAuth(moduleAddress);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Fetching
  // ─────────────────────────────────────────────────────────────────────────

  async getConfig(): Promise<CredConfig | null> {
    const [configPda] = this.getConfigAddress();
    const accountInfo = await this.loop.connection.getAccountInfo(configPda);
    if (!accountInfo) return null;
    return this.deserializeCredConfig(accountInfo.data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions
  // ─────────────────────────────────────────────────────────────────────────

  async initialize(
    authority: PublicKey,
    usdcMint: PublicKey,
    credMint: PublicKey,
    reserveVault: PublicKey
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();

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

  async registerCaptureModule(
    authority: PublicKey,
    moduleAddress: PublicKey,
    captureType: CaptureType,
    moduleName: string
  ): Promise<TransactionInstruction> {
    const [configPda] = this.getConfigAddress();
    const [captureAuthPda] = this.getCaptureAuthAddress(moduleAddress);

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

  async getReserveStatus(
    reserveVault: PublicKey,
    credMint: PublicKey
  ): Promise<ReserveStatus> {
    return {
      usdcReserve: new BN(0),
      credSupply: new BN(0),
      backingRatio: new BN(10000),
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
