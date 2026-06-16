import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Bot, Globe } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost';

/**
 * StatusPage - System Monitoring Dashboard
 * Module 14: Observability & Monitoring
 * Displays real-time health and metrics for all services
 */

function ServiceCard({ name, icon, healthUrl, metricsUrl }) {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const healthRes = await fetch(healthUrl);
      const healthData = await healthRes.json();
      setHealth(healthData);
    } catch {
      setHealth({ status: 'unreachable' });
    }

    if (metricsUrl) {
      try {
        const metricsRes = await fetch(metricsUrl);
        const contentType = metricsRes.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        } else {
          // Fallback to parse Nginx stub_status plain text format
          const text = await metricsRes.text();
          const match = text.match(/server accepts handled requests\n\s+(\d+)\s+(\d+)\s+(\d+)/);
          if (match) {
            const accepts = parseInt(match[1], 10);
            const handled = parseInt(match[2], 10);
            const requests = parseInt(match[3], 10);
            setMetrics({
              total_requests: requests,
              total_errors: accepts - handled, // Basic error estimation
              error_rate_percent: 0, // N/A
              latency: { avg_ms: 0, p95_ms: 0 }, // N/A
              uptime_seconds: 0 // N/A
            });
          } else {
            setMetrics(null);
          }
        }
      } catch (err) {
        setMetrics(null);
      }
    }

    setLoading(false);
  }, [healthUrl, metricsUrl]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const statusColor = {
    healthy: '#10b981',
    degraded: '#f59e0b',
    unhealthy: '#ef4444',
    unreachable: '#6b7280',
  };

  const statusBgColor = {
    healthy: 'rgba(16, 185, 129, 0.08)',
    degraded: 'rgba(245, 158, 11, 0.08)',
    unhealthy: 'rgba(239, 68, 68, 0.08)',
    unreachable: 'rgba(107, 114, 128, 0.08)',
  };

  const status = health?.status || 'unreachable';
  const isDark = document.documentElement.classList.contains('light') === false;

  const cardBgColor = isDark 
    ? 'rgba(17, 24, 39, 0.6)' 
    : 'rgba(255, 255, 255, 0.8)';
  const cardBorderColor = isDark 
    ? 'rgba(229, 231, 235, 0.1)' 
    : 'rgba(209, 213, 219, 0.4)';
  const textColor = isDark 
    ? '#f3f4f6' 
    : '#1f2937';
  const subtextColor = isDark 
    ? '#9ca3af' 
    : '#6b7280';
  const metricBgColor = isDark
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.02)';

  return (
    <div style={{
      border: `1px solid ${cardBorderColor}`,
      borderRadius: '12px',
      padding: '20px',
      borderLeft: `3px solid ${statusColor[status] || '#6b7280'}`,
      background: isDark ? cardBgColor : statusBgColor[status],
      backdropFilter: 'blur(10px)',
      color: textColor,
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', color: statusColor[status] || '#6b7280', display: 'flex' }}>{icon}</span>
            {name}
          </h3>
        </div>
        <span style={{
          background: statusColor[status],
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '16px',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
        }}>
          {loading ? 'Checking' : status}
        </span>
      </div>

      {metrics && (
        <div style={{ marginTop: '16px', fontSize: '13px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ background: metricBgColor, padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', color: subtextColor }}>Requests</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: textColor }}>{metrics.total_requests || 0}</div>
            </div>
            <div style={{ background: metricBgColor, padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', color: metrics.total_errors > 0 ? '#ef4444' : subtextColor }}>Errors</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: metrics.total_errors > 0 ? '#ef4444' : textColor }}>
                {metrics.total_errors || 0}
              </div>
            </div>
            <div style={{ background: metricBgColor, padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', color: subtextColor }}>Error %</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: textColor }}>{metrics.error_rate_percent || 0}%</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <div style={{ background: metricBgColor, padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', color: subtextColor }}>Avg Latency</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: textColor }}>{metrics.latency?.avg_ms ? `${metrics.latency.avg_ms.toFixed(1)}ms` : '-'}</div>
            </div>
            <div style={{ background: metricBgColor, padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', color: subtextColor }}>P95 Latency</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: textColor }}>{metrics.latency?.p95_ms ? `${metrics.latency.p95_ms.toFixed(1)}ms` : '-'}</div>
            </div>
            <div style={{ background: metricBgColor, padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', color: subtextColor }}>Uptime</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: textColor }}>{metrics.uptime_seconds ? `${Math.round(metrics.uptime_seconds / 60)}m` : '-'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StatusPage() {
  const navigate = useNavigate();
  const isDark = document.documentElement.classList.contains('light') === false;

  const bgColor = isDark 
    ? 'radial-gradient(circle at top left, rgba(136, 115, 255, 0.16), transparent 24%), radial-gradient(circle at bottom right, rgba(255, 184, 130, 0.18), transparent 24%), #060913'
    : 'linear-gradient(135deg, #f8f9fa 0%, #f0f4f8 100%)';
  const textColor = isDark 
    ? '#f3f4f6' 
    : '#1f2937';
  const subtextColor = isDark 
    ? '#9ca3af' 
    : '#6b7280';

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: bgColor,
      padding: '2rem',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'San Francisco', 'Segoe UI', sans-serif",
      color: textColor,
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header dengan back button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <button
            onClick={handleBack}
            style={{
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
              color: textColor,
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
              e.target.style.transform = 'scale(1)';
            }}
            title="Back to application"
          >
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>System Status</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: subtextColor }}>
              Real-time monitoring • Auto-refresh every 10 seconds
            </p>
          </div>
        </div>

        {/* Service Status Cards */}
        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          <ServiceCard
            name="Auth Service"
            icon={<ShieldCheck size={20} />}
            healthUrl={`${API_URL}/auth/health`}
            metricsUrl={`${API_URL}/auth/metrics`}
          />
          <ServiceCard
            name="AI Service"
            icon={<Bot size={20} />}
            healthUrl={`${API_URL}/items/health`}
            metricsUrl={`${API_URL}/items/metrics`}
          />
          <ServiceCard
            name="API Gateway"
            icon={<Globe size={20} />}
            healthUrl={`${API_URL}/health`}
            metricsUrl={`${API_URL}/nginx_status`}
          />
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          color: subtextColor,
          paddingTop: '16px',
          borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
        }}>
          <p style={{ margin: '12px 0' }}>
            Last checked: <strong>{new Date().toLocaleTimeString('id-ID')}</strong> • 
            Status page auto-refresh enabled
          </p>
          <p style={{ margin: '0', fontSize: '11px' }}>
            For production monitoring, integrate with Prometheus + Grafana
          </p>
        </div>
      </div>
    </div>
  );
}
