/**
 * Cred Module - Stable value token (1 Cred = $1 USDC)
 *
 * Program ID: FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA
 */
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { CredConfig, CaptureType, ReserveStatus } from '../types';
import type { Loop } from '../loop';
export declare class CredModule {
    private readonly loop;
    constructor(loop: Loop);
    getConfigAddress(): [PublicKey, number];
    getCaptureAuthAddress(moduleAddress: PublicKey): [PublicKey, number];
    getConfig(): Promise<CredConfig | null>;
    initialize(authority: PublicKey, usdcMint: PublicKey, credMint: PublicKey, reserveVault: PublicKey): Promise<TransactionInstruction>;
    wrap(user: PublicKey, amount: BN, userUsdcAccount: PublicKey, userCredAccount: PublicKey, credMint: PublicKey, reserveVault: PublicKey): Promise<TransactionInstruction>;
    unwrap(user: PublicKey, amount: BN, userCredAccount: PublicKey, userUsdcAccount: PublicKey, credMint: PublicKey, reserveVault: PublicKey): Promise<TransactionInstruction>;
    captureMint(captureSigner: PublicKey, amount: BN, captureType: CaptureType, destinationCredAccount: PublicKey, credMint: PublicKey, reserveVault: PublicKey, captureUsdcAccount: PublicKey): Promise<TransactionInstruction>;
    registerCaptureModule(authority: PublicKey, moduleAddress: PublicKey, captureType: CaptureType, moduleName: string): Promise<TransactionInstruction>;
    getReserveStatus(reserveVault: PublicKey, credMint: PublicKey): Promise<ReserveStatus>;
    private createInstruction;
    private deserializeCredConfig;
}
//# sourceMappingURL=cred.d.ts.map