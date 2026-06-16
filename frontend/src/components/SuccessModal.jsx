import React from "react"

function SuccessModal({ isOpen, message, isDark = true }) {
  if (!isOpen) return null

  const styles = getStyles(isDark)

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.iconContainer}>
          <svg style={styles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle style={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
            <path style={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
        <h2 style={styles.title}>Berhasil!</h2>
        <p style={styles.message}>{message}</p>
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
        @keyframes stroke {
          100% { stroke-dashoffset: 0; }
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
      ? "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(25, 39, 76, 0.95))"
      : "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(252, 248, 243, 0.98))",
    border: isDark 
      ? "1px solid rgba(255, 164, 82, 0.2)"
      : "1px solid rgba(255, 143, 72, 0.3)",
    borderRadius: "24px",
    padding: "3rem 2rem",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: isDark 
      ? "0 24px 80px rgba(0, 0, 0, 0.4)"
      : "0 24px 80px rgba(255, 143, 72, 0.15)",
    animation: "scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
  },
  iconContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1.5rem",
  },
  checkmark: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    display: "block",
    strokeWidth: 4,
    stroke: "#ffb57f",
    strokeMiterlimit: 10,
    boxShadow: "inset 0px 0px 0px #ffb57f",
  },
  checkmarkCircle: {
    strokeDasharray: 166,
    strokeDashoffset: 166,
    strokeWidth: 4,
    strokeMiterlimit: 10,
    stroke: isDark ? "rgba(255, 181, 127, 0.3)" : "rgba(255, 143, 72, 0.3)",
    fill: "none",
    animation: "stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards",
  },
  checkmarkCheck: {
    transformOrigin: "50% 50%",
    strokeDasharray: 48,
    strokeDashoffset: 48,
    animation: "stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards",
  },
  title: {
    margin: "0 0 0.5rem",
    fontSize: "1.8rem",
    color: isDark ? "#fff" : "#1a1410",
    fontWeight: "bold",
  },
  message: {
    margin: 0,
    color: isDark ? "#a1a6b3" : "#8b7355",
    fontSize: "1.05rem",
    lineHeight: 1.5,
  },
})

export default SuccessModal
