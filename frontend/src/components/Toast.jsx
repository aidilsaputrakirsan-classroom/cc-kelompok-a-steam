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
    success: "",
    error: "",
    info: "",
    warning: "",
  }

  const isDark = document.documentElement.classList.contains('light') === false;

  const colors = {
    success: {
      bg: isDark ? "rgba(45, 80, 22, 0.85)" : "#E2EFDA",
      border: isDark ? "rgba(84, 130, 53, 0.5)" : "#548235",
      text: isDark ? "#E2EFDA" : "#2D5016",
    },
    error: {
      bg: isDark ? "rgba(127, 0, 0, 0.85)" : "#FBE5D6",
      border: isDark ? "rgba(192, 0, 0, 0.5)" : "#C00000",
      text: isDark ? "#FBE5D6" : "#7F0000",
    },
    info: {
      bg: isDark ? "rgba(31, 78, 121, 0.85)" : "#DEEBF7",
      border: isDark ? "rgba(46, 117, 182, 0.5)" : "#2E75B6",
      text: isDark ? "#DEEBF7" : "#1F4E79",
    },
    warning: {
      bg: isDark ? "rgba(127, 96, 0, 0.85)" : "#FFF2CC",
      border: isDark ? "rgba(191, 143, 0, 0.5)" : "#BF8F00",
      text: isDark ? "#FFF2CC" : "#7F6000",
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
    boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.15)",
    backdropFilter: isDark ? "blur(8px)" : "none",
    WebkitBackdropFilter: isDark ? "blur(8px)" : "none",
    zIndex: 9999,
    animation: "toastSlideIn 0.3s ease-out",
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
          @keyframes toastSlideIn {
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
      <div style={style} role="status" aria-live="polite" aria-atomic="true">
        <span style={iconStyle}>{icons[type]}</span>
        <span style={messageStyle}>{message}</span>
        <button
          onClick={onClose}
          style={closeButtonStyle}
          onMouseEnter={(e) => (e.target.style.opacity = "1")}
          onMouseLeave={(e) => (e.target.style.opacity = "0.7")}
        >
          X
        </button>
      </div>
    </>
  )
}

export default Toast
