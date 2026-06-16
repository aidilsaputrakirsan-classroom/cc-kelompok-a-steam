import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAuthHealth } from '../services/api'

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

  const getStatusIcon = () => {
    switch (authStatus) {
      case 'healthy': return ''
      case 'degraded': return ''
      case 'unhealthy': return ''
      default: return ''
    }
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

          <div>
            <h1 style={{ ...styles.title, color: "var(--text-primary)" }}>Inti Rupa</h1>
            <p style={{ ...styles.subtitle, color: "var(--text-muted)" }}>AI Platform — Komputasi Awan ITK</p>
          </div>
        </div>
      </div>
      <div style={styles.right}>
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
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(100, 116, 139, 0.3)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(100, 116, 139, 0.2)'}
          title="View system status"
        >
          {getStatusIcon() && <span>{getStatusIcon()}</span>}
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

          <span>{isDark ? "Light" : "Dark"}</span>
        </button>

        {user && (
          <div style={styles.user}>
            <span style={styles.userName}>{user.full_name || user.email}</span>
            <button onClick={onLogout} style={styles.btnLogout}>
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
    color: "#eef2ff",
    borderRadius: "30px",
    marginBottom: "1.5rem",
    border: "1px solid rgba(255, 156, 60, 0.12)",
    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.2)",
    position: "relative",
    overflow: "hidden",
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
  icon: {
    fontSize: "2.5rem",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
  },
  title: {
    margin: 0,
    fontSize: "1.8rem",
    fontWeight: "bold",
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
  },
  subtitle: {
    margin: "0.25rem 0 0 0",
    fontSize: "0.9rem",
    opacity: 0.85,
    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
  },
  right: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.75rem",
  },
  stats: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "rgba(255, 148, 66, 0.16)",
    padding: "0.5rem 0.9rem",
    borderRadius: "999px",
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#ffd8b2",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  status: {
    padding: "0.5rem 0.9rem",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: 700,
    border: "1px solid",
    backdropFilter: "blur(10px)",
  },
  user: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: "0.65rem 1rem",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  userName: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#fff7ee",
  },
  btnLogout: {
    padding: "0.65rem 1rem",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(135deg, #ffb56e, #ff8f48)",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 12px 24px rgba(255, 143, 72, 0.18)",
    transition: "transform 0.2s ease",
  },
}

export default Header

// function Header({ totalItems, isConnected, user, onLogout }) {
//   return (
//     <header style={styles.header}>
//       <div style={styles.left}>
//         <div style={styles.logo}>
//           <span style={styles.icon}>✨</span>
//           <div>
//             <h1 style={styles.title}>Inti Rupa</h1>
//             <p style={styles.subtitle}>AI Platform — Komputasi Awan ITK</p>
//           </div>
//         </div>
//       </div>
//       <div style={styles.right}>
//         <div style={styles.stats}>
//           <span style={styles.badge}>📦 {totalItems} items</span>
//           <span style={{
//             ...styles.status,
//             backgroundColor: isConnected ? "#E2EFDA" : "#FBE5D6",
//             color: isConnected ? "#548235" : "#C00000",
//           }}>
//             {isConnected ? "🟢 Online" : "🔴 Offline"}
//           </span>
//         </div>
//         {user && (
//           <div style={styles.user}>
//             <span style={styles.userName}>👤 {user.full_name || user.email}</span>
//             <button onClick={onLogout} style={styles.btnLogout}>
//               🚪 Logout
//             </button>
//           </div>
//         )}
//       </div>
//     </header>
//   )
// }

// const styles = {
//   header: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: "1.5rem 2rem",
//     background: "linear-gradient(135deg, #1F4E79 0%, #2E75B6 100%)",
//     color: "white",
//     borderRadius: "16px",
//     marginBottom: "1.5rem",
//     boxShadow: "0 8px 32px rgba(31, 78, 121, 0.3)",
//     position: "relative",
//     overflow: "hidden",
//   },
//   left: {
//     display: "flex",
//     alignItems: "center",
//   },
//   logo: {
//     display: "flex",
//     alignItems: "center",
//     gap: "1rem",
//   },
//   icon: {
//     fontSize: "2.5rem",
//     filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
//   },
//   title: {
//     margin: 0,
//     fontSize: "1.8rem",
//     fontWeight: "bold",
//     textShadow: "0 2px 4px rgba(0,0,0,0.3)",
//   },
//   subtitle: {
//     margin: "0.25rem 0 0 0",
//     fontSize: "0.9rem",
//     opacity: 0.8,
//     textShadow: "0 1px 2px rgba(0,0,0,0.3)",
//   },
//   right: {
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "flex-end",
//     gap: "0.75rem",
//   },
//   stats: {
//     display: "flex",
//     gap: "0.75rem",
//     alignItems: "center",
//   },
//   badge: {
//     backgroundColor: "rgba(255,255,255,0.15)",
//     backdropFilter: "blur(10px)",
//     padding: "0.4rem 0.8rem",
//     borderRadius: "20px",
//     fontSize: "0.8rem",
//     fontWeight: "500",
//     border: "1px solid rgba(255,255,255,0.2)",
//   },
//   status: {
//     padding: "0.4rem 0.8rem",
//     borderRadius: "20px",
//     fontSize: "0.75rem",
//     fontWeight: "bold",
//     border: "1px solid rgba(255,255,255,0.2)",
//     backdropFilter: "blur(10px)",
//   },
//   user: {
//     display: "flex",
//     gap: "0.75rem",
//     alignItems: "center",
//     backgroundColor: "rgba(255,255,255,0.1)",
//     backdropFilter: "blur(10px)",
//     padding: "0.5rem 1rem",
//     borderRadius: "25px",
//     border: "1px solid rgba(255,255,255,0.2)",
//   },
//   userName: {
//     fontSize: "0.9rem",
//     fontWeight: "500",
//     opacity: 0.95,
//   },
//   btnLogout: {
//     padding: "0.4rem 0.8rem",
//     backgroundColor: "rgba(255,255,255,0.2)",
//     color: "white",
//     border: "1px solid rgba(255,255,255,0.3)",
//     borderRadius: "20px",
//     cursor: "pointer",
//     fontSize: "0.8rem",
//     fontWeight: "500",
//     transition: "all 0.2s ease",
//   },
// }

// export default Header