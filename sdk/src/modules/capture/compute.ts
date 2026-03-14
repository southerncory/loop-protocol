/**
 * Compute Capture Module - Monetize computational resources
 */

import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { PROGRAM_IDS } from '../../constants';
import { LoopPDA } from '../../pda';
import { ResourceSpec, ComputeStats } from '../../types';
import type { Loop } from '../../loop';

export class ComputeCaptureModule {
  constructor(private readonly loop: Loop) {}

  getResourceProfileAddress(provider: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('compute_profile'), provider.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }

  getTaskAcceptanceAddress(provider: PublicKey, taskId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('task_accept'), provider.toBuffer(), Buffer.from(taskId)],
      PROGRAM_IDS.VAULT
    );
  }

  getTaskSubmissionAddress(provider: PublicKey, taskId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('task_submit'), provider.toBuffer(), Buffer.from(taskId)],
      PROGRAM_IDS.VAULT
    );
  }

  async registerResources(
    user: PublicKey,
    resources: ResourceSpec
  ): Promise<TransactionInstruction> {
    const [profilePda, bump] = this.getResourceProfileAddress(user);

    return this.createInstruction(
      'register_compute_resources',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: profilePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      {
        cpuCores: resources.cpu,
        gpuUnits: resources.gpu,
        storageGb: resources.storage,
        bandwidthMbps: resources.bandwidth,
        bump,
      }
    );
  }

  async acceptTask(
    user: PublicKey,
    taskId: string,
    bid: BN
  ): Promise<TransactionInstruction> {
    const [profilePda] = this.getResourceProfileAddress(user);
    const [acceptancePda, bump] = this.getTaskAcceptanceAddress(user, taskId);

    return this.createInstruction(
      'accept_compute_task',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: profilePda, isSigner: false, isWritable: true },
        { pubkey: acceptancePda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      { taskId, bidAmount: bid.toString(), bump }
    );
  }

  async submitTaskResult(
    user: PublicKey,
    taskId: string,
    resultHash: Uint8Array,
    proof: Uint8Array
  ): Promise<TransactionInstruction> {
    const [acceptancePda] = this.getTaskAcceptanceAddress(user, taskId);
    const [submissionPda, bump] = this.getTaskSubmissionAddress(user, taskId);

    return this.createInstruction(
      'submit_task_result',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: acceptancePda, isSigner: false, isWritable: true },
        { pubkey: submissionPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      {
        taskId,
        resultHash: Array.from(resultHash),
        proof: Array.from(proof),
        bump,
      }
    );
  }

  async claimComputeReward(
    user: PublicKey,
    taskIds: string[]
  ): Promise<TransactionInstruction> {
    const [profilePda] = this.getResourceProfileAddress(user);
    const [vaultPda] = LoopPDA.vault(user);

    return this.createInstruction(
      'claim_compute_reward',
      [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: profilePda, isSigner: false, isWritable: true },
        { pubkey: vaultPda, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      { taskIds }
    );
  }

  async getComputeStats(user: PublicKey): Promise<ComputeStats> {
    const [profilePda] = this.getResourceProfileAddress(user);
    const accountInfo = await this.loop.connection.getAccountInfo(profilePda);
    
    if (!accountInfo) {
      return {
        totalTasks: new BN(0),
        totalRewards: new BN(0),
        successRate: 0,
        avgCompletionTime: new BN(0),
        reputationScore: 0,
        activeTasks: 0,
      };
    }

    return this.deserializeComputeStats(accountInfo.data);
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
      programId: PROGRAM_IDS.VAULT,
      data: Buffer.concat([discriminator, dataBuffer]),
    });
  }

  private deserializeComputeStats(data: Buffer): ComputeStats {
    return {
      totalTasks: new BN(0),
      totalRewards: new BN(0),
      successRate: 0,
      avgCompletionTime: new BN(0),
      reputationScore: 0,
      activeTasks: 0,
    };
  }
}
