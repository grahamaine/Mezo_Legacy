import React, { useState, useCallback, useEffect } from 'react';
import { ArrowDownUp, ArrowDown, Settings2, ExternalLink, Info, RefreshCw, Zap } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseUnits, formatEther, formatUnits } from 'viem';
import {
  SWAP_ROUTER_ADDRESS, SWAP_ROUTER_ABI, SWAP_TOKENS, WBTC_ADDRESS,
} from '../constants/swap';
import { MUSD_ADDRESS, MUSD_ABI } from '../constants/musd';

// ─── Types ────────────────────────────────────────────────────────────────────

type Token = typeof SWAP_TOKENS[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deadline() {
  return BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 min
}

function buildPath(from: Token, to: Token): `0x${string}`[] {
  if (from.symbol === 'BTC')  return [WBTC_ADDRESS, to.address as `0x${string}`];
  if (to.symbol   === 'BTC')  return [from.address as `0x${string}`, WBTC_ADDRESS];
  return [from.address as `0x${string}`, to.address as `0x${string}`];
}

function slippageAmt(amount: bigint, bps: number): bigint {
  return (amount * BigInt(10000 - bps)) / 10000n;
}

// ─── Token Selector ───────────────────────────────────────────────────────────

function TokenBtn({ token, onClick }: { token: Token; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 10,
        background: token.color + '18', border: `1px solid ${token.color}44`,
        color: 'var(--text)', cursor: 'pointer', fontWeight: 700, fontSize: 15,
        transition: 'all 0.15s',
      }}
    >
      <span style={{
        width: 26, height: 26, borderRadius: '50%',
        background: token.color + '28', color: token.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800,
      }}>
        {token.logoChar}
      </span>
      {token.symbol}
      <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 2 }}>▾</span>
    </button>
  );
}

function TokenDropdown({ exclude, onSelect, onClose }: {
  exclude: string; onSelect: (t: Token) => void; onClose: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', top: '110%', left: 0, zIndex: 200,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 14, padding: 8, minWidth: 200,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {SWAP_TOKENS.filter(t => t.symbol !== exclude).map(t => (
        <button key={t.symbol} onClick={() => { onSelect(t); onClose(); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10, background: 'transparent',
            border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{
            width: 32, height: 32, borderRadius: '50%',
            background: t.color + '28', color: t.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800,
          }}>
            {t.logoChar}
          </span>
          <div>
            <div style={{ fontWeight: 700 }}>{t.symbol}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.name}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Contract Address Badge ───────────────────────────────────────────────────

function ContractBadge({ label, address, color }: { label: string; address: string; color: string }) {
  return (
    <a
      href={`https://explorer.test.mezo.org/address/${address}`}
      target="_blank" rel="noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 8,
        background: color + '12', border: `1px solid ${color}30`,
        color, fontSize: 11, fontWeight: 600, textDecoration: 'none',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 10 }}>⬡</span>
      {label}: {address.slice(0, 6)}…{address.slice(-4)}
      <ExternalLink size={10} />
    </a>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SwapPage() {
  const { address, isConnected } = useAccount();

  const [fromToken, setFromToken] = useState<Token>(SWAP_TOKENS[0]); // BTC
  const [toToken,   setToToken]   = useState<Token>(SWAP_TOKENS[1]); // MUSD
  const [fromAmt,   setFromAmt]   = useState('');
  const [slippage,  setSlippage]  = useState(50); // 0.5% in bps
  const [showSlip,  setShowSlip]  = useState(false);
  const [fromDrop,  setFromDrop]  = useState(false);
  const [toDrop,    setToDrop]    = useState(false);
  const [swapDone,  setSwapDone]  = useState(false);

  // ── Quote: getAmountsOut ─────────────────────────────────────────────────
  const fromWei = fromAmt
    ? parseUnits(fromAmt, fromToken.decimals)
    : 0n;

  const path = buildPath(fromToken, toToken);

  const { data: amountsOut, refetch: refetchQuote, isFetching: quoting } = useReadContract({
    address: SWAP_ROUTER_ADDRESS,
    abi: SWAP_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: fromWei > 0n ? [fromWei, path] : undefined,
    query: { enabled: fromWei > 0n, refetchInterval: 10_000 },
  });

  const toAmt = amountsOut
    ? formatUnits((amountsOut as bigint[])[path.length - 1], toToken.decimals)
    : '';

  const minOut = amountsOut
    ? slippageAmt((amountsOut as bigint[])[path.length - 1], slippage)
    : 0n;

  // ── MUSD allowance check ─────────────────────────────────────────────────
  const needsApproval = fromToken.symbol !== 'BTC';
  const { data: allowance } = useReadContract({
    address: MUSD_ADDRESS,
    abi: MUSD_ABI,
    functionName: 'allowance',
    args: address ? [address, SWAP_ROUTER_ADDRESS] : undefined,
    query: { enabled: !!address && needsApproval },
  });
  const approved = !needsApproval || (allowance as bigint ?? 0n) >= fromWei;

  // ── Writes ───────────────────────────────────────────────────────────────
  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeSwap,    data: swapHash    } = useWriteContract();

  const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: swapSuccess    } = useWaitForTransactionReceipt({ hash: swapHash    });

  useEffect(() => { if (swapSuccess) { setSwapDone(true); setFromAmt(''); } }, [swapSuccess]);

  const handleApprove = useCallback(() => {
    writeApprove({
      address: MUSD_ADDRESS,
      abi: MUSD_ABI,
      functionName: 'approve',
      args: [SWAP_ROUTER_ADDRESS, fromWei],
    });
  }, [fromWei, writeApprove]);

  const handleSwap = useCallback(() => {
    if (!address || fromWei === 0n) return;
    const dl = deadline();

    if (fromToken.symbol === 'BTC') {
      // BTC → token
      writeSwap({
        address: SWAP_ROUTER_ADDRESS,
        abi: SWAP_ROUTER_ABI,
        functionName: 'swapExactETHForTokens',
        args: [minOut, path, address, dl],
        value: fromWei,
      });
    } else if (toToken.symbol === 'BTC') {
      // token → BTC
      writeSwap({
        address: SWAP_ROUTER_ADDRESS,
        abi: SWAP_ROUTER_ABI,
        functionName: 'swapExactTokensForETH',
        args: [fromWei, minOut, path, address, dl],
      });
    } else {
      // token → token
      writeSwap({
        address: SWAP_ROUTER_ADDRESS,
        abi: SWAP_ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [fromWei, minOut, path, address, dl],
      });
    }
  }, [address, fromWei, fromToken, toToken, path, minOut, writeSwap]);

  const flip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmt(toAmt);
  };

  const priceImpact = fromWei > 0n && toAmt ? ((parseFloat(fromAmt) * 97500) / parseFloat(toAmt) - 1) * 100 : 0;

  // ── Derived state for contract info cards ────────────────────────────────
  const CONTRACT_MAP = [
    { fn: 'stake() / withdraw()',    label: 'MezoStaking',  addr: '0x3cB9d513e8eC79283e0Ca41784aCc2C072D1ACd1', color: '#22d3a8' },
    { fn: 'deposit() / withdraw()',  label: 'MezoVault',    addr: '0xD35262b376E5211252fa1aedaf0375B460D1Beb5', color: '#38bdf8' },
    { fn: 'borrow() / repay()',      label: 'MezoBorrow',   addr: '0xeb1A838a9dD91eE9A3D15f21C6b1144ebcFB287a', color: '#f59e0b' },
    { fn: 'balanceOf() / transfer()',label: 'MUSD Token',   addr: '0xf4a9B1F29599d519700893f34e4cc669CD550341', color: '#7c6ef7' },
    { fn: 'swapExact…()',            label: 'SwapRouter',   addr: SWAP_ROUTER_ADDRESS,                         color: '#f87171' },
  ];

  return (
    <div className="page-content fade-in">
      {/* TopBar */}
      <div className="topbar">
        <div className="topbar-left">
          <h1 className="page-title">Swap</h1>
          <p className="page-sub">Mezo Testnet (Chain 31611) · Auto-refreshing</p>
        </div>
        <div className="topbar-right">
          <div className="pill amber"><span className="blink">◉</span> Swap Router</div>
          <div className="pill green"><span>●</span> V2 Liquidity</div>
        </div>
      </div>

      <div className="content-wrap">

        {/* ── Contract address map ─────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent)' }}>⬡</span> Contract Address Map
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Mezo Testnet · Chain 31611</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 4 }}>
            {CONTRACT_MAP.map(c => (
              <ContractBadge key={c.label} label={c.label} address={c.addr} color={c.color} />
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {CONTRACT_MAP.map(c => (
              <div key={c.label} style={{
                padding: '12px 16px', borderRadius: 10,
                background: c.color + '0d', border: `1px solid ${c.color}22`,
              }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{c.label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: c.color, wordBreak: 'break-all', marginBottom: 4 }}>{c.addr}</div>
                <div style={{ fontSize: 11, color: 'var(--sub)' }}>Functions: <span style={{ color: 'var(--text)' }}>{c.fn}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Swap card ────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          <div className="card" style={{ maxWidth: 520 }}>
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <ArrowDownUp size={16} style={{ color: 'var(--accent)' }} />
                Swap Tokens
              </span>
              <button
                onClick={() => setShowSlip(s => !s)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
              >
                <Settings2 size={16} />
              </button>
            </div>

            {/* Slippage */}
            {showSlip && (
              <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Slippage tolerance</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[10, 50, 100].map(bps => (
                    <button key={bps}
                      onClick={() => setSlippage(bps)}
                      style={{
                        padding: '6px 14px', borderRadius: 8,
                        background: slippage === bps ? 'var(--accent)' : 'var(--surface3)',
                        border: `1px solid ${slippage === bps ? 'var(--accent)' : 'var(--border)'}`,
                        color: slippage === bps ? '#000' : 'var(--text)',
                        cursor: 'pointer', fontWeight: 700, fontSize: 12,
                      }}
                    >{bps / 100}%</button>
                  ))}
                  <input
                    type="number" placeholder="Custom"
                    style={{
                      width: 80, padding: '6px 10px', borderRadius: 8,
                      background: 'var(--surface3)', border: '1px solid var(--border)',
                      color: 'var(--text)', fontSize: 12,
                    }}
                    onChange={e => setSlippage(Math.round(parseFloat(e.target.value || '0') * 100))}
                  />
                </div>
              </div>
            )}

            {/* From */}
            <div style={{ background: 'var(--surface2)', borderRadius: 14, padding: '16px', marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>You pay</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="number" placeholder="0.0"
                  value={fromAmt}
                  onChange={e => setFromAmt(e.target.value)}
                  style={{
                    flex: 1, background: 'none', border: 'none', color: 'var(--text)',
                    fontSize: 28, fontWeight: 800, outline: 'none', minWidth: 0,
                  }}
                />
                <div style={{ position: 'relative' }}>
                  <TokenBtn token={fromToken} onClick={() => { setFromDrop(d => !d); setToDrop(false); }} />
                  {fromDrop && (
                    <TokenDropdown exclude={fromToken.symbol} onSelect={setFromToken} onClose={() => setFromDrop(false)} />
                  )}
                </div>
              </div>
            </div>

            {/* Flip button */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
              <button onClick={flip} style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--surface3)', border: '1px solid var(--border)',
                color: 'var(--accent)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                <ArrowDown size={16} />
              </button>
            </div>

            {/* To */}
            <div style={{ background: 'var(--surface2)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>You receive</span>
                {quoting && <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}><RefreshCw size={11} /> Fetching…</span>}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  readOnly placeholder="0.0"
                  value={toAmt ? parseFloat(toAmt).toFixed(6) : ''}
                  style={{
                    flex: 1, background: 'none', border: 'none', color: toAmt ? 'var(--text)' : 'var(--muted)',
                    fontSize: 28, fontWeight: 800, outline: 'none', minWidth: 0,
                  }}
                />
                <div style={{ position: 'relative' }}>
                  <TokenBtn token={toToken} onClick={() => { setToDrop(d => !d); setFromDrop(false); }} />
                  {toDrop && (
                    <TokenDropdown exclude={toToken.symbol} onSelect={setToToken} onClose={() => setToDrop(false)} />
                  )}
                </div>
              </div>
            </div>

            {/* Route info */}
            {fromAmt && toAmt && (
              <div className="info-box" style={{ marginBottom: 16 }}>
                <div className="ib-row">
                  <span>Rate</span>
                  <span>1 {fromToken.symbol} ≈ {(parseFloat(toAmt) / parseFloat(fromAmt)).toFixed(4)} {toToken.symbol}</span>
                </div>
                <div className="ib-row">
                  <span>Price impact</span>
                  <span style={{ color: Math.abs(priceImpact) > 3 ? 'var(--red)' : 'var(--green)' }}>
                    ~{Math.abs(priceImpact).toFixed(2)}%
                  </span>
                </div>
                <div className="ib-row">
                  <span>Min received ({slippage / 100}% slip)</span>
                  <span>{formatUnits(minOut, toToken.decimals).slice(0, 10)} {toToken.symbol}</span>
                </div>
                <div className="ib-row">
                  <span>Route</span>
                  <span style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: 11 }}>
                    {fromToken.symbol} → {toToken.symbol}
                  </span>
                </div>
                <div className="ib-row">
                  <span>Router</span>
                  <a href={`https://explorer.test.mezo.org/address/${SWAP_ROUTER_ADDRESS}`}
                    target="_blank" rel="noreferrer"
                    style={{ color: '#f87171', fontSize: 11 }}>
                    {SWAP_ROUTER_ADDRESS.slice(0, 8)}… ↗
                  </a>
                </div>
              </div>
            )}

            {/* Action button */}
            {!isConnected ? (
              <button className="action-btn stake" disabled>Connect Wallet to Swap</button>
            ) : !approved ? (
              <button className="action-btn send" onClick={handleApprove}>
                Approve {fromToken.symbol}
              </button>
            ) : (
              <button className="action-btn stake" disabled={!fromAmt || !toAmt} onClick={handleSwap}>
                <Zap size={14} />
                Swap {fromToken.symbol} → {toToken.symbol}
              </button>
            )}

            {swapDone && (
              <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(34,211,168,0.1)', border: '1px solid rgba(34,211,168,0.3)', color: 'var(--green)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                ✓ Swap confirmed on Mezo Testnet
              </div>
            )}
          </div>

          {/* ── Side info ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* How swap works */}
            <div className="card">
              <div className="card-header"><span className="card-title">How it works</span></div>
              {[
                { step: '1', text: 'Select tokens & enter amount', color: '#7c6ef7' },
                { step: '2', text: 'Router fetches on-chain quote', color: '#22d3a8' },
                { step: '3', text: 'Approve token (if ERC-20 input)', color: '#f59e0b' },
                { step: '4', text: 'Sign swap tx — router executes', color: '#f87171' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: s.color + '20', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{s.step}</div>
                  <span style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.5 }}>{s.text}</span>
                </div>
              ))}
            </div>

            {/* Token addresses */}
            <div className="card">
              <div className="card-header"><span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Info size={13} />Token Addresses</span></div>
              {SWAP_TOKENS.map(t => (
                <div key={t.symbol} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: t.color + '28', color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{t.logoChar}</span>
                    <span style={{ fontWeight: 700 }}>{t.symbol}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{t.name}</span>
                  </div>
                  {t.address === 'NATIVE' ? (
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>Native BTC — no contract</span>
                  ) : (
                    <a href={`https://explorer.test.mezo.org/address/${t.address}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, color: t.color, fontFamily: 'monospace' }}>
                      {t.address.slice(0, 10)}…{t.address.slice(-6)} ↗
                    </a>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
