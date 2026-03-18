import { useState, useEffect } from "react"
import Spinner from "./Spinner"

function ItemForm({ onSubmit, editingItem, onCancelEdit, showToast }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "0",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Jika editingItem berubah, isi form dengan datanya
  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        description: editingItem.description || "",
        price: String(editingItem.price),
        quantity: String(editingItem.quantity),
      })
    } else {
      setFormData({ name: "", description: "", price: "", quantity: "0" })
    }
  }, [editingItem])

  const handleChange = (e) => {
    const { name, value } = e.target
    let processedValue = value
    if (name === 'price') {
      // Replace comma with dot for decimal
      processedValue = value.replace(',', '.')
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const itemData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      price: parseFloat(formData.price) || 0,
      quantity: parseInt(formData.quantity) || 0,
    }

    try {
      await onSubmit(itemData, editingItem?.id)
      // Reset form setelah berhasil
      setFormData({ name: "", description: "", price: "", quantity: "0" })
    } catch (err) {
      showToast("Error: " + err.message, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        {editingItem ? "✏️ Edit Item" : "➕ Tambah Item Baru"}
      </h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Nama Item *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Laptop"
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Harga (Rp) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Contoh: 15000000"
              min="0"
              step="any"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Deskripsi</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Opsional"
              style={styles.input}
            />
          </div>
          <div style={{ ...styles.field, maxWidth: "150px" }}>
            <label style={styles.label}>Jumlah Stok</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Contoh: 10"
              min="0"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.actions}>
          <button type="submit" style={{ ...styles.btnSubmit, opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size={20} color="white" />
                <span style={{ marginLeft: '0.5rem' }}>
                  {editingItem ? "Menyimpan..." : "Menambah..."}
                </span>
              </>
            ) : (
              editingItem ? "💾 Update Item" : "➕ Tambah Item"
            )}
          </button>
          {editingItem && (
            <button type="button" onClick={onCancelEdit} style={styles.btnCancel} disabled={isSubmitting}>
              ✕ Batal Edit
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: "#f8f9fa",
    padding: "1.5rem",
    borderRadius: "12px",
    border: "2px solid #e0e0e0",
    marginBottom: "1.5rem",
  },
  title: {
    margin: "0 0 1rem 0",
    color: "#1F4E79",
    fontSize: "1.2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  row: {
    display: "flex",
    gap: "1rem",
  },
  field: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "bold",
    color: "#555",
  },
  input: {
    padding: "0.6rem 0.8rem",
    border: "2px solid #ddd",
    borderRadius: "6px",
    fontSize: "0.95rem",
    outline: "none",
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.5rem",
  },
  btnSubmit: {
    padding: "0.7rem 1.5rem",
    backgroundColor: "#548235",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "bold",
  },
  btnCancel: {
    padding: "0.7rem 1.5rem",
    backgroundColor: "#e0e0e0",
    color: "#333",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
  },
  error: {
    backgroundColor: "#FBE5D6",
    color: "#C00000",
    padding: "0.6rem 1rem",
    borderRadius: "6px",
    marginBottom: "0.75rem",
    fontSize: "0.9rem",
  },
}

export default ItemForm