import { useState, useEffect, useCallback } from "react"
import Header from "./components/Header"
import LoginPage from "./components/LoginPage"
import Toast from "./components/Toast"
import ImageGeneratorPage from "./components/ImageGeneratorPage"
import AiSummarizePage from "./components/AiSummarizePage"
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

  // ==================== APP STATE ====================
  const [activeTab, setActiveTab] = useState("ai-generator") // "ai-generator" | "ai-summarize"
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
  useEffect(() => {
    const token = getToken()
    if (token && !isAuthenticated) {
      getMe()
        .then((userData) => {
          setUser(userData)
          setIsAuthenticated(true)
        })
        .catch(() => {
          clearToken() // Token expired atau invalid
        })
    }
  }, [])

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
      setIsAuthenticated(true)
      setActiveTab("ai-generator")
      showToast("Login berhasil! Selamat datang kembali!", "success")
    } catch (err) {
      showToast("Login gagal: " + err.message, "error")
    }
  }

  const handleRegister = async (userData) => {
    await register(userData)
    await handleLogin(userData.email, userData.password)
    showToast("Registrasi berhasil! Selamat datang!", "success")
  }

  const handleLogout = () => {
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

        {activeTab === "ai-generator" && (
          <ImageGeneratorPage
            showToast={showToast}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />
        )}
        {activeTab === "ai-summarize" && (
          <AiSummarizePage
            showToast={showToast}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />
        )}
      </div>
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
  tabNav: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    marginBottom: "1.5rem",
  },
  tabBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "999px",
    padding: "0.8rem 1.2rem",
    color: "#e8edf8",
    cursor: "pointer",
  },
  tabBtnActive: {
    backgroundColor: "#ffb57f",
    color: "#0f172a",
    borderColor: "#ffb57f",
  },
}

export default App