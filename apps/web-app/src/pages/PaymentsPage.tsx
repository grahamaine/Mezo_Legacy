import React, { useState, useCallback, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import {
  ArrowUpRight, ArrowDownLeft, Copy, CheckCircle, Zap, Clock,
  CreditCard, Landmark, RefreshCw, FileText, Globe, Bot,
  Layers, ChevronRight,
} from 'lucide-react';
import { MUSD_ADDRESS, MUSD_ABI } from '../constants/musd';
import { TopBar } from '../components/shared';
import { useLiveChainData } from '../hooks/useLiveChainData';

const QUICK_AMOUNTS = [5, 10, 25, 50, 100];

const MOCK_ACTIVITY = [
  { id: 1, dir: 'out', label: 'Cosmic Coffee',   amount: 4.50,  time: '2m ago',  emoji: '☕', note: 'Morning latte' },
  { id: 2, dir: 'in',  label: 'Alex K.',         amount: 25.00, time: '1h ago',  emoji: '👤', note: 'Split dinner' },
  { id: 3, dir: 'out', label: 'Netflix',         amount: 15.99, time: '2d ago',  emoji: '📺', note: 'Monthly sub' },
  { id: 4, dir: 'in',  label: 'Game Prize Pool', amount: 50.00, time: '3d ago',  emoji: '🏆', note: 'Tournament win' },
  { id: 5, dir: 'out', label: 'Jordan L.',       amount: 12.00, time: '5d ago',  emoji: '👤', note: 'Lunch' },
  { id: 6, dir: 'out', label: 'Spotify',         amount: 9.99,  time: '7d ago',  emoji: '🎵', note: 'Monthly sub' },
];

const INFRA_CATEGORIES = [
  {
    id: 'cards',
    icon: <CreditCard size={22} />,
    title: 'Card Programs',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.22)',
    desc: 'Issue virtual and physical debit cards backed by MUSD. Spend BTC value anywhere Visa/Mastercard is accepted.',
    features: ['Virtual & physical cards', 'Instant MUSD-to-fiat conversion', 'Real-time spend controls', 'Multi-currency support'],
    stats: [{ label: 'Cards Issued', val: '12,400+' }, { label: 'Merchants', val: '60M+' }],
  },
  {
    id: 'atm',
    icon: <Landmark size={22} />,
    title: 'ATM Networks',
    color: 'var(--green)',
    bg: 'rgba(34,211,168,0.08)',
    border: 'rgba(34,211,168,0.22)',
    desc: 'Withdraw local cash from 300K+ ATMs globally using your MUSD balance. Bitcoin liquidity meets real-world cash.',
    features: ['300K+ ATM locations', 'Competitive FX rates', 'Instant conversion', 'Low withdrawal fees'],
    stats: [{ label: 'ATM Locations', val: '300K+' }, { label: 'Countries', val: '60+' }],
  },
  {
    id: 'subscriptions',
    icon: <RefreshCw size={22} />,
    title: 'Subscriptions & Billing',
    color: 'var(--accent)',
    bg: 'rgba(124,110,247,0.08)',
    border: 'rgba(124,110,247,0.22)',
    desc: 'Set up recurring MUSD payments for any subscription — from SaaS to media streaming to gym memberships.',
    features: ['Recurring MUSD payments', 'Flexible billing cycles', 'Failed payment recovery', 'Customer portal'],
    stats: [{ label: 'Active Subs', val: '48,000+' }, { label: 'Retention', val: '97.2%' }],
  },
  {
    id: 'invoicing',
    icon: <FileText size={22} />,
    title: 'Invoicing Systems',
    color: 'var(--blue)',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.22)',
    desc: 'Create and send MUSD invoices globally. Instant settlement, automatic reminders, and on-chain receipts.',
    features: ['One-click MUSD invoices', 'Auto-reminders', 'On-chain receipt', 'Multi-currency'],
    stats: [{ label: 'Invoices Sent', val: '200K+' }, { label: 'Avg. Settlement', val: '< 5s' }],
  },
  {
    id: 'remittance',
    icon: <Globe size={22} />,
    title: 'Remittance Platforms',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.22)',
    desc: 'Send money globally in seconds at a fraction of traditional fees. MUSD travels anywhere Bitcoin lives.',
    features: ['Global coverage', 'Near-zero fees', 'Instant settlement', 'Compliance built-in'],
    stats: [{ label: 'Countries', val: '180+' }, { label: 'Avg. Fee', val: '< $0.01' }],
  },
  {
    id: 'agentic',
    icon: <Bot size={22} />,
    title: 'Agentic Payments',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.22)',
    desc: 'AI agents autonomously execute MUSD payments on your behalf — pay for APIs, services, and data streams without lifting a finger.',
    features: ['AI-triggered payments', 'Spending limits & guardrails', 'Cross-agent coordination', 'Audit trail'],
    stats: [{ label: 'AI Agents', val: '3,200+' }, { label: 'Autonomous txns', val: '99K+' }],
  },
  {
    id: 'infrastructure',
    icon: <Layers size={22} />,
    title: 'MUSD Transaction Infrastructure',
    color: 'var(--accent)',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.22)',
    desc: 'Developer-grade payment rails: webhooks, SDKs, APIs, and smart contract hooks for building any MUSD-powered app.',
    features: ['REST & WebSocket API', 'SDKs (JS, Python, Go)', 'Smart contract hooks', 'Real-time settlement'],
    stats: [{ label: 'API Calls / day', val: '4.2M' }, { label: 'Uptime', val: '99.99%' }],
  },
];

export default function PaymentsPage() {
  const { address, isConnected } = useAccount();
  const live = useLiveChainData(address);

  const [tab,        setTab]        = useState<'send' | 'receive'>('send');
  const [infraTab,   setInfraTab]   = useState('cards');
  const [recipient,  setRecipient]  = useState('');
  const [amount,     setAmount]     = useState('');
  const [note,       setNote]       = useState('');
  const [copied,     setCopied]     = useState(false);
  const [sent,       setSent]       = useState(false);

  const { data: musdBalance } = useReadContract({
    address: MUSD_ADDRESS, abi: MUSD_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 12_000 },
  });

  const { writeContract, data: txHash } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const musdFmt = musdBalance ? parseFloat(formatEther(musdBalance as bigint)).toFixed(2) : '0.00';

  const handleSend = useCallback(() => {
    if (!recipient || !amount) return;
    writeContract({
      address: MUSD_ADDRESS, abi: MUSD_ABI, functionName: 'transfer',
      args: [recipient as `0x${string}`, parseEther(amount)],
    });
  }, [recipient, amount, writeContract]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (isSuccess) {
      setSent(true);
      setAmount('');
      setRecipient('');
      setNote('');
      setTimeout(() => setSent(false), 4000);
    }
  }, [isSuccess]);

  const amtNum  = parseFloat(amount) || 0;
  const canSend = isConnected && recipient.startsWith('0x') && amtNum > 0;
  const active  = INFRA_CATEGORIES.find(c => c.id === infraTab)!;

  return (
    <div className="page-content fade-in">
      <TopBar title="Payments" blockNumber={live.blockNumber} gasPriceGwei={live.gasPriceGwei} />
      <div className="content-wrap">

        {/* Balance Hero */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,110,247,0.12), rgba(37,99,235,0.08))',
          border: '1px solid rgba(124,110,247,0.22)', borderRadius: 20,
          padding: '36px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
            MUSD Balance
          </div>
          <div style={{ fontSize: 64, fontWeight: 900, color: 'var(--text)', lineHeight: 1, fontFamily: 'Oswald, sans-serif' }}>
            ${musdFmt}
          </div>
          <div style={{ fontSize: 13, color: 'var(--sub)', marginTop: 10 }}>
            Bitcoin-backed stable currency · Instant · Global · Zero-fee
          </div>
          {!isConnected && (
            <div style={{ marginTop: 14, fontSize: 13, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '8px 16px', borderRadius: 8, display: 'inline-block' }}>
              Connect your wallet to send & receive
            </div>
          )}
        </div>

        {/* Send / Receive */}
        <div style={{ display: 'flex', gap: 10 }}>
          {(['send', 'receive'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '14px', borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              transition: 'all 0.2s',
              background: tab === t ? (t === 'send' ? 'var(--accent)' : 'var(--green)') : 'var(--surface)',
              color: tab === t ? '#fff' : 'var(--muted)',
              border: tab === t ? 'none' : '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {t === 'send' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
              {t === 'send' ? 'Send MUSD' : 'Receive MUSD'}
            </button>
          ))}
        </div>

        {/* Send Panel */}
        {tab === 'send' && (
          <div className="card">
            {sent && (
              <div style={{ background: 'rgba(34,211,168,0.1)', border: '1px solid rgba(34,211,168,0.3)', borderRadius: 12, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--green)', fontSize: 14, fontWeight: 600 }}>
                <CheckCircle size={18} /> Payment sent! Transaction confirmed on-chain.
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Recipient wallet address</label>
              <input className="dapp-input" placeholder="0x... wallet address" value={recipient}
                onChange={e => setRecipient(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Amount</label>
              <div className="input-wrap">
                <input className="dapp-input" type="number" placeholder="0.00" value={amount}
                  onChange={e => setAmount(e.target.value)} />
                <span className="input-unit">MUSD</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                ≈ ${amtNum.toFixed(2)} USD · Balance: ${musdFmt} MUSD
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(a.toString())} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
                  background: amount === String(a) ? 'rgba(124,110,247,0.2)' : 'var(--surface)',
                  border: `1px solid ${amount === String(a) ? 'var(--accent)' : 'var(--border)'}`,
                  color: amount === String(a) ? 'var(--accent)' : 'var(--sub)',
                }}>${a}</button>
              ))}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Note (optional)</label>
              <input className="dapp-input" placeholder="What's it for?" value={note}
                onChange={e => setNote(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <button className="action-btn stake" disabled={!canSend} onClick={handleSend}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: canSend ? 1 : 0.5 }}>
              <Zap size={16} /> Send {amtNum > 0 ? `$${amtNum.toFixed(2)}` : ''} MUSD
            </button>
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
              Settles in seconds · Gas ≈ $0.001 · No fees
            </div>
          </div>
        )}

        {/* Receive Panel */}
        {tab === 'receive' && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: 'var(--sub)', marginBottom: 24 }}>
              Share your address — anyone can send you MUSD instantly
            </div>
            <div style={{
              width: 180, height: 180, margin: '0 auto 24px',
              background: '#ffffff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 6,
            }}>
              <div style={{ fontSize: 56, lineHeight: 1 }}>▦</div>
              <div style={{ fontSize: 11, color: '#374151', fontWeight: 700 }}>MUSD Address</div>
              {address && <div style={{ fontSize: 9, color: '#6b7280', fontFamily: 'monospace' }}>{address.slice(0, 10)}...</div>}
            </div>
            {isConnected && address ? (
              <>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all', marginBottom: 14, color: 'var(--text)', textAlign: 'left' }}>
                  {address}
                </div>
                <button className="action-btn stake" onClick={copyAddress}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {copied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy Address</>}
                </button>
                <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>Works with any EVM wallet · Mezo Network</div>
              </>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Connect wallet to show your address</div>
            )}
          </div>
        )}

        {/* ── Payment Infrastructure ─────────────────────────────────── */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
              Payment Infrastructure
            </div>
            <div style={{ fontSize: 13, color: 'var(--sub)' }}>
              MUSD-powered payment rails for every use case — from cards to AI agents
            </div>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {INFRA_CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setInfraTab(c.id)} style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: infraTab === c.id ? c.bg : 'var(--surface)',
                border: `1px solid ${infraTab === c.id ? c.border : 'var(--border)'}`,
                color: infraTab === c.id ? c.color : 'var(--sub)',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
              }}>
                <span style={{ display: 'flex', color: infraTab === c.id ? c.color : 'var(--muted)' }}>{c.icon}</span>
                {c.title}
              </button>
            ))}
          </div>

          {/* Active category detail */}
          <div className="card" style={{ border: `1px solid ${active.border}`, background: `linear-gradient(135deg, ${active.bg}, var(--surface))` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: active.bg, border: `1px solid ${active.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active.color }}>
                    {active.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{active.title}</div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                      {active.stats.map(s => (
                        <div key={s.label} style={{ fontSize: 11, color: 'var(--muted)' }}>
                          <span style={{ color: active.color, fontWeight: 700 }}>{s.val}</span> {s.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.7, marginBottom: 20 }}>{active.desc}</p>
                <button style={{
                  padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: active.color, color: '#000', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  Explore {active.title} <ChevronRight size={15} />
                </button>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Features</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {active.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <span style={{ color: active.color, fontSize: 14 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'var(--sub)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Activity</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> Last 7 days
            </span>
          </div>
          {MOCK_ACTIVITY.map(tx => (
            <div key={tx.id} className="tx-row">
              <div style={{
                width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
                background: tx.dir === 'in' ? 'rgba(34,211,168,0.1)' : 'rgba(248,113,113,0.08)',
                border: `1px solid ${tx.dir === 'in' ? 'rgba(34,211,168,0.2)' : 'rgba(248,113,113,0.15)'}`,
              }}>
                {tx.emoji}
              </div>
              <div className="tx-info">
                <div className="tx-type">{tx.label}</div>
                <div className="tx-hash">{tx.note} · {tx.time}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: tx.dir === 'in' ? 'var(--green)' : 'var(--text)' }}>
                  {tx.dir === 'in' ? '+' : '-'}${tx.amount.toFixed(2)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>MUSD</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
