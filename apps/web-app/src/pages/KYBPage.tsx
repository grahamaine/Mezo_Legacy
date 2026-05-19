import React, { useState, useCallback, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import {
  Building2, User, FileText, CheckCircle, ChevronRight,
  Upload, AlertCircle, Globe, Phone, Mail, Hash,
  ExternalLink, RefreshCw, ShieldCheck, ShieldAlert, Clock,
} from 'lucide-react';
import { keccak256, encodePacked } from 'viem';
import { TopBar, MetricCard } from '../components/shared';
import { useLiveChainData } from '../hooks/useLiveChainData';
import { KYB_ADDRESS, KYB_ABI, KYB_STATUS } from '../constants/kyb';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEZO_TESTNET_ID = 31611;
const EXPLORER = 'https://explorer.test.mezo.org';

const STEPS = ['Business Info', 'Ownership', 'Documents', 'Review'];

const BUSINESS_TYPES = [
  'LLC', 'Corporation', 'Partnership', 'Sole Proprietorship',
  'Non-Profit', 'DAO', 'Other',
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'Singapore', 'UAE',
  'Canada', 'Australia', 'Switzerland', 'Netherlands', 'Other',
];

const DOC_TYPES = [
  { id: 'reg',   label: 'Business Registration Certificate', required: true  },
  { id: 'tax',   label: 'Tax Identification Document',       required: true  },
  { id: 'addr',  label: 'Proof of Business Address',         required: true  },
  { id: 'owner', label: 'Ownership Structure Chart',         required: false },
  { id: 'bank',  label: 'Bank Statement (last 3 months)',    required: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildApplicationHash(
  bizName: string, regNumber: string,
  ownerAddress: string, timestamp: number,
): `0x${string}` {
  return keccak256(
    encodePacked(
      ['string', 'string', 'address', 'uint256'],
      [bizName, regNumber, ownerAddress as `0x${string}`, BigInt(timestamp)],
    ),
  );
}

function statusLabel(code: number) {
  switch (code) {
    case KYB_STATUS.Pending:  return { text: 'Pending Review', color: '#f59e0b', icon: <Clock size={14} /> };
    case KYB_STATUS.Approved: return { text: 'Approved',       color: '#22d3a8', icon: <ShieldCheck size={14} /> };
    case KYB_STATUS.Rejected: return { text: 'Rejected',       color: '#f87171', icon: <ShieldAlert size={14} /> };
    default:                  return { text: 'Not Submitted',  color: '#6b7280', icon: <ShieldAlert size={14} /> };
  }
}

function timeAgo(ts: number) {
  if (!ts) return '—';
  const s = Math.floor(Date.now() / 1000 - ts);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6,
};

function Field({ label, value, onChange, placeholder, icon, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon?: React.ReactNode; type?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
            {icon}
          </span>
        )}
        <input
          className="dapp-input" type={type}
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', paddingLeft: icon ? 30 : 12 }}
        />
      </div>
    </div>
  );
}

function ReviewSection({ title, rows }: { title: string; rows: { k: string; v: string }[] }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '16px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{title}</div>
      {rows.map(({ k, v }) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
          <span style={{ color: 'var(--muted)' }}>{k}</span>
          <span style={{ color: v ? 'var(--text)' : 'var(--red)', fontWeight: v ? 500 : 400 }}>{v || '—'}</span>
        </div>
      ))}
    </div>
  );
}

// ─── On-chain Status Banner ────────────────────────────────────────────────────

function StatusBanner({ status, txHash, submittedAt, address, contractDeployed }: {
  status: number; txHash?: string; submittedAt?: number;
  address?: string; contractDeployed: boolean;
}) {
  const s = statusLabel(status);
  if (!contractDeployed) {
    return (
      <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <AlertCircle size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: 'var(--sub)' }}>
          <strong style={{ color: '#f59e0b' }}>MezoKYB contract not yet deployed.</strong>{' '}
          Set <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>VITE_KYB_ADDRESS</code> in your <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>.env</code> after deploying{' '}
          <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>contracts/MezoKYB.sol</code> to Mezo Testnet (Chain 31611).
          The form is still fully functional — submissions will go on-chain once deployed.
        </div>
      </div>
    );
  }
  return (
    <div style={{
      padding: '14px 18px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
      background: s.color + '10', border: `1px solid ${s.color}30`,
    }}>
      <span style={{ color: s.color }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: s.color, marginBottom: 2 }}>
          On-chain Status: {s.text}
        </div>
        {submittedAt ? (
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            Submitted {timeAgo(submittedAt)} · Wallet: {address?.slice(0, 8)}…{address?.slice(-6)}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>No application found for this wallet</div>
        )}
      </div>
      {txHash && (
        <a href={`${EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
          View Tx <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KYBPage() {
  const { address, isConnected } = useAccount();
  const chainId                  = useChainId();
  const live                     = useLiveChainData(address);

  const [step,      setStep]      = useState(0);
  const [docs,      setDocs]      = useState<Record<string, boolean>>({});
  const [lastTxHash, setLastTxHash] = useState<string>('');

  const [form, setForm] = useState({
    bizName: '', bizType: '', regNumber: '', country: '', website: '',
    phone: '', email: '', yearFounded: '',
    ownerName: '', ownerTitle: '', ownerEmail: '', ownerPhone: '',
    ownerNationality: '', pctOwnership: '',
    agreeTerms: false, agreeAml: false,
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // ── On-chain reads ─────────────────────────────────────────────────────────
  const contractDeployed = KYB_ADDRESS !== '0x0000000000000000000000000000000000000000';

  const { data: onChainApp, refetch: refetchStatus } = useReadContract({
    address: KYB_ADDRESS,
    abi:     KYB_ABI,
    functionName: 'getApplication',
    args:    address ? [address] : undefined,
    query:   { enabled: !!address && contractDeployed, refetchInterval: 15_000 },
  });

  const { data: totalSubs } = useReadContract({
    address: KYB_ADDRESS,
    abi:     KYB_ABI,
    functionName: 'totalSubmissions',
    query:   { enabled: contractDeployed, refetchInterval: 30_000 },
  });

  const { data: totalApproved } = useReadContract({
    address: KYB_ADDRESS,
    abi:     KYB_ABI,
    functionName: 'totalApproved',
    query:   { enabled: contractDeployed, refetchInterval: 30_000 },
  });

  // Parse on-chain data
  const appData = onChainApp as [string, bigint, number] | undefined;
  const onChainStatus    = appData ? Number(appData[2]) : KYB_STATUS.None;
  const onChainSubmittedAt = appData ? Number(appData[1]) : 0;
  const onChainHash      = appData ? appData[0] : '';

  // ── Contract write ─────────────────────────────────────────────────────────
  const { writeContract: writeKYB, data: submitHash } = useWriteContract();
  const {
    isSuccess:  txSuccess,
    isError:    txError,
    isPending:  txPending,
  } = useWaitForTransactionReceipt({ hash: submitHash });

  useEffect(() => {
    if (txSuccess && submitHash) {
      setLastTxHash(submitHash);
      refetchStatus();
    }
  }, [txSuccess, submitHash, refetchStatus]);

  // ── Form validation ────────────────────────────────────────────────────────
  const step0Valid = form.bizName && form.bizType && form.regNumber && form.country;
  const step1Valid = form.ownerName && form.ownerTitle && form.ownerEmail && form.pctOwnership;
  const step2Valid = DOC_TYPES.filter(d => d.required).every(d => docs[d.id]);
  const step3Valid = form.agreeTerms && form.agreeAml && isConnected;
  const canNext    = [step0Valid, step1Valid, step2Valid, step3Valid][step];

  // ── Submit: hash data → call submitKYB(hash) ──────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!address || !form.bizName || !form.regNumber) return;
    const appHash = buildApplicationHash(form.bizName, form.regNumber, address, Date.now());
    if (!contractDeployed) {
      // Contract not yet deployed — show what would be submitted
      setLastTxHash('PENDING_DEPLOYMENT');
      return;
    }
    writeKYB({
      address:      KYB_ADDRESS,
      abi:          KYB_ABI,
      functionName: 'submitKYB',
      args:         [appHash],
    });
  }, [address, form.bizName, form.regNumber, writeKYB, contractDeployed]);

  const wrongNetwork = isConnected && chainId !== MEZO_TESTNET_ID;
  const submitted    = txSuccess || lastTxHash === 'PENDING_DEPLOYMENT';

  // ── Metric values ──────────────────────────────────────────────────────────
  const statusInfo = statusLabel(onChainStatus);
  const limitLabel = onChainStatus === KYB_STATUS.Approved ? '$500K+' : '$1,000';
  const limitSub   = onChainStatus === KYB_STATUS.Approved ? 'Business limit unlocked' : 'Unverified cap';

  return (
    <div className="page-content fade-in">
      <TopBar title="KYB Verification" blockNumber={live.blockNumber} gasPriceGwei={live.gasPriceGwei} />
      <div className="content-wrap">

        {/* ── Metrics row ─────────────────────────────────────────────────── */}
        <div className="metrics-row four-col">
          <MetricCard
            label="Verification Status"
            value={statusInfo.text}
            sub={contractDeployed ? `Chain ${MEZO_TESTNET_ID}` : 'Contract not deployed'}
          />
          <MetricCard label="Daily Limit"    value={limitLabel}  sub={limitSub} />
          <MetricCard label="After KYB"      value="$500K+"      sub="Business limit" accent />
          <MetricCard
            label="Total Submissions"
            value={contractDeployed ? (totalSubs ? String(Number(totalSubs)) : '…') : '—'}
            sub={contractDeployed ? `${totalApproved ? Number(totalApproved) : 0} approved` : 'Awaiting deployment'}
          />
        </div>

        {/* ── On-chain status banner ────────────────────────────────────── */}
        <StatusBanner
          status={onChainStatus}
          txHash={lastTxHash && lastTxHash !== 'PENDING_DEPLOYMENT' ? lastTxHash : undefined}
          submittedAt={onChainSubmittedAt}
          address={address}
          contractDeployed={contractDeployed}
        />

        {/* ── Wrong network warning ────────────────────────────────────── */}
        {wrongNetwork && (
          <div style={{ padding: '12px 18px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={15} style={{ color: '#f87171', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--sub)' }}>
              Switch to <strong style={{ color: '#f87171' }}>Mezo Testnet (Chain {MEZO_TESTNET_ID})</strong> to submit your KYB on-chain.
            </span>
          </div>
        )}

        {/* ── Contract address info ────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>MezoKYB contract:</div>
          {contractDeployed ? (
            <a href={`${EXPLORER}/address/${KYB_ADDRESS}`} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
              {KYB_ADDRESS.slice(0, 10)}…{KYB_ADDRESS.slice(-8)} <ExternalLink size={10} />
            </a>
          ) : (
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#f59e0b' }}>Not deployed — set VITE_KYB_ADDRESS</span>
          )}
          {onChainHash && onChainHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
              App hash: <span style={{ fontFamily: 'monospace', color: 'var(--sub)' }}>{onChainHash.slice(0, 14)}…</span>
            </div>
          )}
        </div>

        {/* ── Submitted confirmation ───────────────────────────────────── */}
        {submitted && (
          <div style={{
            textAlign: 'center', padding: '60px 40px',
            background: 'linear-gradient(135deg, rgba(34,211,168,0.08), rgba(37,99,235,0.06))',
            border: '1px solid rgba(34,211,168,0.25)', borderRadius: 20,
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--green)', marginBottom: 12 }}>
              Application Submitted On-Chain
            </div>
            <div style={{ fontSize: 13, color: 'var(--sub)', maxWidth: 480, margin: '0 auto 24px' }}>
              Your KYB application hash has been recorded on the Mezo Network (Chain {MEZO_TESTNET_ID}).
              Our compliance team will review and approve your application within 2–3 business days.
            </div>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
              {[
                { label: 'Application Hash',   value: onChainHash ? onChainHash.slice(0, 14) + '…' : buildApplicationHash(form.bizName, form.regNumber, address || '0x0', Date.now()).slice(0, 14) + '…' },
                { label: 'Network',            value: `Mezo Testnet (${MEZO_TESTNET_ID})` },
                { label: 'Status',             value: 'Pending Review' },
                { label: 'Expected Response',  value: '2–3 Business Days' },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', minWidth: 150 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: item.label === 'Application Hash' ? 'monospace' : 'inherit' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {lastTxHash && lastTxHash !== 'PENDING_DEPLOYMENT' && (
              <a
                href={`${EXPLORER}/tx/${lastTxHash}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', background: 'rgba(34,211,168,0.12)', border: '1px solid rgba(34,211,168,0.35)', borderRadius: 10, color: 'var(--green)', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}
              >
                View Transaction on Mezo Explorer <ExternalLink size={13} />
              </a>
            )}
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => { setStep(0); setLastTxHash(''); setDocs({}); setForm({ bizName: '', bizType: '', regNumber: '', country: '', website: '', phone: '', email: '', yearFounded: '', ownerName: '', ownerTitle: '', ownerEmail: '', ownerPhone: '', ownerNationality: '', pctOwnership: '', agreeTerms: false, agreeAml: false }); }}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Submit another application
              </button>
            </div>
          </div>
        )}

        {/* ── Multi-step form (hidden after submission) ────────────────── */}
        {!submitted && (
          <>
            {/* Why KYB banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.10), rgba(14,165,233,0.06))',
              border: '1px solid rgba(37,99,235,0.20)', borderRadius: 16, padding: '20px 28px',
              display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', marginBottom: 4 }}>
                  Why complete KYB on Mezo?
                </div>
                <div style={{ fontSize: 13, color: 'var(--sub)', maxWidth: 440 }}>
                  KYB verification is recorded on the Mezo Network (Chain {MEZO_TESTNET_ID}) via the <strong style={{ color: 'var(--text)' }}>MezoKYB</strong> smart contract.
                  It unlocks higher limits, merchant tools, and compliance-grade payroll — all MUSD-powered.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[
                  { val: '$500K', lbl: 'Daily Limit' },
                  { val: 'AML',   lbl: 'Compliant'   },
                  { val: 'API',   lbl: 'Access'      },
                ].map(s => (
                  <div key={s.lbl} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue)' }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step progress */}
            <div style={{ display: 'flex', gap: 0 }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    background: step === i ? 'rgba(37,99,235,0.12)' : i < step ? 'rgba(34,211,168,0.07)' : 'var(--surface)',
                    border: `1px solid ${step === i ? 'rgba(37,99,235,0.35)' : i < step ? 'rgba(34,211,168,0.25)' : 'var(--border)'}`,
                    borderRadius: i === 0 ? '12px 0 0 12px' : i === STEPS.length - 1 ? '0 12px 12px 0' : '0',
                    borderLeft: i > 0 ? 'none' : undefined,
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: i < step ? 'var(--green)' : step === i ? 'var(--blue)' : 'var(--surface2)',
                      color: i < step || step === i ? '#000' : 'var(--muted)', fontSize: 11, fontWeight: 700,
                    }}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: step === i ? 700 : 400, color: step === i ? 'var(--text)' : i < step ? 'var(--green)' : 'var(--muted)' }}>
                      {s}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Step card */}
            <div className="card">

              {/* Step 0 – Business Info */}
              {step === 0 && (
                <>
                  <div className="card-header">
                    <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={16} style={{ color: 'var(--blue)' }} /> Business Information
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Legal Business Name *" value={form.bizName}    onChange={v => set('bizName', v)}    placeholder="Acme Corp Ltd." />
                    <div>
                      <label style={labelStyle}>Business Type *</label>
                      <select className="dapp-input" value={form.bizType} onChange={e => set('bizType', e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                        <option value="">Select type…</option>
                        {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <Field label="Registration Number *" value={form.regNumber} onChange={v => set('regNumber', v)} placeholder="REG-123456789" icon={<Hash size={13} />} />
                    <div>
                      <label style={labelStyle}>Country of Incorporation *</label>
                      <select className="dapp-input" value={form.country} onChange={e => set('country', e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                        <option value="">Select country…</option>
                        {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <Field label="Year Founded"   value={form.yearFounded} onChange={v => set('yearFounded', v)} placeholder="2020" />
                    <Field label="Website"        value={form.website}    onChange={v => set('website', v)}    placeholder="https://acme.com" icon={<Globe size={13} />} />
                    <Field label="Business Email *" value={form.email}   onChange={v => set('email', v)}    placeholder="contact@acme.com" icon={<Mail size={13} />} />
                    <Field label="Business Phone" value={form.phone}    onChange={v => set('phone', v)}    placeholder="+1 555 000 0000" icon={<Phone size={13} />} />
                  </div>
                </>
              )}

              {/* Step 1 – Ownership */}
              {step === 1 && (
                <>
                  <div className="card-header">
                    <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <User size={16} style={{ color: 'var(--blue)' }} /> Principal Owner / Authorized Representative
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>Person with 25%+ ownership or signing authority</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Full Legal Name *" value={form.ownerName}        onChange={v => set('ownerName', v)}        placeholder="Jane Smith" />
                    <Field label="Title / Role *"    value={form.ownerTitle}       onChange={v => set('ownerTitle', v)}       placeholder="CEO" />
                    <Field label="Email *"           value={form.ownerEmail}       onChange={v => set('ownerEmail', v)}       placeholder="jane@acme.com" icon={<Mail size={13} />} />
                    <Field label="Phone"             value={form.ownerPhone}       onChange={v => set('ownerPhone', v)}       placeholder="+1 555 000 0000" icon={<Phone size={13} />} />
                    <Field label="Nationality"       value={form.ownerNationality} onChange={v => set('ownerNationality', v)} placeholder="American" />
                    <Field label="Ownership % *"     value={form.pctOwnership}     onChange={v => set('pctOwnership', v)}     placeholder="51" type="number" />
                  </div>
                  <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <AlertCircle size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 12, color: 'var(--sub)' }}>
                      If multiple owners each hold 25%+, list them all. Additional owners can be added after initial submission via your compliance dashboard.
                    </div>
                  </div>
                </>
              )}

              {/* Step 2 – Documents */}
              {step === 2 && (
                <>
                  <div className="card-header">
                    <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={16} style={{ color: 'var(--blue)' }} /> Required Documents
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>PDF or image · max 10 MB each</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {DOC_TYPES.map(doc => (
                      <div key={doc.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 12, transition: 'all 0.2s',
                        background: docs[doc.id] ? 'rgba(34,211,168,0.06)' : 'var(--surface2)',
                        border: `1px solid ${docs[doc.id] ? 'rgba(34,211,168,0.25)' : 'var(--border)'}`,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          background: docs[doc.id] ? 'rgba(34,211,168,0.15)' : 'rgba(255,255,255,0.05)',
                          color: docs[doc.id] ? 'var(--green)' : 'var(--muted)',
                        }}>
                          {docs[doc.id] ? <CheckCircle size={18} /> : <Upload size={18} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                            {doc.label}{doc.required && <span style={{ color: 'var(--red)', marginLeft: 4 }}>*</span>}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {docs[doc.id] ? 'Uploaded ✓' : doc.required ? 'Required' : 'Optional'}
                          </div>
                        </div>
                        <button
                          onClick={() => setDocs(prev => ({ ...prev, [doc.id]: true }))}
                          style={{
                            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            background: docs[doc.id] ? 'rgba(34,211,168,0.10)' : 'var(--accent)',
                            color: docs[doc.id] ? 'var(--green)' : '#fff',
                            border: docs[doc.id] ? '1px solid rgba(34,211,168,0.30)' : 'none',
                          }}>
                          {docs[doc.id] ? 'Replace' : 'Upload'}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Step 3 – Review */}
              {step === 3 && (
                <>
                  <div className="card-header">
                    <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle size={16} style={{ color: 'var(--green)' }} /> Review & Submit On-Chain
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <ReviewSection title="Business" rows={[
                      { k: 'Name',        v: form.bizName   },
                      { k: 'Type',        v: form.bizType   },
                      { k: 'Reg. Number', v: form.regNumber },
                      { k: 'Country',     v: form.country   },
                      { k: 'Email',       v: form.email     },
                    ]} />
                    <ReviewSection title="Principal Owner" rows={[
                      { k: 'Name',      v: form.ownerName       },
                      { k: 'Title',     v: form.ownerTitle      },
                      { k: 'Email',     v: form.ownerEmail      },
                      { k: 'Ownership', v: `${form.pctOwnership}%` },
                    ]} />
                  </div>

                  {/* What gets stored on-chain */}
                  <div style={{ padding: '14px 18px', background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                      What gets recorded on Mezo Network
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 8 }}>
                      Privacy-preserving: only a <strong style={{ color: 'var(--text)' }}>keccak256 hash</strong> of your application is stored on-chain — no personal data.
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)', wordBreak: 'break-all', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 8 }}>
                      {address ? buildApplicationHash(form.bizName || '…', form.regNumber || '…', address, 0) : '0x…'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                      Contract: <a href={contractDeployed ? `${EXPLORER}/address/${KYB_ADDRESS}` : '#'} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                        {contractDeployed ? `${KYB_ADDRESS.slice(0, 10)}…` : 'Not yet deployed'}
                      </a>{' · '}Chain {MEZO_TESTNET_ID}
                    </div>
                  </div>

                  {/* Wallet linkage */}
                  <div style={{ padding: '14px 18px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Linked Wallet (submitting address)</div>
                    {isConnected && address
                      ? <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text)' }}>{address}</div>
                      : <div style={{ fontSize: 13, color: 'var(--red)' }}>⚠ Connect your wallet to submit on-chain</div>}
                  </div>

                  {/* Checkboxes */}
                  {[
                    { k: 'agreeTerms', label: 'I confirm all provided information is accurate and I am authorized to submit this application on behalf of the business.' },
                    { k: 'agreeAml',   label: 'I acknowledge this application is subject to AML/KYB compliance checks and agree to Mezo\'s Terms of Service and Privacy Policy.' },
                  ].map(({ k, label }) => (
                    <label key={k} style={{ display: 'flex', gap: 12, padding: '14px 0', borderTop: '1px solid var(--border)', cursor: 'pointer', alignItems: 'flex-start' }}>
                      <input type="checkbox" checked={!!form[k as keyof typeof form]} onChange={e => set(k as keyof typeof form, e.target.checked)}
                        style={{ width: 16, height: 16, marginTop: 1, flexShrink: 0, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                      <span style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.6 }}>{label}</span>
                    </label>
                  ))}
                </>
              )}

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                {step > 0 && (
                  <button className="action-btn withdraw" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>
                    ← Back
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button className="action-btn stake" style={{ flex: 2 }} disabled={!canNext} onClick={() => setStep(s => s + 1)}>
                    Continue <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    className="action-btn stake" style={{ flex: 2 }}
                    disabled={!canNext || txPending || wrongNetwork}
                    onClick={handleSubmit}
                  >
                    {txPending
                      ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting on Mezo…</>
                      : <><CheckCircle size={14} /> Submit KYB On-Chain</>
                    }
                  </button>
                )}
              </div>
              {txError && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, fontSize: 12, color: '#f87171' }}>
                  Transaction failed. Check your wallet and try again.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
