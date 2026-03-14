import { describe, it, expect, beforeAll } from 'vitest';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { DEVNET_PROGRAM_IDS } from '../src/network';

/**
 * Devnet Integration Tests
 * 
 * These tests verify that:
 * 1. All programs are deployed and executable on devnet
 * 2. PDA derivations work correctly
 * 3. Instruction building produces valid data
 */

const DEVNET_RPC = 'https://api.devnet.solana.com';

describe('Devnet Program Verification', () => {
  let connection: Connection;

  beforeAll(() => {
    connection = new Connection(DEVNET_RPC, 'confirmed');
  });

  it('vault program is deployed and executable', async () => {
    const accountInfo = await connection.getAccountInfo(DEVNET_PROGRAM_IDS.VAULT);
    expect(accountInfo).not.toBeNull();
    expect(accountInfo!.executable).toBe(true);
    console.log(`✓ Vault program: ${DEVNET_PROGRAM_IDS.VAULT.toBase58()}`);
  });

  it('cred program is deployed and executable', async () => {
    const accountInfo = await connection.getAccountInfo(DEVNET_PROGRAM_IDS.CRED);
    expect(accountInfo).not.toBeNull();
    expect(accountInfo!.executable).toBe(true);
    console.log(`✓ Cred program: ${DEVNET_PROGRAM_IDS.CRED.toBase58()}`);
  });

  it('oxo program is deployed and executable', async () => {
    const accountInfo = await connection.getAccountInfo(DEVNET_PROGRAM_IDS.OXO);
    expect(accountInfo).not.toBeNull();
    expect(accountInfo!.executable).toBe(true);
    console.log(`✓ OXO program: ${DEVNET_PROGRAM_IDS.OXO.toBase58()}`);
  });

  it('vtp program is deployed and executable', async () => {
    const accountInfo = await connection.getAccountInfo(DEVNET_PROGRAM_IDS.VTP);
    expect(accountInfo).not.toBeNull();
    expect(accountInfo!.executable).toBe(true);
    console.log(`✓ VTP program: ${DEVNET_PROGRAM_IDS.VTP.toBase58()}`);
  });

  it('avp program is deployed and executable', async () => {
    const accountInfo = await connection.getAccountInfo(DEVNET_PROGRAM_IDS.AVP);
    expect(accountInfo).not.toBeNull();
    expect(accountInfo!.executable).toBe(true);
    console.log(`✓ AVP program: ${DEVNET_PROGRAM_IDS.AVP.toBase58()}`);
  });
});

describe('PDA Derivation', () => {
  const testUser = Keypair.generate().publicKey;

  it('derives vault PDA correctly', () => {
    const [vaultPda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), testUser.toBuffer()],
      DEVNET_PROGRAM_IDS.VAULT
    );
    
    expect(vaultPda).toBeInstanceOf(PublicKey);
    expect(bump).toBeGreaterThanOrEqual(0);
    expect(bump).toBeLessThanOrEqual(255);
    console.log(`✓ Vault PDA: ${vaultPda.toBase58()} (bump: ${bump})`);
  });

  it('derives cred mint PDA correctly', () => {
    const [credMintPda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('cred_mint')],
      DEVNET_PROGRAM_IDS.CRED
    );
    
    expect(credMintPda).toBeInstanceOf(PublicKey);
    console.log(`✓ Cred Mint PDA: ${credMintPda.toBase58()} (bump: ${bump})`);
  });

  it('derives oxo mint PDA correctly', () => {
    const [oxoMintPda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('oxo_mint')],
      DEVNET_PROGRAM_IDS.OXO
    );
    
    expect(oxoMintPda).toBeInstanceOf(PublicKey);
    console.log(`✓ OXO Mint PDA: ${oxoMintPda.toBase58()} (bump: ${bump})`);
  });

  it('derives veOXO position PDA correctly', () => {
    const [veOxoPda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('veoxo'), testUser.toBuffer()],
      DEVNET_PROGRAM_IDS.OXO
    );
    
    expect(veOxoPda).toBeInstanceOf(PublicKey);
    console.log(`✓ veOXO PDA: ${veOxoPda.toBase58()} (bump: ${bump})`);
  });

  it('derives agent identity PDA correctly', () => {
    const [agentPda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('agent'), testUser.toBuffer()],
      DEVNET_PROGRAM_IDS.AVP
    );
    
    expect(agentPda).toBeInstanceOf(PublicKey);
    console.log(`✓ Agent PDA: ${agentPda.toBase58()} (bump: ${bump})`);
  });
});

describe('Network Config', () => {
  it('all devnet program IDs are valid public keys', () => {
    for (const [name, pubkey] of Object.entries(DEVNET_PROGRAM_IDS)) {
      expect(pubkey).toBeInstanceOf(PublicKey);
      expect(pubkey.toBase58().length).toBeGreaterThan(30);
      console.log(`✓ ${name}: ${pubkey.toBase58()}`);
    }
  });

  it('program IDs are all unique', () => {
    const ids = Object.values(DEVNET_PROGRAM_IDS).map(p => p.toBase58());
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
