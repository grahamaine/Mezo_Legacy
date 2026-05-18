import React, { useState, useCallback, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { ArrowUpRight, ArrowDownLeft, Copy, CheckCircle, Zap, Clock } from 'lucide-react';
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

export default function PaymentsPage() {
  const { address, isConnected } = useAccount();
  const live = useLiveChainData(address);

  const [tab,       setTab]       = useState<'send' | 'receive'>('send');
  const [recipient, setRecipient] = useState('');
  const [amount,    setAmount]    = useState('');
  const [note,      setNote]      = useState('');
  const [copied,    setCopied]    = useState(false);
  const [sent,      setSent]      = useState(false);

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

  const amtNum = parseFloat(amount) || 0;
  const canSend = isConnected && recipient.startsWith('0x') && amtNum > 0;

  return (
    <div className="page-content fade-in">
      <TopBar title="Pay" blockNumber={live.blockNumber} gasPriceGwei={live.gasPriceGwei} />
      <div className="content-wrap">

        {/* Balance Hero */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,110,247,0.15), rgba(34,211,168,0.06))',
          border: '1px solid rgba(124,110,247,0.25)', borderRadius: 20,
          padding: '36px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
            MUSD Balance
          </div>
          <div style={{ fontSize: 64, fontWeight: 900, color: 'var(--text)', lineHeight: 1, fontFamily: 'Oswald, sans-serif' }}>
            ${musdFmt}
          </div>
          <div style={{ fontSize: 13, color: 'var(--sub)', marginTop: 10 }}>
            Bitcoin-backed stable currency · Instant · Global
          </div>
          {!isConnected && (
            <div style={{ marginTop: 14, fontSize: 13, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '8px 16px', borderRadius: 8, display: 'inline-block' }}>
              Connect your wallet to send & receive
            </div>
          )}
        </div>

        {/* Tab Switcher */}
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
              <input
                className="dapp-input"
                placeholder="0x... wallet address"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
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

            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(a.toString())} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
                  background: amount === String(a) ? 'rgba(124,110,247,0.2)' : 'var(--surface)',
                  border: `1px solid ${amount === String(a) ? 'var(--accent)' : 'var(--border)'}`,
                  color: amount === String(a) ? 'var(--accent)' : 'var(--sub)',
                }}>
                  ${a}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Note (optional)</label>
              <input className="dapp-input" placeholder="What's it for?" value={note}
                onChange={e => setNote(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>

            <button
              className="action-btn stake"
              disabled={!canSend}
              onClick={handleSend}
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

            {/* QR placeholder */}
            <div style={{
              width: 180, height: 180, margin: '0 auto 24px',
              background: '#ffffff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 6,
            }}>
              <div style={{ fontSize: 56, lineHeight: 1 }}>▦</div>
              <div style={{ fontSize: 11, color: '#374151', fontWeight: 700 }}>MUSD Address</div>
              {address && (
                <div style={{ fontSize: 9, color: '#6b7280', fontFamily: 'monospace' }}>
                  {address.slice(0, 10)}...
                </div>
              )}
            </div>

            {isConnected && address ? (
              <>
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
                  padding: '14px 18px', fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all',
                  marginBottom: 14, color: 'var(--text)', textAlign: 'left',
                }}>
                  {address}
                </div>
                <button className="action-btn stake" onClick={copyAddress}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {copied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy Address</>}
                </button>
                <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
                  Works with any EVM wallet · Mezo Network
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Connect wallet to show your address</div>
            )}
          </div>
        )}

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
