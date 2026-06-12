import { useEffect } from "react"
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react"

/**
 * Toast notification component — theme-aware colors
 * Works in both dark and light mode using semi-transparent backgrounds
 * and CSS variable-based text colors.
 */
function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const isDark = !document.documentElement.classList.contains('light')

  const icons = {
    success: <CheckCircle2 size={20} />,
    error: <XCircle size={20} />,
    info: <Info size={20} />,
    warning: <AlertTriangle size={20} />,
  }

  // Theme-aware color scheme
  const colors = isDark
    ? {
        success: {
          bg: "rgba(16, 185, 129, 0.15)",
          border: "rgba(16, 185, 129, 0.5)",
          text: "#6ee7b7",
          icon: "#34d399",
        },
        error: {
          bg: "rgba(239, 68, 68, 0.15)",
          border: "rgba(239, 68, 68, 0.5)",
          text: "#fca5a5",
          icon: "#f87171",
        },
        info: {
          bg: "rgba(59, 130, 246, 0.15)",
          border: "rgba(59, 130, 246, 0.5)",
          text: "#93c5fd",
          icon: "#60a5fa",
        },
        warning: {
          bg: "rgba(245, 158, 11, 0.15)",
          border: "rgba(245, 158, 11, 0.5)",
          text: "#fcd34d",
          icon: "#fbbf24",
        },
      }
    : {
        success: {
          bg: "#E2EFDA",
          border: "#548235",
          text: "#2D5016",
          icon: "#548235",
        },
        error: {
          bg: "#FBE5D6",
          border: "#C00000",
          text: "#7F0000",
          icon: "#C00000",
        },
        info: {
          bg: "#DEEBF7",
          border: "#2E75B6",
          text: "#1F4E79",
          icon: "#2E75B6",
        },
        warning: {
          bg: "#FFF2CC",
          border: "#BF8F00",
          text: "#7F6000",
          icon: "#BF8F00",
        },
      }

  const palette = colors[type] ?? colors.info

  const style = {
    position: "fixed",
    top: "20px",
    right: "20px",
    minWidth: "300px",
    maxWidth: "500px",
    backgroundColor: palette.bg,
    border: `2px solid ${palette.border}`,
    borderRadius: "10px",
    padding: "1rem 1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    boxShadow: isDark
      ? "0 4px 20px rgba(0,0,0,0.5)"
      : "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 9999,
    animation: "toastSlideIn 0.3s ease-out",
    backdropFilter: isDark ? "blur(8px)" : undefined,
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
      <div
        style={style}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span style={{ flexShrink: 0, color: palette.icon, display: "flex", alignItems: "center" }}>
          {icons[type]}
        </span>
        <span style={{ flex: 1, color: palette.text, fontSize: "0.95rem", fontWeight: "500" }}>
          {message}
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: palette.text,
            opacity: 0.7,
            padding: "0",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </>
  )
}

export default Toast
