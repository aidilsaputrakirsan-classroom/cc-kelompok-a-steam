# 🔔 Toast Notification Component

## Deskripsi
Komponen Toast Notification yang menampilkan pesan feedback kepada user setelah melakukan operasi CRUD (Create, Read, Update, Delete). Toast akan muncul di pojok kanan atas dan hilang otomatis setelah 3 detik.

## Fitur
- ✅ **Auto-hide**: Hilang otomatis setelah 3 detik
- 🎨 **Multiple Types**: Success, Error, Info, Warning
- 🖱️ **Manual Close**: User bisa klik tombol ✕ untuk menutup
- 🎭 **Smooth Animation**: Slide-in animation dari kanan
- 🎯 **Responsive**: Posisi fixed di pojok kanan atas

## Struktur File

```
frontend/src/
├── components/
│   └── Toast.jsx           # Komponen Toast UI
├── hooks/
│   └── useToast.js         # Custom hook untuk state management
└── App.jsx                 # Integrasi di root component
```

## Cara Kerja

### 1. Toast Component (`Toast.jsx`)
Komponen visual yang menampilkan pesan notification.

**Props:**
- `message` (string): Pesan yang akan ditampilkan
- `type` (string): Tipe toast - "success" | "error" | "info" | "warning"
- `onClose` (function): Callback saat toast ditutup
- `duration` (number): Durasi tampil dalam ms (default: 3000)

### 2. useToast Hook (`useToast.js`)
Custom hook untuk mengelola state toast.

**Returns:**
- `toast` (object | null): State toast saat ini
- `showToast(message, type)`: Fungsi untuk menampilkan toast
- `hideToast()`: Fungsi untuk menyembunyikan toast

### 3. Integrasi di App.jsx

```jsx
import Toast from "./components/Toast"
import { useToast } from "./hooks/useToast"

function App() {
  const { toast, showToast, hideToast } = useToast()

  // Contoh penggunaan
  const handleCreate = async () => {
    try {
      await createItem(data)
      showToast("✅ Item berhasil ditambahkan!", "success")
    } catch (err) {
      showToast(`❌ Gagal: ${err.message}`, "error")
    }
  }

  return (
    <div>
      {/* Your components */}
      
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
```

## Tipe Toast & Styling

| Type | Icon | Background | Border | Use Case |
|------|------|------------|--------|----------|
| `success` | ✅ | Hijau muda (#E2EFDA) | Hijau (#548235) | Create/Update/Delete berhasil |
| `error` | ❌ | Merah muda (#FBE5D6) | Merah (#C00000) | Operasi gagal, error |
| `info` | ℹ️ | Biru muda (#DEEBF7) | Biru (#2E75B6) | Informasi umum |
| `warning` | ⚠️ | Kuning (#FFF2CC) | Kuning gelap (#BF8F00) | Peringatan |

## Implementasi di Operasi CRUD

### ✅ Create Item
```jsx
const handleSubmit = async (itemData, editId) => {
  try {
    if (!editId) {
      await createItem(itemData)
      showToast("✅ Item berhasil ditambahkan!", "success")
    }
  } catch (err) {
    showToast(`❌ Gagal menyimpan item: ${err.message}`, "error")
  }
}
```

### ✏️ Update Item
```jsx
const handleSubmit = async (itemData, editId) => {
  try {
    if (editId) {
      await updateItem(editId, itemData)
      showToast("✅ Item berhasil diupdate!", "success")
    }
  } catch (err) {
    showToast(`❌ Gagal menyimpan item: ${err.message}`, "error")
  }
}
```

### 🗑️ Delete Item
```jsx
const handleDelete = async (id) => {
  const item = items.find((i) => i.id === id)
  if (!window.confirm(`Yakin ingin menghapus "${item?.name}"?`)) return

  try {
    await deleteItem(id)
    showToast(`🗑️ "${item?.name}" berhasil dihapus!`, "success")
  } catch (err) {
    showToast(`❌ Gagal menghapus: ${err.message}`, "error")
  }
}
```

## Testing

### Manual Testing Checklist

- [ ] **Create Item**: Toast sukses muncul setelah tambah item baru
- [ ] **Update Item**: Toast sukses muncul setelah edit item
- [ ] **Delete Item**: Toast sukses muncul setelah hapus item
- [ ] **Auto-hide**: Toast hilang otomatis setelah 3 detik
- [ ] **Manual Close**: Klik tombol ✕ untuk menutup toast sebelum auto-hide
- [ ] **Error Handling**: Toast error muncul saat operasi gagal (misal: server down)
- [ ] **Animation**: Toast slide-in dari kanan dengan smooth
- [ ] **Multiple Operations**: Bisa melakukan operasi berturut-turut, toast berganti

### Test Scenario

1. **Tambah Item Baru**
   - Isi form → Klik "Tambah Item"
   - ✅ Toast hijau: "Item berhasil ditambahkan!"
   - Toast hilang setelah 3 detik

2. **Edit Item**
   - Klik "Edit" pada item → Ubah data → Klik "Update Item"
   - ✅ Toast hijau: "Item berhasil diupdate!"
   - Toast hilang setelah 3 detik

3. **Hapus Item**
   - Klik "Hapus" → Confirm → Item terhapus
   - ✅ Toast hijau: "Item berhasil dihapus!"
   - Toast hilang setelah 3 detik

4. **Error Handling**
   - Matikan backend → Coba tambah item
   - ❌ Toast merah: "Gagal menyimpan item: ..."
   - Toast hilang setelah 3 detik

5. **Manual Close**
   - Tambah item → Toast muncul
   - Klik tombol ✕ pada toast
   - Toast langsung hilang (tidak perlu tunggu 3 detik)

## Kustomisasi

### Ubah Durasi Auto-hide

Di `App.jsx`, tambahkan prop `duration`:
```jsx
{toast && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={hideToast}
    duration={5000}  // 5 detik
  />
)}
```

### Tambah Tipe Baru

Di `Toast.jsx`, tambahkan di object `icons` dan `colors`:
```jsx
const icons = {
  // ... existing
  custom: "🎉",
}

const colors = {
  // ... existing
  custom: {
    bg: "#F3E5F5",
    border: "#9C27B0",
    text: "#6A1B9A",
  },
}
```

### Ubah Posisi

Di `Toast.jsx`, ubah style position:
```jsx
const style = {
  position: "fixed",
  top: "20px",      // Ubah ke bottom: "20px" untuk pojok kanan bawah
  right: "20px",    // Ubah ke left: "20px" untuk pojok kiri
  // ...
}
```

## Troubleshooting

### Toast Tidak Muncul
- ✅ Pastikan `{toast && <Toast ... />}` ada di render App.jsx
- ✅ Cek console error untuk syntax error
- ✅ Pastikan `showToast()` dipanggil dengan benar

### Toast Tidak Auto-hide
- ✅ Cek nilai `duration` (default: 3000ms)
- ✅ Pastikan `useEffect` di Toast.jsx berjalan

### Animation Tidak Smooth
- ✅ Pastikan `<style>` tag dengan `@keyframes` ada di Toast.jsx
- ✅ Cek browser compatibility untuk CSS animations

## Best Practices

1. **Pesan Jelas & Singkat**
   ```jsx
   // ✅ Good
   showToast("Item berhasil ditambahkan!", "success")
   
   // ❌ Bad - terlalu panjang
   showToast("Item dengan nama X dan harga Y berhasil ditambahkan ke database", "success")
   ```

2. **Gunakan Emoji untuk Visual Cue**
   ```jsx
   showToast("✅ Berhasil!", "success")
   showToast("❌ Gagal!", "error")
   showToast("🗑️ Terhapus!", "success")
   ```

3. **Error Message Informatif**
   ```jsx
   // ✅ Good - include error detail
   showToast(`❌ Gagal: ${err.message}`, "error")
   
   // ❌ Bad - terlalu generic
   showToast("Error!", "error")
   ```

4. **Hindari Toast Spam**
   - Jangan tampilkan toast untuk setiap keystroke
   - Toast untuk operasi penting saja (CRUD)

## Tech Stack

- **React Hooks**: useState, useEffect, useCallback
- **CSS-in-JS**: Inline styles untuk portability
- **CSS Animations**: @keyframes untuk slide-in effect
- **Functional Components**: Modern React pattern

## Credits

Dibuat untuk: **Tugas Terstruktur Modul 3 - Lead CI/CD**  
Mata Kuliah: Komputasi Awan  
Institut Teknologi Kalimantan

---

📝 **Note**: Komponen ini memenuhi requirement modul:
> "Tambah komponen Notification/Toast: Tampilkan pesan sukses/gagal setelah create/update/delete (hilang otomatis setelah 3 detik)"

✅ All requirements implemented!
