/**
 * OXO Module - Protocol equity with veOXO staking and bonding curves
 *
 * Program ID: 3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z
 */
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { OxoConfig, VeOxoPosition, BondingCurve } from '../types';
import type { Loop } from '../loop';
export declare class OxoModule {
    private readonly loop;
    constructor(loop: Loop);
    getConfigAddress(): [PublicKey, number];
    getVePositionAddress(owner: PublicKey): [PublicKey, number];
    getBondingCurveAddress(agentMint: PublicKey): [PublicKey, number];
    getConfig(): Promise<OxoConfig | null>;
    getVePosition(owner: PublicKey): Promise<VeOxoPosition | null>;
    getBondingCurve(agentMint: PublicKey): Promise<BondingCurve | null>;
    initialize(authority: PublicKey, oxoMint: PublicKey, treasury: PublicKey): Promise<TransactionInstruction>;
    lockOxo(owner: PublicKey, amount: BN, lockSeconds: BN, userOxoAccount: PublicKey, protocolOxoAccount: PublicKey): Promise<TransactionInstruction>;
    extendLock(owner: PublicKey, additionalSeconds: BN): Promise<TransactionInstruction>;
    unlockOxo(owner: PublicKey, userOxoAccount: PublicKey, protocolOxoAccount: PublicKey): Promise<TransactionInstruction>;
    claimFeeShare(owner: PublicKey, feePoolAccount: PublicKey, userCredAccount: PublicKey): Promise<TransactionInstruction>;
    getCurrentVeOxo(owner: PublicKey): Promise<BN>;
    createAgentToken(creator: PublicKey, agentMint: PublicKey, name: string, symbol: string, uri: string, creatorOxoAccount: PublicKey, treasuryOxoAccount: PublicKey): Promise<TransactionInstruction>;
    buyAgentToken(buyer: PublicKey, agentMint: PublicKey, oxoAmount: BN, buyerOxoAccount: PublicKey, buyerAgentAccount: PublicKey, curveOxoAccount: PublicKey): Promise<TransactionInstruction>;
    sellAgentToken(seller: PublicKey, agentMint: PublicKey, tokenAmount: BN, sellerOxoAccount: PublicKey, sellerAgentAccount: PublicKey, curveOxoAccount: PublicKey): Promise<TransactionInstruction>;
    depositFees(authority: PublicKey, amount: BN, sourceAccount: PublicKey, feePoolAccount: PublicKey): Promise<TransactionInstruction>;
    calculateVeOxo(amount: BN, lockSeconds: BN): BN;
    calculateDecayedVeOxo(position: VeOxoPosition): BN;
    private createInstruction;
    private deserializeOxoConfig;
    private deserializeVePosition;
    private deserializeBondingCurve;
}
//# sourceMappingURL=oxo.d.ts.map