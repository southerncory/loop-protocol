/**
 * Cred Types
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { CaptureType } from './vault';
/** Cred system configuration */
export interface CredConfig {
    authority: PublicKey;
    usdcMint: PublicKey;
    credMint: PublicKey;
    reserveVault: PublicKey;
    totalMinted: BN;
    totalBurned: BN;
    bump: number;
}
/** Capture module authorization */
export interface CaptureAuthority {
    moduleAddress: PublicKey;
    captureType: CaptureType;
    moduleName: string;
    totalCaptured: BN;
    isActive: boolean;
    registeredAt: BN;
    bump: number;
}
/** Reserve status response */
export interface ReserveStatus {
    usdcReserve: BN;
    credSupply: BN;
    backingRatio: BN;
    totalMinted: BN;
    totalBurned: BN;
}
//# sourceMappingURL=cred.d.ts.map