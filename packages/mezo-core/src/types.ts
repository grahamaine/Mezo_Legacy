/**
 * Transaction Status Types
 */
export type TransactionStatus = 'Pending' | 'Success' | 'Failed';

/**
 * Transaction Action Types
 */
export type TransactionType = 'Stake' | 'Withdraw' | 'Claim' | 'Transfer';

/**
 * Standard interface for all Mezo transactions
 * Used for history logs and UI state
 */
export interface TransactionRecord {
  id: string;               // Unique ID (usually the hash or a UUID)
  type: TransactionType;    // What happened?
  amount: string;           // Human readable amount (e.g., "0.5")
  asset: string;            // e.g., "BTC", "tBTC", "MEZO"
  status: TransactionStatus;
  hash: string;             // On-chain transaction hash
  timestamp: number;        // Unix timestamp
  blockNumber?: number;     // Optional: specific block height
  fee?: string;             // Optional: gas cost in native token
}

/**
 * User Staking Position Summary
 * Useful for dashboard metrics
 */
export interface StakingPosition {
  totalStaked: string;      // Total amount locked
  earnedRewards: string;    // Rewards available to claim
  apy: number;              // Current Annual Percentage Yield
  unlockDate?: number;      // Timestamp when funds are available (if locked)
}

/**
 * Mezo Network Metrics
 */
export interface MezoNetworkStats {
  tvl: string;              // Total Value Locked in USD or BTC
  activeNodes: number;
  blockHeight: number;
}