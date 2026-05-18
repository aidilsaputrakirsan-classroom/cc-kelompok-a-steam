import React from "react"

function LogoutModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.iconContainer}>
          <svg style={styles.exclamation} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle style={styles.exclamationCircle} cx="26" cy="26" r="25" fill="none" />
            <path style={styles.exclamationLine} fill="none" d="M26 12 v16" />
            <circle style={styles.exclamationDot} cx="26" cy="36" r="2" fill="#ffb57f" />
          </svg>
        </div>
        <h2 style={styles.title}>Konfirmasi Logout</h2>
        <p style={styles.message}>Apakah Anda yakin ingin keluar dari sesi ini?</p>
        <div style={styles.buttonContainer}>
          <button onClick={onCancel} style={styles.btnCancel}>Batal</button>
          <button onClick={onConfirm} style={styles.btnConfirm}>Ya, Keluar</button>
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
      `}</style>
    </div>
  )
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(8, 9, 20, 0.8)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    animation: "fadeIn 0.3s ease-out forwards",
  },
  modal: {
    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(25, 39, 76, 0.95))",
    border: "1px solid rgba(255, 164, 82, 0.2)",
    borderRadius: "24px",
    padding: "2.5rem 2rem",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.4)",
    animation: "scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
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
    stroke: "#ffb57f",
    strokeMiterlimit: 10,
    boxShadow: "inset 0px 0px 0px #ffb57f",
  },
  exclamationCircle: {
    strokeDasharray: 166,
    strokeDashoffset: 166,
    strokeWidth: 4,
    strokeMiterlimit: 10,
    stroke: "rgba(255, 181, 127, 0.3)",
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
    color: "#fff",
    fontWeight: "bold",
  },
  message: {
    margin: "0 0 1.5rem",
    color: "#a1a6b3",
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
  },
  btnCancel: {
    padding: "0.75rem 1.5rem",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  btnConfirm: {
    padding: "0.75rem 1.5rem",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #ffb57f, #ff8f8f)",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 10px 20px rgba(255, 149, 92, 0.2)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
}

export default LogoutModal
