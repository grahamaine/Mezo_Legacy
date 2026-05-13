# Mezo Legacy

A decentralized application (dApp) built on the **Mezo Network** — an EVM-compatible Bitcoin Layer 2. Mezo Legacy provides vault deposits, staking, and live on-chain data for BTC-native DeFi.

🔗 **Live App:** [web-app-ainegb.vercel.app](https://web-app-ainegb.vercel.app)

---

## Deployed Contracts — Mezo Testnet (Chain ID: 31611)

| Contract | Address |
|----------|---------|
| **MezoVault** | [`0xD35262b376E5211252fa1aedaf0375B460D1Beb5`](https://explorer.test.mezo.org/address/0xD35262b376E5211252fa1aedaf0375B460D1Beb5) |
| **MezoStaking** | [`0x3cB9d513e8eC79283e0Ca41784aCc2C072D1ACd1`](https://explorer.test.mezo.org/address/0x3cB9d513e8eC79283e0Ca41784aCc2C072D1ACd1) |

---

## Project Structure

```
mezo-legacy/
├── apps/
│   ├── web-app/              # React + Vite dApp (deployed on Vercel)
│   │   ├── src/
│   │   │   ├── components/   # UI components
│   │   │   ├── config/       # Wagmi + Reown AppKit setup
│   │   │   ├── constants/    # Contract addresses & ABIs
│   │   │   └── hooks/        # Live chain data hooks
│   │   └── contracts/        # Solidity source (reference)
│   └── mobile-app/           # Flutter mobile app (iOS + Android)
├── packages/
│   ├── contracts/            # Hardhat workspace
│   │   ├── contracts/        # MezoVault.sol + MezoStaking.sol
│   │   └── scripts/          # Deployment scripts
│   ├── mezo-core/            # TypeScript SDK for Mezo interactions
│   └── shared/               # Shared utilities, types, formatters
├── infrastructure/           # Docker + Kubernetes node setup
└── docs/                     # Documentation
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Blockchain** | Wagmi v2, Viem v2, Ethers v6 |
| **Wallet** | Reown AppKit, MetaMask, WalletConnect |
| **Contracts** | Solidity 0.8.24, Hardhat |
| **Network** | Mezo Testnet (EVM, Chain ID 31611) |
| **Mobile** | Flutter / Dart |
| **Deployment** | Vercel (web), Docker/K8s (nodes) |
| **Monorepo** | Turborepo + npm workspaces |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- MetaMask with Mezo Testnet configured

### Add Mezo Testnet to MetaMask

| Field | Value |
|-------|-------|
| Network Name | Mezo Testnet |
| RPC URL | `https://rpc.test.mezo.org` |
| Chain ID | `31611` |
| Currency | BTC |
| Explorer | `https://explorer.test.mezo.org` |

### Local Development

```bash
# Clone the repo
git clone https://github.com/grahamaine/Mezo_Legacy.git
cd Mezo_Legacy

# Install all workspace dependencies
npm install

# Create web-app environment file
cp apps/web-app/.env.test apps/web-app/.env
# Then fill in your VITE_PROJECT_ID from https://cloud.reown.com

# Start the dev server
cd apps/web-app && npm run dev
```

App runs at `http://localhost:5173`

---

## Smart Contracts

### MezoVault
Accepts BTC deposits and manages user balances securely.

```solidity
deposit()                          // Deposit BTC (payable)
withdraw(uint256 amount)           // Withdraw your balance
balanceOf(address user) → uint256  // Check user balance
totalAssets() → uint256            // Total vault holdings
```

### MezoStaking
Stake BTC to earn rewards on the Mezo Network.

```solidity
stake()                                // Stake BTC (payable)
withdraw(uint256 amount)               // Withdraw staked BTC
getStakedBalance(address user) → uint256 // Check staked balance
```

### Deploy Contracts

```bash
cd packages/contracts

# Copy and fill in your deployer key
cp .env.example .env

# Compile
npm run compile

# Deploy to Mezo Testnet
npm run deploy:testnet
```

---

## Environment Variables

### `apps/web-app/.env`

```env
VITE_PROJECT_ID=                    # Reown AppKit project ID
VITE_WALLETCONNECT_PROJECT_ID=      # Same as above
VITE_RPC_URL=https://rpc.test.mezo.org
VITE_CHAIN_ID=31611
VITE_VAULT_ADDRESS=0xD35262b376E5211252fa1aedaf0375B460D1Beb5
VITE_STAKING_ADDRESS=0x3cB9d513e8eC79283e0Ca41784aCc2C072D1ACd1
```

### `packages/contracts/.env`

```env
DEPLOYER_PRIVATE_KEY=   # Never commit this!
MEZO_RPC_URL=https://rpc.test.mezo.org
```

---

## Infrastructure

The `infrastructure/` folder contains Docker Compose and Helm charts for running a full Mezo node alongside the dApp.

```bash
# Start a local Mezo node
cd infrastructure && docker-compose up -d
```

See the [Mezo Validator Kit](https://github.com/mezo-org/validator-kit) for full node documentation.

---

## Resources

- [Mezo Network](https://mezo.org)
- [Mezo Docs](https://mezo.org/docs)
- [Mezo Testnet Explorer](https://explorer.test.mezo.org)
- [Mezo Testnet Faucet](https://faucet.test.mezo.org)
- [Reown AppKit](https://cloud.reown.com)
- [Validator Kit](https://github.com/mezo-org/validator-kit)

---

## License

MIT © Mezo Legacy
