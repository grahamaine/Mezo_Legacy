import React, { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { Trophy, Zap, Users, Star, Swords, ShoppingBag, BarChart2 } from 'lucide-react';
import { MUSD_ADDRESS, MUSD_ABI } from '../constants/musd';
import { TopBar, MetricCard } from '../components/shared';
import { useLiveChainData } from '../hooks/useLiveChainData';

const GAMES = [
  { id: 'coinflip', emoji: '🪙', name: 'Coin Flip',          desc: 'Pick heads or tails. Double your MUSD instantly.',             minBet: 1,  maxBet: 500,  players: 1247, tag: 'Instant',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { id: 'predict',  emoji: '📊', name: 'Price Prediction',   desc: 'Will BTC be higher or lower in 1 hour? Bet MUSD.',            minBet: 5,  maxBet: 1000, players: 892,  tag: 'Trending',  color: 'var(--accent)', bg: 'rgba(124,110,247,0.1)' },
  { id: 'lottery',  emoji: '🎰', name: 'MUSD Lottery',       desc: 'Weekly jackpot. Buy tickets for $1 MUSD each.',               minBet: 1,  maxBet: 100,  players: 3201, tag: 'Jackpot',   color: 'var(--green)', bg: 'rgba(34,211,168,0.1)' },
  { id: 'crash',    emoji: '🚀', name: 'Rocket Crash',       desc: 'Cash out before the rocket crashes. Multiplier grows live.',   minBet: 2,  maxBet: 250,  players: 654,  tag: 'New',       color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  { id: 'fantasy',  emoji: '⚽', name: 'Fantasy Sports',     desc: 'Build your dream team. Win MUSD prizes every week.',          minBet: 10, maxBet: 500,  players: 2103, tag: 'Hot',       color: 'var(--blue)', bg: 'rgba(56,189,248,0.1)' },
  { id: 'rpg',      emoji: '⚔️', name: 'Mezo Quest RPG',    desc: 'On-chain RPG with real MUSD economies and item trading.',      minBet: 5,  maxBet: 200,  players: 476,  tag: 'Play-to-Earn', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
];

const TOURNAMENTS = [
  { name: 'Weekly Coin Flip Championship',  prize: '5,000',  ends: '2d 14h', entries: 342,  color: '#f59e0b' },
  { name: 'BTC Price Prediction Cup',       prize: '2,500',  ends: '4d 8h',  entries: 218,  color: 'var(--accent)' },
  { name: 'Grand Lottery Draw',             prize: '10,000', ends: '5d 0h',  entries: 3201, color: 'var(--green)' },
  { name: 'Fantasy Football Season Finale', prize: '8,000',  ends: '6d 12h', entries: 1890, color: 'var(--blue)' },
  { name: 'Mezo Quest World Boss Event',    prize: '3,500',  ends: '1d 4h',  entries: 621,  color: '#a78bfa' },
];

const LEADERBOARD = [
  { rank: 1, name: 'satoshi_fan',  won: 4820, emoji: '🥇' },
  { rank: 2, name: 'hodl_master',  won: 3210, emoji: '🥈' },
  { rank: 3, name: 'mezo_wizard',  won: 2875, emoji: '🥉' },
  { rank: 4, name: 'btc_believer', won: 1940, emoji: '👤' },
  { rank: 5, name: 'moon_seeker',  won: 1645, emoji: '👤' },
  { rank: 6, name: 'quest_hero',   won: 1380, emoji: '👤' },
  { rank: 7, name: 'crypto_king',  won: 1120, emoji: '👤' },
];

const ECOSYSTEM_TILES = [
  { icon: <Swords size={20} />,      title: 'Real Game Economies',   desc: 'Items, land, and characters with true on-chain ownership. Trade freely.',         color: '#a78bfa', stat: '14K+ items traded' },
  { icon: <Trophy size={20} />,      title: 'Prize Pools',           desc: 'Accumulating prize pools from entry fees. Win big in daily & weekly events.',      color: '#f59e0b', stat: '$240K+ paid out' },
  { icon: <ShoppingBag size={20} />, title: 'In-Game Purchases',     desc: 'Buy skins, boosters, and passes with MUSD. No credit card required.',              color: 'var(--green)', stat: '85K+ purchases' },
  { icon: <BarChart2 size={20} />,   title: 'Prediction Markets',    desc: 'Stake on real-world events. BTC price, sports outcomes, and more.',                color: 'var(--blue)', stat: '400+ markets live' },
];

function CoinFlipGame({ musdBalance }: { musdBalance: string }) {
  const [bet,      setBet]      = useState('10');
  const [pick,     setPick]     = useState<'heads' | 'tails' | null>(null);
  const [result,   setResult]   = useState<{ won: boolean; side: string } | null>(null);
  const [flipping, setFlipping] = useState(false);

  const play = () => {
    if (!pick || !bet) return;
    setFlipping(true);
    setResult(null);
    setTimeout(() => {
      const side = Math.random() > 0.5 ? 'heads' : 'tails';
      setResult({ won: side === pick, side });
      setFlipping(false);
    }, 1200);
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 72, marginBottom: 8, transition: 'transform 0.3s', transform: flipping ? 'rotateY(720deg)' : 'none' }}>
          🪙
        </div>
        {result && (
          <div style={{ fontSize: 18, fontWeight: 700, color: result.won ? 'var(--green)' : 'var(--red)', marginBottom: 8 }}>
            {result.won ? `🎉 You won $${(parseFloat(bet) * 2).toFixed(2)} MUSD!` : `💸 ${result.side} — try again`}
          </div>
        )}
        {flipping && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Flipping...</div>}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {(['heads', 'tails'] as const).map(s => (
          <button key={s} onClick={() => setPick(s)} style={{
            flex: 1, padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', textTransform: 'capitalize',
            background: pick === s ? '#f59e0b' : 'var(--surface)',
            color: pick === s ? '#000' : 'var(--muted)',
            border: pick === s ? 'none' : '1px solid var(--border)',
          }}>
            {s === 'heads' ? '👑 Heads' : '🪙 Tails'}
          </button>
        ))}
      </div>
      <div className="input-wrap" style={{ marginBottom: 12 }}>
        <input className="dapp-input" type="number" placeholder="Bet amount" value={bet}
          onChange={e => setBet(e.target.value)} />
        <span className="input-unit">MUSD</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[1, 5, 10, 25, 50].map(a => (
          <button key={a} onClick={() => setBet(String(a))} style={{
            flex: 1, padding: '6px', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontWeight: 600,
            background: bet === String(a) ? 'rgba(245,158,11,0.2)' : 'var(--surface)',
            border: `1px solid ${bet === String(a) ? '#f59e0b' : 'var(--border)'}`,
            color: bet === String(a) ? '#f59e0b' : 'var(--sub)',
          }}>${a}</button>
        ))}
      </div>
      <button className="action-btn stake" disabled={!pick || !bet || flipping} onClick={play}
        style={{ background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Zap size={16} /> {flipping ? 'Flipping...' : `Flip for $${bet || '0'}`}
      </button>
      <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 6 }}>50/50 odds · Win 2× your bet</div>
    </div>
  );
}

export default function GamingPage() {
  const { address } = useAccount();
  const live = useLiveChainData(address);
  const [activeGame, setActiveGame] = useState<string | null>('coinflip');

  const { data: musdBalance } = useReadContract({
    address: MUSD_ADDRESS, abi: MUSD_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 12_000 },
  });

  const musdFmt = musdBalance ? parseFloat(formatEther(musdBalance as bigint)).toFixed(2) : '0.00';

  return (
    <div className="page-content fade-in">
      <TopBar title="Gaming & Entertainment" blockNumber={live.blockNumber} gasPriceGwei={live.gasPriceGwei} />
      <div className="content-wrap">

        <div className="metrics-row four-col">
          <MetricCard label="Your MUSD"      value={`$${musdFmt}`} sub="Available to play"   accent />
          <MetricCard label="Active Players" value="6,194"          sub="Online now"          changeDir="up" change="+420 today" />
          <MetricCard label="Total Prizes"   value="$240K+"         sub="Paid out all-time"   changeDir="up" change="Live pools" />
          <MetricCard label="Your Winnings"  value="$50.00"         sub="All time"            changeDir="up" change="+$10 today" />
        </div>

        {/* Gaming ecosystem tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {ECOSYSTEM_TILES.map(t => (
            <div key={t.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px', transition: 'border-color 0.2s' }}>
              <div style={{ color: t.color, marginBottom: 10 }}>{t.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>{t.desc}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.color }}>{t.stat}</div>
            </div>
          ))}
        </div>

        {/* Game grid + active game */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {GAMES.map(g => (
              <button key={g.id} onClick={() => setActiveGame(g.id)} style={{
                padding: '16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                background: activeGame === g.id ? g.bg : 'var(--surface)',
                border: `1px solid ${activeGame === g.id ? g.color + '60' : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 24 }}>{g.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{g.name}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: g.color + '20', color: g.color, fontWeight: 700 }}>{g.tag}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{g.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--muted)' }}>
                  <span><Users size={10} style={{ display: 'inline', marginRight: 3 }} />{g.players.toLocaleString()} players</span>
                  <span>Bet $1–${g.maxBet}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="card">
            {activeGame === 'coinflip' && (
              <>
                <div className="card-header" style={{ marginBottom: 16 }}>
                  <span className="card-title">🪙 Coin Flip</span>
                  <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>Balance: ${musdFmt} MUSD</span>
                </div>
                <CoinFlipGame musdBalance={musdFmt} />
              </>
            )}
            {activeGame !== 'coinflip' && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>{GAMES.find(g => g.id === activeGame)?.emoji}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{GAMES.find(g => g.id === activeGame)?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>{GAMES.find(g => g.id === activeGame)?.desc}</div>
                <div style={{ padding: '12px 20px', background: 'rgba(124,110,247,0.1)', border: '1px solid rgba(124,110,247,0.2)', borderRadius: 12, fontSize: 13, color: 'var(--accent)', marginBottom: 16 }}>
                  🚧 Full game launching soon — MUSD prizes live
                </div>
                <button className="action-btn stake">Join Waitlist</button>
              </div>
            )}
          </div>
        </div>

        {/* Tournaments + Leaderboard */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Trophy size={15} style={{ display: 'inline', marginRight: 6 }} />Active Tournaments</span>
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>● {TOURNAMENTS.length} Live</span>
            </div>
            {TOURNAMENTS.map(t => (
              <div key={t.name} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.entries.toLocaleString()} entries · ends in {t.ends}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: t.color }}>${t.prize}</div>
                  <button style={{ fontSize: 11, padding: '4px 10px', marginTop: 4, background: t.color + '15', border: `1px solid ${t.color}40`, borderRadius: 6, color: t.color, cursor: 'pointer' }}>
                    Enter
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title"><Star size={15} style={{ display: 'inline', marginRight: 6 }} />Leaderboard</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>This week</span>
            </div>
            {LEADERBOARD.map(p => (
              <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 18, width: 28 }}>{p.emoji}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: p.rank <= 3 ? 'var(--text)' : 'var(--sub)' }}>{p.name}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: p.rank === 1 ? '#f59e0b' : 'var(--green)' }}>
                  +${p.won.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
