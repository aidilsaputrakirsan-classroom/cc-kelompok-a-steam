import { useState } from "react"

function AiSummarizePage({ showToast }) {
  const [inputText, setInputText] = useState("")
  const [summary, setSummary] = useState("")
  const [isWorking, setIsWorking] = useState(false)

  const handleSummarize = () => {
    if (!inputText.trim()) {
      showToast("Masukkan teks terlebih dahulu.", "error")
      return
    }

    setIsWorking(true)
    setTimeout(() => {
      const result = simpleSummarize(inputText)
      setSummary(result)
      setIsWorking(false)
      showToast("Ringkasan berhasil dibuat.", "success")
    }, 250)
  }

  const handleClear = () => {
    setInputText("")
    setSummary("")
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>AI Summarize</h2>
        <p style={styles.description}>
          Tempel teks di bawah ini, lalu klik tombol untuk membuat ringkasan singkat.
        </p>

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

const simpleSummarize = (text) => {
  const cleaned = text.trim()
  if (!cleaned) return ""

  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length <= 2) {
    return cleaned
  }

  return sentences.slice(0, 2).join(" ")
}

const styles = {
  page: { marginTop: "1.5rem" },
  card: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "1.75rem",
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
  },
  title: { marginBottom: "0.5rem", fontSize: "1.5rem" },
  description: { marginBottom: "1rem", color: "#555" },
  label: { display: "block", marginBottom: "0.5rem", fontWeight: 600 },
  textarea: {
    width: "100%",
    minHeight: "180px",
    padding: "1rem",
    borderRadius: "12px",
    border: "1px solid #d9d9d9",
    resize: "vertical",
    fontSize: "1rem",
    lineHeight: 1.6,
    marginBottom: "1rem",
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    marginBottom: "1rem",
  },
  primaryBtn: {
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "0.85rem 1.25rem",
    cursor: "pointer",
  },
  secondaryBtn: {
    backgroundColor: "#f3f4f6",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: "999px",
    padding: "0.85rem 1.25rem",
    cursor: "pointer",
  },
  resultBox: {
    backgroundColor: "#f9fafb",
    borderRadius: "14px",
    padding: "1.25rem",
    border: "1px solid #e5e7eb",
  },
  resultTitle: { marginBottom: "0.75rem", fontSize: "1.1rem" },
  resultText: { whiteSpace: "pre-line", lineHeight: 1.7, color: "#1f2937" },
}

export default AiSummarizePage