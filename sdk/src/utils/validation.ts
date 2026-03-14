/**
 * Validation utilities for Loop Protocol SDK
 */

import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Lock duration constants (duplicated to avoid circular import)
const MIN_LOCK_SECONDS = 15_552_000; // 6 months
const MAX_LOCK_SECONDS = 126_144_000; // 4 years

/**
 * Error thrown when validation fails
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate and convert a public key input to PublicKey
 * 
 * @param key - A string or PublicKey
 * @returns PublicKey instance
 * @throws ValidationError if the key is invalid
 * 
 * @example
 * ```typescript
 * const pubkey = validatePublicKey('7xKX...3nP9');
 * const same = validatePublicKey(existingPubkey);
 * ```
 */
export function validatePublicKey(key: string | PublicKey): PublicKey {
  if (key instanceof PublicKey) {
    return key;
  }
  
  if (typeof key !== 'string') {
    throw new ValidationError('Public key must be a string or PublicKey instance');
  }
  
  const trimmed = key.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('Public key cannot be empty');
  }
  
  try {
    return new PublicKey(trimmed);
  } catch (e) {
    throw new ValidationError(`Invalid public key: ${trimmed}`);
  }
}

/**
 * Validate and convert an amount to BN
 * 
 * @param amount - A number or BN
 * @returns BN instance
 * @throws ValidationError if the amount is invalid
 * 
 * @example
 * ```typescript
 * const amount = validateAmount(1000000);
 * const bnAmount = validateAmount(new BN('1000000'));
 * ```
 */
export function validateAmount(amount: number | BN): BN {
  if (amount instanceof BN) {
    return amount;
  }
  
  if (typeof amount !== 'number') {
    throw new ValidationError('Amount must be a number or BN instance');
  }
  
  if (!Number.isFinite(amount)) {
    throw new ValidationError('Amount must be a finite number');
  }
  
  if (!Number.isInteger(amount)) {
    throw new ValidationError('Amount must be an integer (use smallest unit, e.g., lamports)');
  }
  
  return new BN(amount);
}

/**
 * Validate and convert a positive amount to BN
 * 
 * @param amount - A number or BN, must be > 0
 * @returns BN instance
 * @throws ValidationError if the amount is invalid or not positive
 * 
 * @example
 * ```typescript
 * const amount = validatePositiveAmount(1000000);
 * ```
 */
export function validatePositiveAmount(amount: number | BN): BN {
  const bn = validateAmount(amount);
  
  if (bn.isNeg() || bn.isZero()) {
    throw new ValidationError('Amount must be positive (greater than 0)');
  }
  
  return bn;
}

/**
 * Validate a non-negative amount (zero is allowed)
 * 
 * @param amount - A number or BN, must be >= 0
 * @returns BN instance
 * @throws ValidationError if the amount is invalid or negative
 */
export function validateNonNegativeAmount(amount: number | BN): BN {
  const bn = validateAmount(amount);
  
  if (bn.isNeg()) {
    throw new ValidationError('Amount must be non-negative (>= 0)');
  }
  
  return bn;
}

/**
 * Validate a percentage in basis points (0-10000)
 * 
 * @param bps - Basis points (100 bps = 1%)
 * @returns The validated bps value
 * @throws ValidationError if bps is invalid
 * 
 * @example
 * ```typescript
 * const fee = validatePercentage(500); // 5%
 * ```
 */
export function validatePercentage(bps: number): number {
  if (typeof bps !== 'number') {
    throw new ValidationError('Percentage must be a number');
  }
  
  if (!Number.isFinite(bps)) {
    throw new ValidationError('Percentage must be a finite number');
  }
  
  if (!Number.isInteger(bps)) {
    throw new ValidationError('Percentage must be an integer (basis points)');
  }
  
  if (bps < 0 || bps > 10000) {
    throw new ValidationError('Percentage must be between 0 and 10000 basis points (0-100%)');
  }
  
  return bps;
}

/**
 * Validate a lock duration in seconds
 * 
 * @param seconds - Lock duration in seconds
 * @returns The validated seconds value
 * @throws ValidationError if duration is invalid or out of range
 * 
 * @example
 * ```typescript
 * const sixMonths = validateLockDuration(15_552_000);
 * ```
 */
export function validateLockDuration(seconds: number): number {
  if (typeof seconds !== 'number') {
    throw new ValidationError('Lock duration must be a number');
  }
  
  if (!Number.isFinite(seconds)) {
    throw new ValidationError('Lock duration must be a finite number');
  }
  
  if (!Number.isInteger(seconds)) {
    throw new ValidationError('Lock duration must be an integer (seconds)');
  }
  
  if (seconds < MIN_LOCK_SECONDS) {
    throw new ValidationError(
      `Lock duration must be at least ${MIN_LOCK_SECONDS} seconds (6 months)`
    );
  }
  
  if (seconds > MAX_LOCK_SECONDS) {
    throw new ValidationError(
      `Lock duration must be at most ${MAX_LOCK_SECONDS} seconds (4 years)`
    );
  }
  
  return seconds;
}

/**
 * Validate an array has items and doesn't exceed max length
 * 
 * @param arr - Array to validate
 * @param maxLength - Maximum allowed length
 * @param name - Name for error messages
 * @returns The validated array
 */
export function validateArray<T>(arr: T[], maxLength: number, name: string): T[] {
  if (!Array.isArray(arr)) {
    throw new ValidationError(`${name} must be an array`);
  }
  
  if (arr.length === 0) {
    throw new ValidationError(`${name} cannot be empty`);
  }
  
  if (arr.length > maxLength) {
    throw new ValidationError(`${name} cannot have more than ${maxLength} items`);
  }
  
  return arr;
}

/**
 * Validate string length
 * 
 * @param str - String to validate
 * @param maxLength - Maximum allowed length
 * @param name - Name for error messages
 * @returns The validated string
 */
export function validateString(str: string, maxLength: number, name: string): string {
  if (typeof str !== 'string') {
    throw new ValidationError(`${name} must be a string`);
  }
  
  const trimmed = str.trim();
  
  if (trimmed.length === 0) {
    throw new ValidationError(`${name} cannot be empty`);
  }
  
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${name} cannot exceed ${maxLength} characters`);
  }
  
  return trimmed;
}
