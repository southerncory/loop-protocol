/**
 * Formatting utilities for Loop Protocol SDK
 */

import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Token decimals
const CRED_DECIMALS = 6;
const OXO_DECIMALS = 6;

/**
 * Format a BN token amount with decimals and thousands separators
 * 
 * @param amount - Amount in smallest units
 * @param decimals - Number of decimal places
 * @param displayDecimals - Number of decimals to display (default: 2)
 * @returns Formatted string like "1,234.56"
 */
function formatTokenAmount(amount: BN, decimals: number, displayDecimals: number = 2): string {
  const str = amount.toString().padStart(decimals + 1, '0');
  const integerPart = str.slice(0, -decimals) || '0';
  const decimalPart = str.slice(-decimals);
  
  // Add thousands separators to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Truncate decimal part to display decimals
  const truncatedDecimal = decimalPart.slice(0, displayDecimals).padEnd(displayDecimals, '0');
  
  return `${formattedInteger}.${truncatedDecimal}`;
}

/**
 * Format a CRED amount for display
 * 
 * @param amount - Amount in smallest units (1 CRED = 1,000,000)
 * @returns Formatted string like "1,234.56 CRED"
 * 
 * @example
 * ```typescript
 * formatCred(new BN(1_234_560_000)); // "1,234.56 CRED"
 * ```
 */
export function formatCred(amount: BN): string {
  return `${formatTokenAmount(amount, CRED_DECIMALS)} CRED`;
}

/**
 * Format an OXO amount for display
 * 
 * @param amount - Amount in smallest units (1 OXO = 1,000,000)
 * @returns Formatted string like "1,234.56 OXO"
 * 
 * @example
 * ```typescript
 * formatOxo(new BN(1_234_560_000)); // "1,234.56 OXO"
 * ```
 */
export function formatOxo(amount: BN): string {
  return `${formatTokenAmount(amount, OXO_DECIMALS)} OXO`;
}

/**
 * Format a percentage from basis points
 * 
 * @param bps - Basis points (100 bps = 1%)
 * @returns Formatted string like "5.00%"
 * 
 * @example
 * ```typescript
 * formatPercentage(500);  // "5.00%"
 * formatPercentage(25);   // "0.25%"
 * formatPercentage(10000); // "100.00%"
 * ```
 */
export function formatPercentage(bps: number): string {
  const percent = bps / 100;
  return `${percent.toFixed(2)}%`;
}

/**
 * Format a duration in seconds to human-readable string
 * 
 * @param seconds - Duration in seconds
 * @returns Human-readable string like "6 months" or "1 year"
 * 
 * @example
 * ```typescript
 * formatDuration(15_552_000);  // "6 months"
 * formatDuration(31_536_000);  // "1 year"
 * formatDuration(126_144_000); // "4 years"
 * formatDuration(86400);       // "1 day"
 * ```
 */
export function formatDuration(seconds: number): string {
  const MINUTE = 60;
  const HOUR = MINUTE * 60;
  const DAY = HOUR * 24;
  const MONTH = DAY * 30;
  const YEAR = DAY * 365;
  
  if (seconds >= YEAR) {
    const years = Math.floor(seconds / YEAR);
    return years === 1 ? '1 year' : `${years} years`;
  }
  
  if (seconds >= MONTH) {
    const months = Math.floor(seconds / MONTH);
    return months === 1 ? '1 month' : `${months} months`;
  }
  
  if (seconds >= DAY) {
    const days = Math.floor(seconds / DAY);
    return days === 1 ? '1 day' : `${days} days`;
  }
  
  if (seconds >= HOUR) {
    const hours = Math.floor(seconds / HOUR);
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  
  if (seconds >= MINUTE) {
    const minutes = Math.floor(seconds / MINUTE);
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }
  
  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}

/**
 * Shorten a public key address for display
 * 
 * @param address - PublicKey or string address
 * @param chars - Number of characters to show on each end (default: 4)
 * @returns Shortened address like "7xKX...3nP9"
 * 
 * @example
 * ```typescript
 * shortenAddress(new PublicKey('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'));
 * // "7xKX...sAsU"
 * ```
 */
export function shortenAddress(address: PublicKey | string, chars: number = 4): string {
  const str = typeof address === 'string' ? address : address.toBase58();
  
  if (str.length <= chars * 2 + 3) {
    return str;
  }
  
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

/**
 * Format a Unix timestamp to readable date string
 * 
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string
 * 
 * @example
 * ```typescript
 * formatTimestamp(1700000000); // "Nov 14, 2023"
 * ```
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a Unix timestamp to relative time string
 * 
 * @param timestamp - Unix timestamp in seconds
 * @returns Relative time string like "in 2 days" or "3 hours ago"
 * 
 * @example
 * ```typescript
 * formatRelativeTime(futureTimestamp);  // "in 2 days"
 * formatRelativeTime(pastTimestamp);    // "3 hours ago"
 * ```
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  
  const duration = formatDuration(absDiff);
  
  if (diff > 0) {
    return `in ${duration}`;
  } else if (diff < 0) {
    return `${duration} ago`;
  }
  
  return 'now';
}

/**
 * Format a number with compact notation for large values
 * 
 * @param value - Numeric value
 * @returns Compact string like "1.2M" or "3.5K"
 * 
 * @example
 * ```typescript
 * formatCompact(1_500_000);  // "1.5M"
 * formatCompact(25_000);     // "25K"
 * formatCompact(999);        // "999"
 * ```
 */
export function formatCompact(value: number): string {
  const BILLION = 1_000_000_000;
  const MILLION = 1_000_000;
  const THOUSAND = 1_000;
  
  if (value >= BILLION) {
    return `${(value / BILLION).toFixed(1)}B`;
  }
  
  if (value >= MILLION) {
    return `${(value / MILLION).toFixed(1)}M`;
  }
  
  if (value >= THOUSAND) {
    return `${(value / THOUSAND).toFixed(1)}K`;
  }
  
  return value.toString();
}
