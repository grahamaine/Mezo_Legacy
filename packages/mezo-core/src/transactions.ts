import { Address, parseUnits } from 'viem';
import { MEZO_PORTAL_ABI } from './abis';

export const MEZO_STAKING_ADDR = '0xAB13B8eecf5AA2460841d75da5d5D861fD5B8A39' as Address;

export const mezoStakingActions = {
  prepareStake: (amount: string, decimals: number = 18) => ({
    address: MEZO_STAKING_ADDR,
    abi: MEZO_PORTAL_ABI, // Added ABI here
    functionName: 'deposit', // Updated to match standard Portal naming
    args: [parseUnits(amount, decimals)],
  }),

  prepareWithdraw: (amount: string, decimals: number = 18) => ({
    address: MEZO_STAKING_ADDR,
    abi: MEZO_PORTAL_ABI, // Added ABI here
    functionName: 'withdraw',
    args: [parseUnits(amount, decimals)],
  }),
};