import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAppKit } from '@reown/appkit/react';
import {
  useAccount, useConnect, useDisconnect, useBalance,
  useSendTransaction, useWaitForTransactionReceipt,
  useReadContract, useWriteContract, useChainId, useSwitchChain
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar
} from 'recharts';
import { STAKING_ADDRESS, STAKING_ABI } from './constants/staking';
import { VAULT_ADDRESS, VAULT_ABI }     from './constants/contract';
import { MUSD_ADDRESS, MUSD_ABI, BORROW_ADDRESS, BORROW_ABI } from './constants/musd';
import { useLiveChainData } from './hooks/useLiveChainData';
import './App.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransactionRecord {
  id: string;
  type: 'Send' | 'Stake' | 'Withdraw' | 'Deposit' | 'Borrow' | 'Repay';
  amount: string;
  status: 'Pending' | 'Success';
  hash: string;
  timestamp: number;
}

// ─── Mock / Fallback Data ─────────────────────────────────────────────────────

const FALLBACK_PRICE_DATA = [
  { time: '00:00', price: 93200 }, { time: '04:00', price: 92800 },
  { time: '08:00', price: 94100 }, { time: '12:00', price: 95400 },
  { time: '16:00', price: 96200 }, { time: '20:00', price: 95800 },
  { time: '24:00', price: 97500 },
];

const rewardsData = [
  { week: 'W1', amount: 0.00012 }, { week: 'W2', amount: 0.00018 },
  { week: 'W3', amount: 0.00020 }, { week: 'W4', amount: 0.00022 },
];
const volumeData = [
  { day: 'Mon', vol: 0.008 }, { day: 'Tue', vol: 0.012 }, { day: 'Wed', vol: 0.004 },
  { day: 'Thu', vol: 0.018 }, { day: 'Fri', vol: 0.006 }, { day: 'Sat', vol: 0.021 },
  { day: 'Sun', vol: 0.015 },
];
const yieldData = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  yield: +(0.015 * Math.pow(1 + 0.048 / 12, i + 1)).toFixed(6),
}));

const MOCK_HISTORY: TransactionRecord[] = [
  { id: '1', type: 'Borrow',  amount: '500.00',  status: 'Success', hash: '0x4fe2a91c3d8b7e2a', timestamp: Date.now() - 120000   },
  { id: '2', type: 'Stake',   amount: '0.0050',  status: 'Success', hash: '0x8b1dc44e9a3f1c2d', timestamp: Date.now() - 3600000  },
  { id: '3', type: 'Deposit', amount: '0.0020',  status: 'Success', hash: '0x2ca7f12b8e4d9a3c', timestamp: Date.now() - 10800000 },
  { id: '4', type: 'Repay',   amount: '100.00',  status: 'Success', hash: '0x9e3ad77c1f2b8d4e', timestamp: Date.now() - 18000000 },
  { id: '5', type: 'Send',    amount: '0.0005',  status: 'Pending', hash: '0x7d2f88ab3c9e1f5d', timestamp: Date.now() - 86400000 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TX_META: Record<string, { icon: string; color: string }> = {
  Stake:    { icon: '🔥', color: 'var(--accent2)'  },
  Withdraw: { icon: '↙',  color: 'var(--blue)'     },
  Send:     { icon: '↗',  color: 'var(--green)'    },
  Deposit:  { icon: '⬇',  color: 'var(--accent)'   },
  Borrow:   { icon: '₿',  color: '#f59e0b'         },
  Repay:    { icon: '✓',  color: 'var(--green)'    },
};

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      <p className="tooltip-val">{typeof payload[0].value === 'number' && payload[0].value > 100
        ? `$${payload[0].value.toLocaleString()}` : `${payload[0].value} BTC`}</p>
    </div>
  );
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function MetricCard({ label, value, sub, change, changeDir, accent }: any) {
  return (
    <div className={`metric-card${accent ? ' accent' : ''}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub    && <div className="metric-sub">{sub}</div>}
      {change && <div className={`metric-change ${changeDir}`}>{changeDir === 'up' ? '↑' : '↓'} {change}</div>}
    </div>
  );
}

function TopBar({ title, blockNumber, gasPriceGwei }: { title: string; blockNumber?: bigint; gasPriceGwei?: number }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  return (
    <div className="topbar">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">Mezo Testnet (Chain 31611) · Auto-refreshing</p>
      </div>
      <div className="topbar-right">
        <div className="pill amber"><span className="blink">◉</span> Block {blockNumber ? `#${blockNumber.toLocaleString()}` : '#...'}</div>
        <div className="pill green"><span>●</span> Mezo · {gasPriceGwei ?? 0} gwei</div>
        {isConnected ? (
          <div className="topbar-wallet">
            <span className="topbar-addr"><span className="online-dot" />{address?.slice(0, 6)}…{address?.slice(-4)}</span>
            <button className="topbar-disconnect" onClick={() => disconnect()}>Disconnect</button>
          </div>
        ) : (
          <button className="topbar-connect" onClick={() => open()}>Connect Wallet</button>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ address, isConnected, balance, musdBalance, onConnect, onDisconnect, connectors }: any) {
  const location = useLocation();
  const links = [
    { to: '/',        label: 'Dashboard', icon: '⊞', badge: null       },
    { to: '/borrow',  label: 'Borrow',    icon: '₿',  badge: '1% APR'  },
    { to: '/vault',   label: 'Vault',     icon: '🏦', badge: null       },
    { to: '/staking', label: 'Staking',   icon: '🔥', badge: '4.8%'    },
    { to: '/history', label: 'History',   icon: '◷',  badge: null       },
    { to: '/analysis',label: 'Analysis',  icon: '↗',  badge: null       },
  ];
  const musdFmt = musdBalance ? parseFloat(formatEther(musdBalance as bigint)).toFixed(2) : '0.00';

  return (
    <aside className="sidebar">
      <div className="sidebar-glow" />
      <div className="logo-area">
        <div className="logo"><img src="/mezo-icon.png" alt="Mezo Legacy" className="logo-img" />Mezo Legacy</div>
        <div className="logo-sub">Mezo Testnet · v1.0.0</div>
      </div>
      <nav className="nav">
        <div className="nav-section-label">Main</div>
        {links.map(l => (
          <Link key={l.to} to={l.to} className={`nav-item${location.pathname === l.to ? ' active' : ''}`}>
            <span className="nav-icon">{l.icon}</span>
            {l.label}
            {l.badge && <span className="nav-badge">{l.badge}</span>}
          </Link>
        ))}
        <div className="nav-section-label" style={{ marginTop: 20 }}>Settings</div>
        <Link to="/settings" className={`nav-item${location.pathname === '/settings' ? ' active' : ''}`}><span className="nav-icon">⚙</span>Network</Link>
        <Link to="/settings" className={`nav-item${location.pathname === '/settings' ? ' active' : ''}`}><span className="nav-icon">🛡</span>Security</Link>
      </nav>
      <div className="wallet-area">
        {isConnected ? (
          <div className="wallet-card">
            <div className="wallet-addr">
              <span className="online-dot" />
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            <div className="wallet-bal">{parseFloat(balance?.formatted || '0').toFixed(6)} BTC</div>
            <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, margin: '4px 0 8px' }}>
              {musdFmt} MUSD
            </div>
            <div className="wallet-usd">
              ≈ ${(parseFloat(balance?.formatted || '0') * 97500).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
            </div>
            <div className="wallet-actions">
              <button className="wallet-btn primary">↑ Send</button>
              <button className="wallet-btn" onClick={onDisconnect}>Disconnect</button>
            </div>
          </div>
        ) : (
          <div className="wallet-card">
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>No wallet connected</div>
            {connectors.map((c: any) => (
              <button key={c.id} className="connect-btn" onClick={() => onConnect({ connector: c })}>
                Connect {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ balance, staked, vaultBalance, musdBalance, borrowPosition, live }: any) {
  const btcPrice    = live.ethUsd || 97500;
  const musdFmt     = musdBalance ? parseFloat(formatEther(musdBalance as bigint)).toFixed(2) : '0.00';
  const btcDebt     = borrowPosition?.[0] ? Number(formatEther(borrowPosition[0])) : 0;
  const musdDebt    = borrowPosition?.[1] ? Number(formatEther(borrowPosition[1])) : 0;
  const cr          = borrowPosition?.[2] ? Number(borrowPosition[2]) : 0;
  const totalBtc    = parseFloat(balance || '0') + parseFloat(staked || '0') + parseFloat(vaultBalance || '0');
  const portfolioUSD = (totalBtc * btcPrice + parseFloat(musdFmt)).toFixed(2);
  const chartData   = live.priceHistory.length ? live.priceHistory : FALLBACK_PRICE_DATA;

  return (
    <div className="page-content fade-in">
      <TopBar title="Overview" blockNumber={live.blockNumber} gasPriceGwei={live.gasPriceGwei} />
      <div className="content-wrap">

        {/* Metrics */}
        <div className="metrics-row four-col">
          <MetricCard label="BTC Balance"   value={`${parseFloat(balance || '0').toFixed(6)}`}      sub="BTC Available"  change="+0.00024 today" changeDir="up" />
          <MetricCard label="MUSD Balance"  value={`$${musdFmt}`}                                    sub="Bitcoin-backed" change="1% borrow APR"  changeDir="up" accent />
          <MetricCard label="Staked BTC"    value={`${parseFloat(staked || '0').toFixed(6)}`}        sub="Earning 4.8%"   change="APY 4.8%"       changeDir="up" />
          <MetricCard label="Portfolio USD" value={`$${Number(portfolioUSD).toLocaleString()}`}      sub="Total Value"    change="+3.2% 24h"      changeDir="up" />
        </div>

        {/* MUSD Borrow Position Banner (shown when active) */}
        {musdDebt > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(124,110,247,0.08))',
            border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '18px 24px',
            display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Active Borrow Position</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>${musdDebt.toFixed(2)} MUSD</div>
              <div style={{ fontSize: 12, color: 'var(--sub)' }}>borrowed at 1% APR</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>BTC Collateral</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{btcDebt.toFixed(6)} BTC</div>
              <div style={{ fontSize: 12, color: 'var(--sub)' }}>locked in vault</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Collateral Ratio</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: cr >= 200 ? 'var(--green)' : cr >= 150 ? '#f59e0b' : 'var(--red)' }}>{cr}%</div>
              <div style={{ fontSize: 12, color: 'var(--sub)' }}>min 150% safe</div>
            </div>
            <Link to="/borrow" style={{ marginLeft: 'auto', padding: '10px 22px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 10, color: '#f59e0b', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
              Manage Position →
            </Link>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid-2-1">
          <div className="card">
            <div className="card-header">
              <span className="card-title">BTC / USD Price Action</span>
              <div className="tab-row">
                {['24H','7D','1M'].map((t, i) => (
                  <button key={t} className={`tab${i === 0 ? ' active' : ''}`}
                    onClick={e => { e.currentTarget.closest('.tab-row')!.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); e.currentTarget.classList.add('active'); }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c6ef7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#7c6ef7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis hide domain={['auto','auto']} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="price" stroke="#7c6ef7" strokeWidth={2} fill="url(#priceGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-footer">
              <div><div className="cf-label">BTC Price</div><div className="cf-val green">${(live.ethUsd || 97500).toLocaleString()}</div></div>
              <div style={{ textAlign: 'right' }}><div className="cf-label">Network</div><div className="cf-val green">Mezo Testnet</div></div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">MUSD Carry Trade</span></div>
            <div style={{ padding: '8px 0' }}>
              {[
                { label: 'Borrow MUSD at', val: '1% APR',  color: '#f59e0b', desc: 'fixed rate' },
                { label: 'Earn yield at',  val: '4–8%',    color: 'var(--green)', desc: 'DeFi strategies' },
                { label: 'Net carry',      val: '+3–7%',   color: 'var(--accent)', desc: 'annual yield' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--sub)' }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.desc}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: r.color }}>{r.val}</div>
                </div>
              ))}
            </div>
            <Link to="/borrow" style={{ display: 'block', marginTop: 14, padding: '10px', textAlign: 'center', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, color: '#f59e0b', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
              ₿ Open Borrow Position →
            </Link>
          </div>
        </div>

        {/* Recent Txns + Gas */}
        <div className="grid-2-1">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Transactions</span>
              <Link to="/history" className="card-link">View all →</Link>
            </div>
            {MOCK_HISTORY.slice(0, 4).map(tx => {
              const meta = TX_META[tx.type];
              return (
                <div key={tx.id} className="tx-row">
                  <div className="tx-icon" style={{ color: meta.color, borderColor: meta.color + '30', background: meta.color + '15' }}>{meta.icon}</div>
                  <div className="tx-info">
                    <div className="tx-type">{tx.type}</div>
                    <div className="tx-hash">{tx.hash.slice(0, 14)}... · {timeAgo(tx.timestamp)}</div>
                  </div>
                  <div className="tx-amount" style={{ color: meta.color }}>
                    {tx.type === 'Borrow' || tx.type === 'Repay' ? `$${tx.amount} MUSD` : `${tx.amount} BTC`}
                  </div>
                  <div className={`tx-status ${tx.status.toLowerCase()}`}>{tx.status}</div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Gas Tracker</span>
              <span className="pill green" style={{ fontSize: 10 }}><span className="blink">●</span> Live</span>
            </div>
            <div className="gas-stack">
              {[
                { speed: 'Slow',     gwei: Math.max(1, (live.gasPriceGwei || 3) - 2), time: '~3 min', cls: 'green' },
                { speed: 'Standard', gwei: live.gasPriceGwei || 3,                     time: '~30 sec', cls: 'amber' },
                { speed: 'Fast',     gwei: (live.gasPriceGwei || 3) + 5,               time: '~10 sec', cls: 'red'   },
              ].map(g => (
                <div key={g.speed} className={`gas-row ${g.cls}`}>
                  <span className="gas-speed">{g.speed}</span>
                  <span className="gas-gwei">{g.gwei} gwei</span>
                  <span className="gas-time">{g.time}</span>
                </div>
              ))}
            </div>
            <div className="staking-mini">
              <div className="sm-header">Protocol Summary</div>
              <div className="sm-row"><span>MUSD borrowed</span><span style={{ color: '#f59e0b' }}>${musdDebt.toFixed(2)}</span></div>
              <div className="sm-row"><span>Staking APY</span><span className="green">4.8%</span></div>
              <div className="sm-row"><span>Borrow rate</span><span className="green">1% fixed</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Borrow Page (MUSD) ───────────────────────────────────────────────────────

function BorrowPage({
  borrowPosition, musdBalance, isConnected,
  borrowBtc, setBorrowBtc, borrowMusd, setBorrowMusd, onBorrow,
  repayAmount, setRepayAmount, onRepay,
  addCollateralAmt, setAddCollateralAmt, onAddCollateral,
  onClosePosition, live,
}: any) {
  const btcPrice = live.ethUsd || 97500;

  // Live position data from contract read
  const btcCollateral  = borrowPosition?.[0] ? Number(formatEther(borrowPosition[0])) : 0;
  const musdDebt       = borrowPosition?.[1] ? Number(formatEther(borrowPosition[1])) : 0;
  const cr             = borrowPosition?.[2] ? Number(borrowPosition[2]) : 0;
  const accruedInt     = borrowPosition?.[3] ? Number(formatEther(borrowPosition[3])) : 0;
  const musdBal        = musdBalance         ? Number(formatEther(musdBalance as bigint)) : 0;
  const hasPosition    = musdDebt > 0 || btcCollateral > 0;

  // Auto-compute max MUSD for entered BTC
  const btcNum       = parseFloat(borrowBtc) || 0;
  const collateralUsd = btcNum * btcPrice;
  const maxMusd      = (collateralUsd * 100 / 150).toFixed(2);  // at 150% CR
  const safeMusd     = (collateralUsd * 100 / 200).toFixed(2);  // at 200% CR (safer)

  const crColor = cr >= 200 ? 'var(--green)' : cr >= 150 ? '#f59e0b' : 'var(--red)';

  return (
    <div className="page-content fade-in">
      <TopBar title="Borrow MUSD" blockNumber={live.blockNumber} gasPriceGwei={live.gasPriceGwei} />
      <div className="content-wrap">

        {/* Explainer */}
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(124,110,247,0.08))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '20px 28px', marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>₿ How it works</div>
              <div style={{ fontSize: 13, color: 'var(--sub)', maxWidth: 420 }}>
                Deposit BTC as collateral → mint MUSD at <strong style={{ color: 'var(--text)' }}>1% fixed APR</strong>. Deploy MUSD in DeFi for 4–8% yield. Keep your BTC exposure. Close your position any time — no lock-up.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { val: '1%',    lbl: 'Fixed APR' },
                { val: '150%',  lbl: 'Min CR'    },
                { val: '0',     lbl: 'Lock-up'   },
              ].map(s => (
                <div key={s.lbl} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Position Summary */}
        {hasPosition && (
          <div className="metrics-row four-col">
            <MetricCard label="BTC Collateral"    value={`${btcCollateral.toFixed(6)} BTC`} sub={`≈ $${(btcCollateral * btcPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} changeDir="up" />
            <MetricCard label="MUSD Borrowed"     value={`$${musdDebt.toFixed(2)}`}          sub="outstanding debt"  changeDir="up" accent />
            <MetricCard label="Collateral Ratio"  value={`${cr}%`}                           sub={cr >= 200 ? '✓ Healthy' : cr >= 150 ? '⚠ Watch' : '✗ Danger'} changeDir={cr >= 200 ? 'up' : 'down'} />
            <MetricCard label="Accrued Interest"  value={`$${accruedInt.toFixed(4)}`}        sub="1% APR, unsettled"  changeDir="up" />
          </div>
        )}

        {/* CR Health Bar */}
        {hasPosition && (
          <div className="card" style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Position Health — Collateral Ratio</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: crColor }}>{cr}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(cr / 3, 100)}%`, background: crColor, borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
              <span>Liquidation 100%</span><span>Minimum 150%</span><span>Safe 200%+</span>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="action-row">
          {/* Borrow */}
          <div className="action-card">
            <div className="action-label accent">₿ Deposit & Borrow MUSD</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>BTC collateral (depositing now)</div>
            <div className="input-wrap">
              <input className="dapp-input" type="number" placeholder="0.000000" value={borrowBtc}
                onChange={e => setBorrowBtc(e.target.value)} />
              <span className="input-unit">BTC</span>
            </div>
            {btcNum > 0 && (
              <div style={{ fontSize: 11, color: 'var(--muted)', margin: '6px 0 12px' }}>
                ≈ ${collateralUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} · Safe MUSD: ${safeMusd} · Max: ${maxMusd}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>MUSD to mint</div>
            <div className="input-wrap">
              <input className="dapp-input" type="number" placeholder="0.00" value={borrowMusd}
                onChange={e => setBorrowMusd(e.target.value)} />
              <span className="input-unit">MUSD</span>
            </div>
            {btcNum > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button onClick={() => setBorrowMusd(safeMusd)}
                  style={{ flex: 1, padding: '6px', background: 'rgba(34,211,168,0.1)', border: '1px solid rgba(34,211,168,0.3)', borderRadius: 8, color: 'var(--green)', fontSize: 11, cursor: 'pointer' }}>
                  Safe (200% CR)
                </button>
                <button onClick={() => setBorrowMusd(maxMusd)}
                  style={{ flex: 1, padding: '6px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, color: '#f59e0b', fontSize: 11, cursor: 'pointer' }}>
                  Max (150% CR)
                </button>
              </div>
            )}
            <div className="info-box" style={{ marginTop: 10 }}>
              <div className="ib-row"><span>Interest rate</span><span className="green">1% fixed APR</span></div>
              <div className="ib-row"><span>Min collateral ratio</span><span>150%</span></div>
              <div className="ib-row"><span>Lock-up period</span><span className="green">None</span></div>
            </div>
            <button className="action-btn stake" disabled={!isConnected} onClick={onBorrow}>
              ₿ Borrow MUSD
            </button>
          </div>

          {/* Repay */}
          <div className="action-card">
            <div className="action-label blue">✓ Repay MUSD</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
              Wallet MUSD: <span style={{ color: '#f59e0b' }}>${musdBal.toFixed(2)}</span>
            </div>
            <div className="input-wrap">
              <input className="dapp-input" type="number" placeholder="0.00" value={repayAmount}
                onChange={e => setRepayAmount(e.target.value)} />
              <span className="input-unit">MUSD</span>
            </div>
            <div className="input-meta">
              <span>Outstanding: ${musdDebt.toFixed(2)}</span>
              <button className="max-btn blue" onClick={() => setRepayAmount(musdDebt.toString())}>MAX</button>
            </div>
            <div className="info-box">
              <div className="ib-row"><span>BTC released</span><span className="green">proportional</span></div>
              <div className="ib-row"><span>Slippage</span><span>0%</span></div>
              <div className="ib-row"><span>Settlement</span><span>instant</span></div>
            </div>
            <button className="action-btn withdraw" disabled={!isConnected || musdDebt === 0} onClick={onRepay}>
              ✓ Repay MUSD
            </button>
            {hasPosition && (
              <button
                onClick={onClosePosition}
                disabled={!isConnected}
                style={{ width: '100%', marginTop: 8, padding: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, color: 'var(--red)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                ✗ Close Entire Position
              </button>
            )}
          </div>

          {/* Add Collateral */}
          <div className="action-card">
            <div className="action-label green">+ Add Collateral</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
              Improve your collateral ratio by adding more BTC
            </div>
            <div className="input-wrap">
              <input className="dapp-input" type="number" placeholder="0.000000" value={addCollateralAmt}
                onChange={e => setAddCollateralAmt(e.target.value)} />
              <span className="input-unit">BTC</span>
            </div>
            <div className="info-box" style={{ marginTop: 10 }}>
              <div className="ib-row"><span>Current CR</span><span style={{ color: crColor }}>{hasPosition ? `${cr}%` : 'N/A'}</span></div>
              <div className="ib-row"><span>Contract</span>
                <a href={`https://explorer.test.mezo.org/address/${BORROW_ADDRESS}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 11 }}>
                  View ↗
                </a>
              </div>
              <div className="ib-row"><span>MUSD token</span>
                <a href={`https://explorer.test.mezo.org/address/${MUSD_ADDRESS}`} target="_blank" rel="noreferrer" style={{ color: '#f59e0b', fontSize: 11 }}>
                  View ↗
                </a>
              </div>
            </div>
            <button className="action-btn send" disabled={!isConnected || !hasPosition} onClick={onAddCollateral}>
              + Add BTC Collateral
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Vault Page ───────────────────────────────────────────────────────────────

function VaultPage({ vaultBalance, tvl, isConnected, depositAmount, setDepositAmount, onDeposit, vaultWithdrawAmount, setVaultWithdrawAmount, onVaultWithdraw, live }: any) {
  const btcPrice = live.ethUsd || 97500;
  const tvlBtc   = Number(tvl ?? 0n) / 1e18;
  const tvlUsd   = (tvlBtc * btcPrice).toLocaleString();
  const userBtc  = parseFloat(vaultBalance || '0');

  return (
    <div className="page-content fade-in">
      <TopBar title="BTC Vault" blockNumber={live.blockNumber} gasPriceGwei={live.gasPriceGwei} />
      <div className="content-wrap">
        <div className="metrics-row three-col">
          <MetricCard label="Your Vault Balance" value={`${userBtc.toFixed(6)} BTC`} sub="Currently deposited" change="Earning yield" changeDir="up" accent />
          <MetricCard label="Vault TVL"           value={`${tvlBtc.toFixed(4)} BTC`} sub={`≈ $${tvlUsd}`}      change="On-chain"     changeDir="up" />
          <MetricCard label="Vault Address"       value={`${VAULT_ADDRESS.slice(0,8)}...${VAULT_ADDRESS.slice(-6)}`} sub="MezoVault.sol" />
        </div>
        <div className="action-row">
          <div className="action-card">
            <div className="action-label accent">⬇ Deposit BTC</div>
            <div className="input-wrap">
              <input className="dapp-input" type="number" placeholder="0.000000" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
              <span className="input-unit">BTC</span>
            </div>
            <div className="info-box">
              <div className="ib-row"><span>Contract</span><span>MezoVault</span></div>
              <div className="ib-row"><span>Function</span><span className="green">deposit()</span></div>
            </div>
            <button className="action-btn stake" disabled={!isConnected} onClick={onDeposit}>⬇ Confirm Deposit</button>
          </div>
          <div className="action-card">
            <div className="action-label blue">↙ Withdraw BTC</div>
            <div className="input-wrap">
              <input className="dapp-input" type="number" placeholder="0.000000" value={vaultWithdrawAmount} onChange={e => setVaultWithdrawAmount(e.target.value)} />
              <span className="input-unit">BTC</span>
            </div>
            <div className="input-meta">
              <span>In vault: {userBtc.toFixed(6)} BTC</span>
              <button className="max-btn blue" onClick={() => setVaultWithdrawAmount(vaultBalance || '0')}>MAX</button>
            </div>
            <div className="info-box">
              <div className="ib-row"><span>Function</span><span className="blue">withdraw(uint256)</span></div>
              <div className="ib-row"><span>Fee</span><span className="green">None</span></div>
            </div>
            <button className="action-btn withdraw" disabled={!isConnected} onClick={onVaultWithdraw}>↙ Withdraw from Vault</button>
          </div>
          <div className="action-card">
            <div className="action-label green">ℹ Vault Info</div>
            <div className="info-box" style={{ marginTop: 8 }}>
              <div className="ib-row"><span>Explorer</span><a href={`https://explorer.test.mezo.org/address/${VAULT_ADDRESS}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 11 }}>View ↗</a></div>
              <div className="ib-row"><span>Total BTC</span><span>{tvlBtc.toFixed(6)}</span></div>
              <div className="ib-row"><span>USD Value</span><span className="green">${tvlUsd}</span></div>
              <div className="ib-row"><span>Chain</span><span>Mezo (31611)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Staking Page ─────────────────────────────────────────────────────────────

function StakingPage({ staked, balance, isConnected, stakeAmount, setStakeAmount, onStake, withdrawAmount, setWithdrawAmount, onWithdraw, sendTo, setSendTo, sendAmount, setSendAmount, onSend, live }: any) {
  return (
    <div className="page-content fade-in">
      <TopBar title="Staking Vault" blockNumber={live.blockNumber} gasPriceGwei={live.gasPriceGwei} />
      <div className="content-wrap">
        <div className="metrics-row three-col">
          <MetricCard label="Staked"         value={`${parseFloat(staked || '0').toFixed(6)} BTC`} sub="Currently locked" change="APY 4.8%"            changeDir="up" accent />
          <MetricCard label="Rewards Earned" value="0.00072 BTC"                                   sub="Since inception"  change="+0.000041 this week" changeDir="up" />
          <MetricCard label="Next Reward"    value="~8h"                                           sub="Est. 0.000041 BTC" />
        </div>
        <div className="action-row">
          <div className="action-card">
            <div className="action-label accent">🔥 Stake BTC</div>
            <div className="input-wrap">
              <input className="dapp-input" type="number" placeholder="0.000000" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} />
              <span className="input-unit">BTC</span>
            </div>
            <div className="input-meta">
              <span>Available: {parseFloat(balance || '0').toFixed(6)} BTC</span>
              <button className="max-btn" onClick={() => setStakeAmount(balance || '0')}>MAX</button>
            </div>
            <div className="info-box">
              <div className="ib-row"><span>APY</span><span className="green">4.8%</span></div>
              <div className="ib-row"><span>Lock-up</span><span>None</span></div>
            </div>
            <button className="action-btn stake" disabled={!isConnected} onClick={onStake}>🔥 Confirm Stake</button>
          </div>
          <div className="action-card">
            <div className="action-label blue">↙ Unstake BTC</div>
            <div className="input-wrap">
              <input className="dapp-input" type="number" placeholder="0.000000" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
              <span className="input-unit">BTC</span>
            </div>
            <div className="input-meta">
              <span>Staked: {parseFloat(staked || '0').toFixed(6)} BTC</span>
              <button className="max-btn blue" onClick={() => setWithdrawAmount(staked || '0')}>MAX</button>
            </div>
            <div className="info-box">
              <div className="ib-row"><span>Unlock</span><span className="amber">~24h</span></div>
              <div className="ib-row"><span>Slippage</span><span>0%</span></div>
            </div>
            <button className="action-btn withdraw" disabled={!isConnected} onClick={onWithdraw}>↙ Unstake BTC</button>
          </div>
          <div className="action-card">
            <div className="action-label green">↗ Direct Transfer</div>
            <input className="dapp-input" placeholder="Recipient 0x..." value={sendTo} onChange={e => setSendTo(e.target.value)} style={{ marginBottom: 8 }} />
            <div className="input-wrap">
              <input className="dapp-input" type="number" placeholder="0.000000" value={sendAmount} onChange={e => setSendAmount(e.target.value)} />
              <span className="input-unit">BTC</span>
            </div>
            <div className="info-box">
              <div className="ib-row"><span>Network</span><span>Mezo Testnet</span></div>
              <div className="ib-row"><span>Speed</span><span className="amber">Standard</span></div>
            </div>
            <button className="action-btn send" disabled={!isConnected} onClick={onSend}>↗ Send BTC</button>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Staking Rewards — Last 30 Days</span>
            <span className="card-meta">Total: 0.00072 BTC earned</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rewardsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="week" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(5)}₿`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="amount" fill="#7c6ef7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── History Page ─────────────────────────────────────────────────────────────

function HistoryPage({ history }: { history: TransactionRecord[] }) {
  const [filter, setFilter] = useState<'All' | 'Stake' | 'Withdraw' | 'Send' | 'Deposit' | 'Borrow' | 'Repay'>('All');
  const filtered = filter === 'All' ? history : history.filter(tx => tx.type === filter);

  return (
    <div className="page-content fade-in">
      <TopBar title="Transaction History" />
      <div className="content-wrap">
        <div className="metrics-row three-col">
          <MetricCard label="Total Transactions" value={history.length.toString()} sub="All time" />
          <MetricCard label="MUSD Borrowed"       value={`$${history.filter(t => t.type === 'Borrow').reduce((a, t) => a + parseFloat(t.amount), 0).toFixed(2)}`} sub="Cumulative" />
          <MetricCard label="Volume Staked"       value={`${history.filter(t => t.type === 'Stake').reduce((a, t) => a + parseFloat(t.amount), 0).toFixed(6)} BTC`} sub="Cumulative" />
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">All Activity</span>
            <div className="tab-row">
              {(['All','Borrow','Repay','Stake','Withdraw','Send','Deposit'] as const).map(f => (
                <button key={f} className={`tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">No transactions found</div>
          ) : (
            filtered.map(tx => {
              const meta = TX_META[tx.type];
              return (
                <div key={tx.id} className="tx-row">
                  <div className="tx-icon" style={{ color: meta.color, borderColor: meta.color + '30', background: meta.color + '15' }}>{meta.icon}</div>
                  <div className="tx-info">
                    <div className="tx-type">{tx.type}</div>
                    <div className="tx-hash">
                      <a href={`https://explorer.test.mezo.org/tx/${tx.hash}`} target="_blank" rel="noreferrer">
                        {tx.hash.slice(0, 14)}...
                      </a>
                      · {timeAgo(tx.timestamp)}
                    </div>
                  </div>
                  <div className="tx-amount" style={{ color: meta.color }}>
                    {tx.type === 'Borrow' || tx.type === 'Repay' ? `$${tx.amount} MUSD` : `${tx.amount} BTC`}
                  </div>
                  <div className={`tx-status ${tx.status.toLowerCase()}`}>{tx.status}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Analysis Page ────────────────────────────────────────────────────────────

function AnalysisPage({ balance, staked, vaultBalance, live }: any) {
  const btcPrice = live.ethUsd || 97500;
  const tvlBtc   = Number(live.tvlWei ?? 0n) / 1e18;
  const tvlUsd   = (tvlBtc * btcPrice).toFixed(0);
  const totalBtc = parseFloat(staked || '0') + parseFloat(balance || '0') + parseFloat(vaultBalance || '0');
  const stakingRatio = totalBtc > 0 ? ((parseFloat(staked || '0') / totalBtc) * 100).toFixed(1) : '52.7';

  return (
    <div className="page-content fade-in">
      <TopBar title="Portfolio Analysis" blockNumber={live.blockNumber} gasPriceGwei={live.gasPriceGwei} />
      <div className="content-wrap">
        <div className="grid-1-1">
          <div className="card">
            <div className="card-header"><span className="card-title">Volume Analysis</span><span className="card-meta">Last 7 days</span></div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v: number) => `${v}₿`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="vol" fill="#22d3a8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Yield Projection</span><span className="card-meta">12 months @ 4.8% APY</span></div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yieldData}>
                  <defs>
                    <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(5)}₿`} domain={['auto','auto']} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="yield" stroke="#f59e0b" strokeWidth={2} fill="url(#yieldGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="grid-2-1">
          <div className="card">
            <div className="card-header"><span className="card-title">On-Chain Metrics</span></div>
            <div className="metrics-row two-col" style={{ marginBottom: 20 }}>
              <div className="info-block"><div className="ib-label">Vault TVL</div><div className="ib-val accent">${Number(tvlUsd).toLocaleString()}</div></div>
              <div className="info-block"><div className="ib-label">Staking Ratio</div><div className="ib-val green">{stakingRatio}%</div></div>
              <div className="info-block"><div className="ib-label">Gas Price</div><div className="ib-val">{live.gasPriceGwei || 3} gwei</div></div>
              <div className="info-block"><div className="ib-label">Block</div><div className="ib-val">{live.blockNumber?.toLocaleString() ?? '...'}</div></div>
            </div>
            <div className="progress-section">
              <div className="progress-row"><span>Staking utilization</span><span>{stakingRatio}%</span></div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${stakingRatio}%` }} /></div>
              <div className="progress-row" style={{ marginTop: 12 }}><span>Reward efficiency</span><span>97.2%</span></div>
              <div className="progress-bar"><div className="progress-fill green" style={{ width: '97.2%' }} /></div>
              <div className="progress-row" style={{ marginTop: 12 }}><span>Network uptime</span><span>99.9%</span></div>
              <div className="progress-bar"><div className="progress-fill blue" style={{ width: '99.9%' }} /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Holdings</span></div>
            {[
              { sym: 'stB', label: 'Staked BTC', net: 'MezoStaking', amt: parseFloat(staked  || '0.015').toFixed(6), usd: (parseFloat(staked  || '0.015') * btcPrice).toFixed(2), color: '#7c6ef7' },
              { sym: 'VLT', label: 'Vault BTC',  net: 'MezoVault',   amt: parseFloat(vaultBalance || '0.010').toFixed(6), usd: (parseFloat(vaultBalance || '0.010') * btcPrice).toFixed(2), color: '#38bdf8' },
              { sym: 'BTC', label: 'Liquid BTC', net: 'Mezo Testnet',amt: parseFloat(balance || '0.028').toFixed(6), usd: (parseFloat(balance || '0.028') * btcPrice).toFixed(2), color: '#22d3a8' },
            ].map(h => (
              <div key={h.sym} className="holding-row">
                <div className="holding-left">
                  <div className="holding-icon" style={{ background: h.color + '20', color: h.color }}>{h.sym}</div>
                  <div><div className="holding-name">{h.label}</div><div className="holding-net">{h.net}</div></div>
                </div>
                <div>
                  <div className="holding-amt">{h.amt} BTC</div>
                  <div className="holding-usd">${Number(h.usd).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Page ───────────────────────────────────────────────────────────

function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { disconnect }           = useDisconnect();
  const { open }                 = useAppKit();
  const chainId                  = useChainId();
  const { switchChain }          = useSwitchChain();
  const [copied, setCopied]      = useState(false);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const networks = [
    {
      id: 31612, label: 'Mezo Mainnet', rpc: 'https://rpc-http.mezo.boar.network',
      explorer: 'https://explorer.mezo.org', badge: 'Mainnet',
    },
    {
      id: 31611, label: 'Mezo Testnet', rpc: 'https://rpc.test.mezo.org',
      explorer: 'https://explorer.test.mezo.org', badge: 'Testnet',
    },
  ];

  return (
    <div className="page-content fade-in">
      <TopBar title="Settings" />
      <div className="content-wrap">

        {/* ── Network ── */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><span className="card-title">⚙ Network</span></div>
          <div style={{ padding: '0 0 8px' }}>
            {networks.map(n => {
              const active = chainId === n.id;
              return (
                <div key={n.id} className="settings-net-row" style={{ borderColor: active ? 'var(--accent)' : 'var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`pill ${active ? 'green' : ''}`} style={active ? {} : { background: 'rgba(255,255,255,0.05)', color: 'var(--muted)' }}>
                      {active ? '● Active' : '○'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{n.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        Chain ID: {n.id} &nbsp;·&nbsp;
                        <a href={n.explorer} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Explorer ↗</a>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'monospace' }}>{n.rpc}</div>
                    </div>
                  </div>
                  {!active && isConnected && (
                    <button className="wallet-btn primary" style={{ marginLeft: 'auto' }}
                      onClick={() => switchChain({ chainId: n.id })}>
                      Switch
                    </button>
                  )}
                  {!active && !isConnected && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>Connect wallet to switch</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Security ── */}
        <div className="card">
          <div className="card-header"><span className="card-title">🛡 Security</span></div>
          <div style={{ padding: '8px 0' }}>
            {isConnected ? (
              <div>
                <div className="settings-net-row" style={{ borderColor: 'var(--accent)' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Connected Wallet</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14 }}>{address}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                    <button className="wallet-btn" onClick={copyAddress}>{copied ? '✓ Copied' : 'Copy'}</button>
                    <a href={`https://explorer.mezo.org/address/${address}`} target="_blank" rel="noreferrer"
                      className="wallet-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Explorer ↗</a>
                  </div>
                </div>
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.06)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Disconnect Wallet</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Remove connection from this session</div>
                  </div>
                  <button className="wallet-btn" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => disconnect()}>
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '16px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>No wallet connected</div>
                <button className="topbar-connect" onClick={() => open()}>Connect Wallet</button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function AppContent() {
  const { address, isConnected } = useAccount();
  const { disconnect }           = useDisconnect();
  const { connect, connectors }  = useConnect();
  const { data: walletBalance }  = useBalance({ address });

  const live = useLiveChainData(address);

  const [stakeAmount,         setStakeAmount]         = useState('');
  const [withdrawAmount,      setWithdrawAmount]       = useState('');
  const [depositAmount,       setDepositAmount]        = useState('');
  const [vaultWithdrawAmount, setVaultWithdrawAmount]  = useState('');
  const [borrowBtc,           setBorrowBtc]            = useState('');
  const [borrowMusd,          setBorrowMusd]           = useState('');
  const [repayAmount,         setRepayAmount]          = useState('');
  const [addCollateralAmt,    setAddCollateralAmt]     = useState('');
  const [sendTo,              setSendTo]               = useState('');
  const [sendAmount,          setSendAmount]           = useState('');
  const [history,             setHistory]              = useState<TransactionRecord[]>(MOCK_HISTORY);

  // ── Contract reads ────────────────────────────────────────────────────────
  const { data: stakedBalance }    = useReadContract({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'getStakedBalance', args: address ? [address] : undefined, query: { enabled: !!address, refetchInterval: 12_000 } });
  const { data: vaultUserBalance } = useReadContract({ address: VAULT_ADDRESS,   abi: VAULT_ABI,   functionName: 'balanceOf',        args: address ? [address] : undefined, query: { enabled: !!address, refetchInterval: 12_000 } });
  const { data: musdBalance }      = useReadContract({ address: MUSD_ADDRESS,    abi: MUSD_ABI,    functionName: 'balanceOf',        args: address ? [address] : undefined, query: { enabled: !!address, refetchInterval: 12_000 } });
  const { data: borrowPosition }   = useReadContract({ address: BORROW_ADDRESS,  abi: BORROW_ABI,  functionName: 'getPosition',      args: address ? [address] : undefined, query: { enabled: !!address, refetchInterval: 12_000 } });

  // ── Contract writes ───────────────────────────────────────────────────────
  const { writeContract: writeStaking,   data: stakeHash    } = useWriteContract();
  const { writeContract: writeUnstake,   data: unstakeHash  } = useWriteContract();
  const { writeContract: writeDeposit,   data: depositHash  } = useWriteContract();
  const { writeContract: writeVaultW,    data: vaultWHash   } = useWriteContract();
  const { writeContract: writeBorrow,    data: borrowHash   } = useWriteContract();
  const { writeContract: writeRepay,     data: repayHash    } = useWriteContract();
  const { writeContract: writeAddColl,   data: addCollHash  } = useWriteContract();
  const { writeContract: writeClose,     data: closeHash    } = useWriteContract();
  const { data: sendHash, sendTransaction }                    = useSendTransaction();

  // ── Wait for receipts ─────────────────────────────────────────────────────
  const { isSuccess: isSendSuccess }    = useWaitForTransactionReceipt({ hash: sendHash    });
  const { isSuccess: isStakeSuccess }   = useWaitForTransactionReceipt({ hash: stakeHash   });
  const { isSuccess: isUnstakeSuccess } = useWaitForTransactionReceipt({ hash: unstakeHash });
  const { isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });
  const { isSuccess: isVaultWSuccess }  = useWaitForTransactionReceipt({ hash: vaultWHash  });
  const { isSuccess: isBorrowSuccess }  = useWaitForTransactionReceipt({ hash: borrowHash  });
  const { isSuccess: isRepaySuccess }   = useWaitForTransactionReceipt({ hash: repayHash   });

  useEffect(() => {
    if (isSendSuccess    && sendHash)    { setHistory(p => [{ id: sendHash,    type: 'Send',    amount: sendAmount,       status: 'Success', hash: sendHash,    timestamp: Date.now() }, ...p]); setSendAmount(''); setSendTo(''); }
  }, [isSendSuccess, sendHash]);
  useEffect(() => {
    if (isStakeSuccess   && stakeHash)   { setHistory(p => [{ id: stakeHash,   type: 'Stake',   amount: stakeAmount,      status: 'Success', hash: stakeHash,   timestamp: Date.now() }, ...p]); setStakeAmount(''); }
  }, [isStakeSuccess, stakeHash]);
  useEffect(() => {
    if (isUnstakeSuccess && unstakeHash) { setHistory(p => [{ id: unstakeHash, type: 'Withdraw',amount: withdrawAmount,    status: 'Success', hash: unstakeHash, timestamp: Date.now() }, ...p]); setWithdrawAmount(''); }
  }, [isUnstakeSuccess, unstakeHash]);
  useEffect(() => {
    if (isDepositSuccess && depositHash) { setHistory(p => [{ id: depositHash, type: 'Deposit', amount: depositAmount,     status: 'Success', hash: depositHash, timestamp: Date.now() }, ...p]); setDepositAmount(''); }
  }, [isDepositSuccess, depositHash]);
  useEffect(() => {
    if (isVaultWSuccess  && vaultWHash)  { setHistory(p => [{ id: vaultWHash,  type: 'Withdraw',amount: vaultWithdrawAmount,status: 'Success', hash: vaultWHash,  timestamp: Date.now() }, ...p]); setVaultWithdrawAmount(''); }
  }, [isVaultWSuccess, vaultWHash]);
  useEffect(() => {
    if (isBorrowSuccess  && borrowHash)  { setHistory(p => [{ id: borrowHash,  type: 'Borrow',  amount: borrowMusd,        status: 'Success', hash: borrowHash,  timestamp: Date.now() }, ...p]); setBorrowBtc(''); setBorrowMusd(''); }
  }, [isBorrowSuccess, borrowHash]);
  useEffect(() => {
    if (isRepaySuccess   && repayHash)   { setHistory(p => [{ id: repayHash,   type: 'Repay',   amount: repayAmount,        status: 'Success', hash: repayHash,   timestamp: Date.now() }, ...p]); setRepayAmount(''); }
  }, [isRepaySuccess, repayHash]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStake         = useCallback(() => { if (!stakeAmount)        return; writeStaking ({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'stake',         value: parseEther(stakeAmount) }); }, [stakeAmount, writeStaking]);
  const handleUnstake       = useCallback(() => { if (!withdrawAmount)     return; writeUnstake ({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'withdraw',      args: [parseEther(withdrawAmount)] }); }, [withdrawAmount, writeUnstake]);
  const handleDeposit       = useCallback(() => { if (!depositAmount)      return; writeDeposit ({ address: VAULT_ADDRESS,   abi: VAULT_ABI,   functionName: 'deposit',       value: parseEther(depositAmount) }); }, [depositAmount, writeDeposit]);
  const handleVaultWithdraw = useCallback(() => { if (!vaultWithdrawAmount)return; writeVaultW  ({ address: VAULT_ADDRESS,   abi: VAULT_ABI,   functionName: 'withdraw',      args: [parseEther(vaultWithdrawAmount)] }); }, [vaultWithdrawAmount, writeVaultW]);
  const handleBorrow        = useCallback(() => { if (!borrowBtc || !borrowMusd) return; writeBorrow({ address: BORROW_ADDRESS, abi: BORROW_ABI, functionName: 'borrow', value: parseEther(borrowBtc), args: [parseEther(borrowMusd)] }); }, [borrowBtc, borrowMusd, writeBorrow]);
  const handleRepay         = useCallback(() => { if (!repayAmount)        return; writeRepay   ({ address: BORROW_ADDRESS,  abi: BORROW_ABI,  functionName: 'repay',         args: [parseEther(repayAmount)] }); }, [repayAmount, writeRepay]);
  const handleAddCollateral = useCallback(() => { if (!addCollateralAmt)   return; writeAddColl ({ address: BORROW_ADDRESS,  abi: BORROW_ABI,  functionName: 'addCollateral', value: parseEther(addCollateralAmt) }); }, [addCollateralAmt, writeAddColl]);
  const handleClosePosition = useCallback(() => { writeClose({ address: BORROW_ADDRESS, abi: BORROW_ABI, functionName: 'closePosition' }); }, [writeClose]);
  const handleSend          = useCallback(() => { if (!sendAmount || !sendTo) return; sendTransaction({ to: sendTo as `0x${string}`, value: parseEther(sendAmount) }); }, [sendAmount, sendTo, sendTransaction]);

  const stakedFormatted       = stakedBalance      ? formatEther(stakedBalance      as bigint) : '0';
  const vaultBalanceFormatted = vaultUserBalance   ? formatEther(vaultUserBalance   as bigint) : '0';

  return (
    <div className="app-layout">
      <Sidebar address={address} isConnected={isConnected} balance={walletBalance} musdBalance={musdBalance} connectors={connectors} onConnect={connect} onDisconnect={disconnect} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard balance={walletBalance?.formatted} staked={stakedFormatted} vaultBalance={vaultBalanceFormatted} musdBalance={musdBalance} borrowPosition={borrowPosition as any} live={live} />} />
          <Route path="/borrow" element={
            <BorrowPage
              borrowPosition={borrowPosition as any} musdBalance={musdBalance}
              isConnected={isConnected}
              borrowBtc={borrowBtc}       setBorrowBtc={setBorrowBtc}
              borrowMusd={borrowMusd}     setBorrowMusd={setBorrowMusd}     onBorrow={handleBorrow}
              repayAmount={repayAmount}   setRepayAmount={setRepayAmount}   onRepay={handleRepay}
              addCollateralAmt={addCollateralAmt} setAddCollateralAmt={setAddCollateralAmt} onAddCollateral={handleAddCollateral}
              onClosePosition={handleClosePosition}
              live={live}
            />
          } />
          <Route path="/vault" element={<VaultPage vaultBalance={vaultBalanceFormatted} tvl={live.tvlWei} isConnected={isConnected} depositAmount={depositAmount} setDepositAmount={setDepositAmount} onDeposit={handleDeposit} vaultWithdrawAmount={vaultWithdrawAmount} setVaultWithdrawAmount={setVaultWithdrawAmount} onVaultWithdraw={handleVaultWithdraw} live={live} />} />
          <Route path="/staking" element={<StakingPage staked={stakedFormatted} balance={walletBalance?.formatted} isConnected={isConnected} stakeAmount={stakeAmount} setStakeAmount={setStakeAmount} onStake={handleStake} withdrawAmount={withdrawAmount} setWithdrawAmount={setWithdrawAmount} onWithdraw={handleUnstake} sendTo={sendTo} setSendTo={setSendTo} sendAmount={sendAmount} setSendAmount={setSendAmount} onSend={handleSend} live={live} />} />
          <Route path="/history"  element={<HistoryPage history={history} />} />
          <Route path="/analysis" element={<AnalysisPage balance={walletBalance?.formatted} staked={stakedFormatted} vaultBalance={vaultBalanceFormatted} live={live} />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <Router><AppContent /></Router>;
}
