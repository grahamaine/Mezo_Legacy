import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  Building2, User, FileText, CheckCircle, ChevronRight,
  Upload, AlertCircle, Globe, Phone, Mail, Hash,
} from 'lucide-react';
import { TopBar, MetricCard } from '../components/shared';
import { useLiveChainData } from '../hooks/useLiveChainData';

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
  { id: 'reg',   label: 'Business Registration Certificate', required: true },
  { id: 'tax',   label: 'Tax Identification Document',       required: true },
  { id: 'addr',  label: 'Proof of Business Address',         required: true },
  { id: 'owner', label: 'Ownership Structure Chart',         required: false },
  { id: 'bank',  label: 'Bank Statement (last 3 months)',    required: false },
];

export default function KYBPage() {
  const { address, isConnected } = useAccount();
  const live = useLiveChainData(address);

  const [step,        setStep]        = useState(0);
  const [submitted,   setSubmitted]   = useState(false);
  const [docs,        setDocs]        = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({
    bizName: '', bizType: '', regNumber: '', country: '', website: '',
    phone: '', email: '', yearFounded: '',
    ownerName: '', ownerTitle: '', ownerEmail: '', ownerPhone: '',
    ownerNationality: '', pctOwnership: '',
    agreeTerms: false, agreeAml: false,
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const step0Valid = form.bizName && form.bizType && form.regNumber && form.country;
  const step1Valid = form.ownerName && form.ownerTitle && form.ownerEmail && form.pctOwnership;
  const step2Valid = DOC_TYPES.filter(d => d.required).every(d => docs[d.id]);
  const step3Valid = form.agreeTerms && form.agreeAml && isConnected;

  const canNext = [step0Valid, step1Valid, step2Valid, step3Valid][step];

  return (
    <div className="page-content fade-in">
      <TopBar title="KYB Verification" blockNumber={live.blockNumber} gasPriceGwei={live.gasPriceGwei} />
      <div className="content-wrap">

        {submitted ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: 'linear-gradient(135deg, rgba(34,211,168,0.08), rgba(37,99,235,0.06))',
            border: '1px solid rgba(34,211,168,0.25)', borderRadius: 20,
          }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--green)', marginBottom: 12 }}>
              Application Submitted
            </div>
            <div style={{ fontSize: 14, color: 'var(--sub)', maxWidth: 480, margin: '0 auto 24px' }}>
              Your KYB application is under review. Our compliance team will respond within 2–3 business days.
              You will receive an email at <strong style={{ color: 'var(--text)' }}>{form.email || 'your provided address'}</strong>.
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Application ID', value: `KYB-${Date.now().toString(36).toUpperCase()}` },
                { label: 'Status',         value: 'Under Review' },
                { label: 'Expected',       value: '2–3 Business Days' },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '16px 24px', minWidth: 160,
                }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Metrics */}
            <div className="metrics-row four-col">
              <MetricCard label="Verification Level" value="Level 0" sub="Not verified" />
              <MetricCard label="Daily Limit"        value="$1,000"  sub="Unverified cap" />
              <MetricCard label="After KYB"          value="$500K+"  sub="Business limit" accent />
              <MetricCard label="Processing Time"    value="2–3 days" sub="Business days" />
            </div>

            {/* Why KYB */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.10), rgba(14,165,233,0.06))',
              border: '1px solid rgba(37,99,235,0.20)', borderRadius: 16, padding: '20px 28px',
              display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center', marginBottom: 0,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', marginBottom: 4 }}>
                  Why complete KYB?
                </div>
                <div style={{ fontSize: 13, color: 'var(--sub)', maxWidth: 440 }}>
                  Business verification unlocks higher transaction limits, merchant tools,
                  payroll features, and compliance-grade reporting — all powered by MUSD.
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

            {/* Step progress bar */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px',
                    background: step === i ? 'rgba(37,99,235,0.12)' : i < step ? 'rgba(34,211,168,0.07)' : 'var(--surface)',
                    border: `1px solid ${step === i ? 'rgba(37,99,235,0.35)' : i < step ? 'rgba(34,211,168,0.25)' : 'var(--border)'}`,
                    borderRadius: i === 0 ? '12px 0 0 12px' : i === STEPS.length - 1 ? '0 12px 12px 0' : '0',
                    borderLeft: i > 0 ? 'none' : undefined,
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: i < step ? 'var(--green)' : step === i ? 'var(--blue)' : 'var(--surface2)',
                      color: i < step || step === i ? '#000' : 'var(--muted)',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
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

            {/* Step content */}
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
                    <Field label="Legal Business Name *" value={form.bizName} onChange={v => set('bizName', v)} placeholder="Acme Corp Ltd." />
                    <div>
                      <label style={labelStyle}>Business Type *</label>
                      <select className="dapp-input" value={form.bizType} onChange={e => set('bizType', e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                        <option value="">Select type…</option>
                        {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <Field label="Registration Number *" value={form.regNumber} onChange={v => set('regNumber', v)} placeholder="REG-123456789" icon={<Hash size={13} />} />
                    <div>
                      <label style={labelStyle}>Country of Incorporation *</label>
                      <select className="dapp-input" value={form.country} onChange={e => set('country', e.target.value)} style={{ width: '100%', cursor: 'pointer' }}>
                        <option value="">Select country…</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <Field label="Year Founded" value={form.yearFounded} onChange={v => set('yearFounded', v)} placeholder="2020" />
                    <Field label="Website" value={form.website} onChange={v => set('website', v)} placeholder="https://acme.com" icon={<Globe size={13} />} />
                    <Field label="Business Email *" value={form.email} onChange={v => set('email', v)} placeholder="contact@acme.com" icon={<Mail size={13} />} />
                    <Field label="Business Phone" value={form.phone} onChange={v => set('phone', v)} placeholder="+1 555 000 0000" icon={<Phone size={13} />} />
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
                    <Field label="Full Legal Name *" value={form.ownerName} onChange={v => set('ownerName', v)} placeholder="Jane Smith" />
                    <Field label="Title / Role *"    value={form.ownerTitle} onChange={v => set('ownerTitle', v)} placeholder="CEO" />
                    <Field label="Email *"           value={form.ownerEmail} onChange={v => set('ownerEmail', v)} placeholder="jane@acme.com" icon={<Mail size={13} />} />
                    <Field label="Phone"             value={form.ownerPhone} onChange={v => set('ownerPhone', v)} placeholder="+1 555 000 0000" icon={<Phone size={13} />} />
                    <Field label="Nationality"       value={form.ownerNationality} onChange={v => set('ownerNationality', v)} placeholder="American" />
                    <Field label="Ownership % *"     value={form.pctOwnership} onChange={v => set('pctOwnership', v)} placeholder="51" />
                  </div>
                  <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <AlertCircle size={15} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 12, color: 'var(--sub)' }}>
                      If multiple owners each hold 25%+, you must list them all. Additional owners can be added after initial submission via your compliance dashboard.
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
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>PDF or image, max 10 MB each</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {DOC_TYPES.map(doc => (
                      <div key={doc.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 18px', borderRadius: 12,
                        background: docs[doc.id] ? 'rgba(34,211,168,0.06)' : 'var(--surface2)',
                        border: `1px solid ${docs[doc.id] ? 'rgba(34,211,168,0.25)' : 'var(--border)'}`,
                        transition: 'all 0.2s',
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: docs[doc.id] ? 'rgba(34,211,168,0.15)' : 'rgba(255,255,255,0.05)',
                          color: docs[doc.id] ? 'var(--green)' : 'var(--muted)', flexShrink: 0,
                        }}>
                          {docs[doc.id] ? <CheckCircle size={18} /> : <Upload size={18} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                            {doc.label}
                            {doc.required && <span style={{ color: 'var(--red)', marginLeft: 4 }}>*</span>}
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
                      <CheckCircle size={16} style={{ color: 'var(--green)' }} /> Review & Submit
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <ReviewSection title="Business" rows={[
                      { k: 'Name',        v: form.bizName     },
                      { k: 'Type',        v: form.bizType     },
                      { k: 'Reg. Number', v: form.regNumber   },
                      { k: 'Country',     v: form.country     },
                      { k: 'Email',       v: form.email       },
                    ]} />
                    <ReviewSection title="Principal Owner" rows={[
                      { k: 'Name',      v: form.ownerName       },
                      { k: 'Title',     v: form.ownerTitle      },
                      { k: 'Email',     v: form.ownerEmail      },
                      { k: 'Ownership', v: `${form.pctOwnership}%` },
                    ]} />
                  </div>

                  {/* Wallet linkage */}
                  <div style={{ padding: '14px 18px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Linked Wallet</div>
                    {isConnected && address ? (
                      <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text)' }}>{address}</div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--red)' }}>⚠ Connect your wallet to link it to this application</div>
                    )}
                  </div>

                  {/* AML / Terms checkboxes */}
                  {[
                    { k: 'agreeTerms', label: 'I confirm all provided information is accurate and I am authorized to submit this application on behalf of the business.' },
                    { k: 'agreeAml',   label: 'I acknowledge that this application is subject to AML/KYB compliance checks and agree to Mezo\'s Terms of Service and Privacy Policy.' },
                  ].map(({ k, label }) => (
                    <label key={k} style={{ display: 'flex', gap: 12, padding: '14px 0', borderTop: '1px solid var(--border)', cursor: 'pointer', alignItems: 'flex-start' }}>
                      <input
                        type="checkbox"
                        checked={!!form[k as keyof typeof form]}
                        onChange={e => set(k as keyof typeof form, e.target.checked)}
                        style={{ width: 16, height: 16, marginTop: 1, flexShrink: 0, accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
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
                  <button className="action-btn stake" style={{ flex: 2 }} disabled={!canNext} onClick={() => setSubmitted(true)}>
                    <CheckCircle size={15} /> Submit KYB Application
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6,
};

function Field({ label, value, onChange, placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon?: React.ReactNode;
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
          className="dapp-input"
          value={value}
          onChange={e => onChange(e.target.value)}
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
