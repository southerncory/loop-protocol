/**
 * Data Capture Module - User-controlled data licensing and monetization
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { DataType, DataPricingConfig, DataLicenseTerms, DataLicense, DataStats } from '../../types';
import type { Loop } from '../../loop';
export declare class DataCaptureModule {
    private readonly loop;
    constructor(loop: Loop);
    setDataPricing(user: PublicKey, dataTypes: DataType[], prices: Map<DataType, BN>): Promise<DataPricingConfig>;
    licenseData(user: PublicKey, buyer: PublicKey, dataType: DataType, terms: DataLicenseTerms): Promise<DataLicense>;
    revokeDataLicense(user: PublicKey, licenseId: string): Promise<string>;
    claimDataRevenue(user: PublicKey): Promise<string>;
    getDataStats(user: PublicKey): Promise<DataStats>;
}
//# sourceMappingURL=data.d.ts.map