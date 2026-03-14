/**
 * Loop Protocol Constants
 *
 * Program IDs and protocol constants
 */
import { PublicKey } from '@solana/web3.js';
// ============================================================================
// PROGRAM IDS
// ============================================================================
export const PROGRAM_IDS = {
    VAULT: new PublicKey('76FgGQNTw9maaV82og6U33KMZw4FCw9yGJu4M75hJ3Z7'),
    CRED: new PublicKey('FHVp7WrnUZq69aNZgYw2YNmitSdj8UCwoJ8C2A1M98JA'),
    OXO: new PublicKey('3qxTuF17rTdGFECPimRWu51uUycSwAL4ebd7w9s2xx4z'),
    VTP: new PublicKey('4D2PnJ4txLTQAqcoURt5eUQHMM85QsGPdGBHdsineuWj'),
    AVP: new PublicKey('H5c9xfPYcx6EtC8hpThshARtUR7tq1NfMJVrTx8z9Jcx'),
};
// ============================================================================
// CONSTANTS
// ============================================================================
export const CONSTANTS = {
    // Vault
    EXTRACTION_FEE_BPS: 500, // 5%
    // OXO
    OXO_TOTAL_SUPPLY: 1000000000000000, // 1B with 6 decimals
    MIN_LOCK_SECONDS: 15552000, // 6 months
    MAX_LOCK_SECONDS: 126144000, // 4 years
    GRADUATION_THRESHOLD: 25000000000, // 25,000 OXO
    AGENT_CREATION_FEE: 500000000, // 500 OXO
    // VTP
    TRANSFER_FEE_BPS: 10, // 0.1%
    ESCROW_FEE_BPS: 25, // 0.25%
    MAX_ARBITERS: 5,
    MAX_CONDITIONS: 10,
    // AVP
    MIN_SERVICE_AGENT_STAKE: 500000000, // 500 OXO
    MAX_CAPABILITIES: 20,
    MAX_METADATA_LEN: 200,
};
