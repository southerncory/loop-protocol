/**
 * AVP Module - Agent Value Protocol (identity, capabilities, reputation)
 * 
 * Program ID: H5c9xfPYcx6EtC8hpThshARtUR7tq1NfMJVrTx8z9Jcx
 */

import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

import { PROGRAM_IDS } from '../constants';
import { LoopPDA } from '../pda';
import { AgentIdentity, CapabilityId } from '../types';
import type { Loop } from '../loop';

export class AvpModule {
  constructor(private readonly loop: Loop) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PDA Helpers
  // ─────────────────────────────────────────────────────────────────────────

  getAgentAddress(agent: PublicKey): [PublicKey, number] {
    return LoopPDA.agentIdentity(agent);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Account Fetching
  // ─────────────────────────────────────────────────────────────────────────

  async getAgent(agent: PublicKey): Promise<AgentIdentity | null> {
    const [identityPda] = this.getAgentAddress(agent);
    const accountInfo = await this.loop.connection.getAccountInfo(identityPda);
    if (!accountInfo) return null;
    return this.deserializeAgentIdentity(accountInfo.data);
  }

  async isRegistered(agent: PublicKey): Promise<boolean> {
    const identity = await this.getAgent(agent);
    return identity !== null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Instructions - Registration
  // ─────────────────────────────────────────────────────────────────────────

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

  async revokeAgent(agent: PublicKey): Promise<TransactionInstruction> {
    const [identityPda] = this.getAgentAddress(agent);

    return this.createInstruction(
      'revoke_agent',
      [{ pubkey: agent, isSigner: true, isWritable: false },
       { pubkey: identityPda, isSigner: false, isWritable: true }],
      {}
    );
  }

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

  createCapabilityId(name: string): CapabilityId {
    const bytes = new Uint8Array(8);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(name);
    bytes.set(encoded.slice(0, 8));
    return bytes;
  }

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
