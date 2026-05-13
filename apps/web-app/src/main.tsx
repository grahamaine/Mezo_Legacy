// Place this at: apps/web-app/src/main.tsx
// This wraps the app in WagmiProvider + QueryClientProvider.
// Without this, every wagmi hook throws "No WagmiProvider found".

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./config/wagmi";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep chain data fresh — refetch every 12s (roughly 1 Sepolia block)
      staleTime: 12_000,
      refetchInterval: 12_000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);