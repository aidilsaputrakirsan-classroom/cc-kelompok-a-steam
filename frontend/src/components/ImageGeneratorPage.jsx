import { useState } from "react"
import Spinner from "./Spinner"
import { generateImage } from "../services/api"

const MODELS = [
  { id: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell ⚡", desc: "Cepat & berkualitas tinggi" },
  { id: "stabilityai/stable-diffusion-xl-base-1.0", label: "Stable Diffusion XL", desc: "Detail tinggi, serbaguna" },
]

const SIZE_OPTIONS = [512, 768, 1024]

function ImageGeneratorPage({ showToast, activeTab, onSelectTab }) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
        seed: seed !== "" ? parseInt(seed, 10) : null,
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

  const handleReset = () => {
    setResult(null)
    setPrompt("")
    setNegativePrompt("")
    setSeed("")
  }

  const randomSeed = () => setSeed(Math.floor(Math.random() * 2147483647).toString())

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.hero}>
        <div style={styles.heroTextBlock}>
          <p style={styles.kicker}>Dream in Pixels.</p>
          <h2 style={styles.heroTitle}>Transform thoughts into ethereal visuals.</h2>
          <p style={styles.heroText}>
            Buat karya visual yang tajam dan elegan dengan AI. Pilih model, atur detail, lalu manifestasikan imajinasimu.
          </p>
        </div>

        <div style={styles.heroActions}>
          {["ai-generator", "ai-summarize", "chat-history"].map(tab => (
            <button
              key={tab}
              type="button"
              style={{
                ...styles.heroButton,
                ...(activeTab === tab ? styles.heroButtonActive : {}),
              }}
              onClick={() => onSelectTab?.(tab)}
            >
              {tab === "ai-generator" ? "Image Generator" : tab === "ai-summarize" ? "Text Summarizer" : "History"}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.mainGrid}>
        <section style={styles.controlCard}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.sectionLabel}>Prompt Input</p>
              <h3 style={styles.sectionTitle}>Beri arahan AI-mu</h3>
            </div>
            <span style={styles.badge}>Creative</span>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Prompt</label>
            <textarea
              id="image-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Contoh: cinematic cyberpunk city, neon glow, highly detailed..."
              style={styles.textarea}
              rows={5}
              disabled={loading}
            />
          </div>

          <div style={styles.section}>
            <p style={styles.label}>Pilih Model</p>
            <div style={styles.modelGrid}>
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  style={{
                    ...styles.modelCard,
                    ...(selectedModel === m.id ? styles.modelCardActive : {}),
                  }}
                >
                  <span style={styles.modelName}>{m.label}</span>
                  <span style={styles.modelDesc}>{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            style={styles.advancedToggle}
          >
            {showAdvanced ? "Hide advanced settings" : "Show advanced settings"} {showAdvanced ? "▲" : "▼"}
          </button>

          {showAdvanced && (
            <div style={styles.advancedPanel}>
              <div style={styles.field}>
                <label style={styles.label}>Negative Prompt</label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Contoh: blurry, bad anatomy, watermark"
                  style={styles.textarea}
                  rows={2}
                  disabled={loading}
                />
              </div>

              <div style={styles.row2}>
                <div style={styles.field}>
                  <label style={styles.label}>CFG Scale: {guidanceScale}</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={guidanceScale}
                    onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                    style={styles.slider}
                    disabled={loading}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Inference Steps: {inferenceSteps}</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={inferenceSteps}
                    onChange={(e) => setInferenceSteps(parseInt(e.target.value, 10))}
                    style={styles.slider}
                    disabled={loading}
                  />
                </div>
              </div>

              {!isFlux ? (
                <div style={styles.row2}>
                  <div style={styles.field}>
                    <label style={styles.label}>Width</label>
                    <select
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                      style={styles.select}
                      disabled={loading}
                    >
                      {SIZE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}px
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Height</label>
                    <select
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                      style={styles.select}
                      disabled={loading}
                    >
                      {SIZE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}px
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p style={styles.note}>Model FLUX otomatis menggunakan 1024×1024.</p>
              )}

              <div style={styles.field}>
                <label style={styles.label}>Seed (opsional)</label>
                <div style={styles.seedRow}>
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="Kosongkan untuk acak"
                    style={styles.input}
                    disabled={loading}
                  />
                  <button type="button" onClick={randomSeed} style={styles.btnSeed} disabled={loading}>
                    🎲
                  </button>
                  <button type="button" onClick={() => setSeed("")} style={styles.btnSeed} disabled={loading}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={styles.submitRow}>
            <button
              type="button"
              onClick={handleGenerate}
              style={{ ...styles.btnGenerate, ...(loading ? styles.btnDisabled : {}) }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size={18} color="#fff" />
                  <span style={{ marginLeft: "0.6rem" }}>Generating...</span>
                </>
              ) : (
                "Manifest"
              )}
            </button>
            <button type="button" onClick={handleReset} style={styles.btnSecondary}>
              Reset
            </button>
          </div>
        </section>

        <section style={styles.previewCard}>
          <div style={styles.previewHeader}>
            <div>
              <p style={styles.sectionLabel}>Output Preview</p>
              <h3 style={styles.sectionTitle}>Hasil Generate</h3>
            </div>
            {result && (
              <button type="button" onClick={handleDownload} style={styles.btnDownload}>
                ⬇️ Download
              </button>
            )}
          </div>

          {loading ? (
            <div style={styles.loadingPanel}>
              <Spinner size={40} color="#ffb26c" />
              <p style={styles.loadingText}>AI sedang menggambar...</p>
              <p style={styles.loadingSubtext}>
                {MODELS.find((m) => m.id === selectedModel)?.label}
              </p>
            </div>
          ) : result ? (
            <>
              <div style={styles.imageWrapper}>
                <img
                  src={`data:image/png;base64,${result.image_base64}`}
                  alt={result.prompt || "Generated"}
                  style={styles.resultImage}
                />
              </div>
              <div style={styles.resultMeta}>
                <p style={styles.metaLine}>
                  <strong>Prompt:</strong> {result.prompt}
                </p>
                <p style={styles.metaLine}>
                  <strong>Model:</strong> {result.model}
                </p>
                <p style={styles.metaLine}>
                  <strong>CFG:</strong> {guidanceScale} · <strong>Steps:</strong> {inferenceSteps}
                  {seed ? ` · Seed: ${seed}` : ""}
                </p>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>✨</div>
              <p style={styles.emptyTitle}>Canvas is empty</p>
              <p style={styles.emptyText}>
                Masukkan prompt, lalu tekan tombol manifest untuk melihat hasil AI.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const styles = {
  pageWrapper: {
    width: "100%",
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "1.75rem",
    fontFamily: "'SF Pro Display', 'SF Pro', system-ui, sans-serif",
    color: "#eef2ff",
    padding: "0",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "1.5rem",
    padding: "2rem",
    borderRadius: "30px",
    background: "linear-gradient(135deg, rgba(255, 164, 82, 0.14), rgba(25, 39, 76, 0.92))",
    border: "1px solid rgba(255, 156, 59, 0.12)",
    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.2)",
  },
  heroTextBlock: { flex: "1 1 440px", minWidth: "280px" },
  kicker: {
    margin: 0,
    color: "#ffc38d",
    fontSize: "0.9rem",
    letterSpacing: "0.24em",
    textTransform: "uppercase",
  },
  heroTitle: {
    margin: "0.75rem 0 0.85rem 0",
    fontSize: "clamp(2rem, 3vw, 2.8rem)",
    lineHeight: 1.05,
    letterSpacing: "-0.035em",
    color: "#fff1e4",
  },
  heroText: {
    margin: 0,
    color: "#d9d7e5",
    maxWidth: "720px",
    fontSize: "1rem",
    lineHeight: 1.75,
  },
  heroActions: {
    display: "flex",
    gap: "0.8rem",
    flexWrap: "wrap",
    alignItems: "center",
  },
  heroButton: {
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#f8f9ff",
    padding: "0.95rem 1.45rem",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.95rem",
  },
  heroButtonActive: {
    borderRadius: "999px",
    border: "1px solid rgba(255, 151, 73, 0.22)",
    background: "linear-gradient(135deg, rgba(255, 166, 79, 0.22), rgba(255, 255, 255, 0.08))",
    color: "#fff4e7",
    padding: "0.95rem 1.45rem",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.95rem",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "1.5rem",
    width: "100%",
    alignItems: "start",
  },
  controlCard: {
    width: "100%",
    padding: "1.75rem",
    borderRadius: "30px",
    background: "rgba(31, 41, 77, 0.94)",
    border: "1px solid rgba(255, 156, 60, 0.12)",
    boxShadow: "0 30px 70px rgba(0, 0, 0, 0.22)",
  },
  previewCard: {
    width: "100%",
    padding: "1.75rem",
    borderRadius: "30px",
    background: "rgba(28, 34, 57, 0.96)",
    border: "1px solid rgba(255, 156, 60, 0.12)",
    boxShadow: "0 30px 70px rgba(0, 0, 0, 0.22)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    minHeight: "560px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    alignItems: "flex-start",
    marginBottom: "1.5rem",
  },
  sectionLabel: {
    margin: 0,
    color: "#f2c29b",
    fontSize: "0.8rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  },
  sectionTitle: {
    margin: "0.35rem 0 0",
    fontSize: "1.38rem",
    color: "#fff8f0",
    lineHeight: 1.25,
  },
  badge: {
    display: "inline-flex",
    padding: "0.5rem 0.9rem",
    borderRadius: "999px",
    background: "rgba(255, 148, 66, 0.16)",
    color: "#ffd8b2",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "0.9rem",
    marginBottom: "1.2rem",
  },
  label: {
    color: "#e6d8ca",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "#f8f5ef",
    padding: "1rem 1.15rem",
    outline: "none",
    resize: "vertical",
    fontSize: "1rem",
    lineHeight: 1.7,
  },
  modelGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
    gap: "0.75rem",
  },
  modelCard: {
    padding: "0.9rem 1rem",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#f2ede8",
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.2s ease",
    minHeight: "92px",
    display: "grid",
    gap: "0.35rem",
    alignItems: "flex-start",
  },
  modelCardActive: {
    background: "linear-gradient(135deg, rgba(255, 156, 60, 0.16), rgba(255, 255, 255, 0.08))",
    borderColor: "rgba(255, 156, 60, 0.32)",
    boxShadow: "0 16px 40px rgba(255, 141, 61, 0.14)",
  },
  modelName: {
    display: "block",
    fontWeight: 700,
    color: "#fff7ee",
    marginBottom: "0.35rem",
    fontSize: "0.9rem",
  },
  modelDesc: {
    color: "#d2c5b4",
    fontSize: "0.82rem",
    lineHeight: 1.5,
  },
  advancedToggle: {
    width: "100%",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff4e6",
    padding: "0.95rem 1rem",
    cursor: "pointer",
    fontWeight: 700,
    marginBottom: "1rem",
  },
  advancedPanel: {
    display: "grid",
    gap: "1rem",
    padding: "1.2rem",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  field: {
    display: "grid",
    gap: "0.55rem",
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  slider: {
    width: "100%",
    accentColor: "#ff9f4d",
  },
  select: {
    width: "100%",
    padding: "0.85rem 1rem",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.07)",
    color: "#f7ede2",
    outline: "none",
    fontSize: "0.95rem",
  },
  note: {
    margin: 0,
    color: "#e2c8a3",
    fontSize: "0.9rem",
  },
  seedRow: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  input: {
    width: "100%",
    padding: "0.85rem 1rem",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#f7f1e8",
    outline: "none",
    fontSize: "0.95rem",
  },
  btnSeed: {
    minWidth: "96px",
    padding: "0.85rem 1rem",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#f4e6d3",
    cursor: "pointer",
    fontWeight: 700,
  },
  submitRow: {
    display: "flex",
    gap: "1rem",
    marginTop: "0.5rem",
    flexWrap: "wrap",
  },
  btnGenerate: {
    flex: 1,
    minHeight: "54px",
    borderRadius: "18px",
    border: "none",
    background: "linear-gradient(135deg, #ffb56e, #ff8f48)",
    color: "#111827",
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.65rem",
  },
  btnSecondary: {
    minHeight: "54px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#f7ece1",
    padding: "0 1.4rem",
    cursor: "pointer",
    fontWeight: 700,
  },
  btnDisabled: {
    opacity: 0.75,
    cursor: "not-allowed",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    alignItems: "center",
  },
  btnDownload: {
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #ffb56e, #ff8f48)",
    color: "#111827",
    padding: "0.9rem 1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  loadingPanel: {
    flex: 1,
    minHeight: "320px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "grid",
    placeItems: "center",
    gap: "1rem",
    textAlign: "center",
    padding: "2rem",
  },
  loadingText: {
    margin: 0,
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#fff7e9",
  },
  loadingSubtext: {
    margin: 0,
    color: "#f0d8b5",
  },
  imageWrapper: {
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
  },
  resultImage: {
    width: "100%",
    display: "block",
  },
  resultMeta: {
    padding: "1rem 1.2rem",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#f3e7d7",
    fontSize: "0.92rem",
    lineHeight: 1.7,
  },
  metaLine: {
    margin: "0 0 0.55rem 0",
  },
  emptyState: {
    flex: 1,
    borderRadius: "24px",
    padding: "2.5rem",
    display: "grid",
    placeItems: "center",
    gap: "0.85rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px dashed rgba(255,255,255,0.14)",
    color: "#eedccb",
    textAlign: "center",
  },
  emptyIcon: {
    width: "76px",
    height: "76px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.12)",
    color: "#ffcf9a",
    fontSize: "2rem",
  },
  emptyTitle: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#fff9ee",
  },
  emptyText: {
    margin: 0,
    maxWidth: "280px",
    color: "#e4d2b4",
    lineHeight: 1.7,
  },
}

export default ImageGeneratorPage