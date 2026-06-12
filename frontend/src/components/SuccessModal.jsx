import React from "react"

function SuccessModal({ isOpen, message }) {
  if (!isOpen) return null

  const styles = getSuccessModalStyles()

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

const getSuccessModalStyles = () => {
  return {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "var(--modal-overlay)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    animation: "fadeIn 0.3s ease-out forwards",
  },
  modal: {
    background: "var(--bg-card)",
    border: "1px solid var(--bg-card-border)",
    borderRadius: "24px",
    padding: "3rem 2rem",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: "var(--modal-shadow)",
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
    stroke: "rgba(255, 181, 127, 0.3)",
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
    color: "var(--text-primary)",
    fontWeight: "bold",
  },
  message: {
    margin: 0,
    color: "var(--text-muted)",
    fontSize: "1.05rem",
    lineHeight: 1.5,
  },
}
}

export default SuccessModal
