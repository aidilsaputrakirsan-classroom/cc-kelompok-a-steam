import { useState } from "react"
import Spinner from "./Spinner"
import { generateImage } from "../services/api"

function ImageGeneratorPage({ showToast }) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { image_base64, prompt, model }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) {
      showToast("Prompt tidak boleh kosong!", "error")
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const data = await generateImage(prompt.trim())
      setResult(data)
      showToast("Gambar berhasil di-generate! 🎨", "success")
    } catch (err) {
      showToast("Gagal generate gambar: " + err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${result.image_base64}`
    link.download = `inti-rupa-${Date.now()}.png`
    link.click()
  }

  const handleReset = () => {
    setResult(null)
    setPrompt("")
  }

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.heroSection}>
        <div style={styles.heroIcon}>🎨</div>
        <h2 style={styles.heroTitle}>AI Image Generator</h2>
        <p style={styles.heroSubtitle}>
          Deskripsikan gambar impian Anda, dan biarkan AI mewujudkannya dalam hitungan detik.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} style={styles.form}>
        <div style={styles.inputWrapper}>
          <label style={styles.label}>✏️ Prompt / Deskripsi Gambar</label>
          <textarea
            id="image-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Contoh: a futuristic Indonesian city at sunset, digital art, highly detailed..."
            style={styles.textarea}
            rows={3}
            disabled={loading}
          />
          <p style={styles.hint}>
            💡 Tips: Gunakan bahasa Inggris untuk hasil terbaik. Tambahkan kata kunci seperti
            <em> "digital art", "ultra realistic", "cinematic lighting"</em>.
          </p>
        </div>

        <div style={styles.btnRow}>
          <button
            type="submit"
            style={{ ...styles.btnGenerate, ...(loading ? styles.btnDisabled : {}) }}
            disabled={loading}
            id="btn-generate"
          >
            {loading ? (
              <>
                <Spinner size={18} color="white" />
                <span style={{ marginLeft: "0.5rem" }}>Generating... (10-30 detik)</span>
              </>
            ) : (
              "✨ Generate Gambar"
            )}
          </button>
          {result && (
            <button
              type="button"
              onClick={handleReset}
              style={styles.btnReset}
            >
              🔄 Reset
            </button>
          )}
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <div style={styles.loadingCard}>
          <Spinner size={40} color="#2E75B6" />
          <p style={styles.loadingText}>AI sedang menggambar...</p>
          <p style={styles.loadingSubtext}>Model Stable Diffusion XL membutuhkan ~10-30 detik</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div style={styles.resultCard}>
          <div style={styles.resultHeader}>
            <h3 style={styles.resultTitle}>🖼️ Hasil Generate</h3>
            <button onClick={handleDownload} style={styles.btnDownload} id="btn-download">
              ⬇️ Download
            </button>
          </div>
          <img
            src={`data:image/png;base64,${result.image_base64}`}
            alt={result.prompt}
            style={styles.resultImage}
          />
          <div style={styles.resultMeta}>
            <p style={styles.resultPrompt}>
              <strong>Prompt:</strong> {result.prompt}
            </p>
            <p style={styles.resultModel}>
              <strong>Model:</strong> {result.model}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  heroSection: {
    textAlign: "center",
    padding: "2rem",
    background: "linear-gradient(135deg, #1F4E79 0%, #2E75B6 50%, #548235 100%)",
    borderRadius: "16px",
    color: "white",
    boxShadow: "0 8px 32px rgba(31,78,121,0.25)",
  },
  heroIcon: {
    fontSize: "3rem",
    marginBottom: "0.5rem",
  },
  heroTitle: {
    margin: "0 0 0.5rem 0",
    fontSize: "1.8rem",
    fontWeight: "bold",
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
  },
  heroSubtitle: {
    margin: 0,
    fontSize: "1rem",
    opacity: 0.9,
  },
  form: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontWeight: "bold",
    fontSize: "0.9rem",
    color: "#555",
  },
  textarea: {
    padding: "0.9rem 1rem",
    border: "2px solid #ddd",
    borderRadius: "10px",
    fontSize: "1rem",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    resize: "vertical",
    outline: "none",
    transition: "border-color 0.2s",
  },
  hint: {
    margin: "0.2rem 0 0 0",
    fontSize: "0.8rem",
    color: "#888",
  },
  btnRow: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
  },
  btnGenerate: {
    flex: 1,
    padding: "0.9rem 1.5rem",
    background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    transition: "opacity 0.2s",
  },
  btnDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  btnReset: {
    padding: "0.9rem 1.2rem",
    backgroundColor: "#f0f2f5",
    color: "#555",
    border: "2px solid #ddd",
    borderRadius: "10px",
    fontSize: "0.95rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
  loadingCard: {
    backgroundColor: "white",
    padding: "3rem 2rem",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
  },
  loadingText: {
    margin: 0,
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: "#1F4E79",
  },
  loadingSubtext: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#888",
  },
  resultCard: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultTitle: {
    margin: 0,
    color: "#1F4E79",
    fontSize: "1.2rem",
  },
  btnDownload: {
    padding: "0.5rem 1rem",
    background: "linear-gradient(135deg, #548235, #70AD47)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.9rem",
  },
  resultImage: {
    width: "100%",
    borderRadius: "12px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
    objectFit: "contain",
  },
  resultMeta: {
    backgroundColor: "#f8f9fa",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    borderLeft: "4px solid #2E75B6",
  },
  resultPrompt: {
    margin: "0 0 0.3rem 0",
    fontSize: "0.9rem",
    color: "#444",
  },
  resultModel: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#888",
  },
}

export default ImageGeneratorPage
