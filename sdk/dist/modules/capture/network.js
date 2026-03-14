/**
 * Network Capture Module - Monetize network participation
 */
import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { PROGRAM_IDS } from '../../constants';
import { LoopPDA } from '../../pda';
export class NetworkCaptureModule {
    constructor(loop) {
        this.loop = loop;
    }
    getNodeRegistrationAddress(operator) {
        return PublicKey.findProgramAddressSync([Buffer.from('network_node'), operator.toBuffer()], PROGRAM_IDS.VAULT);
    }
    getVoteAddress(voter, proposalId) {
        return PublicKey.findProgramAddressSync([Buffer.from('vote'), voter.toBuffer(), Buffer.from(proposalId)], PROGRAM_IDS.VAULT);
    }
    getAttestationAddress(attester, dataHash) {
        return PublicKey.findProgramAddressSync([Buffer.from('attestation'), attester.toBuffer(), dataHash.slice(0, 32)], PROGRAM_IDS.VAULT);
    }
    async registerNode(user, nodeType, capabilities) {
        const [nodePda, bump] = this.getNodeRegistrationAddress(user);
        return this.createInstruction('register_network_node', [
            { pubkey: user, isSigner: true, isWritable: true },
            { pubkey: nodePda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ], { nodeType, capabilities, bump });
    }
    async submitVote(user, proposalId, vote, proof) {
        const [nodePda] = this.getNodeRegistrationAddress(user);
        const [votePda, bump] = this.getVoteAddress(user, proposalId);
        const [vePositionPda] = LoopPDA.veOxoPosition(user);
        return this.createInstruction('submit_network_vote', [
            { pubkey: user, isSigner: true, isWritable: true },
            { pubkey: nodePda, isSigner: false, isWritable: true },
            { pubkey: votePda, isSigner: false, isWritable: true },
            { pubkey: vePositionPda, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ], { proposalId, vote, proof: Array.from(proof), bump });
    }
    async submitAttestation(user, dataHash, attestationType) {
        const [nodePda] = this.getNodeRegistrationAddress(user);
        const [attestationPda, bump] = this.getAttestationAddress(user, dataHash);
        return this.createInstruction('submit_attestation', [
            { pubkey: user, isSigner: true, isWritable: true },
            { pubkey: nodePda, isSigner: false, isWritable: true },
            { pubkey: attestationPda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ], { dataHash: Array.from(dataHash), attestationType, bump });
    }
    async claimParticipationReward(user, activityIds) {
        const [nodePda] = this.getNodeRegistrationAddress(user);
        const [vaultPda] = LoopPDA.vault(user);
        return this.createInstruction('claim_participation_reward', [
            { pubkey: user, isSigner: true, isWritable: true },
            { pubkey: nodePda, isSigner: false, isWritable: true },
            { pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ], { activityIds });
    }
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
                slashCount: 0,
            };
        }
        return this.deserializeNetworkStats(accountInfo.data);
    }
    createInstruction(name, accounts, data) {
        const discriminator = Buffer.alloc(8);
        const dataBuffer = Buffer.from(JSON.stringify(data));
        return new TransactionInstruction({
            keys: accounts,
            programId: PROGRAM_IDS.VAULT,
            data: Buffer.concat([discriminator, dataBuffer]),
        });
    }
    deserializeNetworkStats(data) {
        return {
            totalVotes: new BN(0),
            totalAttestations: new BN(0),
            participationRewards: new BN(0),
            uptimePercentage: 0,
            currentStreak: 0,
            slashCount: 0,
        };
    }
}
