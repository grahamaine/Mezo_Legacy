# Mezo Legacy DApp — v2.0

A modern DeFi dashboard built with React, Wagmi v2, Viem, and Recharts.

## Stack

- **React 18** + TypeScript
- **Wagmi v2** — wallet connection & contract interaction
- **Viem** — Ethereum utilities (parseEther, formatEther)
- **Recharts** — charts (Area, Bar, Line)
- **React Router v6** — client-side routing
- **DM Mono + Syne** — typography

## Pages

| Route | Page | Description |
| --- | --- | --- |
| `/` | Dashboard | Metrics, ETH price chart, portfolio allocation, recent txns, gas tracker |
| `/staking` | Staking Vault | Stake / Withdraw / Transfer forms + rewards chart |
| `/history` | History | Filterable transaction history with Etherscan links |
| `/analysis` | Analysis | Volume bars, yield projection, on-chain metrics, holdings breakdown |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your contract

Edit `src/constants/staking.ts`:

```ts
export const STAKING_ADDRESS = '0xYourContractAddress';
```

### 3. Configure WalletConnect (optional)

Edit `src/wagmi.ts`:

```ts
const WALLETCONNECT_PROJECT_ID = 'your_project_id';
```

Get a free project ID at [cloud.walletconnect.com](https://cloud.walletconnect.com)

### 4. File structure

```text
src/
  App.tsx               ← Main app (all pages + wagmi hooks)
  App.css               ← All styles (dark DeFi theme)
  main.tsx              ← Entry point with WagmiProvider + QueryClientProvider
  wagmi.ts              ← Wagmi config (chains, connectors, transports)
  constants/
    staking.ts          ← Contract address + ABI
```

### 5. Run

```bash
npm run dev
```

### 6. Build for production

```bash
npm run build
```

## Contract ABI expected

Your staking contract should expose:

```solidity
function stake() external payable;
function withdraw(uint256 amount) external;
function getStakedBalance(address user) external view returns (uint256);
```

## Customization

- Colors: edit CSS variables in `:root` block of `App.css`
- Mock price data: edit `priceData` array in `App.tsx`
- Network: change `sepolia` to `mainnet` or another chain in `wagmi.ts`
- Etherscan links: update the base URL in `HistoryPage` (`sepolia.etherscan.io` → `etherscan.io`)