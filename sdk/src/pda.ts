/**
 * Loop Protocol PDA Derivation Helpers
 * Derive Program Derived Addresses for all Loop accounts
 */

import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { PROGRAM_IDS } from './constants';

/**
 * Derive PDA addresses for all Loop Protocol accounts
 */
export class LoopPDA {
  // ─────────────────────────────────────────────────────────────────────────
  // Vault PDAs
  // ─────────────────────────────────────────────────────────────────────────

  /** Derive vault PDA for an owner */
  static vault(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), owner.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }

  /** Derive stack record PDA */
  static stackRecord(vault: PublicKey, stackIndex: BN): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('stack'), vault.toBuffer(), stackIndex.toArrayLike(Buffer, 'le', 8)],
      PROGRAM_IDS.VAULT
    );
  }

  /** Derive agent permission PDA */
  static agentPermission(vault: PublicKey, agent: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('agent_perm'), vault.toBuffer(), agent.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }

  /** Derive vault inheritance config PDA */
  static vaultInheritance(vault: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('inheritance'), vault.toBuffer()],
      PROGRAM_IDS.VAULT
    );
  }

  /** Derive capture authority PDA */
  static captureAuthority(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('capture_authority')],
      PROGRAM_IDS.VAULT
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cred PDAs
  // ─────────────────────────────────────────────────────────────────────────

  /** Derive cred config PDA */
  static credConfig(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('cred_config')],
      PROGRAM_IDS.CRED
    );
  }

  /** Derive capture auth PDA for a module */
  static captureAuth(moduleAddress: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('capture_auth'), moduleAddress.toBuffer()],
      PROGRAM_IDS.CRED
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OXO PDAs
  // ─────────────────────────────────────────────────────────────────────────

  /** Derive OXO config PDA */
  static oxoConfig(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      PROGRAM_IDS.OXO
    );
  }

  /** Derive veOXO position PDA */
  static veOxoPosition(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('ve_position'), owner.toBuffer()],
      PROGRAM_IDS.OXO
    );
  }

  /** Derive bonding curve PDA for agent token */
  static bondingCurve(agentMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('bonding_curve'), agentMint.toBuffer()],
      PROGRAM_IDS.OXO
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VTP PDAs
  // ─────────────────────────────────────────────────────────────────────────

  /** Derive VTP config PDA */
  static vtpConfig(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vtp_config')],
      PROGRAM_IDS.VTP
    );
  }

  /** Derive escrow PDA */
  static escrow(sender: PublicKey, recipient: PublicKey, createdAt: BN): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('escrow'),
        sender.toBuffer(),
        recipient.toBuffer(),
        createdAt.toArrayLike(Buffer, 'le', 8),
      ],
      PROGRAM_IDS.VTP
    );
  }

  /** Derive VTP inheritance plan PDA */
  static vtpInheritance(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('inheritance'), owner.toBuffer()],
      PROGRAM_IDS.VTP
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AVP PDAs
  // ─────────────────────────────────────────────────────────────────────────

  /** Derive agent identity PDA */
  static agentIdentity(agent: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), agent.toBuffer()],
      PROGRAM_IDS.AVP
    );
  }
}
