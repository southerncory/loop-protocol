/**
 * Para Module - Passkey-based seedless authentication
 */
import { Connection, Transaction } from '@solana/web3.js';
import { DeviceInfo, PasskeyWallet, SessionKeyPermissions, SessionKey, SessionInfo, SignedTransaction } from '../types';
export declare class ParaModule {
    private connection;
    constructor(connection: Connection);
    createPasskeyWallet(userId: string, deviceInfo: DeviceInfo): Promise<PasskeyWallet>;
    getSessionKey(userId: string, permissions: SessionKeyPermissions, expirySeconds: number): Promise<SessionKey>;
    signWithPasskey(userId: string, transaction: Transaction): Promise<SignedTransaction>;
    revokeSession(userId: string, sessionKeyId: string): Promise<string>;
    listActiveSessions(userId: string): Promise<SessionInfo[]>;
}
//# sourceMappingURL=para.d.ts.map