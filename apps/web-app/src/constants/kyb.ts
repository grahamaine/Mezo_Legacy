// ── MezoKYB on-chain registry ─────────────────────────────────────────────────
// Deploy contracts/MezoKYB.sol to Mezo Testnet (31611) and set this env var.
// npx hardhat run scripts/deployKYB.ts --network mezo-testnet
export const KYB_ADDRESS = (
  import.meta.env.VITE_KYB_ADDRESS || '0x0000000000000000000000000000000000000000'
) as `0x${string}`;

export const KYB_ABI = [
  // ── Applicant write ────────────────────────────────────────────────────────
  {
    name: 'submitKYB',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs:  [{ name: 'applicationHash', type: 'bytes32' }],
    outputs: [],
  },
  // ── Views ──────────────────────────────────────────────────────────────────
  {
    name: 'isVerified',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getStatus',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint8' }],  // 0=None 1=Pending 2=Approved 3=Rejected
  },
  {
    name: 'getApplication',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'dataHash',    type: 'bytes32' },
      { name: 'submittedAt', type: 'uint256' },
      { name: 'status',      type: 'uint8'   },
    ],
  },
  {
    name: 'totalSubmissions',
    type: 'function',
    stateMutability: 'view',
    inputs:  [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalApproved',
    type: 'function',
    stateMutability: 'view',
    inputs:  [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // ── Events ─────────────────────────────────────────────────────────────────
  {
    name: 'KYBSubmitted',
    type: 'event',
    inputs: [
      { name: 'applicant',       type: 'address', indexed: true  },
      { name: 'applicationHash', type: 'bytes32', indexed: false },
      { name: 'timestamp',       type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'KYBApproved',
    type: 'event',
    inputs: [
      { name: 'applicant',  type: 'address', indexed: true  },
      { name: 'timestamp',  type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'KYBRejected',
    type: 'event',
    inputs: [
      { name: 'applicant', type: 'address', indexed: true  },
      { name: 'reason',    type: 'string',  indexed: false },
    ],
  },
] as const;

// ── Status enum mirror ─────────────────────────────────────────────────────────
export const KYB_STATUS = {
  None:     0,
  Pending:  1,
  Approved: 2,
  Rejected: 3,
} as const;

export type KYBStatusValue = typeof KYB_STATUS[keyof typeof KYB_STATUS];
