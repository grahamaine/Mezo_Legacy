// STEP 7 — Create at: apps/web-app/src/hooks/useLiveChainData.ts
//
// Replaces the hardcoded priceData, rewardsData, volumeData arrays in App.tsx
// with live reads from the contract + CoinGecko free API.
// Drop-in: the hook returns arrays in the same shape the Recharts components expect.

import { useState, useEffect } from "react";
import { useReadContract, useBlockNumber, useGasPrice } from "wagmi";
import { VAULT_ABI, VAULT_ADDRESS } from "../constants/contract";

// ─── ETH price from CoinGecko (free, no key needed) ──────────────────────────
async function getEthUsd(): Promise<number> {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { cache: "force-cache" }
    );
    const d = await r.json();
    return d?.ethereum?.usd ?? 0;
  } catch {
    return 0;
  }
}

// ─── 24h OHLCV from CoinGecko (free) ─────────────────────────────────────────
async function getEthPriceHistory(): Promise<{ time: string; price: number }[]> {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=1&interval=hourly"
    );
    const d = await r.json();
    return (d?.prices ?? []).map(([ts, price]: [number, number]) => ({
      time:  new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      price: Math.round(price),
    }));
  } catch {
    return [];
  }
}

export interface LiveChainData {
  // Contract reads
  tvlWei:       bigint;
  userBalanceWei: bigint;

  // Price data for charts
  ethUsd:       number;
  priceHistory: { time: string; price: number }[];

  // Gas
  gasPriceGwei: number;

  // Block
  blockNumber:  bigint | undefined;

  // Loading states
  isLoading:    boolean;
}

export function useLiveChainData(
  userAddress: `0x${string}` | undefined
): LiveChainData {
  const [ethUsd,        setEthUsd]        = useState(0);
  const [priceHistory,  setPriceHistory]  = useState<{ time: string; price: number }[]>([]);
  const [isPriceFetching, setIsPriceFetching] = useState(true);

  // Fetch price on mount and every 60s
  useEffect(() => {
    let alive = true;
    async function load() {
      setIsPriceFetching(true);
      const [price, history] = await Promise.all([getEthUsd(), getEthPriceHistory()]);
      if (!alive) return;
      setEthUsd(price);
      setPriceHistory(history);
      setIsPriceFetching(false);
    }
    load();
    const id = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // ── On-chain reads ──────────────────────────────────────────────────────
  const { data: tvlData } = useReadContract({
    address:      VAULT_ADDRESS,
    abi:          VAULT_ABI,
    functionName: "totalAssets",
    query:        { refetchInterval: 12_000 },
  });

  const { data: balData } = useReadContract({
    address:      VAULT_ADDRESS,
    abi:          VAULT_ABI,
    functionName: "balanceOf",
    args:         userAddress ? [userAddress] : undefined,
    query:        { enabled: !!userAddress, refetchInterval: 12_000 },
  });

  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { data: gasPrice }    = useGasPrice();

  const gasPriceGwei = gasPrice ? Math.round(Number(gasPrice) / 1e9) : 0;

  return {
    tvlWei:         (tvlData ?? 0n) as bigint,
    userBalanceWei: (balData ?? 0n) as bigint,
    ethUsd,
    priceHistory,
    gasPriceGwei,
    blockNumber,
    isLoading:      isPriceFetching,
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// STEP 7B — How to wire this into App.tsx
// ─────────────────────────────────────────────────────────────────────────────
//
// Inside AppContent(), replace the static mock arrays with:
//
//   const { address, isConnected } = useAccount();
//   const live = useLiveChainData(address);
//
// Then pass live.priceHistory to the price AreaChart instead of priceData:
//
//   <AreaChart data={live.priceHistory.length ? live.priceHistory : priceData}>
//
// Update the TopBar block number pill:
//   `Block #${live.blockNumber?.toLocaleString() ?? "..."}`
//
// Update the Gas Tracker section using live.gasPriceGwei:
//   { speed: "Slow",     gwei: live.gasPriceGwei - 3, ... }
//   { speed: "Standard", gwei: live.gasPriceGwei,     ... }
//   { speed: "Fast",     gwei: live.gasPriceGwei + 6, ... }
//
// Update the TVL MetricCard in AnalysisPage:
//   value={`$${(Number(live.tvlWei) / 1e18 * live.ethUsd).toLocaleString()}`}
//
// Update the ETH price display footer:
//   <div className="cf-val green">${live.ethUsd.toLocaleString()}</div>