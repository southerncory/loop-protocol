/**
 * Security Integration Types
 * 
 * Types for:
 * - Para (Passkey authentication)
 * - Squads (Smart account policies)
 * - Reclaim (ZK proof verification)
 * - TEE (Trusted execution environment)
 */

import { PublicKey, Transaction } from '@solana/web3.js';
import { CaptureType } from './vault';

// ============================================================================
// PARA INTEGRATION (Passkeys)
// ============================================================================

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'mobile' | 'desktop' | 'hardware';
  platform: string;
  biometricCapable: boolean;
}

export interface PasskeyWallet {
  userId: string;
  walletAddress: PublicKey;
  deviceId: string;
  createdAt: number;
  lastUsed: number;
}

export interface SessionKeyPermissions {
  canCapture: boolean;
  canStack: boolean;
  canTransfer: boolean;
  maxTransferAmount: number;
  allowedPrograms: PublicKey[];
}

export interface SessionKey {
  keyId: string;
  publicKey: PublicKey;
  permissions: SessionKeyPermissions;
  expiresAt: number;
  createdAt: number;
}

export interface SessionInfo {
  keyId: string;
  deviceInfo: DeviceInfo;
  permissions: SessionKeyPermissions;
  expiresAt: number;
  lastActivity: number;
  isActive: boolean;
}

export interface SignedTransaction {
  transaction: Transaction;
  signature: string;
  signedAt: number;
}

// ============================================================================
// SQUADS INTEGRATION (Policies)
// ============================================================================

export interface SmartAccountConfig {
  threshold: number;
  members: { pubkey: PublicKey; weight: number }[];
  timeLockSeconds: number;
}

export interface SmartAccount {
  address: PublicKey;
  config: SmartAccountConfig;
  createdAt: number;
}

export interface AgentPolicy {
  dailyLimit: number;
  allowedInstructions: string[];
  timelock: number;
  requiresApproval: boolean;
}

export interface PolicyConfig {
  account: PublicKey;
  agentKey: PublicKey;
  policy: AgentPolicy;
  setAt: number;
}

export interface Proposal {
  proposalId: string;
  account: PublicKey;
  transaction: Transaction;
  proposer: PublicKey;
  approvals: PublicKey[];
  status: 'pending' | 'approved' | 'executed' | 'rejected';
  createdAt: number;
  expiresAt: number;
}

export interface ApprovalResult {
  proposalId: string;
  approver: PublicKey;
  newApprovalCount: number;
  thresholdMet: boolean;
}

// ============================================================================
// RECLAIM INTEGRATION (ZK Proofs)
// ============================================================================

export interface ZKProof {
  proofId: string;
  captureType: CaptureType;
  claims: Record<string, unknown>;
  proof: string;
  publicInputs: string[];
  generatedAt: number;
}

export interface VerificationResult {
  valid: boolean;
  claims: Record<string, unknown>;
  verifiedAt: number;
  error?: string;
}

export interface CaptureResult {
  captureId: string;
  user: PublicKey;
  captureType: CaptureType;
  amount: number;
  proof: ZKProof;
  transactionSignature: string;
}

// ============================================================================
// TEE INTEGRATION (Trusted Execution)
// ============================================================================

export interface EnclaveAttestation {
  enclaveId: string;
  codeHash: string;
  timestamp: number;
  signature: string;
  awsAttestationDoc?: string;
}

export interface AgentRegistration {
  agentId: string;
  user: PublicKey;
  attestation: EnclaveAttestation;
  capabilities: string[];
  registeredAt: number;
}
