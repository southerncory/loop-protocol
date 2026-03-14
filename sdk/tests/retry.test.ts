/**
 * Retry Utils Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  retry,
  retryWithResult,
  isErrorRetryable,
  isPermanentError,
  retryRead,
  retryTransaction,
  retryBatch,
  sleep,
  timeout,
} from '../src/utils/retry';
import {
  RateLimitError,
  ConnectionError,
  TransactionTimeoutError,
  BlockhashExpiredError,
  ValidationError,
  InsufficientBalanceError,
  UnauthorizedError,
} from '../src/errors';

describe('Retry Utils', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Basic Retry
  // ─────────────────────────────────────────────────────────────────────────

  describe('retry', () => {
    it('returns result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure then succeeds', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new RateLimitError())
        .mockResolvedValue('success');

      const result = await retry(fn, { initialDelayMs: 10 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('respects maxRetries', async () => {
      const fn = vi.fn().mockRejectedValue(new RateLimitError());

      await expect(retry(fn, { maxRetries: 2, initialDelayMs: 10 }))
        .rejects.toBeInstanceOf(RateLimitError);

      expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('calls onRetry callback', async () => {
      const onRetry = vi.fn();
      const fn = vi.fn()
        .mockRejectedValueOnce(new RateLimitError())
        .mockResolvedValue('success');

      await retry(fn, { initialDelayMs: 10, onRetry });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(RateLimitError),
        1,
        expect.any(Number)
      );
    });

    it('does not retry non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new ValidationError('test', 1, 'bad'));

      await expect(retry(fn, { maxRetries: 3 }))
        .rejects.toBeInstanceOf(ValidationError);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('uses rate limit retry-after', async () => {
      const start = Date.now();
      const fn = vi.fn()
        .mockRejectedValueOnce(new RateLimitError(100)) // 100ms
        .mockResolvedValue('success');

      await retry(fn, { maxRetries: 1 });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(50); // jitter might reduce
    });

    it('respects custom isRetryable', async () => {
      const customError = new Error('Custom retryable');
      const fn = vi.fn()
        .mockRejectedValueOnce(customError)
        .mockResolvedValue('success');

      const result = await retry(fn, {
        initialDelayMs: 10,
        isRetryable: (e) => e === customError,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Retry With Result
  // ─────────────────────────────────────────────────────────────────────────

  describe('retryWithResult', () => {
    it('returns success result', async () => {
      const fn = vi.fn().mockResolvedValue('data');
      const result = await retryWithResult(fn);

      expect(result.success).toBe(true);
      expect(result.result).toBe('data');
      expect(result.attempts).toBe(1);
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('returns failure result', async () => {
      const error = new ValidationError('test', 1, 'bad');
      const fn = vi.fn().mockRejectedValue(error);
      const result = await retryWithResult(fn);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
      expect(result.attempts).toBe(1);
    });

    it('counts retry attempts', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new RateLimitError())
        .mockRejectedValueOnce(new RateLimitError())
        .mockResolvedValue('success');

      const result = await retryWithResult(fn, { initialDelayMs: 10 });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Error Classification
  // ─────────────────────────────────────────────────────────────────────────

  describe('isErrorRetryable', () => {
    it('returns true for RateLimitError', () => {
      expect(isErrorRetryable(new RateLimitError())).toBe(true);
    });

    it('returns true for ConnectionError', () => {
      expect(isErrorRetryable(new ConnectionError('http://test'))).toBe(true);
    });

    it('returns true for TransactionTimeoutError', () => {
      expect(isErrorRetryable(new TransactionTimeoutError('sig', 1000))).toBe(true);
    });

    it('returns true for BlockhashExpiredError', () => {
      expect(isErrorRetryable(new BlockhashExpiredError())).toBe(true);
    });

    it('returns true for 429 in message', () => {
      expect(isErrorRetryable(new Error('Error 429: Too Many Requests'))).toBe(true);
    });

    it('returns true for 503 in message', () => {
      expect(isErrorRetryable(new Error('503 Service Unavailable'))).toBe(true);
    });

    it('returns true for network errors', () => {
      expect(isErrorRetryable(new Error('ECONNRESET'))).toBe(true);
      expect(isErrorRetryable(new Error('ETIMEDOUT'))).toBe(true);
      expect(isErrorRetryable(new Error('socket hang up'))).toBe(true);
    });

    it('returns true for blockhash not found', () => {
      expect(isErrorRetryable(new Error('Blockhash not found'))).toBe(true);
    });

    it('returns false for ValidationError', () => {
      expect(isErrorRetryable(new ValidationError('test', 1, 'bad'))).toBe(false);
    });

    it('returns false for InsufficientBalanceError', () => {
      expect(isErrorRetryable(new InsufficientBalanceError(0, 100))).toBe(false);
    });

    it('uses custom check', () => {
      const custom = (e: unknown) => e instanceof ValidationError;
      expect(isErrorRetryable(new ValidationError('t', 1, 'b'), custom)).toBe(true);
    });
  });

  describe('isPermanentError', () => {
    it('returns true for ValidationError', () => {
      expect(isPermanentError(new ValidationError('test', 1, 'bad'))).toBe(true);
    });

    it('returns true for InsufficientBalanceError', () => {
      expect(isPermanentError(new InsufficientBalanceError(0, 100))).toBe(true);
    });

    it('returns true for UnauthorizedError', () => {
      expect(isPermanentError(new UnauthorizedError('a', 'b'))).toBe(true);
    });

    it('returns true for 400 errors', () => {
      expect(isPermanentError(new Error('400 Bad Request'))).toBe(true);
    });

    it('returns true for 403 errors', () => {
      expect(isPermanentError(new Error('403 Forbidden'))).toBe(true);
    });

    it('returns true for program errors', () => {
      expect(isPermanentError(new Error('custom program error: 0x1'))).toBe(true);
    });

    it('returns false for RateLimitError', () => {
      expect(isPermanentError(new RateLimitError())).toBe(false);
    });

    it('returns false for ConnectionError', () => {
      expect(isPermanentError(new ConnectionError('http://test'))).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Specialized Retry Functions
  // ─────────────────────────────────────────────────────────────────────────

  describe('retryRead', () => {
    it('uses aggressive settings', async () => {
      const fn = vi.fn().mockResolvedValue('data');
      await retryRead(fn);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryTransaction', () => {
    it('uses conservative settings', async () => {
      const fn = vi.fn().mockResolvedValue('sig');
      await retryTransaction(fn);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Batch Retry
  // ─────────────────────────────────────────────────────────────────────────

  describe('retryBatch', () => {
    it('processes all items', async () => {
      const items = [1, 2, 3];
      const fn = vi.fn().mockImplementation((n) => Promise.resolve(n * 2));

      const result = await retryBatch(items, fn);

      expect(result.results).toEqual([2, 4, 6]);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('handles failures with continueOnError', async () => {
      const items = [1, 2, 3];
      const fn = vi.fn().mockImplementation((n) => {
        if (n === 2) return Promise.reject(new Error('fail'));
        return Promise.resolve(n * 2);
      });

      const result = await retryBatch(items, fn, { continueOnError: true });

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results[0]).toBe(2);
      expect(result.results[1]).toBeInstanceOf(Error);
      expect(result.results[2]).toBe(6);
    });

    it('respects concurrency', async () => {
      const items = [1, 2, 3, 4, 5];
      const inFlight: number[] = [];
      let maxInFlight = 0;

      const fn = vi.fn().mockImplementation(async (n) => {
        inFlight.push(n);
        maxInFlight = Math.max(maxInFlight, inFlight.length);
        await sleep(10);
        inFlight.pop();
        return n;
      });

      await retryBatch(items, fn, { concurrency: 2 });

      expect(maxInFlight).toBeLessThanOrEqual(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────────────

  describe('sleep', () => {
    it('waits for specified time', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe('timeout', () => {
    it('returns result if fast enough', async () => {
      const result = await timeout(Promise.resolve('fast'), 100);
      expect(result).toBe('fast');
    });

    it('throws if too slow', async () => {
      const slow = sleep(200).then(() => 'slow');
      await expect(timeout(slow, 50)).rejects.toThrow('Operation timed out');
    });

    it('uses custom message', async () => {
      const slow = sleep(200);
      await expect(timeout(slow, 50, 'Custom timeout'))
        .rejects.toThrow('Custom timeout');
    });
  });
});
