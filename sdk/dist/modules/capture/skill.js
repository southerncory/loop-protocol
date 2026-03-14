/**
 * Skill Capture Module - Monetize behavioral patterns and skills
 */
import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { PROGRAM_IDS } from '../../constants';
import { LoopPDA } from '../../pda';
import { SkillType } from '../../types';
export class SkillCaptureModule {
    constructor(loop) {
        this.loop = loop;
    }
    getBehaviorModelAddress(owner, modelId) {
        return PublicKey.findProgramAddressSync([Buffer.from('behavior_model'), owner.toBuffer(), Buffer.from(modelId)], PROGRAM_IDS.VAULT);
    }
    getSkillLicenseAddress(licensor, licenseId) {
        return PublicKey.findProgramAddressSync([Buffer.from('skill_license'), licensor.toBuffer(), Buffer.from(licenseId)], PROGRAM_IDS.VAULT);
    }
    getSkillStatsAddress(owner) {
        return PublicKey.findProgramAddressSync([Buffer.from('skill_stats'), owner.toBuffer()], PROGRAM_IDS.VAULT);
    }
    async exportBehaviorModel(user, skillType, anonymizationLevel) {
        const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const [modelPda, bump] = this.getBehaviorModelAddress(user, modelId);
        const [statsPda] = this.getSkillStatsAddress(user);
        return this.createInstruction('export_behavior_model', [
            { pubkey: user, isSigner: true, isWritable: true },
            { pubkey: modelPda, isSigner: false, isWritable: true },
            { pubkey: statsPda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ], { modelId, skillType, anonymizationLevel, bump });
    }
    async licenseSkill(user, buyer, modelId, terms) {
        const licenseId = `lic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const [modelPda] = this.getBehaviorModelAddress(user, modelId);
        const [licensePda, bump] = this.getSkillLicenseAddress(user, licenseId);
        const [statsPda] = this.getSkillStatsAddress(user);
        return this.createInstruction('license_skill', [
            { pubkey: user, isSigner: true, isWritable: true },
            { pubkey: buyer, isSigner: false, isWritable: true },
            { pubkey: modelPda, isSigner: false, isWritable: true },
            { pubkey: licensePda, isSigner: false, isWritable: true },
            { pubkey: statsPda, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ], {
            modelId,
            licenseId,
            duration: terms.duration.toString(),
            price: terms.price.toString(),
            usageLimit: terms.usageLimit.toString(),
            allowSublicense: terms.allowSublicense,
            commercialUse: terms.commercialUse,
            bump,
        });
    }
    async revokeSkillLicense(user, licenseId) {
        const [licensePda] = this.getSkillLicenseAddress(user, licenseId);
        const [statsPda] = this.getSkillStatsAddress(user);
        return this.createInstruction('revoke_skill_license', [
            { pubkey: user, isSigner: true, isWritable: true },
            { pubkey: licensePda, isSigner: false, isWritable: true },
            { pubkey: statsPda, isSigner: false, isWritable: true },
        ], { licenseId });
    }
    async claimSkillRevenue(user) {
        const [statsPda] = this.getSkillStatsAddress(user);
        const [vaultPda] = LoopPDA.vault(user);
        return this.createInstruction('claim_skill_revenue', [
            { pubkey: user, isSigner: true, isWritable: true },
            { pubkey: statsPda, isSigner: false, isWritable: true },
            { pubkey: vaultPda, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ], {});
    }
    async getSkillStats(user) {
        const [statsPda] = this.getSkillStatsAddress(user);
        const accountInfo = await this.loop.connection.getAccountInfo(statsPda);
        if (!accountInfo) {
            return {
                totalModels: new BN(0),
                totalLicenses: new BN(0),
                totalRevenue: new BN(0),
                activeLicenses: 0,
                avgLicensePrice: new BN(0),
                topSkillType: SkillType.Custom,
            };
        }
        return this.deserializeSkillStats(accountInfo.data);
    }
    createInstruction(name, accounts, data) {
        const discriminator = Buffer.alloc(8);
        const dataBuffer = Buffer.from(JSON.stringify(data));
        return new TransactionInstruction({
            keys: accounts,
            programId: PROGRAM_IDS.VAULT,
            data: Buffer.concat([discriminator, dataBuffer]),
        });
    }
    deserializeSkillStats(data) {
        return {
            totalModels: new BN(0),
            totalLicenses: new BN(0),
            totalRevenue: new BN(0),
            activeLicenses: 0,
            avgLicensePrice: new BN(0),
            topSkillType: SkillType.Custom,
        };
    }
}
