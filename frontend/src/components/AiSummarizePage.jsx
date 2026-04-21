import { useState } from "react"
import Spinner from "./Spinner"
import { summarizeText } from "../services/api"

function AiSummarizePage({ showToast, activeTab, onSelectTab }) {
  const [inputText, setInputText] = useState("")
  const [summary, setSummary] = useState("")
  const [isWorking, setIsWorking] = useState(false)

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      showToast("Masukkan teks terlebih dahulu.", "error")
      return
    }

    setIsWorking(true)
    try {
      const data = await summarizeText(inputText.trim(), "text")
      setSummary(data.summary)
      showToast("Ringkasan berhasil dibuat oleh Gemini AI! 📝", "success")
    } catch (err) {
      showToast("Gagal merangkum: " + err.message, "error")
    } finally {
      setIsWorking(false)
    }
  }

  const handleClear = () => {
    setInputText("")
    setSummary("")
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.hero}>
        <div style={styles.heroTextBlock}>
          <p style={styles.kicker}>Text Summarizer</p>
          <h2 style={styles.heroTitle}>Ubah tulisan panjang menjadi ringkasan padat.</h2>
          <p style={styles.heroText}>
            Tempel teks di bawah ini, lalu biarkan AI merangkum inti pesan dengan cepat dan cerdas.
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

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <p style={styles.sectionLabel}>Ringkas teks dengan cepat</p>
            <h3 style={styles.cardTitle}>Masukkan teks, lalu terjemahkan menjadi rangkuman.</h3>
          </div>
        </div>

        <label style={styles.label}>Teks sumber</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Masukkan teks yang ingin diringkas..."
          style={styles.textarea}
          rows={10}
        />

        <div style={styles.actions}>
          <button
            onClick={handleSummarize}
            disabled={isWorking}
            style={styles.primaryBtn}
          >
            {isWorking ? "Menyusun..." : "Buat Ringkasan"}
          </button>
          <button
            onClick={handleClear}
            type="button"
            style={styles.secondaryBtn}
          >
            Bersihkan
          </button>
        </div>

        {summary && (
          <div style={styles.resultBox}>
            <h3 style={styles.resultTitle}>Ringkasan</h3>
            <p style={styles.resultText}>{summary}</p>
          </div>
        )}
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
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "1.5rem",
    padding: "2rem",
    borderRadius: "30px",
    background: "linear-gradient(135deg, rgba(255, 166, 79, 0.14), rgba(25, 39, 76, 0.92))",
    border: "1px solid rgba(255, 156, 60, 0.12)",
    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.2)",
  },
  heroTextBlock: { flex: "1 1 420px", minWidth: "280px" },
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
    color: "#fff4e5",
  },
  heroText: {
    margin: 0,
    color: "#d9d7e5",
    maxWidth: "720px",
    fontSize: "1rem",
    lineHeight: 1.7,
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
  },
  card: {
    width: "100%",
    padding: "1.75rem",
    borderRadius: "28px",
    background: "rgba(31, 41, 77, 0.94)",
    border: "1px solid rgba(255, 156, 60, 0.12)",
    boxShadow: "0 30px 70px rgba(0, 0, 0, 0.22)",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
  },
  sectionLabel: {
    margin: 0,
    color: "#f2c29b",
    fontSize: "0.8rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  },
  cardTitle: {
    margin: "0.35rem 0 0",
    fontSize: "1.4rem",
    color: "#fff8f0",
    lineHeight: 1.3,
  },
  label: {
    color: "#e6d8ca",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  textarea: {
    width: "100%",
    minHeight: "220px",
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
  actions: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    marginBottom: "1rem",
  },
  primaryBtn: {
    flex: 1,
    minHeight: "54px",
    borderRadius: "18px",
    border: "none",
    background: "linear-gradient(135deg, #ffb56e, #ff8f48)",
    color: "#111827",
    fontWeight: 800,
    cursor: "pointer",
    padding: "0.95rem 1.25rem",
  },
  secondaryBtn: {
    minHeight: "54px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#f7ece1",
    padding: "0.95rem 1.25rem",
    cursor: "pointer",
    fontWeight: 700,
  },
  resultBox: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: "22px",
    padding: "1.25rem",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  resultTitle: {
    marginBottom: "0.75rem",
    fontSize: "1.2rem",
    color: "#fff8ee",
  },
  resultText: {
    whiteSpace: "pre-line",
    lineHeight: 1.75,
    color: "#f3e3cf",
  },
}

export default AiSummarizePage