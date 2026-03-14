/**
 * Para Module - Passkey-based seedless authentication
 */
export class ParaModule {
    constructor(connection) {
        this.connection = connection;
    }
    async createPasskeyWallet(userId, deviceInfo) {
        throw new Error('Para integration not yet implemented - requires @para-sdk/solana');
    }
    async getSessionKey(userId, permissions, expirySeconds) {
        throw new Error('Para integration not yet implemented - requires @para-sdk/solana');
    }
    async signWithPasskey(userId, transaction) {
        throw new Error('Para integration not yet implemented - requires @para-sdk/solana');
    }
    async revokeSession(userId, sessionKeyId) {
        throw new Error('Para integration not yet implemented - requires @para-sdk/solana');
    }
    async listActiveSessions(userId) {
        throw new Error('Para integration not yet implemented - requires @para-sdk/solana');
    }
}
