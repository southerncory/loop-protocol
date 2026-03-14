/**
 * Retry utilities with exponential backoff
 */

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay between retries in milliseconds */
  baseDelayMs: number;
  /** Maximum delay between retries in milliseconds */
  maxDelayMs: number;
  /** Optional jitter factor (0-1) to add randomness to delays */
  jitterFactor?: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.1,
};

/**
 * Error types that should NOT be retried
 */
const NON_RETRYABLE_ERRORS = [
  'InvalidPublicKey',
  'InvalidAmount',
  'ValidationError',
  'InsufficientFunds',
  'AccountNotFound',
  'InvalidInstruction',
  'InvalidOwner',
  'InvalidAuthority',
  'Unauthorized',
];

/**
 * HTTP status codes that indicate retryable errors
 */
const RETRYABLE_STATUS_CODES = [
  429, // Too Many Requests
  503, // Service Unavailable
  502, // Bad Gateway
  500, // Internal Server Error (sometimes transient)
  504, // Gateway Timeout
];

/**
 * Sleep for a specified number of milliseconds
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  // Check for non-retryable error names/messages
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : '';

  for (const nonRetryable of NON_RETRYABLE_ERRORS) {
    if (errorMessage.includes(nonRetryable) || errorName.includes(nonRetryable)) {
      return false;
    }
  }

  // Check for HTTP status codes
  if (typeof error === 'object' && error !== null) {
    const statusCode = (error as Record<string, unknown>).statusCode || 
                       (error as Record<string, unknown>).status ||
                       (error as Record<string, unknown>).code;
    
    if (typeof statusCode === 'number' && RETRYABLE_STATUS_CODES.includes(statusCode)) {
      return true;
    }
  }

  // Network errors are retryable
  if (errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('socket hang up')) {
    return true;
  }

  // RPC-specific retryable errors
  if (errorMessage.includes('blockhash not found') ||
      errorMessage.includes('Node is behind') ||
      errorMessage.includes('Too many requests') ||
      errorMessage.includes('rate limit')) {
    return true;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: baseDelay * 2^attempt
  let delay = config.baseDelayMs * Math.pow(2, attempt);
  
  // Apply max cap
  delay = Math.min(delay, config.maxDelayMs);
  
  // Add jitter if configured
  if (config.jitterFactor && config.jitterFactor > 0) {
    const jitter = delay * config.jitterFactor * Math.random();
    delay = delay + jitter;
  }
  
  return Math.floor(delay);
}

/**
 * Execute a function with automatic retry on transient failures
 * 
 * @param fn - The async function to execute
 * @param config - Optional retry configuration
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => connection.getBalance(pubkey),
 *   { maxRetries: 5, baseDelayMs: 500 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const finalConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt >= finalConfig.maxRetries) {
        break;
      }
      
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // Calculate and wait for backoff delay
      const delay = calculateDelay(attempt, finalConfig);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Execute a function with retry, returning a result object instead of throwing
 * 
 * @param fn - The async function to execute
 * @param config - Optional retry configuration
 * @returns Object with success flag and either result or error
 */
export async function tryWithRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<{ success: true; result: T } | { success: false; error: unknown }> {
  try {
    const result = await withRetry(fn, config);
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
}
