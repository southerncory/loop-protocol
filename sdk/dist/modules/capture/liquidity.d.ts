/**
 * Liquidity Capture Module - Deploy and manage capital in yield strategies
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { LiquidityStrategy, RiskTolerance, DeploymentPosition, RebalanceResult, WithdrawalResult, LiquidityStats } from '../../types';
import type { Loop } from '../../loop';
export declare class LiquidityCapture {
    private readonly loop;
    constructor(loop: Loop);
    deployCapital(user: PublicKey, amount: BN, strategy: LiquidityStrategy, riskTolerance: RiskTolerance): Promise<DeploymentPosition>;
    rebalance(user: PublicKey, positionId: string, newStrategy: LiquidityStrategy): Promise<RebalanceResult>;
    withdrawCapital(user: PublicKey, positionId: string, amount: BN | null): Promise<WithdrawalResult>;
    claimYield(user: PublicKey, positionIds: string[]): Promise<string>;
    getLiquidityStats(user: PublicKey): Promise<LiquidityStats>;
}
//# sourceMappingURL=liquidity.d.ts.map