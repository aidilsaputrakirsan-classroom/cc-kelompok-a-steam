import { useEffect } from "react"

function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  }

  const colors = {
    success: {
      bg: "#E2EFDA",
      border: "#548235",
      text: "#2D5016",
    },
    error: {
      bg: "#FBE5D6",
      border: "#C00000",
      text: "#7F0000",
    },
    info: {
      bg: "#DEEBF7",
      border: "#2E75B6",
      text: "#1F4E79",
    },
    warning: {
      bg: "#FFF2CC",
      border: "#BF8F00",
      text: "#7F6000",
    },
  }

  const style = {
    position: "fixed",
    top: "20px",
    right: "20px",
    minWidth: "300px",
    maxWidth: "500px",
    backgroundColor: colors[type].bg,
    border: `2px solid ${colors[type].border}`,
    borderRadius: "10px",
    padding: "1rem 1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 9999,
    animation: "slideIn 0.3s ease-out",
  }

  const iconStyle = {
    fontSize: "1.5rem",
    flexShrink: 0,
  }

  const messageStyle = {
    flex: 1,
    color: colors[type].text,
    fontSize: "0.95rem",
    fontWeight: "500",
  }

  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
    color: colors[type].text,
    opacity: 0.7,
    padding: "0",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
  }

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={style}>
        <span style={iconStyle}>{icons[type]}</span>
        <span style={messageStyle}>{message}</span>
        <button
          onClick={onClose}
          style={closeButtonStyle}
          onMouseEnter={(e) => (e.target.style.opacity = "1")}
          onMouseLeave={(e) => (e.target.style.opacity = "0.7")}
        >
          ✕
        </button>
      </div>
    </>
  )
}

export default Toast
