/**
 * Skill Capture Module - Monetize behavioral patterns and skills
 */
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { SkillType, AnonymizationLevel, LicenseTerms, SkillStats } from '../../types';
import type { Loop } from '../../loop';
export declare class SkillCaptureModule {
    private readonly loop;
    constructor(loop: Loop);
    getBehaviorModelAddress(owner: PublicKey, modelId: string): [PublicKey, number];
    getSkillLicenseAddress(licensor: PublicKey, licenseId: string): [PublicKey, number];
    getSkillStatsAddress(owner: PublicKey): [PublicKey, number];
    exportBehaviorModel(user: PublicKey, skillType: SkillType, anonymizationLevel: AnonymizationLevel): Promise<TransactionInstruction>;
    licenseSkill(user: PublicKey, buyer: PublicKey, modelId: string, terms: LicenseTerms): Promise<TransactionInstruction>;
    revokeSkillLicense(user: PublicKey, licenseId: string): Promise<TransactionInstruction>;
    claimSkillRevenue(user: PublicKey): Promise<TransactionInstruction>;
    getSkillStats(user: PublicKey): Promise<SkillStats>;
    private createInstruction;
    private deserializeSkillStats;
}
//# sourceMappingURL=skill.d.ts.map