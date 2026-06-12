import { useState, useEffect } from "react"
import { LogIn, UserPlus } from "lucide-react"
import Spinner from "./Spinner"

const initialFormData = {
  username: "",
  email: "",
  password: "",
  full_name: "",
}

function LoginPage({ onLogin, onRegister, showToast }) {
  const styles = getLoginPageStyles()
  const [isRegister, setIsRegister] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    resetForm()
  }, [])

  const resetForm = () => {
    setFormData(initialFormData)
    setError("")
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isRegister) {
        if (!formData.full_name.trim()) {
          showToast("Nama lengkap wajib diisi", "error")
          setLoading(false)
          return
        }
        if (!formData.username.trim()) {
          showToast("Username wajib diisi", "error")
          setLoading(false)
          return
        }
        if (formData.password.length < 8) {
          showToast("Password minimal 8 karakter", "error")
          setLoading(false)
          return
        }
        await onRegister(formData)
      } else {
        await onLogin(formData.email.trim(), formData.password)
      }
      resetForm()
    } catch (err) {
      showToast(err.message, "error")
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div role="main" style={styles.wrapper}>
      <div style={styles.backgroundGlow} />
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Intirupa</h1>
            <p style={styles.subtitle}>Masuk atau daftar untuk mulai menggunakan AI generator dan summarizer.</p>
          </div>
          <div style={styles.badge}>Secure</div>
        </div>

        <div style={styles.tabs}>
          <button
            type="button"
            style={{ ...styles.tab, ...(isRegister ? {} : styles.tabActive) }}
            onClick={() => {
              setIsRegister(false)
              resetForm()
            }}
          >
            Login
          </button>
          <button
            type="button"
            style={{ ...styles.tab, ...(isRegister ? styles.tabActive : {}) }}
            onClick={() => {
              setIsRegister(true)
              resetForm()
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} autoComplete="off" aria-label={isRegister ? "Registration form" : "Login form"}>
          <input
            type="text"
            name="fakeusername"
            style={{ display: "none" }}
            autoComplete="username"
          />
          <input
            type="password"
            name="fakepassword"
            style={{ display: "none" }}
            autoComplete="new-password"
          />

          {isRegister && (
            <div style={styles.field}>
              <label style={styles.label}>Nama Lengkap</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Nama Lengkap"
                style={styles.input}
                autoComplete="name"
              />
            </div>
          )}

          {isRegister && (
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="username_tanpa_spasi"
                style={styles.input}
                autoComplete="username"
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>{isRegister ? "Email" : "Email / Username"}</label>
            <input
              type={isRegister ? "email" : "text"}
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={isRegister ? "email@student.itk.ac.id" : "email atau username"}
              required
              style={styles.input}
              autoComplete={isRegister ? "email" : "username"}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimal 8 karakter"
              required
              style={styles.input}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.btnSubmit} disabled={loading}>
            {loading ? (
              <>
                <Spinner size={20} color="white" />
                <span style={{ marginLeft: "0.5rem" }}>
                  {isRegister ? "Mendaftarkan..." : "Masuk..."}
                </span>
              </>
            ) : (
              isRegister
                ? <><UserPlus size={18} style={{ flexShrink: 0 }} /><span>Register</span></>
                : <><LogIn size={18} style={{ flexShrink: 0 }} /><span>Login</span></>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

const getLoginPageStyles = () => {
  return {
  wrapper: {
    position: "relative",
    overflow: "hidden",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-app-gradient)",
    padding: "2rem",
    fontFamily: "'SF Pro Display', 'SF Pro', 'Inter', system-ui, sans-serif",
  },
  backgroundGlow: {
    position: "absolute",
    width: "720px",
    height: "720px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255, 189, 169, 0.14), transparent 52%)",
    filter: "blur(80px)",
    top: "-180px",
    right: "-120px",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: "460px",
    background: "var(--bg-card)",
    border: "1px solid var(--bg-card-border)",
    borderRadius: "28px",
    padding: "2rem",
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)",
    backdropFilter: "blur(18px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    alignItems: "flex-start",
    marginBottom: "1.75rem",
  },
  title: {
    margin: 0,
    fontSize: "2.2rem",
    lineHeight: 1.05,
    color: "var(--text-primary)",
  },
  subtitle: {
    margin: "0.65rem 0 0",
    color: "var(--text-muted)",
    lineHeight: 1.6,
    maxWidth: "320px",
    fontSize: "0.95rem",
  },
  badge: {
    alignSelf: "center",
    padding: "0.5rem 0.9rem",
    borderRadius: "999px",
    background: "linear-gradient(135deg, rgba(255,180,130,0.16), rgba(255,255,255,0.08))",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#ffe7d1",
    fontSize: "0.82rem",
    letterSpacing: "0.02em",
  },
  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.5rem",
    marginBottom: "1.75rem",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "14px",
    padding: "0.35rem",
  },
  tab: {
    border: "none",
    borderRadius: "12px",
    padding: "0.95rem 1rem",
    background: "transparent",
    color: "var(--text-muted)",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.18s ease",
  },
  tabActive: {
    background: "linear-gradient(135deg, rgba(255, 183, 128, 0.22), rgba(255, 255, 255, 0.08))",
    color: "#fff",
    boxShadow: "0 10px 30px rgba(255, 183, 128, 0.14)",
  },
  form: {
    display: "grid",
    gap: "1rem",
  },
  field: {
    display: "grid",
    gap: "0.45rem",
  },
  label: {
    color: "var(--text-body)",
    fontSize: "0.86rem",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "0.95rem 1rem",
    borderRadius: "16px",
    border: "1px solid var(--toggle-border)",
    background: "var(--toggle-bg)",
    color: "var(--text-primary)",
    outline: "none",
    fontSize: "0.98rem",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  btnSubmit: {
    marginTop: "0.5rem",
    padding: "0.95rem 1rem",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #ffb57f, #ff8f48)",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    boxShadow: "0 18px 40px rgba(255, 149, 92, 0.24)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
  },
  error: {
    padding: "0.85rem 1rem",
    borderRadius: "14px",
    background: "rgba(255, 74, 91, 0.14)",
    color: "#ffccd6",
    border: "1px solid rgba(255, 74, 91, 0.25)",
    fontSize: "0.92rem",
  },
}
}

export default LoginPage