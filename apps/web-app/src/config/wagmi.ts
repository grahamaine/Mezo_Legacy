import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";

const projectId = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || import.meta.env.VITE_PROJECT_ID) as string;
const rpcUrl    = (import.meta.env.VITE_RPC_URL as string) || "https://rpc.test.mezo.org";

if (!projectId) {
  console.warn("[appkit] VITE_WALLETCONNECT_PROJECT_ID is not set.");
}

export const mezoTestnet: AppKitNetwork = {
  id: 31611,
  name: "Mezo Testnet",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
    public:  { http: ["https://rpc.test.mezo.org"] },
  },
  blockExplorers: {
    default: { name: "Mezo Explorer", url: "https://explorer.test.mezo.org" },
  },
};

const wagmiAdapter = new WagmiAdapter({
  networks: [mezoTestnet],
  projectId: projectId || "",
  ssr: false,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mezoTestnet] as [AppKitNetwork, ...AppKitNetwork[]],
  projectId: projectId || "",
  metadata: {
    name: "Mezo Legacy",
    description: "Mezo Payments & Commerce DApp",
    url: "https://mezo-legacy.vercel.app",
    icons: ["https://mezo-legacy.vercel.app/og-thumbnail.png"],
  },
});

export const config = wagmiAdapter.wagmiConfig;

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
