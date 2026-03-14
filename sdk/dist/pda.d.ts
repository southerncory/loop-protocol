/**
 * Loop Protocol PDA Derivation Helpers
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
/**
 * Derive PDA addresses for all Loop Protocol accounts
 */
export declare class LoopPDA {
    /** Derive vault PDA for an owner */
    static vault(owner: PublicKey): [PublicKey, number];
    /** Derive stack record PDA */
    static stackRecord(vault: PublicKey, stackIndex: BN): [PublicKey, number];
    /** Derive agent permission PDA */
    static agentPermission(vault: PublicKey, agent: PublicKey): [PublicKey, number];
    /** Derive vault inheritance config PDA */
    static vaultInheritance(vault: PublicKey): [PublicKey, number];
    /** Derive capture authority PDA */
    static captureAuthority(): [PublicKey, number];
    /** Derive cred config PDA */
    static credConfig(): [PublicKey, number];
    /** Derive capture auth PDA for a module */
    static captureAuth(moduleAddress: PublicKey): [PublicKey, number];
    /** Derive OXO config PDA */
    static oxoConfig(): [PublicKey, number];
    /** Derive veOXO position PDA */
    static veOxoPosition(owner: PublicKey): [PublicKey, number];
    /** Derive bonding curve PDA for agent token */
    static bondingCurve(agentMint: PublicKey): [PublicKey, number];
    /** Derive VTP config PDA */
    static vtpConfig(): [PublicKey, number];
    /** Derive escrow PDA */
    static escrow(sender: PublicKey, recipient: PublicKey, createdAt: BN): [PublicKey, number];
    /** Derive VTP inheritance plan PDA */
    static vtpInheritance(owner: PublicKey): [PublicKey, number];
    /** Derive agent identity PDA */
    static agentIdentity(agent: PublicKey): [PublicKey, number];
}
//# sourceMappingURL=pda.d.ts.map