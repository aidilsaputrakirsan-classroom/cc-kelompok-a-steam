import { useState, useEffect, useCallback } from "react"
import { useLocation, BrowserRouter, Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import LoginPage from "./components/LoginPage"
import Toast from "./components/Toast"
import SuccessModal from "./components/SuccessModal"
import LogoutModal from "./components/LogoutModal"
import ErrorBoundaryWrapper from "./components/ErrorBoundary"
import { DegradedModeBanner } from "./components/DegradedModeBanner"

import ChatHistoryPage from "./components/ChatHistoryPage"
import AboutUs from "./components/AboutUs"
import StatusPage from "./pages/StatusPage"
import { useToast } from "./hooks/useToast"
import { Info, MessageSquare } from "lucide-react"
import {
  checkHealth,
  login,
  register,
  getMe,
  clearToken,
  getToken,
} from "./services/api"

/**
 * Main App Content (setelah login)
 * Module 12-14: Microservices frontend integration
 */
function AppContent() {
  // ==================== AUTH STATE ====================
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ==================== TOAST ====================
  const { toast, showToast, hideToast } = useToast()

  // ==================== MODAL ====================
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMessage, setAuthModalMessage] = useState("")
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // ==================== APP STATE ====================
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("inti_active_tab") || "about-us")
  
  // Location hook untuk routing
  const location = useLocation()
  
  useEffect(() => {
    localStorage.setItem("inti_active_tab", activeTab)
  }, [activeTab])

  // ==================== DARK MODE ====================
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("inti_dark_mode")
    return saved !== null ? saved === "true" : true
  })

  useEffect(() => {
    const isStatusPage = location.pathname === "/status"
    if (!isAuthenticated && !isStatusPage) {
      document.documentElement.classList.remove("light")
    } else {
      if (isDark) {
        document.documentElement.classList.remove("light")
      } else {
        document.documentElement.classList.add("light")
      }
    }
    localStorage.setItem("inti_dark_mode", String(isDark))
  }, [isDark, isAuthenticated, location.pathname])

  const toggleDark = useCallback(() => setIsDark((prev) => !prev), [])

  // ==================== AUTH HANDLERS ====================
  const handleLogout = useCallback(() => {
    setShowLogoutModal(true)
  }, [])

  useEffect(() => {
    checkHealth().catch(() => {})
  }, [])

  // Restore session dari localStorage saat app pertama load
  useEffect(() => {
    const token = getToken()
    if (token && !isAuthenticated) {
      getMe()
        .then((userData) => {
          setUser(userData)
          setIsAuthenticated(true)
        })
        .catch((err) => {
          if (err.type === "SERVICE_UNAVAILABLE") {
            showToast("Auth service temporarily unavailable. Some features may be limited.", "warning")
          } else {
            clearToken()
          }
        })
    }
  }, [isAuthenticated, showToast])

  // ==================== AUTH HANDLERS ====================
  const handleLogin = async (email, password) => {
    try {
      await login(email, password)
      const userData = await getMe()
      setUser(userData)
      setAuthModalMessage("Login berhasil! Selamat datang di Inti Studio! ✨")
      setShowAuthModal(true)
      
      setTimeout(() => {
        setShowAuthModal(false)
        setIsAuthenticated(true)
        setActiveTab("about-us")
      }, 2000)
    } catch (err) {
      // Handle service unavailable error
      if (err.type === "SERVICE_UNAVAILABLE") {
        showToast("Auth service is temporarily unavailable. Please try again later.", "error")
      } else {
        showToast("Login gagal: " + err.message, "error")
      }
    }
  }

  const handleRegister = async (userData) => {
    try {
      await register(userData)
      await login(userData.email, userData.password)
      const newUserData = await getMe()
      setUser(newUserData)
      setAuthModalMessage("Registrasi berhasil! Selamat datang!")
      setShowAuthModal(true)
      
      setTimeout(() => {
        setShowAuthModal(false)
        setIsAuthenticated(true)
        setActiveTab("about-us")
      }, 2000)
    } catch (err) {
      if (err.type === "SERVICE_UNAVAILABLE") {
        showToast("Auth service is temporarily unavailable. Please try again later.", "error")
      } else {
        showToast("Registrasi gagal: " + err.message, "error")
      }
    }
  }

  const performLogout = () => {
    setShowLogoutModal(false)
    clearToken()
    setUser(null)
    setIsAuthenticated(false)
  }

  // ==================== RENDER ====================
  
  // Check if we're on status page
  if (location.pathname === "/status") {
    return (
      <ErrorBoundaryWrapper>
        <StatusPage isDark={isDark} />
      </ErrorBoundaryWrapper>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLogin={handleLogin} onRegister={handleRegister} showToast={showToast} />
        <SuccessModal isOpen={showAuthModal} message={authModalMessage} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </>
    )
  }

  return (
    <div style={{ ...styles.app, background: "var(--bg-app-gradient)" }}>
      {/* Degraded Mode Banner */}
      <DegradedModeBanner />
      
      <div style={styles.container}>
        <Header
          user={user}
          onLogout={handleLogout}
          isDark={isDark}
          onToggleDark={toggleDark}
        />

        <div className="flex gap-3 flex-wrap mb-6">
          <button
            onClick={() => setActiveTab("about-us")}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === "about-us"
                ? isDark
                  ? "bg-linear-to-r from-inti-orange to-inti-orange-light text-inti-dark shadow-[0_10px_25px_-5px_rgba(255,143,72,0.4)] scale-105"
                  : "bg-linear-to-r from-inti-orange to-inti-orange-light text-white shadow-[0_10px_25px_-5px_rgba(255,143,72,0.5)] scale-105"
                : isDark
                  ? "bg-white/10 border border-white/15 text-inti-text-muted hover:bg-white/20 hover:text-inti-text-light hover:border-white/30"
                  : "bg-orange-50 border border-orange-200 text-slate-700 hover:bg-orange-100 hover:text-orange-800 hover:border-orange-300"
            }`}
          >
            <Info size={16} />
            About Us
          </button>
          <button
            onClick={() => setActiveTab("chat-history")}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === "chat-history"
                ? isDark
                  ? "bg-linear-to-r from-inti-orange to-inti-orange-light text-inti-dark shadow-[0_10px_25px_-5px_rgba(255,143,72,0.4)] scale-105"
                  : "bg-linear-to-r from-inti-orange to-inti-orange-light text-white shadow-[0_10px_25px_-5px_rgba(255,143,72,0.5)] scale-105"
                : isDark
                  ? "bg-white/10 border border-white/15 text-inti-text-muted hover:bg-white/20 hover:text-inti-text-light hover:border-white/30"
                  : "bg-orange-50 border border-orange-200 text-slate-700 hover:bg-orange-100 hover:text-orange-800 hover:border-orange-300"
            }`}
          >
            <MessageSquare size={16} />
            Chat History
          </button>
        </div>

        <ErrorBoundaryWrapper>
          {activeTab === "chat-history" ? (
            <ChatHistoryPage showToast={showToast} isDark={isDark} />
          ) : (
            <AboutUs isDark={isDark} />
          )}
        </ErrorBoundaryWrapper>
      </div>
      <LogoutModal 
        isOpen={showLogoutModal} 
        onConfirm={performLogout} 
        onCancel={() => setShowLogoutModal(false)} 
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "var(--bg-app-gradient)",
    padding: "2rem",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'San Francisco', 'Segoe UI', 'Helvetica Neue', sans-serif",
    color: "var(--text-primary)",
  },
  container: {
    width: "100%",
    maxWidth: "1600px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
}

/**
 * Wrapper dengan React Router
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/status" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App