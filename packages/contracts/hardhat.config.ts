import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";
const MEZO_RPC    = process.env.MEZO_RPC_URL || "https://rpc.test.mezo.org";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    "mezo-testnet": {
      url: MEZO_RPC,
      chainId: 31611,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
    "mezo-mainnet": {
      url: "https://rpc.mezo.org",
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
};

export default config;
