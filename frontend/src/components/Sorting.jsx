function Sorting({ sortBy, onSortChange }) {
  const handleSortChange = (e) => {
    onSortChange(e.target.value)
  }

  return (
    <div style={styles.container}>
      <label htmlFor="sort-select" style={styles.label}>
        Urutkan berdasarkan:
      </label>
      <select
        id="sort-select"
        value={sortBy}
        onChange={handleSortChange}
        style={styles.select}
      >
        <option value="">-- Pilih opsi --</option>
        <option value="name">Nama (A-Z)</option>
        <option value="price">Harga (Terendah-Tertinggi)</option>
        <option value="created_at">Terbaru</option>
      </select>
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
    padding: "0.75rem",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
  },
  label: {
    fontWeight: "500",
    color: "#333",
    fontSize: "0.95rem",
    whiteSpace: "nowrap",
  },
  select: {
    flex: 1,
    padding: "0.5rem 0.75rem",
    fontSize: "0.9rem",
    border: "2px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "white",
    cursor: "pointer",
    outline: "none",
    transition: "border-color 0.2s",
  },
}

export default Sorting