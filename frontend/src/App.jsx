import { useState, useEffect, useCallback, useMemo } from "react"
import Header from "./components/Header"
import SearchBar from "./components/SearchBar"
import ItemForm from "./components/ItemForm"
import ItemList from "./components/ItemList"
import Sorting from "./components/Sorting"
import Toast from "./components/Toast"
import { fetchItems, createItem, updateItem, deleteItem, checkHealth } from "./services/api"
import { useToast } from "./hooks/useToast"

function App() {
  // ==================== STATE ====================
  const [items, setItems] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("")
  
  // Toast notification hook
  const { toast, showToast, hideToast } = useToast()

  // ==================== LOAD DATA ====================
  const loadItems = useCallback(async (search = "") => {
    setLoading(true)
    try {
      const data = await fetchItems(search)
      setItems(data.items)
      setTotalItems(data.total)
    } catch (err) {
      console.error("Error loading items:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // ==================== ON MOUNT ====================
  useEffect(() => {
    // Cek koneksi API
    checkHealth().then(setIsConnected)
    // Load items
    loadItems()
  }, [loadItems])

  // ==================== HANDLERS ====================

  const handleSubmit = async (itemData, editId) => {
    try {
      if (editId) {
        // Mode edit
        await updateItem(editId, itemData)
        setEditingItem(null)
        showToast("✅ Item berhasil diupdate!", "success")
      } else {
        // Mode create
        await createItem(itemData)
        showToast("✅ Item berhasil ditambahkan!", "success")
      }
      // Reload daftar items
      loadItems(searchQuery)
    } catch (err) {
      showToast(`❌ Gagal menyimpan item: ${err.message}`, "error")
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    // Scroll ke atas ke form
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    const item = items.find((i) => i.id === id)
    if (!window.confirm(`Yakin ingin menghapus "${item?.name}"?`)) return

    try {
      await deleteItem(id)
      showToast(`🗑️ "${item?.name}" berhasil dihapus!`, "success")
      loadItems(searchQuery)
    } catch (err) {
      showToast(`❌ Gagal menghapus: ${err.message}`, "error")
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    loadItems(query)
  }

  const handleSortChange = (value) => {
    setSortBy(value)
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  const sortedItems = useMemo(() => {
    if (!sortBy) return items

    const sorted = [...items]
    sorted.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === "price") {
        return (a.price ?? 0) - (b.price ?? 0)
      }
      if (sortBy === "created_at") {
        return new Date(b.created_at) - new Date(a.created_at)
      }
      return 0
    })
    return sorted
  }, [items, sortBy])

  // ==================== RENDER ====================
  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <Header totalItems={totalItems} isConnected={isConnected} />
        <ItemForm
          onSubmit={handleSubmit}
          editingItem={editingItem}
          onCancelEdit={handleCancelEdit}
        />
        <SearchBar onSearch={handleSearch} />
        <Sorting sortBy={sortBy} onSortChange={handleSortChange} />
        <ItemList
          items={sortedItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  )
}

const styles = {
  app: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    padding: "2rem",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },
}

export default App