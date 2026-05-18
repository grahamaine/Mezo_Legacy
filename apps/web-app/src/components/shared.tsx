import React from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useNavigate, useLocation } from 'react-router-dom';

export function TopBar({
  title,
  blockNumber,
  gasPriceGwei,
}: {
  title: string;
  blockNumber?: bigint;
  gasPriceGwei?: number;
}) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="topbar">
      <div className="topbar-left">
        {location.pathname !== '/' && (
          <button className="topbar-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
        )}
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">Mezo Network · MUSD Powered</p>
      </div>
      <div className="topbar-right">
        <div className="pill amber">
          <span className="blink">◉</span> Block{' '}
          {blockNumber ? `#${blockNumber.toLocaleString()}` : '#...'}
        </div>
        <div className="pill green">
          <span>●</span> {gasPriceGwei ?? 0} gwei
        </div>
        {isConnected ? (
          <div className="topbar-wallet">
            <span className="topbar-addr">
              <span className="online-dot" />
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </span>
            <button className="topbar-disconnect" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>
        ) : (
          <button className="topbar-connect" onClick={() => open()}>
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  change,
  changeDir,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  change?: string;
  changeDir?: 'up' | 'down';
  accent?: boolean;
}) {
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

export const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      <p className="tooltip-val">
        {typeof payload[0].value === 'number' && payload[0].value > 100
          ? `$${payload[0].value.toLocaleString()}`
          : `${payload[0].value}`}
      </p>
    </div>
  );
};
