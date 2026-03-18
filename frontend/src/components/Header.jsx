function Header({ totalItems, isConnected, user, onLogout }) {
  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <div style={styles.logo}>
          <span style={styles.icon}>☁️</span>
          <div>
            <h1 style={styles.title}>Cloud App</h1>
            <p style={styles.subtitle}>Komputasi Awan — SI ITK</p>
          </div>
        </div>
      </div>
      <div style={styles.right}>
        <div style={styles.stats}>
          <span style={styles.badge}>📦 {totalItems} items</span>
          <span style={{
            ...styles.status,
            backgroundColor: isConnected ? "#E2EFDA" : "#FBE5D6",
            color: isConnected ? "#548235" : "#C00000",
          }}>
            {isConnected ? "🟢 Online" : "🔴 Offline"}
          </span>
        </div>
        {user && (
          <div style={styles.user}>
            <span style={styles.userName}>👤 {user.full_name || user.email}</span>
            <button onClick={onLogout} style={styles.btnLogout}>
              🚪 Logout
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
    padding: "1.5rem 2rem",
    background: "linear-gradient(135deg, #1F4E79 0%, #2E75B6 100%)",
    color: "white",
    borderRadius: "16px",
    marginBottom: "1.5rem",
    boxShadow: "0 8px 32px rgba(31, 78, 121, 0.3)",
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
    opacity: 0.8,
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
    backgroundColor: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    padding: "0.4rem 0.8rem",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "500",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  status: {
    padding: "0.4rem 0.8rem",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "bold",
    border: "1px solid rgba(255,255,255,0.2)",
    backdropFilter: "blur(10px)",
  },
  user: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    padding: "0.5rem 1rem",
    borderRadius: "25px",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  userName: {
    fontSize: "0.9rem",
    fontWeight: "500",
    opacity: 0.95,
  },
  btnLogout: {
    padding: "0.4rem 0.8rem",
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },
}

export default Header