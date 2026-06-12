import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAuthHealth } from '../services/api'
import { Sparkles, Sun, Moon, User, LogOut } from 'lucide-react'

function Header({ user, onLogout, isDark, onToggleDark }) {
  const navigate = useNavigate()
  const [authStatus, setAuthStatus] = useState('healthy')

  useEffect(() => {
    const checkStatus = async () => {
      const health = await fetchAuthHealth()
      setAuthStatus(health?.status || 'unknown')
    }

    checkStatus()
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const getStatusDot = () => {
    const colorMap = {
      healthy: '#10b981',
      degraded: '#f59e0b',
      unhealthy: '#ef4444',
    }
    const color = colorMap[authStatus] || '#94a3b8'
    return (
      <span style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 0 2px ${color}33`,
        flexShrink: 0,
      }} />
    )
  }

  return (
    <header style={{
      ...styles.header,
      background: "var(--bg-header)",
      borderColor: "var(--bg-header-border)",
      color: "var(--text-primary)",
    }}>
      <div style={styles.left}>
        <div style={styles.logo}>
          <div style={styles.iconWrapper}>
            <Sparkles size={26} style={{ color: '#ff8f48' }} />
          </div>
          <div>
            <h1 style={{ ...styles.title, color: "var(--text-primary)" }}>Inti Rupa</h1>
            <p style={{ ...styles.subtitle, color: "var(--text-muted)" }}>AI Platform — Komputasi Awan ITK</p>
          </div>
        </div>
      </div>
      <div style={styles.right}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
          {/* Status Page Link */}
          <button
            onClick={() => navigate('/status')}
            style={{
              ...styles.badge,
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              cursor: 'pointer',
              backgroundColor: 'rgba(100, 116, 139, 0.2)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.2)'}
            title="View system status"
          >
            {getStatusDot()}
            <span>Status</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="dark-mode-toggle"
            className="dark-mode-toggle"
            onClick={onToggleDark}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark
              ? <Sun size={16} style={{ flexShrink: 0 }} />
              : <Moon size={16} style={{ flexShrink: 0 }} />
            }
            <span>{isDark ? "Light" : "Dark"}</span>
          </button>
        </div>

        {user && (
          <div style={styles.user}>
            <User size={15} style={{ color: 'var(--text-primary)', flexShrink: 0, opacity: 0.75 }} />
            <span style={styles.userName}>{user.full_name || user.email}</span>
            <button onClick={onLogout} style={styles.btnLogout}>
              <LogOut size={15} style={{ flexShrink: 0 }} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.75rem 2rem",
    background: "linear-gradient(135deg, rgba(255, 164, 82, 0.14), rgba(25, 39, 76, 0.92))",
    color: "var(--text-primary)",
    borderRadius: "30px",
    marginBottom: "1.5rem",
    border: "1px solid rgba(255, 156, 60, 0.12)",
    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.2)",
    position: "relative",
    overflow: "hidden",
    width: "100%",
  },
  left: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  iconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "rgba(255, 143, 72, 0.15)",
    border: "1px solid rgba(255, 143, 72, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "1.8rem",
    fontWeight: "bold",
  },
  subtitle: {
    margin: "0.25rem 0 0 0",
    fontSize: "0.9rem",
    opacity: 0.85,
  },
  right: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.75rem",
  },
  badge: {
    backgroundColor: "rgba(255, 148, 66, 0.16)",
    padding: "0.5rem 0.9rem",
    borderRadius: "999px",
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  user: {
    display: "flex",
    gap: "0.6rem",
    alignItems: "center",
    backgroundColor: "var(--header-user-bg, rgba(255,255,255,0.08))",
    padding: "0.65rem 1rem",
    borderRadius: "999px",
    border: "1px solid var(--header-user-border, rgba(255,255,255,0.12))",
  },
  userName: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  btnLogout: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.55rem 0.9rem",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(135deg, #ffb56e, #ff8f48)",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.88rem",
    boxShadow: "0 12px 24px rgba(255, 143, 72, 0.18)",
    transition: "transform 0.2s ease",
  },
}

export default Header