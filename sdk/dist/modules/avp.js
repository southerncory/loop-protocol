/**
 * AVP Module - Agent Value Protocol (identity, capabilities, reputation)
 *
 * Program ID: H5c9xfPYcx6EtC8hpThshARtUR7tq1NfMJVrTx8z9Jcx
 */
import { TransactionInstruction, SystemProgram, } from '@solana/web3.js';
import { PROGRAM_IDS } from '../constants';
import { LoopPDA } from '../pda';
export class AvpModule {
    constructor(loop) {
        this.loop = loop;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PDA Helpers
    // ─────────────────────────────────────────────────────────────────────────
    getAgentAddress(agent) {
        return LoopPDA.agentIdentity(agent);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Account Fetching
    // ─────────────────────────────────────────────────────────────────────────
    async getAgent(agent) {
        const [identityPda] = this.getAgentAddress(agent);
        const accountInfo = await this.loop.connection.getAccountInfo(identityPda);
        if (!accountInfo)
            return null;
        return this.deserializeAgentIdentity(accountInfo.data);
    }
    async isRegistered(agent) {
        const identity = await this.getAgent(agent);
        return identity !== null;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Instructions - Registration
    // ─────────────────────────────────────────────────────────────────────────
    async registerPersonalAgent(agent, principalHash, metadataUri) {
        const [identityPda, bump] = this.getAgentAddress(agent);
        return this.createInstruction('register_personal_agent', [{ pubkey: agent, isSigner: true, isWritable: true },
            { pubkey: identityPda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { principalHash: Array.from(principalHash), metadataUri, bump });
    }
    async registerServiceAgent(creator, agent, metadataUri, creatorOxoAccount) {
        const [identityPda, bump] = this.getAgentAddress(agent);
        return this.createInstruction('register_service_agent', [{ pubkey: creator, isSigner: true, isWritable: true },
            { pubkey: agent, isSigner: false, isWritable: false },
            { pubkey: identityPda, isSigner: false, isWritable: true },
            { pubkey: creatorOxoAccount, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }], { metadataUri, bump });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Instructions - Binding & Status
    // ─────────────────────────────────────────────────────────────────────────
    async bindAgent(agent, newPrincipalHash) {
        const [identityPda] = this.getAgentAddress(agent);
        return this.createInstruction('bind_agent', [{ pubkey: agent, isSigner: true, isWritable: false },
            { pubkey: identityPda, isSigner: false, isWritable: true }], { newPrincipalHash: Array.from(newPrincipalHash) });
    }
    async revokeAgent(agent) {
        const [identityPda] = this.getAgentAddress(agent);
        return this.createInstruction('revoke_agent', [{ pubkey: agent, isSigner: true, isWritable: false },
            { pubkey: identityPda, isSigner: false, isWritable: true }], {});
    }
    async suspendAgent(authority, agentIdentity, reason) {
        return this.createInstruction('suspend_agent', [{ pubkey: authority, isSigner: true, isWritable: false },
            { pubkey: agentIdentity, isSigner: false, isWritable: true }], { reason });
    }
    async reactivateAgent(authority, agentIdentity) {
        return this.createInstruction('reactivate_agent', [{ pubkey: authority, isSigner: true, isWritable: false },
            { pubkey: agentIdentity, isSigner: false, isWritable: true }], {});
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Instructions - Capabilities & Stake
    // ─────────────────────────────────────────────────────────────────────────
    async declareCapabilities(agent, capabilities) {
        const [identityPda] = this.getAgentAddress(agent);
        return this.createInstruction('declare_capabilities', [{ pubkey: agent, isSigner: true, isWritable: false },
            { pubkey: identityPda, isSigner: false, isWritable: true }], { capabilities: capabilities.map(c => Array.from(c)) });
    }
    async addStake(creator, agentIdentity, amount) {
        return this.createInstruction('add_stake', [{ pubkey: creator, isSigner: true, isWritable: false },
            { pubkey: agentIdentity, isSigner: false, isWritable: true }], { amount });
    }
    async updateReputation(authority, agentIdentity, delta) {
        return this.createInstruction('update_reputation', [{ pubkey: authority, isSigner: true, isWritable: false },
            { pubkey: agentIdentity, isSigner: false, isWritable: true }], { delta });
    }
    async updateMetadata(agent, newUri) {
        const [identityPda] = this.getAgentAddress(agent);
        return this.createInstruction('update_metadata', [{ pubkey: agent, isSigner: true, isWritable: false },
            { pubkey: identityPda, isSigner: false, isWritable: true }], { newUri });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
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
            data: Buffer.concat([discriminator, dataBuffer]),
        });
    }
    deserializeAgentIdentity(data) {
        return {};
    }
}
AvpModule.CAPABILITIES = {
    CAPTURE_SHOPPING: new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    CAPTURE_DATA: new Uint8Array([0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    CAPTURE_PRESENCE: new Uint8Array([0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    CAPTURE_ATTENTION: new Uint8Array([0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    TRANSFER: new Uint8Array([0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    ESCROW: new Uint8Array([0x11, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    STACK: new Uint8Array([0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
};
