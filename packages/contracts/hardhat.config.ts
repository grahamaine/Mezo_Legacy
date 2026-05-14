import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const DEPLOYER_KEY       = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY || "";
const MEZO_TESTNET_RPC   = process.env.MEZO_TESTNET_RPC_URL  || "https://rpc.test.mezo.org";
const MEZO_MAINNET_RPC   = process.env.MEZO_MAINNET_RPC_URL  || "https://rpc-http.mezo.boar.network";

const config: HardhatUserConfig = {
  defaultNetwork: "mezo-testnet",
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "london",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},

    // ── Mezo Testnet (chain 31611) ──────────────────────────────────────────
    "mezo-testnet": {
      url: MEZO_TESTNET_RPC,           // https://rpc.test.mezo.org
      chainId: 31611,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },

    // ── Mezo Mainnet (chain 31612) ──────────────────────────────────────────
    // Primary: Boar Network
    "mezo-mainnet": {
      url: MEZO_MAINNET_RPC,           // https://rpc-http.mezo.boar.network
      chainId: 31612,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
    // Fallback: Validation Cloud
    "mezo-mainnet-vc": {
      url: "https://mainnet.mezo.public.validationcloud.io",
      chainId: 31612,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
    // Fallback: dRPC NodeCloud
    "mezo-mainnet-drpc": {
      url: "https://mezo.drpc.org",
      chainId: 31612,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
  },
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: {
      "mezo-testnet": process.env.MEZO_EXPLORER_API_KEY || "placeholder",
      "mezo-mainnet": process.env.MEZO_EXPLORER_API_KEY || "placeholder",
    },
    customChains: [
      {
        network: "mezo-testnet",
        chainId: 31611,
        urls: {
          apiURL:     "https://explorer.test.mezo.org/api",
          browserURL: "https://explorer.test.mezo.org",
        },
      },
      {
        network: "mezo-mainnet",
        chainId: 31612,
        urls: {
          apiURL:     "https://explorer.mezo.org/api",
          browserURL: "https://explorer.mezo.org",
        },
      },
    ],
  },
};

export default config;
