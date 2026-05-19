import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { ShoppingCart, CheckCircle, X, Star } from 'lucide-react';
import { MUSD_ADDRESS, MUSD_ABI } from '../constants/musd';
import { TopBar, MetricCard } from '../components/shared';
import { useLiveChainData } from '../hooks/useLiveChainData';

interface Product {
  id: number;
  emoji: string;
  name: string;
  desc: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  tag?: string;
  tagColor?: string;
}

const PRODUCTS: Product[] = [
  // Digital & Education
  { id: 1,  emoji: '🎨', name: 'Crypto Art Bundle',         desc: 'Pack of 10 exclusive digital artworks',               price: 29.99, rating: 4.9, reviews: 124, category: 'Digital',    tag: 'Popular',    tagColor: '#f59e0b' },
  { id: 2,  emoji: '📚', name: 'Bitcoin Mastery Course',    desc: 'Full 12-hour video course for beginners',              price: 49.00, rating: 4.8, reviews: 389, category: 'Education',  tag: 'Bestseller', tagColor: 'var(--green)' },
  { id: 3,  emoji: '🎵', name: '3-Month Music Stream',      desc: 'Unlimited music on Mezo Stream',                       price: 9.99,  rating: 4.7, reviews: 210, category: 'Subs',       tag: 'New',        tagColor: 'var(--accent)' },
  { id: 4,  emoji: '🔐', name: 'VPN Premium (1yr)',         desc: 'Privacy-first VPN, 60+ countries',                    price: 35.00, rating: 4.6, reviews: 88,  category: 'Tools' },
  { id: 5,  emoji: '🎮', name: 'Game Credits ×500',         desc: '500 universal game credits for Mezo games',            price: 5.00,  rating: 4.5, reviews: 741, category: 'Gaming',     tag: 'Hot',        tagColor: '#f87171' },
  { id: 6,  emoji: '🤖', name: 'AI Writing Assistant',      desc: '3 months premium AI writing tool access',              price: 39.00, rating: 4.8, reviews: 182, category: 'AI',         tag: 'Trending',   tagColor: '#f59e0b' },
  { id: 7,  emoji: '🌐', name: 'Domain (1 year)',           desc: '.mezo domain name — your on-chain identity',           price: 12.00, rating: 4.9, reviews: 33,  category: 'Web3',       tag: 'Web3',       tagColor: 'var(--accent)' },
  // Merchant & Commerce
  { id: 8,  emoji: '🏪', name: 'POS System — Starter',      desc: 'Accept MUSD in-store with plug-and-play hardware',     price: 99.00, rating: 4.8, reviews: 62,  category: 'Merchant',  tag: 'New',        tagColor: 'var(--green)' },
  { id: 9,  emoji: '🛒', name: 'E-Commerce Plugin',         desc: 'WooCommerce & Shopify MUSD payment plugin',            price: 49.00, rating: 4.7, reviews: 118, category: 'Merchant',  tag: 'Popular',    tagColor: '#f59e0b' },
  { id: 10, emoji: '💳', name: 'Buy-Now-Pay-Later Kit',     desc: 'Offer BNPL to your customers, settle in MUSD',         price: 79.00, rating: 4.6, reviews: 44,  category: 'Merchant' },
  { id: 11, emoji: '📋', name: 'Smart Invoicing Suite',     desc: 'Auto-generate MUSD invoices with on-chain receipts',   price: 29.00, rating: 4.8, reviews: 97,  category: 'Merchant',  tag: 'Trending',   tagColor: 'var(--blue)' },
  { id: 12, emoji: '🤝', name: 'Affiliate Manager',         desc: 'Track referrals & pay commissions in MUSD',            price: 59.00, rating: 4.7, reviews: 33,  category: 'Merchant' },
  // E-commerce & Marketplaces
  { id: 13, emoji: '🎟', name: 'Event Ticketing SDK',       desc: 'Sell event tickets with MUSD, no middlemen',           price: 39.99, rating: 4.8, reviews: 55,  category: 'Market',    tag: 'New',        tagColor: 'var(--accent)' },
  { id: 14, emoji: '🏘', name: 'P2P Marketplace Template',  desc: 'Launch a peer-to-peer marketplace in hours',           price: 149.00,rating: 4.9, reviews: 28,  category: 'Market',    tag: 'Pro',        tagColor: '#f59e0b' },
  { id: 15, emoji: '🏅', name: 'Membership NFT Pack',       desc: 'Mint and sell tiered membership tokens',               price: 69.00, rating: 4.7, reviews: 41,  category: 'Market' },
  { id: 16, emoji: '🏡', name: 'Local Services Board',      desc: 'List & pay for local services with MUSD',              price: 19.99, rating: 4.5, reviews: 73,  category: 'Market' },
  // Social & Creator Economy
  { id: 17, emoji: '💡', name: 'Creator Tip Page',          desc: 'Your personal MUSD tipping page — shareable link',     price: 0.00,  rating: 4.9, reviews: 430, category: 'Social',    tag: 'Free',       tagColor: 'var(--green)' },
  { id: 18, emoji: '🎙', name: 'Content Sub Platform',      desc: 'Paywall your content — fans pay in MUSD monthly',      price: 29.99, rating: 4.8, reviews: 167, category: 'Social',    tag: 'Popular',    tagColor: '#f59e0b' },
  { id: 19, emoji: '🌟', name: 'Creator Analytics Pro',     desc: 'Track earnings, fans, and growth in one dashboard',    price: 19.00, rating: 4.7, reviews: 89,  category: 'Social' },
  { id: 20, emoji: '🎁', name: 'Community Rewards Kit',     desc: 'Distribute MUSD rewards to your community',            price: 49.00, rating: 4.8, reviews: 52,  category: 'Social',    tag: 'New',        tagColor: 'var(--blue)' },
  // Lifestyle
  { id: 21, emoji: '💰', name: 'Budget Planner',            desc: 'Personal finance & MUSD budgeting tool',               price: 14.99, rating: 4.7, reviews: 211, category: 'Lifestyle', tag: 'Top Pick',   tagColor: 'var(--green)' },
  { id: 22, emoji: '✈️', name: 'Travel Booking Credit',    desc: '$100 MUSD travel credit for flights & hotels',         price: 95.00, rating: 4.6, reviews: 78,  category: 'Lifestyle' },
  { id: 23, emoji: '🏋', name: 'Fitness Membership 3mo',   desc: 'Premium gym & wellness access, paid in MUSD',          price: 59.00, rating: 4.5, reviews: 63,  category: 'Lifestyle' },
  { id: 24, emoji: '📝', name: 'Productivity Suite',       desc: 'Project mgmt + notes + time-tracking bundle',          price: 34.99, rating: 4.8, reviews: 145, category: 'Lifestyle', tag: 'Trending',   tagColor: '#f59e0b' },
  // Emerging
  { id: 25, emoji: '🧠', name: 'AI Agent Credits',         desc: 'Power 100 autonomous MUSD-spending AI agent tasks',    price: 25.00, rating: 4.9, reviews: 94,  category: 'Emerging',  tag: 'Hot',        tagColor: '#f87171' },
  { id: 26, emoji: '🎶', name: 'Music Streaming Rights',   desc: 'Royalty-backed music NFT with MUSD revenue share',     price: 89.00, rating: 4.8, reviews: 37,  category: 'Emerging',  tag: 'New',        tagColor: 'var(--accent)' },
  { id: 27, emoji: '💘', name: 'Dating App Boost',         desc: 'Premium exposure credits on MUSD-native dating apps',  price: 9.99,  rating: 4.4, reviews: 502, category: 'Emerging' },
  { id: 28, emoji: '📡', name: 'Streaming Pay-Per-View',   desc: 'Pay-per-second video streaming powered by MUSD',       price: 4.99,  rating: 4.6, reviews: 188, category: 'Emerging',  tag: 'Trending',   tagColor: '#f59e0b' },
];

const CATEGORIES = [
  { id: 'All',       label: 'All',                 emoji: '🌐' },
  { id: 'Digital',   label: 'Digital & Education', emoji: '🎨' },
  { id: 'Merchant',  label: 'Merchant Tools',      emoji: '🏪' },
  { id: 'Market',    label: 'Marketplaces',        emoji: '🛒' },
  { id: 'Social',    label: 'Social & Creator',    emoji: '🌟' },
  { id: 'Lifestyle', label: 'Lifestyle',           emoji: '💰' },
  { id: 'Emerging',  label: 'Emerging',            emoji: '🧠' },
  { id: 'Gaming',    label: 'Gaming',              emoji: '🎮' },
  { id: 'AI',        label: 'AI',                  emoji: '🤖' },
  { id: 'Subs',      label: 'Subscriptions',       emoji: '🔄' },
];

export default function ShopPage() {
  const { address, isConnected } = useAccount();
  const live = useLiveChainData(address);

  const [filter,   setFilter]   = useState('All');
  const [cart,     setCart]     = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [bought,   setBought]   = useState<Set<number>>(new Set());
  const [checking, setChecking] = useState(false);
  const [done,     setDone]     = useState(false);

  const { data: musdBalance } = useReadContract({
    address: MUSD_ADDRESS, abi: MUSD_ABI, functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 12_000 },
  });
  const { writeContract, data: txHash } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  React.useEffect(() => {
    if (isSuccess) {
      setBought(new Set(cart.map(p => p.id)));
      setCart([]);
      setDone(true);
      setChecking(false);
      setTimeout(() => setDone(false), 5000);
    }
  }, [isSuccess]);

  const musdFmt   = musdBalance ? parseFloat(formatEther(musdBalance as bigint)).toFixed(2) : '0.00';
  const filtered  = filter === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
  const cartTotal = cart.reduce((s, p) => s + p.price, 0);
  const cartCount = cart.length;

  const addToCart    = (p: Product) => setCart(prev => prev.find(x => x.id === p.id) ? prev : [...prev, p]);
  const removeFromCart = (id: number) => setCart(prev => prev.filter(p => p.id !== id));

  const checkout = () => {
    if (!cart.length || !isConnected) return;
    setChecking(true);
    writeContract({
      address: MUSD_ADDRESS, abi: MUSD_ABI, functionName: 'transfer',
      args: ['0x742d35Cc6634C0532925a3b8D4C9C5b0e8b1234' as `0x${string}`, parseEther(cartTotal.toFixed(18))],
    });
  };

  return (
    <div className="page-content fade-in">
      <TopBar title="Shop" blockNumber={live.blockNumber} gasPriceGwei={live.gasPriceGwei} />
      <div className="content-wrap">

        {done && (
          <div style={{ background: 'rgba(34,211,168,0.1)', border: '1px solid rgba(34,211,168,0.3)', borderRadius: 14, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>
            <CheckCircle size={20} /> Purchase complete! Items delivered to your wallet.
          </div>
        )}

        <div className="metrics-row four-col">
          <MetricCard label="MUSD Balance"     value={`$${musdFmt}`}       sub="Available to spend"     accent />
          <MetricCard label="Items Available"  value={PRODUCTS.length.toString()} sub="Across all categories" />
          <MetricCard label="Verified Sellers" value="1,240"               sub="Merchants onboarded"    changeDir="up" change="+18 this week" />
          <MetricCard label="Categories"       value={CATEGORIES.length.toString()} sub="Use cases covered"  changeDir="up" change="Always growing" />
        </div>

        {/* Category banner cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {CATEGORIES.filter(c => c.id !== 'All').map(c => {
            const count = PRODUCTS.filter(p => p.category === c.id).length;
            return (
              <button key={c.id} onClick={() => setFilter(c.id)} style={{
                padding: '14px 12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                background: filter === c.id ? 'rgba(124,110,247,0.12)' : 'var(--surface)',
                border: `1px solid ${filter === c.id ? 'rgba(124,110,247,0.35)' : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{c.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: filter === c.id ? 'var(--accent)' : 'var(--text)', marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{count} items</div>
              </button>
            );
          })}
        </div>

        {/* Filter pills + cart */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setFilter(c.id)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: filter === c.id ? 'var(--accent)' : 'var(--surface)',
                color:      filter === c.id ? '#fff'           : 'var(--sub)',
                border:     filter === c.id ? 'none'           : '1px solid var(--border)',
              }}>
                {c.id}
              </button>
            ))}
          </div>
          <button onClick={() => setCartOpen(!cartOpen)} style={{
            padding: '10px 18px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: cartCount > 0 ? 'var(--accent)' : 'var(--surface)',
            color: cartCount > 0 ? '#fff' : 'var(--muted)',
            border: cartCount > 0 ? 'none' : '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <ShoppingCart size={16} />
            {cartCount > 0 ? `Cart (${cartCount}) · $${cartTotal.toFixed(2)}` : 'Cart'}
          </button>
        </div>

        {/* Cart panel */}
        {cartOpen && cartCount > 0 && (
          <div className="card" style={{ border: '1px solid rgba(124,110,247,0.3)' }}>
            <div className="card-header">
              <span className="card-title">Your Cart</span>
              <button onClick={() => setCart([])} style={{ fontSize: 11, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>
            </div>
            {cart.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 22 }}>{p.emoji}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{p.name}</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>${p.price.toFixed(2)}</span>
                <button onClick={() => removeFromCart(p.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 8px', fontWeight: 800, fontSize: 16 }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent)' }}>${cartTotal.toFixed(2)} MUSD</span>
            </div>
            <button className="action-btn stake" disabled={!isConnected || checking} onClick={checkout}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {checking ? '⏳ Processing...' : `Pay $${cartTotal.toFixed(2)} MUSD`}
            </button>
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 6 }}>Instant settlement · No chargebacks</div>
          </div>
        )}

        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {filtered.map(p => {
            const inCart      = cart.some(c => c.id === p.id);
            const isPurchased = bought.has(p.id);
            return (
              <div key={p.id} style={{
                background: 'var(--surface)', border: `1px solid ${inCart ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 14, padding: '18px', transition: 'border-color 0.2s',
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{p.emoji}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{p.name}</span>
                  {p.tag && (
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 20, background: (p.tagColor || 'var(--accent)') + '20', color: p.tagColor || 'var(--accent)', fontWeight: 700 }}>
                      {p.tag}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{p.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12, fontSize: 12, color: '#f59e0b' }}>
                  <Star size={11} fill="#f59e0b" />
                  <span>{p.rating}</span>
                  <span style={{ color: 'var(--muted)' }}>({p.reviews})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: p.price === 0 ? 'var(--green)' : 'var(--accent)' }}>
                    {p.price === 0 ? 'FREE' : `$${p.price.toFixed(2)}`}
                  </span>
                  {isPurchased ? (
                    <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✓ Owned</span>
                  ) : (
                    <button onClick={() => addToCart(p)} style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      background: inCart ? 'rgba(124,110,247,0.15)' : 'var(--accent)',
                      color: inCart ? 'var(--accent)' : '#fff',
                      border: inCart ? '1px solid var(--accent)' : 'none',
                    }}>
                      {inCart ? '✓ Added' : p.price === 0 ? 'Get Free' : 'Add to cart'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
