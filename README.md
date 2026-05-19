# Mezo Legacy — Bitcoin Layer 2 DeFi Platform

> The primary gateway to the Mezo ecosystem — a Bitcoin-native Economic Layer (L2) built to activate idle BTC via Proof of HODL consensus.

**Live App:** [web-app-ainegb.vercel.app](https://web-app-ainegb.vercel.app)
**Network:** Mezo Testnet · Chain ID 31611 · RPC: `https://rpc.test.mezo.org`
**Explorer:** [explorer.test.mezo.org](https://explorer.test.mezo.org)
**GitHub:** [github.com/grahamaine/Mezo_Legacy](https://github.com/grahamaine/Mezo_Legacy)

---

## Table of Contents

- [Overview](#overview)
- [Feature Map](#feature-map)
- [Smart Contracts](#smart-contracts)
- [Pages & Functions](#pages--functions)
  - [Dashboard](#dashboard)
  - [Borrow MUSD](#borrow-musd)
  - [BTC Vault](#btc-vault)
  - [Staking](#staking)
  - [Swap](#swap)
  - [Pay](#pay)
  - [Savings](#savings)
  - [Shop](#shop)
  - [Games & Entertainment](#games--entertainment)
  - [KYB Verification](#kyb-verification)
  - [History](#history)
  - [Analysis](#analysis)
  - [Settings](#settings)
- [App Menu](#app-menu)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Overview

Mezo Legacy lets users interact with the Mezo Network (Bitcoin L2) through a full-featured DeFi web application. Users can stake BTC, borrow MUSD at a fixed 1% APR, deposit into vaults, swap tokens, send payments, earn savings yield, shop for merchant tools, play games with real economies, and complete business KYB verification — all powered by MUSD (Bitcoin-backed stablecoin).

---

## Feature Map

| Section | Route | Contract | Status |
|---|---|---|---|
| Dashboard | `/` | All reads | Live |
| Borrow MUSD | `/borrow` | MezoBorrow | Live |
| BTC Vault | `/vault` | MezoVault | Live |
| Staking | `/staking` | MezoStaking | Live |
| Swap | `/swap` | SwapRouter | Live |
| Pay | `/pay` | MUSD ERC-20 | Live |
| Savings | `/savings` | MezoStaking | Live |
| Shop | `/shop` | MUSD ERC-20 | Live |
| Games | `/games` | MUSD ERC-20 | Live |
| KYB | `/kyb` | MezoKYB | Ready to deploy |
| History | `/history` | — | Live |
| Analysis | `/analysis` | All reads | Live |
| Settings | `/settings` | — | Live |

---

## Smart Contracts

All contracts deployed on **Mezo Testnet (Chain 31611)**.

| Contract | Address | Functions |
|---|---|---|
| **MUSD Token** (ERC-20) | `0xf4a9B1F29599d519700893f34e4cc669CD550341` | `balanceOf`, `transfer`, `approve`, `transferFrom` |
| **MezoBorrow** | `0xeb1A838a9dD91eE9A3D15f21C6b1144ebcFB287a` | `borrow`, `repay`, `addCollateral`, `closePosition`, `getPosition` |
| **MezoVault** | `0xD35262b376E5211252fa1aedaf0375B460D1Beb5` | `deposit`, `withdraw`, `balanceOf`, `totalAssets` |
| **MezoStaking** | `0x3cB9d513e8eC79283e0Ca41784aCc2C072D1ACd1` | `stake`, `withdraw`, `getStakedBalance` |
| **SwapRouter** (V2) | `VITE_SWAP_ROUTER_ADDRESS` | `swapExactETHForTokens`, `swapExactTokensForETH`, `swapExactTokensForTokens`, `getAmountsOut` |
| **MezoKYB** | `VITE_KYB_ADDRESS` | `submitKYB`, `isVerified`, `getStatus`, `getApplication`, `approveKYB`, `rejectKYB` |

Contract source files: [`apps/web-app/contracts/`](apps/web-app/contracts/)

---

## Pages & Functions

### Dashboard

**Route:** `/`

Main overview with live on-chain data auto-refreshing every 12 seconds.

| Function | Description |
|---|---|
| BTC/USD Price Chart | Real-time AreaChart with 24H/7D/1M timeframes from live chain data |
| Portfolio Metrics | BTC balance, MUSD balance, staked BTC, total portfolio USD value |
| Active Borrow Banner | Shows collateral ratio, MUSD debt, health status when position is open |
| MUSD Carry Trade | Borrow at 1% APR, earn 4–8% DeFi yield for net +3–7% carry |
| Recent Transactions | Last 4 on-chain transactions with type, hash, timestamp, status |
| Gas Tracker | Live slow/standard/fast gas prices from Mezo network |
| Protocol Summary | MUSD borrowed, staking APY, borrow rate at a glance |
| All Features Menu | Grid icon opens the full app menu overlay |

---

### Borrow MUSD

**Route:** `/borrow` — **Contract:** MezoBorrow `0xeb1A838a9dD91eE9A3D15f21C6b1144ebcFB287a`

Deposit BTC collateral and mint MUSD at 1% fixed APR. No lock-up period.

| Function | On-chain Call | Description |
|---|---|---|
| Deposit & Borrow | `borrow(musdAmount)` payable | Deposit BTC + mint MUSD in one tx |
| Repay MUSD | `repay(musdAmount)` | Reduce debt and release proportional collateral |
| Add Collateral | `addCollateral()` payable | Top up BTC to improve collateral ratio |
| Close Position | `closePosition()` | Repay all debt and withdraw all BTC at once |
| Safe preset | — | Auto-fills MUSD at 200% collateral ratio |
| Max preset | — | Auto-fills MUSD at 150% collateral ratio (minimum) |
| Live Position | `getPosition(address)` view | btcCollateral, musdDebt, collateralRatio, accruedInterest |
| CR Health Bar | — | Visual bar: green ≥200%, amber ≥150%, red <150% |

---

### BTC Vault

**Route:** `/vault` — **Contract:** MezoVault `0xD35262b376E5211252fa1aedaf0375B460D1Beb5`

Secure BTC deposit and withdrawal vault.

| Function | On-chain Call | Description |
|---|---|---|
| Deposit BTC | `deposit()` payable | Deposit native BTC into the vault |
| Withdraw BTC | `withdraw(uint256)` | Withdraw BTC from vault by amount |
| MAX button | — | Pre-fills full vault balance |
| Vault TVL | `totalAssets()` view | Total BTC held across all users |
| User Balance | `balanceOf(address)` view | User's deposited BTC balance |
| Explorer Link | — | Direct link to vault contract on Mezo Explorer |

---

### Staking

**Route:** `/staking` — **Contract:** MezoStaking `0x3cB9d513e8eC79283e0Ca41784aCc2C072D1ACd1`

Stake BTC and earn 4.8% APY. No lock-up period.

| Function | On-chain Call | Description |
|---|---|---|
| Stake BTC | `stake()` payable | Stake native BTC |
| Unstake BTC | `withdraw(uint256)` | Withdraw staked BTC |
| MAX button | — | Pre-fills available or staked balance |
| Direct Transfer | `sendTransaction` | Send BTC to any address on Mezo |
| Staked Balance | `getStakedBalance(address)` view | Live staked amount for connected wallet |
| Rewards Chart | — | BarChart of weekly rewards (last 30 days) |

---

### Swap

**Route:** `/swap` — **Contract:** SwapRouter (Uniswap V2-compatible)

Swap between BTC, MUSD, and WBTC via the Mezo DEX router.

| Function | On-chain Call | Description |
|---|---|---|
| Price quote | `getAmountsOut(amountIn, path)` | Live on-chain quote, refreshes every 10s |
| BTC → Token | `swapExactETHForTokens(amountOutMin, path, to, deadline)` | Swap native BTC for any token |
| Token → BTC | `swapExactTokensForETH(amountIn, amountOutMin, path, to, deadline)` | Swap any token for native BTC |
| Token → Token | `swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline)` | Swap ERC-20 to ERC-20 |
| Approve | `MUSD.approve(router, amount)` | Required before ERC-20 input swaps |
| Slippage | — | 0.1% / 0.5% / 1% presets or custom |
| Price impact | — | Calculated and shown red if >3% |
| Flip tokens | — | Swaps from/to and carries amount |
| Contract Map | — | All 5 protocol contracts with addresses and explorer links |

---

### Pay

**Route:** `/pay` — **Contract:** MUSD ERC-20 `0xf4a9B1F29599d519700893f34e4cc669CD550341`

Send and receive MUSD globally with a full payment infrastructure showcase.

| Function | On-chain Call | Description |
|---|---|---|
| Send MUSD | `transfer(to, amount)` | Direct MUSD transfer to any address |
| Receive | — | Displays wallet address and QR code |
| Card Programs | — | Visa/Mastercard-compatible card issuance via MUSD |
| ATM Networks | — | BTC/MUSD ATM integration infrastructure |
| Subscriptions | — | Recurring billing and subscription management |
| Invoicing | — | Business invoice generation and payment |
| Remittance | — | Cross-border MUSD transfers |
| Agentic Payments | — | AI-powered autonomous payment flows |
| MUSD Infrastructure | — | Core transaction rails and settlement layer |

---

### Savings

**Route:** `/savings` — **Contract:** MezoStaking (read), MUSD ERC-20 (read)

Earn yield on BTC and MUSD through structured savings products.

| Product | APY | Term | Description |
|---|---|---|---|
| Fixed BTC Savings | 5.2% | 90 days | Locked term for maximum BTC yield |
| Flexible MUSD | 3.8% | None | Withdraw anytime, earn daily |
| Auto-Save | 2.4% | None | Automatic savings from round-ups |
| Yield Boost | 7.5% | 180 days | Premium locked term — highest yield |

| Function | Description |
|---|---|
| Product selector | Clickable cards with live APY and color coding |
| Yield projection chart | 12-month AreaChart with gradient per product |
| APY comparison chart | BarChart comparing all 4 products side-by-side |
| Savings goals | Progress bars for Emergency Fund, BTC Stack, Business Reserve |
| New goal modal | Create custom goal with name and target amount |
| Live balances | Reads MUSD `balanceOf` and MezoStaking `getStakedBalance` |

---

### Shop

**Route:** `/shop` — **Contract:** MUSD ERC-20 (`transfer` to merchant address)

Buy 28 digital products across 7 categories using MUSD.

| Category | Products |
|---|---|
| Gaming | Battle NFT Pack, Rare Skin Bundle, Power-Up Crate, Tournament Entry |
| Merchant | POS System Pro, E-Commerce Plugin, BNPL Kit, Smart Invoicing Suite, Affiliate Manager |
| Market | Event Ticketing SDK, P2P Marketplace Template, Membership NFT Pack, Local Services Board |
| Social | Creator Tip Page (FREE), Content Subscription Platform, Creator Analytics Pro, Community Rewards Kit |
| Lifestyle | Budget Planner, Travel Booking Credit, Fitness Membership, Productivity Suite |
| Emerging | AI Agent Credits, Music Streaming Rights, Dating App Boost, Streaming Pay-Per-View |
| DeFi | Yield Optimizer, Liquidity Miner Pro |

| Function | Description |
|---|---|
| Browse & filter | 7 category filters + text search |
| Cart | Add/remove items, running total in MUSD |
| Checkout | Calls MUSD `transfer(merchantAddress, total)` |
| FREE items | Get Free CTA — no payment, zero MUSD cost |
| Category grid | 5-column banner with product counts per category |

---

### Games & Entertainment

**Route:** `/games` — **Contract:** MUSD ERC-20 (entry fees and prize payouts)

Play-to-earn games, tournaments, and prediction markets with real MUSD economies.

| Game | Players | Entry Fee |
|---|---|---|
| BTC Blitz | 1,247 | 0.5 MUSD |
| Crypto Slots | 3,891 | 0.25 MUSD |
| Mezo Poker | 567 | 2.0 MUSD |
| DeFi Racer | 2,103 | 1.0 MUSD |
| Fantasy Sports | 2,103 | 5.0 MUSD |
| Mezo Quest RPG | 891 | 0.1 MUSD |

| Function | Description |
|---|---|
| Join game | Entry fee paid via MUSD `transfer` |
| Tournaments | 5 active brackets with live prize pools and participant counts |
| Leaderboard | Top 7 players ranked by MUSD earnings |
| Gaming Ecosystem | Real Economies, Prize Pools, In-Game Purchases, Prediction Markets tiles |
| Live wallet balance | Reads MUSD `balanceOf(address)` |

---

### KYB Verification

**Route:** `/kyb` — **Contract:** MezoKYB (deploy `contracts/MezoKYB.sol` to Chain 31611)

4-step business verification with on-chain proof recorded on the Mezo Network.

**Steps:**

| Step | Fields |
|---|---|
| 1. Business Info | Legal name, business type, registration number, country, year, website, email, phone |
| 2. Ownership | Owner name, title, email, phone, nationality, ownership % |
| 3. Documents | Business Registration (required), Tax ID (required), Proof of Address (required), Ownership Chart, Bank Statement |
| 4. Review & Submit | Full data review, wallet linkage, AML/Terms agreement |

**On-chain functions:**

| Function | On-chain Call | Description |
|---|---|---|
| Submit application | `submitKYB(bytes32 hash)` | Stores keccak256 hash — no PII on-chain |
| Read status | `getApplication(address)` view | Returns hash, timestamp, status (polls every 15s) |
| Global counters | `totalSubmissions()`, `totalApproved()` view | Protocol-wide KYB stats |
| Approve (admin) | `approveKYB(address)` | Owner unlocks $500K daily limit |
| Reject (admin) | `rejectKYB(address, reason)` | Owner rejects with reason string |
| Revoke (admin) | `revokeKYB(address)` | Owner revokes approved status |
| Network guard | — | Warns if wallet is not on Chain 31611 |
| Explorer link | — | TX hash links to `explorer.test.mezo.org` |

**Status levels:**

| Status | Daily Limit | Unlocks |
|---|---|---|
| None | $1,000 | Standard access |
| Pending | $1,000 | Under review |
| Approved | $500,000 | Merchant tools, payroll, API access |
| Rejected | $1,000 | Re-application allowed |

---

### History

**Route:** `/history`

Full transaction history with type filtering.

| Function | Description |
|---|---|
| Filter tabs | All / Borrow / Repay / Stake / Withdraw / Send / Deposit |
| Transaction rows | Type icon, hash (Mezo Explorer link), time ago, amount, status badge |
| Summary metrics | Total tx count, cumulative MUSD borrowed, total BTC staked |

---

### Analysis

**Route:** `/analysis`

Portfolio analytics and live on-chain metrics.

| Function | Description |
|---|---|
| Volume Chart | 7-day BarChart of BTC transaction volume |
| Yield Projection | 12-month AreaChart at 4.8% APY compounding |
| On-Chain Metrics | Vault TVL (USD), staking ratio, gas price, current block |
| Progress bars | Staking utilization %, reward efficiency %, network uptime |
| Holdings breakdown | Staked BTC, Vault BTC, Liquid BTC with USD values |

---

### Settings

**Route:** `/settings`

Network configuration and wallet security controls.

| Function | On-chain Call | Description |
|---|---|---|
| Network switcher | `switchChain({ chainId })` | Toggle between Mezo Mainnet (31612) and Testnet (31611) |
| Wallet info | — | Connected address with copy and Explorer link |
| Disconnect | `useDisconnect()` | Remove wallet from session |
| Connect | Reown AppKit | Opens multi-wallet modal (WalletConnect, MetaMask, etc.) |

---

## App Menu

A full-screen overlay accessible from three entry points across the app.

**Open from:**
- Sidebar — "All Features" button with count badge (desktop)
- Top bar — Grid icon button on Dashboard
- Mobile nav — "Menu" button in bottom navigation bar

**Features:**
- All 14 tabs displayed in a grid, grouped by section: Main / Consumer / Compliance / Settings
- Live search — filters tabs by name, description, and section
- Active tab highlighted with a color-coded checkmark
- Click any tile to navigate and close the menu
- ESC key to close
- Keyboard shortcut hint in footer

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 + vite-plugin-pwa |
| Blockchain hooks | Wagmi v2 + Viem |
| Wallet modal | Reown AppKit (WalletConnect v3) |
| Routing | React Router v6 |
| Charts | Recharts (AreaChart, BarChart, ResponsiveContainer) |
| Icons | Lucide React |
| Styling | CSS custom properties — navy dark blue theme (`--bg: #060d1b`) |
| Network | Mezo Testnet — EVM-compatible Bitcoin L2, Chain 31611 |

---

## Local Development

```bash
# Clone
git clone https://github.com/grahamaine/Mezo_Legacy.git
cd Mezo_Legacy/apps/web-app

# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env

# Start dev server
npm run dev
# → http://localhost:5173

# Production build
npm run build

# Preview build
npm run preview
```

---

## Environment Variables

Create `apps/web-app/.env`:

```env
# Required — get from cloud.reown.com
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Contract addresses — Mezo Testnet defaults already embedded in constants/
VITE_MUSD_ADDRESS=0xf4a9B1F29599d519700893f34e4cc669CD550341
VITE_BORROW_ADDRESS=0xeb1A838a9dD91eE9A3D15f21C6b1144ebcFB287a
VITE_STAKING_ADDRESS=0x3cB9d513e8eC79283e0Ca41784aCc2C072D1ACd1
VITE_VAULT_ADDRESS=0xD35262b376E5211252fa1aedaf0375B460D1Beb5

# Set after deploying contracts/MezoKYB.sol to Mezo Testnet
VITE_KYB_ADDRESS=0x...

# Set after deploying a Uniswap V2-compatible router to Mezo Testnet
VITE_SWAP_ROUTER_ADDRESS=0x...
VITE_WBTC_ADDRESS=0x...
```

---

## Deployment

### Vercel

```bash
cd apps/web-app

# Link project (first time only)
vercel link --yes --scope ainegb

# Deploy to production
vercel --prod --yes --scope ainegb
```

Production URL: **[web-app-ainegb.vercel.app](https://web-app-ainegb.vercel.app)**

### Deploy MezoKYB Smart Contract

```bash
cd apps/web-app

# Install Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Compile contracts
npx hardhat compile

# Deploy to Mezo Testnet
npx hardhat run scripts/deployKYB.ts --network mezo-testnet

# Add deployed address to Vercel
vercel env add VITE_KYB_ADDRESS production
```

---

## License

MIT
