<p align="center"><a href="https://github.com/grahamaine"><img src=".github/thee-agency/powered-by-thee-agency.svg" alt="Powered by thee AGENCY Consults (UG)"></a></p>

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

---

<!-- thee-agency-portfolio:start -->
## More work by thee AGENCY Consults (UG) Limited

### Web portals & websites

| Project | What it is | Live link |
|---|---|---|
| 6 Summits Rwenzori | Trekking & safari website with an owner console | [6summitsafrica.com](https://www.6summitsafrica.com) |
| Airport View Hotel | Hotel website, Entebbe | [airportviewhotel.co.ug](https://airportviewhotel.co.ug) |
| StudioX Uganda | Photography, videography & film production app | [studiox-client.vercel.app](https://studiox-client.vercel.app) |
| Attitude Aviation Academy | Academy admin portal | [attitude-aviation-portal.vercel.app](https://attitude-aviation-portal.vercel.app) |
| Relish Spa & Wellness | Spa & wellness website | [relish-spa-wellness.vercel.app](https://relish-spa-wellness.vercel.app) |
| Construction Consultancy | Consultancy company website | [construction-consultancy-site.vercel.app](https://construction-consultancy-site.vercel.app) |

### dApps (open source)

[Kakasa (cord-dapp)](https://github.com/grahamaine/cord-dapp) ·
[Pamoja](https://github.com/grahamaine/Pamoja) ·
[Universal Pay](https://github.com/grahamaine/universal-pay) ·
[ChainLinks](https://github.com/grahamaine/ChainLinks) ·
[KitePay](https://github.com/grahamaine/KitePay_) ·
[Aura Agentic](https://github.com/grahamaine/aura-agentic) ·
[Mezo Legacy](https://github.com/grahamaine/Mezo_Legacy) ·
[Arc Legacy](https://github.com/grahamaine/arc-legacy) ·
[Cantongun](https://github.com/grahamaine/cantongun-dapp) ·
[Moove Build](https://github.com/grahamaine/moove-build) ·
[Solana Dev](https://github.com/grahamaine/solana-dev) ·
[Habitual Trends](https://github.com/grahamaine/habitual_trends)

**Contact:** ✉️ [ainegb05@gmail.com](mailto:ainegb05@gmail.com) · 💬 WhatsApp [+256 742 701 202](https://wa.me/256742701202)
<!-- thee-agency-portfolio:end -->

<p align="center">
  <a href="https://github.com/grahamaine"><img src=".github/thee-agency/thee-agency-card-1280x640.png" width="520" alt="thee AGENCY Consults (UG) Limited: Innovation Unleashed"></a><br>
  <b>Powered &amp; rendered by thee AGENCY Consults (UG) Limited</b><br>
  <sub>Innovation Unleashed · Web Portals · dApps · Websites · Entebbe, Uganda</sub>
</p>
