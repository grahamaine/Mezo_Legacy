import React, { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { PiggyBank, Lock, Unlock, Target, TrendingUp, Zap, Plus } from 'lucide-react';
import { TopBar, MetricCard } from '../components/shared';
import { useLiveChainData } from '../hooks/useLiveChainData';
import { MUSD_ADDRESS, MUSD_ABI } from '../constants/musd';
import { STAKING_ADDRESS, STAKING_ABI } from '../constants/staking';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const SAVINGS_PRODUCTS = [
  {
    id: 'fixed',
    icon: <Lock size={22} />,
    name: 'Fixed Savings',
    token: 'BTC',
    apy: '5.2%',
    apyNum: 5.2,
    term: '90 days',
    minDeposit: '0.001 BTC',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    desc: 'Lock BTC for a fixed term and earn a guaranteed yield. Best for long-term holders.',
    features: ['Guaranteed APY', 'No early withdrawal', 'Auto-compound'],
  },
  {
    id: 'flexible',
    icon: <Unlock size={22} />,
    name: 'Flexible Savings',
    token: 'MUSD',
    apy: '3.8%',
    apyNum: 3.8,
    term: 'No lock-up',
    minDeposit: '$10 MUSD',
    color: 'var(--accent)',
    bg: 'rgba(124,110,247,0.08)',
    border: 'rgba(124,110,247,0.25)',
    desc: 'Earn yield on MUSD with full liquidity. Withdraw anytime, no fees.',
    features: ['Withdraw anytime', 'Daily payouts', 'No minimum term'],
  },
  {
    id: 'autosave',
    icon: <Zap size={22} />,
    name: 'Auto-Save',
    token: 'MUSD',
    apy: '2.4%',
    apyNum: 2.4,
    term: 'Ongoing',
    minDeposit: 'Any amount',
    color: 'var(--green)',
    bg: 'rgba(34,211,168,0.08)',
    border: 'rgba(34,211,168,0.25)',
    desc: 'Round up every MUSD transaction and automatically save the difference.',
    features: ['Round-up savings', 'Fully automated', 'Instant setup'],
  },
  {
    id: 'boost',
    icon: <TrendingUp size={22} />,
    name: 'Yield Boost',
    token: 'BTC + MUSD',
    apy: '7.5%',
    apyNum: 7.5,
    term: '180 days',
    minDeposit: '0.005 BTC',
    color: 'var(--blue)',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.25)',
    desc: 'Combine BTC collateral with MUSD deployment for maximum yield. Advanced strategy.',
    features: ['Highest APY', 'Carry trade', 'MUSD deployment'],
  },
];

const GOALS = [
  { name: 'Emergency Fund',  target: 5000,  saved: 2850,  color: 'var(--green)',  icon: '🛡' },
  { name: 'Bitcoin Stack',   target: 0.1,   saved: 0.047, color: '#f59e0b',       icon: '₿',  isBtc: true },
  { name: 'Travel Fund',     target: 3000,  saved: 800,   color: 'var(--blue)',   icon: '✈️' },
];

function projectionData(apy: number, principal: number, months = 12) {
  return Array.from({ length: months }, (_, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    value: +(principal * Math.pow(1 + apy / 100 / 12, i + 1)).toFixed(2),
  }));
}

export default function SavingsPage() {
  const { address, isConnected } = useAccount();
  const live = useLiveChainData(address);

  const [selected,    setSelected]    = useState('flexible');
  const [amount,      setAmount]      = useState('');
  const [goalModal,   setGoalModal]   = useState(false);
  const [activeGoal,  setActiveGoal]  = useState<typeof GOALS[0] | null>(null);

  const { data: musdBalance } = useReadContract({
    address: MUSD_ADDRESS, abi: MUSD_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 12_000 },
  });
  const { data: stakedBalance } = useReadContract({
    address: STAKING_ADDRESS, abi: STAKING_ABI, functionName: 'getStakedBalance',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 12_000 },
  });

  const musdFmt   = musdBalance   ? parseFloat(formatEther(musdBalance   as bigint)).toFixed(2) : '0.00';
  const stakedFmt = stakedBalance ? parseFloat(formatEther(stakedBalance as bigint)).toFixed(6) : '0.000000';

  const product    = SAVINGS_PRODUCTS.find(p => p.id === selected)!;
  const amtNum     = parseFloat(amount) || 1000;
  const chartData  = projectionData(product.apyNum, amtNum);
  const projected  = chartData[chartData.length - 1]?.value ?? amtNum;
  const yieldEarned = (projected - amtNum).toFixed(2);

  return (
    <div className="page-content fade-in">
      <TopBar title="Savings" blockNumber={live.blockNumber} gasPriceGwei={live.gasPriceGwei} />
      <div className="content-wrap">

        {/* Metrics */}
        <div className="metrics-row four-col">
          <MetricCard label="MUSD Saved"      value={`$${musdFmt}`}    sub="Flexible savings"  accent />
          <MetricCard label="BTC Staked"       value={`${stakedFmt}`}   sub="Earning 4.8% APY"  changeDir="up" change="APY 4.8%" />
          <MetricCard label="Total Yield APY"  value="Up to 7.5%"       sub="Yield Boost"       changeDir="up" change="Best rate" />
          <MetricCard label="Goals Tracking"   value={`${GOALS.length}`} sub="Active goals"     changeDir="up" change="On track" />
        </div>

        {/* Products */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {SAVINGS_PRODUCTS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              style={{
                padding: '18px', borderRadius: 14, textAlign: 'left', cursor: 'pointer',
                background: selected === p.id ? p.bg : 'var(--surface)',
                border: `1px solid ${selected === p.id ? p.border : 'var(--border)'}`,
                transition: 'all 0.18s',
              }}>
              <div style={{ color: p.color, marginBottom: 10 }}>{p.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: p.color, letterSpacing: -1, marginBottom: 2 }}>{p.apy}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>APY · {p.token}</div>
              <div style={{ fontSize: 11, color: 'var(--sub)' }}>{p.term}</div>
            </button>
          ))}
        </div>

        {/* Selected product detail */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: product.color }}>{product.icon}</span> {product.name}
              </span>
              <span style={{ fontSize: 20, fontWeight: 900, color: product.color }}>{product.apy}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--sub)', marginBottom: 18, lineHeight: 1.7 }}>{product.desc}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
              {product.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--sub)' }}>
                  <span style={{ color: product.color, fontSize: 14 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <div className="info-box">
              <div className="ib-row"><span>Min. deposit</span><span>{product.minDeposit}</span></div>
              <div className="ib-row"><span>Term</span><span>{product.term}</span></div>
              <div className="ib-row"><span>Token</span><span style={{ color: product.color }}>{product.token}</span></div>
              <div className="ib-row"><span>Payout</span><span className="green">Daily</span></div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Deposit amount</label>
              <div className="input-wrap">
                <input className="dapp-input" type="number" placeholder="0.00" value={amount}
                  onChange={e => setAmount(e.target.value)} />
                <span className="input-unit">{product.token}</span>
              </div>
            </div>
            {amtNum > 0 && (
              <div style={{ padding: '10px 14px', background: 'rgba(34,211,168,0.06)', border: '1px solid rgba(34,211,168,0.18)', borderRadius: 10, fontSize: 12, color: 'var(--sub)', marginBottom: 14 }}>
                At {product.apy} APY, earn ≈ <strong style={{ color: 'var(--green)' }}>+{yieldEarned} {product.token}</strong> over 12 months
              </div>
            )}
            <button className="action-btn stake" disabled={!isConnected || !amount}
              style={{ background: product.color }}>
              <PiggyBank size={15} /> Deposit to {product.name}
            </button>
          </div>

          {/* Yield projection chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">12-Month Yield Projection</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: product.color }}>{product.apy} APY</span>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={product.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={product.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: 'var(--muted)' }}
                    formatter={(v: any) => [`${Number(v).toFixed(2)} ${product.token}`, 'Value']}
                  />
                  <Area type="monotone" dataKey="value" stroke={product.color} strokeWidth={2} fill="url(#savingsGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Rate comparisons */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SAVINGS_PRODUCTS.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 12, color: p.id === selected ? 'var(--text)' : 'var(--muted)', flex: 1, fontWeight: p.id === selected ? 700 : 400 }}>
                    {p.name}
                  </div>
                  <div style={{ width: `${p.apyNum / 8 * 60}%`, height: 6, background: p.color, borderRadius: 3, opacity: p.id === selected ? 1 : 0.4 }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: p.color, width: 40, textAlign: 'right' }}>{p.apy}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Savings Goals */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={15} style={{ color: 'var(--accent)' }} /> Savings Goals
            </span>
            <button
              onClick={() => setGoalModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(124,110,247,0.12)', border: '1px solid rgba(124,110,247,0.25)', color: 'var(--accent)' }}>
              <Plus size={13} /> New Goal
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {GOALS.map(g => {
              const pct = Math.round((g.saved / g.target) * 100);
              return (
                <div key={g.name} style={{ background: 'var(--surface2)', borderRadius: 12, padding: '18px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {g.isBtc ? `${g.saved} / ${g.target} BTC` : `$${g.saved.toLocaleString()} / $${g.target.toLocaleString()}`}
                      </div>
                    </div>
                    <span style={{ fontSize: 22 }}>{g.icon}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: g.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: g.color, fontWeight: 700 }}>{pct}% complete</span>
                    <span style={{ color: 'var(--muted)' }}>{100 - pct}% to go</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* New Goal Modal */}
        {goalModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(6,13,27,0.85)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)',
          }} onClick={() => setGoalModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{
              background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 20,
              padding: '32px', width: '100%', maxWidth: 420,
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Target size={18} style={{ color: 'var(--accent)' }} /> New Savings Goal
              </div>
              {['Goal name', 'Target amount', 'Target date'].map(label => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{label}</label>
                  <input className="dapp-input" placeholder={label} style={{ width: '100%' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="action-btn withdraw" style={{ flex: 1 }} onClick={() => setGoalModal(false)}>Cancel</button>
                <button className="action-btn stake" style={{ flex: 2 }} onClick={() => setGoalModal(false)}>Create Goal</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
