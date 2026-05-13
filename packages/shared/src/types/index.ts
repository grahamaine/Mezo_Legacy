export type Address = `0x${string}`;

export type ChainId = number;

export interface TokenBalance {
  address: Address;
  symbol: string;
  decimals: number;
  balance: bigint;
}
