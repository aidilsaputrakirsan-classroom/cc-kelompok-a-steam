import { useState } from "react"
import Spinner from "./Spinner"
import { generateImage } from "../services/api"

const MODELS = [
  { id: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell ⚡", desc: "Terbaik & cepat (Aman)" },
  { id: "stabilityai/stable-diffusion-3.5-large", label: "Stable Diffusion 3.5", desc: "Kualitas tinggi" },
]

const SIZE_OPTIONS = [512, 768, 1024]

function ImageGeneratorPage({ showToast }) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Advanced settings state
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id)
  const [negativePrompt, setNegativePrompt] = useState("")
  const [guidanceScale, setGuidanceScale] = useState(7.5)
  const [inferenceSteps, setInferenceSteps] = useState(30)
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [seed, setSeed] = useState("")

  const isFlux = selectedModel.includes("flux")

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) {
      showToast("Prompt tidak boleh kosong!", "error")
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const params = {
        prompt: prompt.trim(),
        model: selectedModel,
        guidance_scale: guidanceScale,
        num_inference_steps: inferenceSteps,
        negative_prompt: negativePrompt.trim() || null,
        width: isFlux ? 1024 : width,
        height: isFlux ? 1024 : height,
        seed: seed !== "" ? parseInt(seed) : null,
      }
      const data = await generateImage(params)
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

  const handleReset = () => { setResult(null); setPrompt("") }

  const randomSeed = () => setSeed(Math.floor(Math.random() * 2147483647).toString())

  return (
    <div style={styles.container}>
      {/* Hero */}
      <div style={styles.heroSection}>
        <div style={styles.heroIcon}>🎨</div>
        <h2 style={styles.heroTitle}>AI Image Generator</h2>
        <p style={styles.heroSubtitle}>Deskripsikan gambar impian Anda, dan biarkan AI mewujudkannya.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} style={styles.form}>

        {/* Model Selector */}
        <div style={styles.section}>
          <label style={styles.label}>🤖 Pilih Model AI</label>
          <div style={styles.modelGrid}>
            {MODELS.map(m => (
              <button
                key={m.id}
                type="button"
                id={`model-${m.id.split("/")[1]}`}
                onClick={() => setSelectedModel(m.id)}
                style={{
                  ...styles.modelCard,
                  ...(selectedModel === m.id ? styles.modelCardActive : {})
                }}
              >
                <span style={styles.modelName}>{m.label}</span>
                <span style={styles.modelDesc}>{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div style={styles.section}>
          <label style={styles.label}>✏️ Prompt</label>
          <textarea
            id="image-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Contoh: "a futuristic Indonesian city at sunset, digital art, highly detailed..."'
            style={styles.textarea}
            rows={3}
            disabled={loading}
          />
          <p style={styles.hint}>💡 Tips: Bahasa Inggris lebih akurat. Tambahkan <em>"digital art", "ultra realistic", "cinematic lighting"</em>.</p>
        </div>

        {/* Advanced Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={styles.advancedToggle}
          id="btn-advanced-settings"
        >
          ⚙️ Advanced Settings {showAdvanced ? "▲" : "▼"}
        </button>

        {/* Advanced Panel */}
        {showAdvanced && (
          <div style={styles.advancedPanel}>

            {/* Negative Prompt */}
            <div style={styles.field}>
              <label style={styles.fieldLabel}>🚫 Negative Prompt</label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder='Hal yang TIDAK diinginkan, contoh: "blurry, ugly, bad quality, watermark"'
                style={{ ...styles.textarea, fontSize: "0.85rem" }}
                rows={2}
                disabled={loading}
              />
            </div>

            {/* CFG Scale + Steps */}
            <div style={styles.row2}>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>
                  🎯 CFG Scale: <strong>{guidanceScale}</strong>
                </label>
                <input
                  type="range" min="1" max="20" step="0.5"
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                  style={styles.slider}
                  disabled={loading}
                />
                <div style={styles.sliderHint}><span>Bebas (1)</span><span>Ketat (20)</span></div>
              </div>
              <div style={styles.field}>
                <label style={styles.fieldLabel}>
                  🔄 Inference Steps: <strong>{inferenceSteps}</strong>
                </label>
                <input
                  type="range" min="10" max="100" step="5"
                  value={inferenceSteps}
                  onChange={(e) => setInferenceSteps(parseInt(e.target.value))}
                  style={styles.slider}
                  disabled={loading}
                />
                <div style={styles.sliderHint}><span>Cepat (10)</span><span>Detail (100)</span></div>
              </div>
            </div>

            {/* Width & Height (disabled for FLUX) */}
            {!isFlux && (
              <div style={styles.row2}>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>↔️ Width</label>
                  <select value={width} onChange={(e) => setWidth(parseInt(e.target.value))} style={styles.select} disabled={loading}>
                    {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}px</option>)}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>↕️ Height</label>
                  <select value={height} onChange={(e) => setHeight(parseInt(e.target.value))} style={styles.select} disabled={loading}>
                    {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}px</option>)}
                  </select>
                </div>
              </div>
            )}
            {isFlux && (
              <p style={styles.fluxNote}>ℹ️ Model FLUX menggunakan ukuran gambar otomatis (1024×1024).</p>
            )}

            {/* Seed */}
            <div style={styles.field}>
              <label style={styles.fieldLabel}>🌱 Seed (opsional — untuk hasil reproducible)</label>
              <div style={styles.seedRow}>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Kosongkan untuk acak"
                  style={{ ...styles.input, flex: 1 }}
                  disabled={loading}
                />
                <button type="button" onClick={randomSeed} style={styles.btnSeed} disabled={loading}>🎲 Acak</button>
                <button type="button" onClick={() => setSeed("")} style={styles.btnSeed} disabled={loading}>✕ Reset</button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Row */}
        <div style={styles.btnRow}>
          <button
            type="submit"
            style={{ ...styles.btnGenerate, ...(loading ? styles.btnDisabled : {}) }}
            disabled={loading}
            id="btn-generate"
          >
            {loading ? (
              <><Spinner size={18} color="white" /><span style={{ marginLeft: "0.5rem" }}>Generating...</span></>
            ) : "✨ Generate Gambar"}
          </button>
          {result && (
            <button type="button" onClick={handleReset} style={styles.btnReset}>🔄 Reset</button>
          )}
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div style={styles.loadingCard}>
          <Spinner size={40} color="#2E75B6" />
          <p style={styles.loadingText}>AI sedang menggambar...</p>
          <p style={styles.loadingSubtext}>{MODELS.find(m => m.id === selectedModel)?.label} · {inferenceSteps} steps</p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div style={styles.resultCard}>
          <div style={styles.resultHeader}>
            <h3 style={styles.resultTitle}>🖼️ Hasil Generate</h3>
            <button onClick={handleDownload} style={styles.btnDownload} id="btn-download">⬇️ Download</button>
          </div>
          <img
            src={`data:image/png;base64,${result.image_base64}`}
            alt={result.prompt}
            style={styles.resultImage}
          />
          <div style={styles.resultMeta}>
            <p style={styles.metaItem}><strong>Prompt:</strong> {result.prompt}</p>
            <p style={styles.metaItem}><strong>Model:</strong> {result.model}</p>
            <p style={styles.metaItem}><strong>CFG Scale:</strong> {guidanceScale} · <strong>Steps:</strong> {inferenceSteps}{seed ? ` · Seed: ${seed}` : ""}</p>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  heroSection: {
    textAlign: "center", padding: "2rem",
    background: "linear-gradient(135deg, #1F4E79 0%, #2E75B6 50%, #548235 100%)",
    borderRadius: "16px", color: "white",
    boxShadow: "0 8px 32px rgba(31,78,121,0.25)",
  },
  heroIcon: { fontSize: "3rem", marginBottom: "0.5rem" },
  heroTitle: { margin: "0 0 0.5rem 0", fontSize: "1.8rem", fontWeight: "bold", textShadow: "0 2px 4px rgba(0,0,0,0.3)" },
  heroSubtitle: { margin: 0, fontSize: "1rem", opacity: 0.9 },
  form: {
    backgroundColor: "white", padding: "1.5rem", borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "1.25rem",
  },
  section: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  label: { fontWeight: "bold", fontSize: "0.9rem", color: "#444" },
  modelGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.5rem" },
  modelCard: {
    padding: "0.7rem", border: "2px solid #e0e0e0", borderRadius: "10px",
    backgroundColor: "#fafafa", cursor: "pointer", textAlign: "left",
    display: "flex", flexDirection: "column", gap: "0.2rem", transition: "all 0.2s",
  },
  modelCardActive: { borderColor: "#2E75B6", backgroundColor: "#EBF5FF" },
  modelName: { fontWeight: "bold", fontSize: "0.82rem", color: "#1F4E79" },
  modelDesc: { fontSize: "0.75rem", color: "#888" },
  textarea: {
    padding: "0.9rem 1rem", border: "2px solid #ddd", borderRadius: "10px",
    fontSize: "1rem", fontFamily: "'Segoe UI', Arial, sans-serif", resize: "vertical", outline: "none",
  },
  hint: { margin: "0.2rem 0 0 0", fontSize: "0.8rem", color: "#888" },
  advancedToggle: {
    padding: "0.6rem 1rem", border: "2px solid #ddd", borderRadius: "8px",
    backgroundColor: "#f8f9fa", cursor: "pointer", fontWeight: "bold",
    fontSize: "0.9rem", color: "#555", textAlign: "left",
  },
  advancedPanel: {
    backgroundColor: "#f8f9fa", padding: "1.25rem", borderRadius: "12px",
    border: "2px solid #e8e8e8", display: "flex", flexDirection: "column", gap: "1rem",
  },
  field: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  fieldLabel: { fontSize: "0.85rem", fontWeight: "bold", color: "#555" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  slider: { width: "100%", accentColor: "#2E75B6" },
  sliderHint: { display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#aaa" },
  select: {
    padding: "0.6rem 0.8rem", border: "2px solid #ddd", borderRadius: "8px",
    fontSize: "0.9rem", backgroundColor: "white", outline: "none",
  },
  fluxNote: { margin: 0, fontSize: "0.82rem", color: "#888", backgroundColor: "#fff3cd", padding: "0.5rem 0.75rem", borderRadius: "6px" },
  seedRow: { display: "flex", gap: "0.5rem", alignItems: "center" },
  input: {
    padding: "0.6rem 0.8rem", border: "2px solid #ddd", borderRadius: "8px",
    fontSize: "0.9rem", outline: "none",
  },
  btnSeed: {
    padding: "0.6rem 0.8rem", border: "2px solid #ddd", borderRadius: "8px",
    backgroundColor: "white", cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap",
  },
  btnRow: { display: "flex", gap: "0.75rem", alignItems: "center" },
  btnGenerate: {
    flex: 1, padding: "0.9rem 1.5rem",
    background: "linear-gradient(135deg, #1F4E79, #2E75B6)",
    color: "white", border: "none", borderRadius: "10px",
    fontSize: "1rem", fontWeight: "bold", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
  },
  btnDisabled: { opacity: 0.7, cursor: "not-allowed" },
  btnReset: {
    padding: "0.9rem 1.2rem", backgroundColor: "#f0f2f5",
    color: "#555", border: "2px solid #ddd", borderRadius: "10px",
    fontSize: "0.95rem", fontWeight: "bold", cursor: "pointer",
  },
  loadingCard: {
    backgroundColor: "white", padding: "3rem 2rem", borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
  },
  loadingText: { margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: "#1F4E79" },
  loadingSubtext: { margin: 0, fontSize: "0.85rem", color: "#888" },
  resultCard: {
    backgroundColor: "white", padding: "1.5rem", borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "1rem",
  },
  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  resultTitle: { margin: 0, color: "#1F4E79", fontSize: "1.2rem" },
  btnDownload: {
    padding: "0.5rem 1rem",
    background: "linear-gradient(135deg, #548235, #70AD47)",
    color: "white", border: "none", borderRadius: "8px", cursor: "pointer",
    fontWeight: "bold", fontSize: "0.9rem",
  },
  resultImage: { width: "100%", borderRadius: "12px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", objectFit: "contain" },
  resultMeta: { backgroundColor: "#f8f9fa", padding: "0.75rem 1rem", borderRadius: "8px", borderLeft: "4px solid #2E75B6" },
  metaItem: { margin: "0 0 0.25rem 0", fontSize: "0.85rem", color: "#555" },
}

export default ImageGeneratorPage
