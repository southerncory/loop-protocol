/**
 * Energy Capture Module - Monetize distributed energy resources
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { DeviceType, DeviceCapabilities, ArbitrageAction, DeviceRegistration, UsageReport, ArbitrageExecution, EnergyStats } from '../../types';
import type { Loop } from '../../loop';
export declare class EnergyCapture {
    private readonly loop;
    constructor(loop: Loop);
    registerDevice(user: PublicKey, deviceType: DeviceType, capabilities: DeviceCapabilities): Promise<DeviceRegistration>;
    reportEnergyUsage(user: PublicKey, deviceId: string, usage: {
        generated: BN;
        consumed: BN;
    }, gridPrices: {
        buyPrice: BN;
        sellPrice: BN;
    }): Promise<UsageReport>;
    executeArbitrage(user: PublicKey, deviceId: string, action: ArbitrageAction): Promise<ArbitrageExecution>;
    claimEnergyRevenue(user: PublicKey, periodIds: string[]): Promise<string>;
    getEnergyStats(user: PublicKey): Promise<EnergyStats>;
}
//# sourceMappingURL=energy.d.ts.map