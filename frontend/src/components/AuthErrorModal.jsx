import React from "react"

function AuthErrorModal({ isOpen, onClose, title, message, isDark = true }) {
  if (!isOpen) return null

  const s = getStyles(isDark)

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.iconContainer}>
          <svg style={s.exclamation} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle style={s.exclamationCircle} cx="26" cy="26" r="25" fill="none" />
            <path style={s.exclamationLine} fill="none" d="M26 12 v16" />
            <circle style={s.exclamationDot} cx="26" cy="36" r="2" fill={isDark ? "#fca5a5" : "#ef4444"} />
          </svg>
        </div>
        <h2 style={s.title}>{title || "Autentikasi Gagal"}</h2>
        <p style={s.message}>{message || "Terjadi kesalahan saat memproses permintaan Anda."}</p>
        <div style={s.buttonContainer}>
          <button 
            onClick={onClose} 
            style={s.btnConfirm}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = isDark ? "0 10px 25px rgba(239, 68, 68, 0.3)" : "0 10px 25px rgba(239, 68, 68, 0.5)" }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = isDark ? "0 10px 20px rgba(239, 68, 68, 0.2)" : "0 10px 20px rgba(239, 68, 68, 0.4)" }}
          >
            Mengerti
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 16; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes drawCircle {
          from { stroke-dashoffset: 166; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes popDot {
          0% { transform: scale(0); opacity: 0; }
          80% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}

const getStyles = (isDark) => ({
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: isDark ? "rgba(8, 9, 20, 0.8)" : "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    animation: "fadeIn 0.3s ease-out forwards",
  },
  modal: {
    background: isDark 
      ? "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(35, 15, 20, 0.95))"
      : "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 245, 245, 0.98))",
    border: isDark 
      ? "1px solid rgba(239, 68, 68, 0.3)"
      : "1px solid rgba(239, 68, 68, 0.4)",
    borderRadius: "24px",
    padding: "2.5rem 2rem",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: isDark 
      ? "0 24px 80px rgba(0, 0, 0, 0.4)"
      : "0 24px 80px rgba(239, 68, 68, 0.15)",
    animation: "scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, shake 0.4s ease-in-out",
  },
  iconContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1.2rem",
  },
  exclamation: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    display: "block",
    strokeWidth: 4,
    stroke: isDark ? "#fca5a5" : "#ef4444",
    strokeMiterlimit: 10,
    boxShadow: isDark ? "inset 0px 0px 0px #fca5a5" : "inset 0px 0px 0px #ef4444",
  },
  exclamationCircle: {
    strokeDasharray: 166,
    strokeDashoffset: 166,
    strokeWidth: 4,
    strokeMiterlimit: 10,
    stroke: isDark ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.2)",
    fill: "none",
    animation: "drawCircle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards",
  },
  exclamationLine: {
    strokeDasharray: 16,
    strokeDashoffset: 16,
    strokeLinecap: "round",
    animation: "drawLine 0.3s ease-out 0.4s forwards",
  },
  exclamationDot: {
    stroke: "none",
    transformOrigin: "center",
    transformBox: "fill-box",
    animation: "popDot 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.6s forwards",
    opacity: 0,
  },
  title: {
    margin: "0 0 0.5rem",
    fontSize: "1.5rem",
    color: isDark ? "#fff" : "#7f1d1d",
    fontWeight: "bold",
  },
  message: {
    margin: "0 0 1.5rem",
    color: isDark ? "#cbd5e1" : "#991b1b",
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
  },
  btnConfirm: {
    padding: "0.75rem 2.5rem",
    borderRadius: "12px",
    border: "none",
    background: isDark 
      ? "linear-gradient(135deg, #ef4444, #b91c1c)"
      : "linear-gradient(135deg, #f87171, #ef4444)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: isDark 
      ? "0 10px 20px rgba(239, 68, 68, 0.2)"
      : "0 10px 20px rgba(239, 68, 68, 0.4)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
})

export default AuthErrorModal
