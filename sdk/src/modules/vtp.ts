/**
 * VTP Module - Value Transfer Protocol (transfers, escrow, inheritance)
 * 
 * Program ID: 4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj
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
import { ReleaseCondition, Heir } from '../types';
import type { Loop } from '../loop';

export class VtpModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────

  getConfigAddress(): [PublicKey, number] {
    return LoopPDA.vtpConfig();
  }

  getEscrowAddress(sender: PublicKey, recipient: PublicKey, createdAt: BN): [PublicKey, number] {
    return LoopPDA.escrow(sender, recipient, createdAt);
  }

  getInheritanceAddress(owner: PublicKey): [PublicKey, number] {
    return LoopPDA.vtpInheritance(owner);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions - Initialization
  // ─────────────────────────────────────────────────────────────────────────

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

  async inheritanceHeartbeat(owner: PublicKey): Promise<TransactionInstruction> {
    const [inheritancePda] = this.getInheritanceAddress(owner);

    return this.createInstruction(
      'inheritance_heartbeat',
      [{ pubkey: owner, isSigner: true, isWritable: false },
       { pubkey: inheritancePda, isSigner: false, isWritable: true }],
      {}
    );
  }

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

  arbiterCondition(arbiter: PublicKey): ReleaseCondition {
    return { arbiterApproval: { arbiter } };
  }

  timeCondition(timestamp: BN): ReleaseCondition {
    return { timeRelease: { timestamp } };
  }

  oracleCondition(oracle: PublicKey, dataHash: Uint8Array): ReleaseCondition {
    return { oracleAttestation: { oracle, dataHash } };
  }

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
