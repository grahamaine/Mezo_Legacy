// ── Mezo DEX Swap Router (Uniswap V2-compatible) ─────────────────────────────
// Replace VITE_SWAP_ROUTER_ADDRESS in .env with the deployed address on
// Mezo Mainnet (31612) or Testnet (31611).
export const SWAP_ROUTER_ADDRESS = (
  import.meta.env.VITE_SWAP_ROUTER_ADDRESS || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
) as `0x${string}`;

// WBTC wrapper on Mezo — needed by the router as the "WETH" equivalent
export const WBTC_ADDRESS = (
  import.meta.env.VITE_WBTC_ADDRESS || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
) as `0x${string}`;

// ── Mezo token list for the swap UI ──────────────────────────────────────────
export const SWAP_TOKENS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin (native)',
    address: 'NATIVE' as const,
    decimals: 18,
    color: '#f59e0b',
    logoChar: '₿',
  },
  {
    symbol: 'MUSD',
    name: 'Mezo USD',
    address: import.meta.env.VITE_MUSD_ADDRESS || '0xf4a9B1F29599d519700893f34e4cc669CD550341',
    decimals: 18,
    color: '#7c6ef7',
    logoChar: 'M',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    address: import.meta.env.VITE_WBTC_ADDRESS || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    decimals: 8,
    color: '#f97316',
    logoChar: 'W',
  },
] as const;

// ── Uniswap V2 Router ABI (subset used by this app) ──────────────────────────
export const SWAP_ROUTER_ABI = [
  // Read
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path',     type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'getAmountsIn',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'path',      type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  // Swap ETH (BTC) → tokens
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256'   },
      { name: 'path',         type: 'address[]' },
      { name: 'to',           type: 'address'   },
      { name: 'deadline',     type: 'uint256'   },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  // Swap tokens → ETH (BTC)
  {
    name: 'swapExactTokensForETH',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn',     type: 'uint256'   },
      { name: 'amountOutMin', type: 'uint256'   },
      { name: 'path',         type: 'address[]' },
      { name: 'to',           type: 'address'   },
      { name: 'deadline',     type: 'uint256'   },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  // Swap tokens → tokens
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn',     type: 'uint256'   },
      { name: 'amountOutMin', type: 'uint256'   },
      { name: 'path',         type: 'address[]' },
      { name: 'to',           type: 'address'   },
      { name: 'deadline',     type: 'uint256'   },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  // Events
  {
    name: 'Swap',
    type: 'event',
    inputs: [
      { name: 'sender',     type: 'address', indexed: true  },
      { name: 'amount0In',  type: 'uint256', indexed: false },
      { name: 'amount1In',  type: 'uint256', indexed: false },
      { name: 'amount0Out', type: 'uint256', indexed: false },
      { name: 'amount1Out', type: 'uint256', indexed: false },
      { name: 'to',         type: 'address', indexed: true  },
    ],
  },
] as const;
