/**
 * OXO Types
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
/** OXO protocol configuration */
export interface OxoConfig {
    authority: PublicKey;
    oxoMint: PublicKey;
    treasury: PublicKey;
    totalVeOxo: BN;
    totalLocked: BN;
    feePool: BN;
    lastFeeDistribution: BN;
    initializedAt: BN;
    agentCount: BN;
    bump: number;
}
/** veOXO staking position */
export interface VeOxoPosition {
    owner: PublicKey;
    oxoLocked: BN;
    veOxoBalance: BN;
    lockStart: BN;
    unlockAt: BN;
    lastClaim: BN;
    bump: number;
}
/** Agent token bonding curve */
export interface BondingCurve {
    creator: PublicKey;
    agentMint: PublicKey;
    oxoReserve: BN;
    tokenSupply: BN;
    graduated: boolean;
    createdAt: BN;
    bump: number;
}
//# sourceMappingURL=oxo.d.ts.map