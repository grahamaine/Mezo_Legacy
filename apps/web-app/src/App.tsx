import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  useAccount, useConnect, useDisconnect, useBalance,
  useSendTransaction, useWaitForTransactionReceipt,
  useReadContract, useWriteContract
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, LineChart, Line
} from 'recharts';
import { STAKING_ADDRESS, STAKING_ABI } from './constants/staking';
import './App.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TransactionRecord {
  id: string;
  type: 'Send' | 'Stake' | 'Withdraw';
  amount: string;
  status: 'Pending' | 'Success';
  hash: string;
  timestamp: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const priceData = [
  { time: '00:00', price: 3200 }, { time: '04:00', price: 3150 },
  { time: '08:00', price: 3300 }, { time: '12:00', price: 3280 },
  { time: '16:00', price: 3450 }, { time: '20:00', price: 3400 },
  { time: '24:00', price: 3512 },
];

const rewardsData = [
  { week: 'W1', amount: 0.012 }, { week: 'W2', amount: 0.018 },
  { week: 'W3', amount: 0.020 }, { week: 'W4', amount: 0.022 },
];

const volumeData = [
  { day: 'Mon', vol: 0.8 }, { day: 'Tue', vol: 1.2 }, { day: 'Wed', vol: 0.4 },
  { day: 'Thu', vol: 1.8 }, { day: 'Fri', vol: 0.6 }, { day: 'Sat', vol: 2.1 },
  { day: 'Sun', vol: 1.5 },
];

const yieldData = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  yield: +(1.5 * Math.pow(1 + 0.048 / 12, i + 1)).toFixed(4),
}));

const MOCK_HISTORY: TransactionRecord[] = [
  { id: '1', type: 'Stake',    amount: '0.50', status: 'Success', hash: '0x4fe2a91c', timestamp: Date.now() - 120000 },
  { id: '2', type: 'Withdraw', amount: '0.20', status: 'Success', hash: '0x8b1dc44e', timestamp: Date.now() - 3600000 },
  { id: '3', type: 'Send',     amount: '0.05', status: 'Pending', hash: '0x2ca7f12b', timestamp: Date.now() - 10800000 },
  { id: '4', type: 'Stake',    amount: '1.00', status: 'Success', hash: '0x9e3ad77c', timestamp: Date.now() - 18000000 },
  { id: '5', type: 'Send',     amount: '0.10', status: 'Success', hash: '0x7d2f88ab', timestamp: Date.now() - 86400000 },
  { id: '6', type: 'Stake',    amount: '0.25', status: 'Success', hash: '0x3a1ecc91', timestamp: Date.now() - 172800000 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TX_META: Record<string, { icon: string; color: string; label: string }> = {
  Stake:    { icon: '🔥', color: 'var(--accent2)',   label: 'Stake' },
  Withdraw: { icon: '↙',  color: 'var(--blue)',      label: 'Withdraw' },
  Send:     { icon: '↗',  color: 'var(--green)',     label: 'Send' },
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      <p className="tooltip-val">{typeof payload[0].value === 'number' && payload[0].value > 100
        ? `$${payload[0].value.toLocaleString()}`
        : `${payload[0].value} ETH`
      }</p>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ address, isConnected, balance, onConnect, onDisconnect, connectors }: any) {
  const location = useLocation();
  const links = [
    { to: '/',         label: 'Dashboard', icon: '⊞', badge: null },
    { to: '/staking',  label: 'Staking',   icon: '🔥', badge: '4.8%' },
    { to: '/history',  label: 'History',   icon: '◷',  badge: null },
    { to: '/analysis', label: 'Analysis',  icon: '↗',  badge: null },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-glow" />
      <div className="logo-area">
        <div className="logo"><span className="logo-dot" />Mezo Legacy</div>
        <div className="logo-sub">Sepolia Testnet · v2.4.1</div>
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
        <div className="nav-item"><span className="nav-icon">⚙</span>Network</div>
        <div className="nav-item"><span className="nav-icon">🛡</span>Security</div>
      </nav>
      <div className="wallet-area">
        {isConnected ? (
          <div className="wallet-card">
            <div className="wallet-addr">
              <span className="online-dot" />
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            <div className="wallet-bal">{parseFloat(balance?.formatted || '0').toFixed(4)} ETH</div>
            <div className="wallet-usd">
              ≈ ${(parseFloat(balance?.formatted || '0') * 3512).toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
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

// ─── TopBar ───────────────────────────────────────────────────────────────────

function TopBar({ title }: { title: string }) {
  return (
    <div className="topbar">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">Friday, May 8 2026 · Auto-refreshing</p>
      </div>
      <div className="topbar-right">
        <div className="pill amber"><span className="blink">◉</span> Block #7,842,391</div>
        <div className="pill green"><span>●</span> Sepolia · 12 gwei</div>
      </div>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, change, changeDir, accent }: any) {
  return (
    <div className={`metric-card${accent ? ' accent' : ''}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
      {change && (
        <div className={`metric-change ${changeDir}`}>
          {changeDir === 'up' ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

function Dashboard({ balance, staked }: { balance?: string; staked?: string }) {
  const portfolioUSD = ((parseFloat(balance || '0') + parseFloat(staked || '0')) * 3512).toFixed(2);

  return (
    <div className="page-content fade-in">
      <TopBar title="Overview" />
      <div className="content-wrap">

        {/* Metrics */}
        <div className="metrics-row four-col">
          <MetricCard label="ETH Balance"    value={`${parseFloat(balance || '0').toFixed(4)}`}  sub="ETH Available"  change="+0.24 today"   changeDir="up" />
          <MetricCard label="Total Staked"   value={`${parseFloat(staked  || '0').toFixed(4)}`}  sub="ETH Locked"     change="APY 4.8%"      changeDir="up" accent />
          <MetricCard label="Rewards Earned" value="0.0723"   sub="ETH Earned"     change="+0.0041 this week" changeDir="up" />
          <MetricCard label="Portfolio USD"  value={`$${Number(portfolioUSD).toLocaleString()}`} sub="Total Value" change="+3.2% 24h" changeDir="up" />
        </div>

        {/* Charts Row */}
        <div className="grid-2-1">
          <div className="card">
            <div className="card-header">
              <span className="card-title">ETH / USD Price Action</span>
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
                <AreaChart data={priceData}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c6ef7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#7c6ef7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="price" stroke="#7c6ef7" strokeWidth={2} fill="url(#priceGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-footer">
              <div><div className="cf-label">Current</div><div className="cf-val green">$3,512.40</div></div>
              <div style={{ textAlign: 'right' }}><div className="cf-label">24h Change</div><div className="cf-val green">+$312.40 (+9.8%)</div></div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Allocation</span>
              <span className="card-meta">3 assets</span>
            </div>
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:52},{v:31},{v:17}]}>
                  <Area type="monotone" dataKey="v" stroke="#7c6ef7" fill="#7c6ef720" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <div className="donut-pct">100%</div>
                <div className="donut-lbl">TVL</div>
              </div>
            </div>
            <div className="legend-stack">
              {[
                { label: 'Staked ETH', pct: '52%', color: '#7c6ef7' },
                { label: 'Liquid ETH', pct: '31%', color: '#38bdf8' },
                { label: 'Rewards',    pct: '17%', color: '#22d3a8' },
              ].map(l => (
                <div key={l.label} className="legend-row">
                  <span className="legend-dot" style={{ background: l.color }} />
                  <span className="legend-label">{l.label}</span>
                  <span className="legend-pct">{l.pct}</span>
                </div>
              ))}
            </div>
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
                  <div className="tx-icon" style={{ color: meta.color, borderColor: meta.color + '30', background: meta.color + '15' }}>
                    {meta.icon}
                  </div>
                  <div className="tx-info">
                    <div className="tx-type">{tx.type}</div>
                    <div className="tx-hash">{tx.hash} · {timeAgo(tx.timestamp)}</div>
                  </div>
                  <div className="tx-amount" style={{ color: meta.color }}>{tx.amount} ETH</div>
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
                { speed: 'Slow',     gwei: 9,  time: '~3 min', cls: 'green' },
                { speed: 'Standard', gwei: 12, time: '~30 sec', cls: 'amber' },
                { speed: 'Fast',     gwei: 18, time: '~10 sec', cls: 'red' },
              ].map(g => (
                <div key={g.speed} className={`gas-row ${g.cls}`}>
                  <span className="gas-speed">{g.speed}</span>
                  <span className="gas-gwei">{g.gwei} gwei</span>
                  <span className="gas-time">{g.time}</span>
                </div>
              ))}
            </div>
            <div className="staking-mini">
              <div className="sm-header">Staking Overview</div>
              <div className="sm-row"><span>Staked</span><span>{parseFloat(staked || '0').toFixed(4)} ETH</span></div>
              <div className="sm-row"><span>APY</span><span className="green">4.8%</span></div>
              <div className="sm-row"><span>Next reward</span><span>~8h</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Staking Page ─────────────────────────────────────────────────────────────

function StakingPage({
  staked, balance, isConnected,
  stakeAmount, setStakeAmount, onStake,
  withdrawAmount, setWithdrawAmount, onWithdraw,
  sendTo, setSendTo, sendAmount, setSendAmount, onSend,
}: any) {
  return (
    <div className="page-content fade-in">
      <TopBar title="Staking Vault" />
      <div className="content-wrap">

        <div className="metrics-row three-col">
          <MetricCard label="Staked" value={`${parseFloat(staked || '0').toFixed(4)} ETH`} sub="Currently locked" change="APY 4.8%" changeDir="up" accent />
          <MetricCard label="Rewards Earned" value="0.0723 ETH" sub="Since inception" change="+0.0041 this week" changeDir="up" />
          <MetricCard label="Next Reward" value="~8h" sub="Est. 0.0041 ETH" />
        </div>

        {/* Action Cards */}
        <div className="action-row">
          {/* Stake */}
          <div className="action-card">
            <div className="action-label accent">🔥 Stake Assets</div>
            <div className="input-wrap">
              <input className="dapp-input" type="number" placeholder="0.00" value={stakeAmount}
                onChange={e => setStakeAmount(e.target.value)} />
              <span className="input-unit">ETH</span>
            </div>
            <div className="input-meta">
              <span>Available: {parseFloat(balance || '0').toFixed(4)} ETH</span>
              <button className="max-btn" onClick={() => setStakeAmount(balance || '0')}>MAX</button>
            </div>
            <div className="info-box">
              <div className="ib-row"><span>Est. APY</span><span className="green">4.8%</span></div>
              <div className="ib-row"><span>Annual reward</span><span>~0.072 ETH</span></div>
              <div className="ib-row"><span>Lock period</span><span>None</span></div>
            </div>
            <button className="action-btn stake" disabled={!isConnected} onClick={onStake}>
              🔥 Confirm Stake
            </button>
          </div>

          {/* Withdraw */}
          <div className="action-card">
            <div className="action-label blue">↙ Withdraw</div>
            <div className="input-wrap">
              <input className="dapp-input" type="number" placeholder="0.00" value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)} />
              <span className="input-unit">ETH</span>
            </div>
            <div className="input-meta">
              <span>Staked: {parseFloat(staked || '0').toFixed(4)} ETH</span>
              <button className="max-btn blue" onClick={() => setWithdrawAmount(staked || '0')}>MAX</button>
            </div>
            <div className="info-box">
              <div className="ib-row"><span>Unlock period</span><span className="amber">~24h</span></div>
              <div className="ib-row"><span>Rewards forfeited</span><span className="green">None</span></div>
              <div className="ib-row"><span>Slippage</span><span>0%</span></div>
            </div>
            <button className="action-btn withdraw" disabled={!isConnected} onClick={onWithdraw}>
              ↙ Withdraw Assets
            </button>
          </div>

          {/* Send */}
          <div className="action-card">
            <div className="action-label green">↗ Direct Transfer</div>
            <input className="dapp-input" placeholder="Recipient 0x..." value={sendTo}
              onChange={e => setSendTo(e.target.value)} style={{ marginBottom: 8 }} />
            <div className="input-wrap">
              <input className="dapp-input" type="number" placeholder="0.00" value={sendAmount}
                onChange={e => setSendAmount(e.target.value)} />
              <span className="input-unit">ETH</span>
            </div>
            <div className="input-meta">
              <span>Gas est: ~0.00042 ETH</span>
              <span className="muted">≈ $1.48</span>
            </div>
            <div className="info-box">
              <div className="ib-row"><span>Network</span><span>Sepolia</span></div>
              <div className="ib-row"><span>Confirmations</span><span>1 block</span></div>
              <div className="ib-row"><span>Speed</span><span className="amber">Standard</span></div>
            </div>
            <button className="action-btn send" disabled={!isConnected} onClick={onSend}>
              ↗ Send ETH
            </button>
          </div>
        </div>

        {/* Rewards Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Staking Rewards — Last 30 Days</span>
            <span className="card-meta">Total: 0.0723 ETH earned</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rewardsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="week" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(3)}Ξ`} />
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
  const [filter, setFilter] = useState<'All' | 'Stake' | 'Withdraw' | 'Send'>('All');
  const filtered = filter === 'All' ? history : history.filter(tx => tx.type === filter);
  const totalStaked = history.filter(t => t.type === 'Stake').reduce((a, t) => a + parseFloat(t.amount), 0);
  const totalSent   = history.filter(t => t.type === 'Send').reduce((a, t) => a + parseFloat(t.amount), 0);

  return (
    <div className="page-content fade-in">
      <TopBar title="Transaction History" />
      <div className="content-wrap">

        <div className="metrics-row three-col">
          <MetricCard label="Total Transactions" value={history.length.toString()} sub="All time" />
          <MetricCard label="Volume Staked"      value={`${totalStaked.toFixed(4)} ETH`} sub="Cumulative" />
          <MetricCard label="Volume Sent"        value={`${totalSent.toFixed(4)} ETH`}   sub="Cumulative" />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">All Activity</span>
            <div className="tab-row">
              {(['All', 'Stake', 'Withdraw', 'Send'] as const).map(f => (
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
                  <div className="tx-icon" style={{ color: meta.color, borderColor: meta.color + '30', background: meta.color + '15' }}>
                    {meta.icon}
                  </div>
                  <div className="tx-info">
                    <div className="tx-type">{tx.type}</div>
                    <div className="tx-hash">
                      <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer">
                        {tx.hash.slice(0, 12)}...
                      </a>
                      · {timeAgo(tx.timestamp)}
                    </div>
                  </div>
                  <div className="tx-amount" style={{ color: meta.color }}>{tx.amount} ETH</div>
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

function AnalysisPage({ balance, staked }: { balance?: string; staked?: string }) {
  const tvl = ((parseFloat(balance || '0') + parseFloat(staked || '0')) * 3512).toFixed(0);
  const stakingRatio = staked && balance
    ? ((parseFloat(staked) / (parseFloat(staked) + parseFloat(balance))) * 100).toFixed(1)
    : '52.7';

  return (
    <div className="page-content fade-in">
      <TopBar title="Portfolio Analysis" />
      <div className="content-wrap">

        {/* Charts */}
        <div className="grid-1-1">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Volume Analysis</span>
              <span className="card-meta">Last 7 days</span>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v: number) => `${v}Ξ`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="vol" fill="#22d3a8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Yield Projection</span>
              <span className="card-meta">12 months @ 4.8% APY</span>
            </div>
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
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(2)}Ξ`} domain={['auto','auto']} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="yield" stroke="#f59e0b" strokeWidth={2} fill="url(#yieldGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Metrics + Holdings */}
        <div className="grid-2-1">
          <div className="card">
            <div className="card-header"><span className="card-title">On-Chain Metrics</span></div>
            <div className="metrics-row two-col" style={{ marginBottom: 20 }}>
              <div className="info-block"><div className="ib-label">Total Value Locked</div><div className="ib-val accent">${Number(tvl).toLocaleString()}</div></div>
              <div className="info-block"><div className="ib-label">Staking Ratio</div><div className="ib-val green">{stakingRatio}%</div></div>
              <div className="info-block"><div className="ib-label">Avg Gas Used</div><div className="ib-val">12.4 gwei</div></div>
              <div className="info-block"><div className="ib-label">Contract Calls</div><div className="ib-val">47</div></div>
            </div>
            <div className="progress-section">
              <div className="progress-row">
                <span>Staking utilization</span><span>{stakingRatio}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${stakingRatio}%` }} /></div>
              <div className="progress-row" style={{ marginTop: 12 }}>
                <span>Reward efficiency</span><span>97.2%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill green" style={{ width: '97.2%' }} /></div>
              <div className="progress-row" style={{ marginTop: 12 }}>
                <span>Network uptime</span><span>99.9%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill blue" style={{ width: '99.9%' }} /></div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Holdings</span></div>
            {[
              { sym: 'stE', label: 'Staked ETH',  net: 'Ethereum · Sepolia', amt: parseFloat(staked || '1.5').toFixed(4), usd: (parseFloat(staked || '1.5') * 3512).toFixed(2), color: '#7c6ef7' },
              { sym: 'ETH', label: 'Ethereum',     net: 'Ethereum · Sepolia', amt: parseFloat(balance || '2.844').toFixed(4), usd: (parseFloat(balance || '2.844') * 3512).toFixed(2), color: '#38bdf8' },
              { sym: 'RWD', label: 'Rewards',      net: 'Staking · Earned',   amt: '0.0723', usd: (0.0723 * 3512).toFixed(2), color: '#22d3a8' },
            ].map(h => (
              <div key={h.sym} className="holding-row">
                <div className="holding-left">
                  <div className="holding-icon" style={{ background: h.color + '20', color: h.color }}>{h.sym}</div>
                  <div>
                    <div className="holding-name">{h.label}</div>
                    <div className="holding-net">{h.net}</div>
                  </div>
                </div>
                <div>
                  <div className="holding-amt">{h.amt} ETH</div>
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

// ─── Main App ─────────────────────────────────────────────────────────────────

function AppContent() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const { data: walletBalance } = useBalance({ address });

  const [stakeAmount,    setStakeAmount]    = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [sendTo,         setSendTo]         = useState('');
  const [sendAmount,     setSendAmount]     = useState('');
  const [history,        setHistory]        = useState<TransactionRecord[]>(MOCK_HISTORY);

  // Contract reads
  const { data: stakedBalance } = useReadContract({
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getStakedBalance',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Contract writes
  const { writeContract: writeStaking, data: stakeHash }   = useWriteContract();
  const { data: sendHash, sendTransaction }                  = useSendTransaction();
  const { writeContract: writeWithdraw,  data: withdrawHash } = useWriteContract();

  // Wait for confirmations
  const { isSuccess: isSendSuccess }     = useWaitForTransactionReceipt({ hash: sendHash });
  const { isSuccess: isStakeSuccess }    = useWaitForTransactionReceipt({ hash: stakeHash });
  const { isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

  useEffect(() => {
    if (isSendSuccess && sendHash) {
      setHistory(prev => [{
        id: sendHash, type: 'Send', amount: sendAmount,
        status: 'Success', hash: sendHash, timestamp: Date.now(),
      }, ...prev]);
      setSendAmount(''); setSendTo('');
    }
  }, [isSendSuccess, sendHash]);

  useEffect(() => {
    if (isStakeSuccess && stakeHash) {
      setHistory(prev => [{
        id: stakeHash, type: 'Stake', amount: stakeAmount,
        status: 'Success', hash: stakeHash, timestamp: Date.now(),
      }, ...prev]);
      setStakeAmount('');
    }
  }, [isStakeSuccess, stakeHash]);

  useEffect(() => {
    if (isWithdrawSuccess && withdrawHash) {
      setHistory(prev => [{
        id: withdrawHash, type: 'Withdraw', amount: withdrawAmount,
        status: 'Success', hash: withdrawHash, timestamp: Date.now(),
      }, ...prev]);
      setWithdrawAmount('');
    }
  }, [isWithdrawSuccess, withdrawHash]);

  const handleStake = useCallback(() => {
    if (!stakeAmount) return;
    writeStaking({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'stake', value: parseEther(stakeAmount) });
  }, [stakeAmount, writeStaking]);

  const handleWithdraw = useCallback(() => {
    if (!withdrawAmount) return;
    writeWithdraw({ address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'withdraw', args: [parseEther(withdrawAmount)] });
  }, [withdrawAmount, writeWithdraw]);

  const handleSend = useCallback(() => {
    if (!sendAmount || !sendTo) return;
    sendTransaction({ to: sendTo as `0x${string}`, value: parseEther(sendAmount) });
  }, [sendAmount, sendTo, sendTransaction]);

  const stakedFormatted = stakedBalance ? formatEther(stakedBalance as bigint) : '1.5000';

  return (
    <div className="app-layout">
      <Sidebar
        address={address}
        isConnected={isConnected}
        balance={walletBalance}
        connectors={connectors}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      <main className="app-main">
        <Routes>
          <Route path="/"         element={<Dashboard balance={walletBalance?.formatted} staked={stakedFormatted} />} />
          <Route path="/staking"  element={
            <StakingPage
              staked={stakedFormatted}
              balance={walletBalance?.formatted}
              isConnected={isConnected}
              stakeAmount={stakeAmount}    setStakeAmount={setStakeAmount}    onStake={handleStake}
              withdrawAmount={withdrawAmount} setWithdrawAmount={setWithdrawAmount} onWithdraw={handleWithdraw}
              sendTo={sendTo} setSendTo={setSendTo}
              sendAmount={sendAmount} setSendAmount={setSendAmount} onSend={handleSend}
            />
          } />
          <Route path="/history"  element={<HistoryPage history={history} />} />
          <Route path="/analysis" element={<AnalysisPage balance={walletBalance?.formatted} staked={stakedFormatted} />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}