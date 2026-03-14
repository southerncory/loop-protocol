/**
 * Test Setup - Common utilities and mocks for SDK tests
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// ============================================================================
// TEST CONSTANTS
// ============================================================================

export const TEST_RPC = 'http://localhost:8899';
export const DEVNET_RPC = 'https://api.devnet.solana.com';

// Known test keypairs (DO NOT use in production)
export const TEST_OWNER = Keypair.fromSeed(
  Uint8Array.from(Array(32).fill(1))
);
export const TEST_AGENT = Keypair.fromSeed(
  Uint8Array.from(Array(32).fill(2))
);
export const TEST_RECIPIENT = Keypair.fromSeed(
  Uint8Array.from(Array(32).fill(3))
);

// Mock mint addresses (valid base58)
export const MOCK_CRED_MINT = new PublicKey('4THszk4dzFAkrcRXB2bXhrLunc74qmc6AUbzRGsGVETH');
export const MOCK_OXO_MINT = new PublicKey('AidgmTgrbV7UMTLzyDM1MhQLzkrGZMFGTdgHVd3dVC7R');
export const MOCK_USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// ============================================================================
// MOCK FACTORIES
// ============================================================================

export function createMockConnection(): Connection {
  return new Connection(TEST_RPC, 'confirmed');
}

export function createMockVault(overrides: Partial<{
  owner: PublicKey;
  credBalance: BN;
  stackedBalance: BN;
  pendingYield: BN;
  oxoBalance: BN;
}> = {}) {
  return {
    owner: overrides.owner || TEST_OWNER.publicKey,
    credBalance: overrides.credBalance || new BN(1_000_000_000), // 1000 Cred
    stackedBalance: overrides.stackedBalance || new BN(500_000_000), // 500 Cred
    pendingYield: overrides.pendingYield || new BN(10_000_000), // 10 Cred
    oxoBalance: overrides.oxoBalance || new BN(100_000_000), // 100 OXO
    createdAt: new BN(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
    lastYieldClaim: new BN(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
    bump: 255,
    totalCaptured: new BN(2_000_000_000),
    totalWithdrawn: new BN(500_000_000),
  };
}

export function createMockStack(overrides: Partial<{
  vault: PublicKey;
  amount: BN;
  startTime: BN;
  endTime: BN;
  apyBasisPoints: number;
  isActive: boolean;
}> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    vault: overrides.vault || TEST_OWNER.publicKey,
    amount: overrides.amount || new BN(100_000_000),
    startTime: overrides.startTime || new BN(now - 86400 * 30), // 30 days ago
    endTime: overrides.endTime || new BN(now + 86400 * 60), // 60 days from now
    apyBasisPoints: overrides.apyBasisPoints ?? 1500,
    claimedYield: new BN(0),
    isActive: overrides.isActive ?? true,
    bump: 255,
    nonce: new BN(now - 86400 * 30),
  };
}

export function createMockAgentIdentity(overrides: Partial<{
  agentPubkey: PublicKey;
  agentType: number;
  status: number;
  reputationScore: number;
}> = {}) {
  return {
    agentPubkey: overrides.agentPubkey || TEST_AGENT.publicKey,
    agentType: overrides.agentType ?? 0, // Personal
    createdAt: new BN(Math.floor(Date.now() / 1000) - 86400),
    principalHash: new Uint8Array(32).fill(1),
    bindingTimestamp: new BN(Math.floor(Date.now() / 1000) - 86400),
    creator: null,
    capabilities: [],
    stakeAmount: new BN(0),
    stakeLockedUntil: new BN(0),
    status: overrides.status ?? 0, // Active
    reputationScore: overrides.reputationScore ?? 5000, // 50%
    metadataUri: null,
    bump: 255,
  };
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

export function expectBN(actual: BN, expected: number | BN, message?: string) {
  const expectedBN = typeof expected === 'number' ? new BN(expected) : expected;
  if (!actual.eq(expectedBN)) {
    throw new Error(
      message || `Expected ${expectedBN.toString()}, got ${actual.toString()}`
    );
  }
}

export function expectPublicKey(actual: PublicKey, expected: PublicKey, message?: string) {
  if (!actual.equals(expected)) {
    throw new Error(
      message || `Expected ${expected.toBase58()}, got ${actual.toBase58()}`
    );
  }
}

// ============================================================================
// TIME HELPERS
// ============================================================================

export function futureTimestamp(secondsFromNow: number): BN {
  return new BN(Math.floor(Date.now() / 1000) + secondsFromNow);
}

export function pastTimestamp(secondsAgo: number): BN {
  return new BN(Math.floor(Date.now() / 1000) - secondsAgo);
}

// ============================================================================
// AMOUNT HELPERS
// ============================================================================

/** Convert whole Cred to lamports (6 decimals) */
export function cred(amount: number): BN {
  return new BN(amount * 1_000_000);
}

/** Convert whole OXO to lamports (6 decimals) */
export function oxo(amount: number): BN {
  return new BN(amount * 1_000_000);
}
