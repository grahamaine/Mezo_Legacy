// src/constants/staking.ts
// Replace STAKING_ADDRESS with your deployed contract address on Sepolia

export const STAKING_ADDRESS = '0xYourContractAddressHere' as `0x${string}`;

export const STAKING_ABI = [
  // stake() — payable, no args, accepts ETH value
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
] as const;// "as const" is vital for Wagmi type-safety