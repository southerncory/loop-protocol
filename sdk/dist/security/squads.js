/**
 * Squads Module - Programmable custody and policies
 */
export class SquadsModule {
    constructor(connection) {
        this.connection = connection;
    }
    async createSmartAccount(owner, config) {
        throw new Error('Squads integration not yet implemented - requires @sqds/sdk');
    }
    async setAgentPolicy(account, agentKey, policy) {
        throw new Error('Squads integration not yet implemented - requires @sqds/sdk');
    }
    async proposeTransaction(account, transaction) {
        throw new Error('Squads integration not yet implemented - requires @sqds/sdk');
    }
    async approveTransaction(account, proposalId) {
        throw new Error('Squads integration not yet implemented - requires @sqds/sdk');
    }
    async executeTransaction(account, proposalId) {
        throw new Error('Squads integration not yet implemented - requires @sqds/sdk');
    }
    async pauseAgent(account, agentKey) {
        throw new Error('Squads integration not yet implemented - requires @sqds/sdk');
    }
}
