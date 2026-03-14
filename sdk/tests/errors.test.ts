/**
 * Error Classes Tests
 */

import { describe, it, expect } from 'vitest';
import {
  LoopError,
  ValidationError,
  InvalidPublicKeyError,
  InvalidAmountError,
  InvalidDurationError,
  AccountNotFoundError,
  VaultNotFoundError,
  StackNotFoundError,
  InsufficientBalanceError,
  InsufficientSolError,
  UnauthorizedError,
  InsufficientPermissionError,
  DailyLimitExceededError,
  StackLockedError,
  StackInactiveError,
  TransactionError,
  SimulationError,
  TransactionTimeoutError,
  BlockhashExpiredError,
  ConnectionError,
  RateLimitError,
  CaptureModuleNotAuthorizedError,
  DuplicateCaptureError,
  EscrowConditionsNotMetError,
  EscrowExpiredError,
  AlreadyGraduatedError,
  InsufficientCurveReserveError,
  ErrorCodes,
} from '../src/errors';

describe('Error Classes', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Base Error
  // ─────────────────────────────────────────────────────────────────────────

  describe('LoopError', () => {
    it('creates error with message and code', () => {
      const error = new LoopError('Test error', 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('LoopError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('is instanceof Error', () => {
      const error = new LoopError('Test', 'TEST');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LoopError);
    });

    it('has stack trace', () => {
      const error = new LoopError('Test', 'TEST');
      expect(error.stack).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Validation Errors
  // ─────────────────────────────────────────────────────────────────────────

  describe('ValidationError', () => {
    it('includes field, value, and constraint', () => {
      const error = new ValidationError('amount', -100, 'must be positive');
      expect(error.field).toBe('amount');
      expect(error.value).toBe(-100);
      expect(error.constraint).toBe('must be positive');
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('InvalidPublicKeyError', () => {
    it('creates with field and value', () => {
      const error = new InvalidPublicKeyError('owner', 'bad-key');
      expect(error.field).toBe('owner');
      expect(error.value).toBe('bad-key');
      expect(error.name).toBe('InvalidPublicKeyError');
    });
  });

  describe('InvalidAmountError', () => {
    it('includes min and max', () => {
      const error = new InvalidAmountError('amount', 5, 10, 100);
      expect(error.field).toBe('amount');
      expect(error.value).toBe(5);
      expect(error.min).toBe(10);
      expect(error.max).toBe(100);
    });
  });

  describe('InvalidDurationError', () => {
    it('creates with duration bounds', () => {
      const error = new InvalidDurationError('days', 5, 7, 730);
      expect(error.field).toBe('days');
      expect(error.value).toBe(5);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Account Errors
  // ─────────────────────────────────────────────────────────────────────────

  describe('AccountNotFoundError', () => {
    it('includes account type and address', () => {
      const error = new AccountNotFoundError('Vault', 'ABC123');
      expect(error.accountType).toBe('Vault');
      expect(error.address).toBe('ABC123');
      expect(error.code).toBe('ACCOUNT_NOT_FOUND');
    });
  });

  describe('VaultNotFoundError', () => {
    it('is an AccountNotFoundError', () => {
      const error = new VaultNotFoundError('owner123');
      expect(error).toBeInstanceOf(AccountNotFoundError);
      expect(error.accountType).toBe('Vault');
    });
  });

  describe('StackNotFoundError', () => {
    it('is an AccountNotFoundError', () => {
      const error = new StackNotFoundError('stack123');
      expect(error).toBeInstanceOf(AccountNotFoundError);
      expect(error.accountType).toBe('Stack');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Balance Errors
  // ─────────────────────────────────────────────────────────────────────────

  describe('InsufficientBalanceError', () => {
    it('includes available, required, and token', () => {
      const error = new InsufficientBalanceError(100, 500, 'Cred');
      expect(error.available).toBe(100);
      expect(error.required).toBe(500);
      expect(error.token).toBe('Cred');
      expect(error.code).toBe('INSUFFICIENT_BALANCE');
    });

    it('defaults to Cred token', () => {
      const error = new InsufficientBalanceError(100, 500);
      expect(error.token).toBe('Cred');
    });
  });

  describe('InsufficientSolError', () => {
    it('includes available and required lamports', () => {
      const error = new InsufficientSolError(1000, 5000);
      expect(error.available).toBe(1000);
      expect(error.required).toBe(5000);
      expect(error.code).toBe('INSUFFICIENT_SOL');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Permission Errors
  // ─────────────────────────────────────────────────────────────────────────

  describe('UnauthorizedError', () => {
    it('includes required and actual authority', () => {
      const error = new UnauthorizedError('owner', 'attacker');
      expect(error.requiredAuthority).toBe('owner');
      expect(error.actualAuthority).toBe('attacker');
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('InsufficientPermissionError', () => {
    it('includes permission levels', () => {
      const error = new InsufficientPermissionError(3, 1);
      expect(error.requiredLevel).toBe(3);
      expect(error.actualLevel).toBe(1);
      expect(error.code).toBe('INSUFFICIENT_PERMISSION');
      expect(error.message).toContain('Guided');
      expect(error.message).toContain('Read');
    });
  });

  describe('DailyLimitExceededError', () => {
    it('includes limit, used, and requested', () => {
      const error = new DailyLimitExceededError(1000, 800, 500);
      expect(error.limit).toBe(1000);
      expect(error.used).toBe(800);
      expect(error.requested).toBe(500);
      expect(error.code).toBe('DAILY_LIMIT_EXCEEDED');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Stacking Errors
  // ─────────────────────────────────────────────────────────────────────────

  describe('StackLockedError', () => {
    it('includes unlock time and remaining seconds', () => {
      const futureDate = new Date(Date.now() + 3600000); // +1 hour
      const error = new StackLockedError(futureDate);
      expect(error.unlockTime).toEqual(futureDate);
      expect(error.remainingSeconds).toBeGreaterThan(3500);
      expect(error.remainingSeconds).toBeLessThanOrEqual(3600);
      expect(error.code).toBe('STACK_LOCKED');
    });
  });

  describe('StackInactiveError', () => {
    it('includes stack address', () => {
      const error = new StackInactiveError('stack123');
      expect(error.stackAddress).toBe('stack123');
      expect(error.code).toBe('STACK_INACTIVE');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Transaction Errors
  // ─────────────────────────────────────────────────────────────────────────

  describe('TransactionError', () => {
    it('includes optional signature and logs', () => {
      const error = new TransactionError('Failed', 'sig123', ['log1', 'log2']);
      expect(error.signature).toBe('sig123');
      expect(error.logs).toEqual(['log1', 'log2']);
      expect(error.code).toBe('TRANSACTION_ERROR');
    });
  });

  describe('SimulationError', () => {
    it('includes units consumed', () => {
      const error = new SimulationError('Sim failed', ['log'], 50000);
      expect(error.unitsConsumed).toBe(50000);
      expect(error.logs).toEqual(['log']);
    });
  });

  describe('TransactionTimeoutError', () => {
    it('includes timeout duration', () => {
      const error = new TransactionTimeoutError('sig123', 30000);
      expect(error.signature).toBe('sig123');
      expect(error.timeoutMs).toBe(30000);
    });
  });

  describe('BlockhashExpiredError', () => {
    it('creates with optional signature', () => {
      const error = new BlockhashExpiredError('sig123');
      expect(error.signature).toBe('sig123');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Network Errors
  // ─────────────────────────────────────────────────────────────────────────

  describe('ConnectionError', () => {
    it('includes endpoint and cause', () => {
      const cause = new Error('ECONNREFUSED');
      const error = new ConnectionError('http://localhost:8899', cause);
      expect(error.endpoint).toBe('http://localhost:8899');
      expect(error.cause).toBe(cause);
      expect(error.code).toBe('CONNECTION_ERROR');
    });
  });

  describe('RateLimitError', () => {
    it('includes retry-after', () => {
      const error = new RateLimitError(5000);
      expect(error.retryAfterMs).toBe(5000);
      expect(error.code).toBe('RATE_LIMITED');
    });

    it('works without retry-after', () => {
      const error = new RateLimitError();
      expect(error.retryAfterMs).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Capture Errors
  // ─────────────────────────────────────────────────────────────────────────

  describe('CaptureModuleNotAuthorizedError', () => {
    it('includes module address', () => {
      const error = new CaptureModuleNotAuthorizedError('module123');
      expect(error.moduleAddress).toBe('module123');
      expect(error.code).toBe('CAPTURE_NOT_AUTHORIZED');
    });
  });

  describe('DuplicateCaptureError', () => {
    it('includes transaction ID', () => {
      const error = new DuplicateCaptureError('tx123');
      expect(error.transactionId).toBe('tx123');
      expect(error.code).toBe('DUPLICATE_CAPTURE');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Escrow Errors
  // ─────────────────────────────────────────────────────────────────────────

  describe('EscrowConditionsNotMetError', () => {
    it('includes unmet condition indices', () => {
      const error = new EscrowConditionsNotMetError([0, 2]);
      expect(error.unmetConditions).toEqual([0, 2]);
      expect(error.code).toBe('ESCROW_CONDITIONS_NOT_MET');
    });
  });

  describe('EscrowExpiredError', () => {
    it('includes expiry time', () => {
      const expiry = new Date();
      const error = new EscrowExpiredError(expiry);
      expect(error.expiryTime).toEqual(expiry);
      expect(error.code).toBe('ESCROW_EXPIRED');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Bonding Curve Errors
  // ─────────────────────────────────────────────────────────────────────────

  describe('AlreadyGraduatedError', () => {
    it('includes agent mint', () => {
      const error = new AlreadyGraduatedError('mint123');
      expect(error.agentMint).toBe('mint123');
      expect(error.code).toBe('ALREADY_GRADUATED');
    });
  });

  describe('InsufficientCurveReserveError', () => {
    it('includes available and required', () => {
      const error = new InsufficientCurveReserveError(100, 500);
      expect(error.available).toBe(100);
      expect(error.required).toBe(500);
      expect(error.code).toBe('INSUFFICIENT_CURVE_RESERVE');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error Codes
  // ─────────────────────────────────────────────────────────────────────────

  describe('ErrorCodes', () => {
    it('has all expected codes', () => {
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.ACCOUNT_NOT_FOUND).toBe('ACCOUNT_NOT_FOUND');
      expect(ErrorCodes.INSUFFICIENT_BALANCE).toBe('INSUFFICIENT_BALANCE');
      expect(ErrorCodes.RATE_LIMITED).toBe('RATE_LIMITED');
    });
  });
});
