// ── MUSD ERC-20 token ────────────────────────────────────────────────────────
export const MUSD_ADDRESS = (
  import.meta.env.VITE_MUSD_ADDRESS || '0xf4a9B1F29599d519700893f34e4cc669CD550341'
) as `0x${string}`;

export const MUSD_ABI = [
  // ERC-20 read
  { name: 'name',        type: 'function', stateMutability: 'view',        inputs: [], outputs: [{ type: 'string'  }] },
  { name: 'symbol',      type: 'function', stateMutability: 'view',        inputs: [], outputs: [{ type: 'string'  }] },
  { name: 'decimals',    type: 'function', stateMutability: 'view',        inputs: [], outputs: [{ type: 'uint8'   }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view',        inputs: [], outputs: [{ type: 'uint256' }] },
  {
    name: 'balanceOf',   type: 'function', stateMutability: 'view',
    inputs:  [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'allowance',   type: 'function', stateMutability: 'view',
    inputs:  [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  // ERC-20 write
  {
    name: 'transfer',    type: 'function', stateMutability: 'nonpayable',
    inputs:  [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'approve',     type: 'function', stateMutability: 'nonpayable',
    inputs:  [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'transferFrom', type: 'function', stateMutability: 'nonpayable',
    inputs:  [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ type: 'bool' }],
  },
  // Events
  {
    name: 'Transfer', type: 'event',
    inputs: [
      { name: 'from',  type: 'address', indexed: true  },
      { name: 'to',    type: 'address', indexed: true  },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Approval', type: 'event',
    inputs: [
      { name: 'owner',   type: 'address', indexed: true  },
      { name: 'spender', type: 'address', indexed: true  },
      { name: 'value',   type: 'uint256', indexed: false },
    ],
  },
] as const;

// ── MezoBorrow protocol ──────────────────────────────────────────────────────
export const BORROW_ADDRESS = (
  import.meta.env.VITE_BORROW_ADDRESS || '0xeb1A838a9dD91eE9A3D15f21C6b1144ebcFB287a'
) as `0x${string}`;

export const BORROW_ABI = [
  // Constants / state
  { name: 'MIN_COLLATERAL_RATIO', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'BORROW_RATE_PCT',      type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'btcPriceUsd',          type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  // Views
  {
    name: 'getPosition', type: 'function', stateMutability: 'view',
    inputs:  [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'btcCollateral',   type: 'uint256' },
      { name: 'musdDebt',        type: 'uint256' },
      { name: 'collateralRatio', type: 'uint256' },
      { name: 'accruedInterest', type: 'uint256' },
    ],
  },
  {
    name: 'maxBorrow', type: 'function', stateMutability: 'view',
    inputs:  [{ name: 'btcWei', type: 'uint256' }],
    outputs: [{ name: 'musdAmount', type: 'uint256' }],
  },
  // Writes
  {
    name: 'borrow',         type: 'function', stateMutability: 'payable',
    inputs:  [{ name: 'musdAmount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'repay',          type: 'function', stateMutability: 'nonpayable',
    inputs:  [{ name: 'musdAmount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'addCollateral',  type: 'function', stateMutability: 'payable',
    inputs:  [],
    outputs: [],
  },
  {
    name: 'closePosition',  type: 'function', stateMutability: 'nonpayable',
    inputs:  [],
    outputs: [],
  },
  // Events
  {
    name: 'Borrowed', type: 'event',
    inputs: [
      { name: 'user',          type: 'address', indexed: true  },
      { name: 'btcCollateral', type: 'uint256', indexed: false },
      { name: 'musdMinted',    type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'Repaid', type: 'event',
    inputs: [
      { name: 'user',        type: 'address', indexed: true  },
      { name: 'musdRepaid',  type: 'uint256', indexed: false },
      { name: 'btcReleased', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'PositionClosed', type: 'event',
    inputs: [
      { name: 'user',        type: 'address', indexed: true  },
      { name: 'btcReturned', type: 'uint256', indexed: false },
      { name: 'musdBurned',  type: 'uint256', indexed: false },
    ],
  },
] as const;
