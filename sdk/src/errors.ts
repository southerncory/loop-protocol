/**
 * Loop Protocol SDK - Custom Error Classes
 * 
 * Provides typed, descriptive errors for all SDK operations
 */

/**
 * Base error class for all Loop Protocol errors
 */
export class LoopError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'LoopError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =============================================================================
// Transaction Errors
// =============================================================================

/**
 * Thrown when a blockchain transaction fails to execute
 */
export class TransactionFailedError extends LoopError {
  constructor(message: string = 'Transaction failed to execute') {
    super(message, 'TRANSACTION_FAILED');
    this.name = 'TransactionFailedError';
  }
}

/**
 * Thrown when a transaction exceeds the timeout period
 */
export class TransactionTimeoutError extends LoopError {
  constructor(message: string = 'Transaction timed out waiting for confirmation') {
    super(message, 'TRANSACTION_TIMEOUT');
    this.name = 'TransactionTimeoutError';
  }
}

/**
 * Thrown when the wallet has insufficient funds for an operation
 */
export class InsufficientFundsError extends LoopError {
  constructor(message: string = 'Insufficient funds in wallet') {
    super(message, 'INSUFFICIENT_FUNDS');
    this.name = 'InsufficientFundsError';
  }
}

// =============================================================================
// Vault Errors
// =============================================================================

/**
 * Thrown when attempting to access a vault that does not exist
 */
export class VaultNotFoundError extends LoopError {
  constructor(message: string = 'Vault not found') {
    super(message, 'VAULT_NOT_FOUND');
    this.name = 'VaultNotFoundError';
  }
}

/**
 * Thrown when attempting to create a vault that already exists
 */
export class VaultAlreadyExistsError extends LoopError {
  constructor(message: string = 'Vault already exists for this owner') {
    super(message, 'VAULT_ALREADY_EXISTS');
    this.name = 'VaultAlreadyExistsError';
  }
}

/**
 * Thrown when vault balance is insufficient for the requested operation
 */
export class InsufficientBalanceError extends LoopError {
  constructor(message: string = 'Insufficient balance in vault') {
    super(message, 'INSUFFICIENT_BALANCE');
    this.name = 'InsufficientBalanceError';
  }
}

/**
 * Thrown when a stacking position cannot be found
 */
export class StackingPositionNotFoundError extends LoopError {
  constructor(message: string = 'Stacking position not found') {
    super(message, 'STACKING_POSITION_NOT_FOUND');
    this.name = 'StackingPositionNotFoundError';
  }
}

/**
 * Thrown when attempting to unstake before the maturity period
 */
export class StackingNotMatureError extends LoopError {
  constructor(message: string = 'Stacking position has not reached maturity') {
    super(message, 'STACKING_NOT_MATURE');
    this.name = 'StackingNotMatureError';
  }
}

// =============================================================================
// Capture Errors
// =============================================================================

/**
 * Thrown when a capture operation fails
 */
export class CaptureFailedError extends LoopError {
  constructor(message: string = 'Capture operation failed') {
    super(message, 'CAPTURE_FAILED');
    this.name = 'CaptureFailedError';
  }
}

/**
 * Thrown when proof verification fails
 */
export class ProofVerificationFailedError extends LoopError {
  constructor(message: string = 'Proof verification failed') {
    super(message, 'PROOF_VERIFICATION_FAILED');
    this.name = 'ProofVerificationFailedError';
  }
}

/**
 * Thrown when an invalid capture type is provided
 */
export class InvalidCaptureTypeError extends LoopError {
  constructor(message: string = 'Invalid capture type specified') {
    super(message, 'INVALID_CAPTURE_TYPE');
    this.name = 'InvalidCaptureTypeError';
  }
}

// =============================================================================
// Security Errors
// =============================================================================

/**
 * Thrown when a session has expired and needs refresh
 */
export class SessionExpiredError extends LoopError {
  constructor(message: string = 'Session has expired') {
    super(message, 'SESSION_EXPIRED');
    this.name = 'SessionExpiredError';
  }
}

/**
 * Thrown when an operation is attempted without proper authorization
 */
export class UnauthorizedError extends LoopError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Thrown when an operation violates security policies
 */
export class PolicyViolationError extends LoopError {
  constructor(message: string = 'Operation violates security policy') {
    super(message, 'POLICY_VIOLATION');
    this.name = 'PolicyViolationError';
  }
}

// =============================================================================
// Agent Errors
// =============================================================================

/**
 * Thrown when an agent cannot be found
 */
export class AgentNotFoundError extends LoopError {
  constructor(message: string = 'Agent not found') {
    super(message, 'AGENT_NOT_FOUND');
    this.name = 'AgentNotFoundError';
  }
}

/**
 * Thrown when an agent lacks authorization for an operation
 */
export class AgentNotAuthorizedError extends LoopError {
  constructor(message: string = 'Agent is not authorized for this operation') {
    super(message, 'AGENT_NOT_AUTHORIZED');
    this.name = 'AgentNotAuthorizedError';
  }
}

// =============================================================================
// Input Validation Errors
// =============================================================================

/**
 * Thrown when an invalid public key is provided
 */
export class InvalidPublicKeyError extends LoopError {
  constructor(message: string = 'Invalid public key format') {
    super(message, 'INVALID_PUBLIC_KEY');
    this.name = 'InvalidPublicKeyError';
  }
}

/**
 * Thrown when an invalid amount is provided
 */
export class InvalidAmountError extends LoopError {
  constructor(message: string = 'Invalid amount specified') {
    super(message, 'INVALID_AMOUNT');
    this.name = 'InvalidAmountError';
  }
}
