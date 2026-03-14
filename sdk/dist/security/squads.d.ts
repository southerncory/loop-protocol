/**
 * Squads Module - Programmable custody and policies
 */
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { SmartAccountConfig, SmartAccount, AgentPolicy, PolicyConfig, Proposal, ApprovalResult } from '../types';
export declare class SquadsModule {
    private connection;
    constructor(connection: Connection);
    createSmartAccount(owner: PublicKey, config: SmartAccountConfig): Promise<SmartAccount>;
    setAgentPolicy(account: PublicKey, agentKey: PublicKey, policy: AgentPolicy): Promise<PolicyConfig>;
    proposeTransaction(account: PublicKey, transaction: Transaction): Promise<Proposal>;
    approveTransaction(account: PublicKey, proposalId: string): Promise<ApprovalResult>;
    executeTransaction(account: PublicKey, proposalId: string): Promise<string>;
    pauseAgent(account: PublicKey, agentKey: PublicKey): Promise<string>;
}
//# sourceMappingURL=squads.d.ts.map