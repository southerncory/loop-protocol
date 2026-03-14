/**
 * Validation Utils Tests
 */

import { describe, it, expect } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import {
  validatePublicKey,
  isValidPublicKey,
  validateAmount,
  validateCredAmount,
  validateStackDuration,
  validateLockDuration,
  validateString,
  validateMemo,
  validatePermissionLevel,
  validatePercentage,
  validateFutureTimestamp,
  validateExpiry,
  validateHeirs,
} from '../src/utils/validation';
import {
  InvalidPublicKeyError,
  InvalidAmountError,
  InvalidDurationError,
  ValidationError,
} from '../src/errors';
import { TEST_OWNER, cred } from './setup';

describe('Validation Utils', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Public Key Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe('validatePublicKey', () => {
    it('accepts valid PublicKey object', () => {
      const result = validatePublicKey(TEST_OWNER.publicKey);
      expect(result.equals(TEST_OWNER.publicKey)).toBe(true);
    });

    it('accepts valid base58 string', () => {
      const pubkeyStr = TEST_OWNER.publicKey.toBase58();
      const result = validatePublicKey(pubkeyStr);
      expect(result.equals(TEST_OWNER.publicKey)).toBe(true);
    });

    it('rejects invalid string', () => {
      expect(() => validatePublicKey('not-a-pubkey')).toThrow(InvalidPublicKeyError);
    });

    it('rejects empty string', () => {
      expect(() => validatePublicKey('')).toThrow(InvalidPublicKeyError);
    });

    it('rejects string with invalid characters', () => {
      expect(() => validatePublicKey('0OIl' + 'a'.repeat(40))).toThrow(InvalidPublicKeyError);
    });
  });

  describe('isValidPublicKey', () => {
    it('returns true for valid pubkey', () => {
      expect(isValidPublicKey(TEST_OWNER.publicKey)).toBe(true);
    });

    it('returns false for invalid string', () => {
      expect(isValidPublicKey('invalid')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Amount Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe('validateAmount', () => {
    it('accepts positive number', () => {
      const result = validateAmount(100);
      expect(result.eq(new BN(100))).toBe(true);
    });

    it('accepts positive BN', () => {
      const bn = new BN(100);
      const result = validateAmount(bn);
      expect(result.eq(bn)).toBe(true);
    });

    it('rejects zero', () => {
      expect(() => validateAmount(0)).toThrow(InvalidAmountError);
    });

    it('rejects negative', () => {
      expect(() => validateAmount(-100)).toThrow(InvalidAmountError);
    });

    it('rejects below minimum', () => {
      expect(() => validateAmount(5, 'amount', 10)).toThrow(InvalidAmountError);
    });

    it('rejects above maximum', () => {
      expect(() => validateAmount(100, 'amount', 1, 50)).toThrow(InvalidAmountError);
    });
  });

  describe('validateCredAmount', () => {
    it('accepts valid Cred amount', () => {
      const result = validateCredAmount(cred(100));
      expect(result.eq(cred(100))).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Duration Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe('validateStackDuration', () => {
    it('accepts 7 days', () => {
      expect(validateStackDuration(7)).toBe(7);
    });

    it('accepts 730 days', () => {
      expect(validateStackDuration(730)).toBe(730);
    });

    it('accepts 90 days', () => {
      expect(validateStackDuration(90)).toBe(90);
    });

    it('rejects less than 7 days', () => {
      expect(() => validateStackDuration(6)).toThrow(InvalidDurationError);
    });

    it('rejects more than 730 days', () => {
      expect(() => validateStackDuration(731)).toThrow(InvalidDurationError);
    });

    it('rejects non-integer', () => {
      expect(() => validateStackDuration(7.5)).toThrow(InvalidDurationError);
    });
  });

  describe('validateLockDuration', () => {
    const SIX_MONTHS = 15_552_000;
    const FOUR_YEARS = 126_144_000;

    it('accepts 6 months', () => {
      const result = validateLockDuration(SIX_MONTHS);
      expect(result.eq(new BN(SIX_MONTHS))).toBe(true);
    });

    it('accepts 4 years', () => {
      const result = validateLockDuration(FOUR_YEARS);
      expect(result.eq(new BN(FOUR_YEARS))).toBe(true);
    });

    it('rejects less than 6 months', () => {
      expect(() => validateLockDuration(SIX_MONTHS - 1)).toThrow(ValidationError);
    });

    it('rejects more than 4 years', () => {
      expect(() => validateLockDuration(FOUR_YEARS + 1)).toThrow(ValidationError);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // String Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe('validateString', () => {
    it('accepts valid string', () => {
      expect(validateString('hello', 'test', 100)).toBe('hello');
    });

    it('rejects too long', () => {
      expect(() => validateString('hello', 'test', 3)).toThrow(ValidationError);
    });

    it('rejects too short', () => {
      expect(() => validateString('hi', 'test', 100, 5)).toThrow(ValidationError);
    });
  });

  describe('validateMemo', () => {
    it('accepts valid memo', () => {
      expect(validateMemo('Test memo')).toBe('Test memo');
    });

    it('returns null for empty', () => {
      expect(validateMemo('')).toBe(null);
    });

    it('returns null for undefined', () => {
      expect(validateMemo(undefined)).toBe(null);
    });

    it('rejects too long', () => {
      const longMemo = 'a'.repeat(201);
      expect(() => validateMemo(longMemo)).toThrow(ValidationError);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Permission Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe('validatePermissionLevel', () => {
    it('accepts 0 (None)', () => {
      expect(validatePermissionLevel(0)).toBe(0);
    });

    it('accepts 4 (Autonomous)', () => {
      expect(validatePermissionLevel(4)).toBe(4);
    });

    it('rejects negative', () => {
      expect(() => validatePermissionLevel(-1)).toThrow(ValidationError);
    });

    it('rejects > 4', () => {
      expect(() => validatePermissionLevel(5)).toThrow(ValidationError);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Percentage Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe('validatePercentage', () => {
    it('accepts 0', () => {
      expect(validatePercentage(0)).toBe(0);
    });

    it('accepts 100', () => {
      expect(validatePercentage(100)).toBe(100);
    });

    it('accepts 50.5', () => {
      expect(validatePercentage(50.5)).toBe(50.5);
    });

    it('rejects negative', () => {
      expect(() => validatePercentage(-1)).toThrow(ValidationError);
    });

    it('rejects > 100', () => {
      expect(() => validatePercentage(101)).toThrow(ValidationError);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Timestamp Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe('validateFutureTimestamp', () => {
    it('accepts future timestamp', () => {
      const future = Math.floor(Date.now() / 1000) + 3600;
      const result = validateFutureTimestamp(future);
      expect(result.eq(new BN(future))).toBe(true);
    });

    it('rejects past timestamp', () => {
      const past = Math.floor(Date.now() / 1000) - 3600;
      expect(() => validateFutureTimestamp(past)).toThrow(ValidationError);
    });
  });

  describe('validateExpiry', () => {
    it('accepts expiry > 1 hour', () => {
      const expiry = Math.floor(Date.now() / 1000) + 7200; // 2 hours
      const result = validateExpiry(expiry);
      expect(result.eq(new BN(expiry))).toBe(true);
    });

    it('rejects expiry < 1 hour', () => {
      const expiry = Math.floor(Date.now() / 1000) + 1800; // 30 min
      expect(() => validateExpiry(expiry)).toThrow(ValidationError);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Heirs Validation
  // ─────────────────────────────────────────────────────────────────────────

  describe('validateHeirs', () => {
    it('accepts valid heirs totaling 100%', () => {
      const heirs = [
        { address: TEST_OWNER.publicKey, percentage: 60, name: 'Heir 1' },
        { address: TEST_OWNER.publicKey, percentage: 40, name: 'Heir 2' },
      ];
      expect(() => validateHeirs(heirs)).not.toThrow();
    });

    it('rejects heirs not totaling 100%', () => {
      const heirs = [
        { address: TEST_OWNER.publicKey, percentage: 60, name: 'Heir 1' },
        { address: TEST_OWNER.publicKey, percentage: 30, name: 'Heir 2' },
      ];
      expect(() => validateHeirs(heirs)).toThrow(ValidationError);
    });

    it('rejects empty heirs', () => {
      expect(() => validateHeirs([])).toThrow(ValidationError);
    });

    it('rejects > 10 heirs', () => {
      const heirs = Array(11).fill(null).map((_, i) => ({
        address: TEST_OWNER.publicKey,
        percentage: i === 0 ? 100 - 10 : 1,
        name: `Heir ${i}`,
      }));
      expect(() => validateHeirs(heirs)).toThrow(ValidationError);
    });
  });
});
