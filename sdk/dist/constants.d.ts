/**
 * Loop Protocol Constants
 *
 * Program IDs and protocol constants
 */
import { PublicKey } from '@solana/web3.js';
export declare const PROGRAM_IDS: {
    readonly VAULT: PublicKey;
    readonly CRED: PublicKey;
    readonly OXO: PublicKey;
    readonly VTP: PublicKey;
    readonly AVP: PublicKey;
};
export declare const CONSTANTS: {
    readonly EXTRACTION_FEE_BPS: 500;
    readonly OXO_TOTAL_SUPPLY: 1000000000000000;
    readonly MIN_LOCK_SECONDS: 15552000;
    readonly MAX_LOCK_SECONDS: 126144000;
    readonly GRADUATION_THRESHOLD: 25000000000;
    readonly AGENT_CREATION_FEE: 500000000;
    readonly TRANSFER_FEE_BPS: 10;
    readonly ESCROW_FEE_BPS: 25;
    readonly MAX_ARBITERS: 5;
    readonly MAX_CONDITIONS: 10;
    readonly MIN_SERVICE_AGENT_STAKE: 500000000;
    readonly MAX_CAPABILITIES: 20;
    readonly MAX_METADATA_LEN: 200;
};
//# sourceMappingURL=constants.d.ts.map