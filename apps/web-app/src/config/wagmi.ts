/// <reference types="vite/client" />
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string;

if (!projectId) {
  console.warn("[wagmi] VITE_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work.");
}

const rpcUrl = import.meta.env.VITE_RPC_URL as string | undefined;

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    metaMask(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
