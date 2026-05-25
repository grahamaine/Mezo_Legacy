// src/constants/staking.ts

// Staking contract — read from env with hardcoded fallback
export const STAKING_ADDRESS = (
  import.meta.env.VITE_STAKING_ADDRESS ||
  '0x3cB9d513e8eC79283e0Ca41784aCc2C072D1ACd1'
) as `0x${string}`;

// Vault contract — read from env with hardcoded fallback
export const VAULT_ADDRESS = (
  import.meta.env.VITE_VAULT_ADDRESS ||
  '0xD35262b376E5211252fa1aedaf0375B460D1Beb5'
) as `0x${string}`;

export const STAKING_ABI = [
  // stake() — payable, no args, accepts BTC value
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  // withdraw(uint256 amount)
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  // getStakedBalance(address user) → uint256
  {
    name: 'getStakedBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Events
  {
    name: 'Staked',
    type: 'event',
    inputs: [
      { name: 'user',   type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Withdrawn',
    type: 'event',
    inputs: [
      { name: 'user',   type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

// ERC-4626 Vault ABI
export const VAULT_ABI = [
  // deposit(uint256 assets, address receiver) → uint256 shares
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'assets',   type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  // withdraw(uint256 assets, address receiver, address owner) → uint256 shares
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets',   type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner',    type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  // balanceOf(address account) → uint256
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // totalAssets() → uint256
  {
    name: 'totalAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Events
  {
    name: 'Deposit',
    type: 'event',
    inputs: [
      { name: 'sender',   type: 'address', indexed: true },
      { name: 'owner',    type: 'address', indexed: true },
      { name: 'assets',   type: 'uint256', indexed: false },
      { name: 'shares',   type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Withdraw',
    type: 'event',
    inputs: [
      { name: 'sender',   type: 'address', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'owner',    type: 'address', indexed: true },
      { name: 'assets',   type: 'uint256', indexed: false },
      { name: 'shares',   type: 'uint256', indexed: false },
    ],
  },
] as const;
