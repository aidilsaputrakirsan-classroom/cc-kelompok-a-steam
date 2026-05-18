import { useState, useEffect, useCallback } from "react"
import Header from "./components/Header"
import LoginPage from "./components/LoginPage"
import Toast from "./components/Toast"
import SuccessModal from "./components/SuccessModal"
import LogoutModal from "./components/LogoutModal"

import ChatHistoryPage from "./components/ChatHistoryPage"
import AboutUs from "./components/AboutUs"
import { useToast } from "./hooks/useToast"
import {
  fetchItems,
  createItem,
  updateItem,
  deleteItem,
  checkHealth,
  login,
  register,
  getMe,
  setToken,
  clearToken,
  getToken,
} from "./services/api"

function App() {
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
  const [activeTab, setActiveTab] = useState("about-us")
  const [items, setItems] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingItems, setDeletingItems] = useState(new Set())

  // ==================== LOAD DATA ====================
  const loadItems = useCallback(async (search = "") => {
    setLoading(true)
    try {
      const data = await fetchItems(search)
      setItems(data.items)
      setTotalItems(data.total)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") {
        handleLogout()
      }
      console.error("Error loading items:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkHealth().then(setIsConnected)
  }, [])

  // Restore session dari localStorage saat app pertama load
  // useEffect(() => {
  //   const token = getToken()
  //   if (token && !isAuthenticated) {
  //     getMe()
  //       .then((userData) => {
  //         setUser(userData)
  //         setIsAuthenticated(true)
  //       })
  //       .catch(() => {
  //         clearToken() // Token expired atau invalid
  //       })
  //   }
  // }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadItems()
    }
  }, [isAuthenticated, loadItems])

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
      showToast("Login gagal: " + err.message, "error")
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
      showToast("Registrasi gagal: " + err.message, "error")
    }
  }

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const performLogout = () => {
    setShowLogoutModal(false)
    clearToken()
    setUser(null)
    setIsAuthenticated(false)
    setItems([])
    setTotalItems(0)
    setEditingItem(null)
    setSearchQuery("")
  }

  // ==================== ITEM HANDLERS ====================
  const handleSubmit = async (itemData, editId) => {
    try {
      if (editId) {
        await updateItem(editId, itemData)
        showToast("Item berhasil diperbarui!", "success")
        setEditingItem(null)
      } else {
        await createItem(itemData)
        showToast("Item berhasil ditambahkan!", "success")
      }
      loadItems(searchQuery)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      else showToast("Gagal menyimpan item: " + err.message, "error")
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    const item = items.find((i) => i.id === id)
    if (!window.confirm(`Yakin ingin menghapus "${item?.name}"?`)) return
    setDeletingItems((prev) => new Set(prev).add(id))
    try {
      await deleteItem(id)
      showToast("Item berhasil dihapus!", "success")
      loadItems(searchQuery)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      else showToast("Gagal menghapus: " + err.message, "error")
    } finally {
      setDeletingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    loadItems(query)
  }

  // ==================== RENDER ====================
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
    <div style={styles.app}>
      <div style={styles.container}>
        <Header
          totalItems={totalItems}
          isConnected={isConnected}
          user={user}
          onLogout={handleLogout}
        />

        <div className="flex gap-3 flex-wrap mb-6">
          <button
            onClick={() => setActiveTab("about-us")}
            className={`px-6 py-3 rounded-full font-bold transition-all duration-300 ${
              activeTab === "about-us"
                ? "bg-gradient-to-r from-inti-orange to-inti-orange-light text-inti-dark shadow-[0_10px_25px_-5px_rgba(255,143,72,0.4)] scale-105"
                : "bg-white/10 border border-white/10 text-inti-text-muted hover:bg-white/20 hover:text-white hover:border-white/30"
            }`}
          >
            ℹ️ About Us
          </button>
          <button
            onClick={() => setActiveTab("chat-history")}
            className={`px-6 py-3 rounded-full font-bold transition-all duration-300 ${
              activeTab === "chat-history"
                ? "bg-gradient-to-r from-inti-orange to-inti-orange-light text-inti-dark shadow-[0_10px_25px_-5px_rgba(255,143,72,0.4)] scale-105"
                : "bg-white/10 border border-white/10 text-inti-text-muted hover:bg-white/20 hover:text-white hover:border-white/30"
            }`}
          >
            💬 Chat History
          </button>
        </div>

        {activeTab === "chat-history" ? (
          <ChatHistoryPage
            showToast={showToast}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />
        ) : (
          <AboutUs />
        )}
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
    background:
      "radial-gradient(circle at top left, rgba(136, 115, 255, 0.16), transparent 24%), radial-gradient(circle at bottom right, rgba(255, 184, 130, 0.18), transparent 24%), #060913",
    padding: "2rem",
    fontFamily: "'SF Pro Display', 'SF Pro', system-ui, sans-serif",
    color: "#edf2ff",
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

export default App