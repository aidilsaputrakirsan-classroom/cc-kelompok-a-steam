import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Spinner from "./Spinner"
import {
  getChatSessions,
  getChatSessionById,
  createChatSession,
  continueChatSession,
  updateChatSessionTitle,
  deleteChatSession,
} from "../services/api"

const MODELS = [
  { id: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell ⚡" },
  { id: "stabilityai/stable-diffusion-xl-base-1.0", label: "Stable Diffusion XL" },
]

function formatDate(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

function formatTime(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

export default function ChatHistoryPage({ showToast, activeTab, onSelectTab }) {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [sending, setSending] = useState(false)
  const hasRestoredSession = useRef(false)

  // New session modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [newType, setNewType] = useState("image")
  const [newTitle, setNewTitle] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [newModel, setNewModel] = useState(MODELS[0].id)
  const [newImageBase64, setNewImageBase64] = useState(null)
  const [newImageFile, setNewImageFile] = useState(null)
  const [creatingSession, setCreatingSession] = useState(false)

  // Continue input
  const [continueMsg, setContinueMsg] = useState("")
  const [continueModel, setContinueModel] = useState(MODELS[0].id)
  const [continueImageBase64, setContinueImageBase64] = useState(null)
  const [continueImageFile, setContinueImageFile] = useState(null)

  // Markdown mode state
  const [inputMode, setInputMode] = useState("plain")       // "plain" | "markdown"
  const [showPreview, setShowPreview] = useState(false)     // preview tab di continue area
  const [newMsgInputMode, setNewMsgInputMode] = useState("plain")   // untuk modal
  const [newMsgShowPreview, setNewMsgShowPreview] = useState(false) // preview tab di modal

  // Rename
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState("")

  // Delete confirm
  const [deletingId, setDeletingId] = useState(null)

  const messagesEndRef = useRef(null)

  // Helper untuk membaca file ke base64
  const handleFileSelect = (e, setBase64, setFileObj) => {
    const file = e.target.files[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'

    if (!isImage && !isPdf) {
      showToast("Hanya format gambar dan PDF yang didukung.", "error")
      e.target.value = null
      return
    }

    if (isImage && file.size > 2 * 1024 * 1024) {
      showToast("Ukuran gambar maksimal 2MB.", "error")
      e.target.value = null
      return
    }

    if (isPdf && file.size > 5 * 1024 * 1024) {
      showToast("Ukuran dokumen PDF maksimal 5MB.", "error")
      e.target.value = null
      return
    }

    setFileObj(file)
    const reader = new FileReader()
    reader.onload = (ev) => setBase64(ev.target.result)
    reader.readAsDataURL(file)
  }

  // ── Load session list ──
  const loadSessions = async () => {
    setLoadingSessions(true)
    try {
      const data = await getChatSessions()
      setSessions(data)
    } catch {
      showToast("Gagal memuat daftar sesi.", "error")
    } finally {
      setLoadingSessions(false)
    }
  }

  useEffect(() => { loadSessions() }, [])

  // ── Disable body scroll when modal is open ──
  useEffect(() => {
    if (showNewModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showNewModal])

  // ── Save active session to localStorage ──
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem("inti_active_session_id", activeSession.id)
    } else {
      localStorage.removeItem("inti_active_session_id")
    }
  }, [activeSession])

  // ── Restore active session after sessions list loaded (only once) ──
  useEffect(() => {
    if (hasRestoredSession.current || sessions.length === 0) return
    hasRestoredSession.current = true
    const savedId = localStorage.getItem("inti_active_session_id")
    if (!savedId) return
    if (sessions.some(s => s.id.toString() === savedId)) {
      openSession(Number(savedId))
    } else {
      localStorage.removeItem("inti_active_session_id")
    }
  }, [sessions])

  // ── Auto-scroll to bottom on new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeSession?.messages])

  // ── Open a session ──
  const openSession = async (id) => {
    setLoadingDetail(true)
    try {
      const data = await getChatSessionById(id)
      setActiveSession(data)
      setContinueMsg("")
    } catch {
      showToast("Gagal memuat sesi.", "error")
    } finally {
      setLoadingDetail(false)
    }
  }

  // ── Create new session ──
  const handleCreateSession = async () => {
    if (newType !== "ocr" && !newMessage.trim()) {
      showToast("Pesan pertama tidak boleh kosong.", "error")
      return
    }
    if (newType === "ocr" && !newImageBase64) {
      showToast("Harap pilih gambar untuk di-scan.", "error")
      return
    }
    setCreatingSession(true)
    try {
      const payload = {
        title: newTitle.trim() || (newType === "image" ? "Sesi Gambar Baru" : newType === "ocr" ? "Sesi OCR Dokumen" : "Sesi Rangkum Baru"),
        session_type: newType,
        first_message: newMessage.trim() || (newType === "ocr" ? "Tolong ekstrak teks dokumen ini." : ""),
        ...(newType === "image" ? { model: newModel } : newType === "ocr" ? { image_data: newImageBase64 } : { source_type: "text" }),
      }
      const created = await createChatSession(payload)
      setShowNewModal(false)
      setNewTitle("")
      setNewMessage("")
      setNewImageBase64(null)
      setNewImageFile(null)
      await loadSessions()
      setActiveSession(created)
      showToast("Sesi baru berhasil dibuat! ✨", "success")
    } catch (err) {
      showToast("Gagal membuat sesi: " + err.message, "error")
    } finally {
      setCreatingSession(false)
    }
  }

  // ── Continue session ──
  const handleContinue = async () => {
    const isOcr = activeSession?.session_type === "ocr"
    if (!activeSession) return
    if (!isOcr && !continueMsg.trim()) return
    if (isOcr && !continueImageBase64) {
      showToast("Harap upload gambar dokumen terlebih dahulu.", "error")
      return
    }
    
    setSending(true)
    try {
      const payload = {
        message: continueMsg.trim() || (isOcr ? "Tolong ekstrak teks dokumen ini." : ""),
        ...(activeSession.session_type === "image" ? { model: continueModel } : activeSession.session_type === "ocr" ? { image_data: continueImageBase64 } : { source_type: "text" }),
      }
      const updated = await continueChatSession(activeSession.id, payload)
      setActiveSession(updated)
      setContinueMsg("")
      setContinueImageBase64(null)
      setContinueImageFile(null)
      showToast("Berhasil diproses!", "success")
    } catch (err) {
      showToast("Gagal mengirim: " + err.message, "error")
    } finally {
      setSending(false)
    }
  }

  // ── Rename ──
  const startRename = (e, session) => {
    e.stopPropagation()
    setRenamingId(session.id)
    setRenameValue(session.title)
  }
  const handleRename = async (id) => {
    if (!renameValue.trim()) return
    try {
      await updateChatSessionTitle(id, renameValue.trim())
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: renameValue.trim() } : s))
      if (activeSession?.id === id) setActiveSession(prev => ({ ...prev, title: renameValue.trim() }))
      showToast("Judul diperbarui.", "success")
    } catch {
      showToast("Gagal mengubah judul.", "error")
    } finally {
      setRenamingId(null)
    }
  }

  // ── Delete ──
  const handleDelete = async (e, id) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await deleteChatSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (activeSession?.id === id) setActiveSession(null)
      showToast("Sesi dihapus.", "success")
    } catch {
      showToast("Gagal menghapus sesi.", "error")
    } finally {
      setDeletingId(null)
    }
  }

  // ── Key press ──
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleContinue()
    }
  }

  // ─────────────────────────────────────────────────────────
  return (
    <div style={s.pageWrapper}>
      {/* HERO */}
      <div style={s.hero}>
        <div style={s.heroTextBlock}>
          <p style={s.kicker}>Inti Studio ✨</p>
          <h2 style={s.heroTitle}>Ruang Kerja AI Kreatifmu</h2>
          <p style={s.heroText}>
            Buat sesi generate gambar atau rangkum teks, lanjutkan kapan saja, dan kelola seluruh riwayat karyamu dalam satu tempat.
          </p>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={s.layout}>
        {/* ── SIDEBAR ── */}
        <aside style={s.sidebar}>
          <div style={s.sidebarHeader}>
            <span style={s.sidebarTitle}>Sesi Inti Studio</span>
            <button style={s.btnNew} onClick={() => setShowNewModal(true)}>+ Baru</button>
          </div>

          {loadingSessions ? (
            <div style={s.centered}><Spinner size={28} color="#ffb26c" /></div>
          ) : sessions.length === 0 ? (
            <div style={s.emptyList}>
              <span style={s.emptyListIcon}>💬</span>
              <p style={s.emptyListText}>Belum ada sesi.<br />Klik "+ Baru" untuk mulai berkarya.</p>
            </div>
          ) : (
            <ul style={s.sessionList}>
              {sessions.map(session => (
                <li
                  key={session.id}
                  style={{
                    ...s.sessionItem,
                    ...(activeSession?.id === session.id ? s.sessionItemActive : {}),
                  }}
                  onClick={() => openSession(session.id)}
                >
                  <div style={s.sessionIcon}>
                    {session.session_type === "image" ? "🖼️" : session.session_type === "ocr" ? "📄" : "📝"}
                  </div>
                  <div style={s.sessionInfo}>
                    {renamingId === session.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => handleRename(session.id)}
                        onKeyDown={e => { if (e.key === "Enter") handleRename(session.id) }}
                        style={s.renameInput}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span style={s.sessionTitle}>{session.title}</span>
                    )}
                    <div style={s.sessionMeta}>
                      <span style={s.sessionType}>
                        {session.session_type === "image" ? "Image" : session.session_type === "ocr" ? "OCR" : "Summarize"}
                      </span>
                      <span style={s.sessionCount}>{session.message_count} pesan</span>
                      <span style={s.sessionDate}>{formatDate(session.updated_at)}</span>
                    </div>
                  </div>
                  <div style={s.sessionActions}>
                    <button
                      style={s.btnIcon}
                      title="Rename"
                      onClick={e => startRename(e, session)}
                    >✏️</button>
                    <button
                      style={{ ...s.btnIcon, ...(deletingId === session.id ? { opacity: 0.4 } : {}) }}
                      title="Hapus"
                      onClick={e => handleDelete(e, session.id)}
                      disabled={deletingId === session.id}
                    >🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* ── CHAT PANEL ── */}
        <div style={s.chatPanel}>
          {loadingDetail ? (
            <div style={s.centered}><Spinner size={40} color="#ffb26c" /></div>
          ) : !activeSession ? (
            <div style={s.emptyChat}>
              <div style={s.emptyIcon}>💬</div>
              <h3 style={s.emptyTitle}>Mulai berkarya di Inti Studio</h3>
              <p style={s.emptyText}>
                Pilih sesi dari daftar kiri, atau klik tombol "+ Baru" untuk memulai sesi generate gambar atau rangkum teks baru.
              </p>
              <button style={s.btnCreateFirst} onClick={() => setShowNewModal(true)}>
                + Buat Sesi Baru
              </button>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={s.chatHeader}>
                <div>
                  <p style={s.chatHeaderLabel}>
                    {activeSession.session_type === "image" ? "🖼️ Image Generation" : activeSession.session_type === "ocr" ? "📄 Document OCR" : "📝 Text Summarize"}
                  </p>
                  <h3 style={s.chatHeaderTitle}>{activeSession.title}</h3>
                </div>
                <span style={s.chatHeaderDate}>{formatDate(activeSession.created_at)}</span>
              </div>

              {/* Messages */}
              <div style={s.messagesArea}>
                {activeSession.messages.map((msg, i) => (
                  <div
                    key={msg.id ?? i}
                    style={{ ...s.msgRow, ...(msg.role === "user" ? s.msgRowUser : {}) }}
                  >
                    <div style={msg.role === "user" ? s.msgAvatarUser : s.msgAvatar}>
                      {msg.role === "user" ? "👤" : "🤖"}
                    </div>
                    <div style={{ ...s.msgBubble, ...(msg.role === "user" ? s.msgBubbleUser : {}) }}>
                      {msg.content_type === "image_base64" ? (
                        <div>
                          <img
                            src={msg.content.startsWith("data:image/") ? msg.content : `data:image/png;base64,${msg.content}`}
                            alt="Generated"
                            style={s.msgImage}
                          />
                          {msg.role !== "user" && (
                            <div style={s.imgActions}>
                              <button
                                style={s.btnDownload}
                                onClick={() => {
                                  const a = document.createElement("a")
                                  a.href = msg.content.startsWith("data:image/") ? msg.content : `data:image/png;base64,${msg.content}`
                                  a.download = `inti-rupa-${msg.id}.png`
                                  a.click()
                                }}
                              >⬇️ Download</button>
                            </div>
                          )}
                        </div>
                      ) : msg.role === "assistant" && (activeSession.session_type === "summarize" || activeSession.session_type === "ocr") ? (
                        <div className="markdown-body" style={s.markdownBody}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p style={s.msgText}>{msg.content}</p>
                      )}
                      <span style={s.msgTime}>{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div style={s.msgRow}>
                    <div style={s.msgAvatar}>🤖</div>
                    <div style={s.msgBubble}>
                      <div style={s.typingDots}>
                        <Spinner size={16} color="#ffb26c" />
                        <span style={{ marginLeft: "0.5rem", color: "#f0d8b5" }}>AI sedang memproses...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Continue Input */}
              <div style={s.inputArea}>
                {activeSession.session_type === "image" && (
                  <select
                    value={continueModel}
                    onChange={e => setContinueModel(e.target.value)}
                    style={s.modelSelect}
                    disabled={sending}
                  >
                    {MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                )}

                {/* Markdown mode toggle — hanya tampil untuk summarize */}
                {activeSession.session_type === "summarize" && (
                  <div style={s.modeToggleRow}>
                    <button
                      id="btn-mode-plain"
                      style={{ ...s.modeToggleBtn, ...(inputMode === "plain" ? s.modeToggleBtnActive : {}) }}
                      onClick={() => { setInputMode("plain"); setShowPreview(false) }}
                      title="Mode teks biasa"
                    >✏️ Plain</button>
                    <button
                      id="btn-mode-markdown"
                      style={{ ...s.modeToggleBtn, ...(inputMode === "markdown" ? s.modeToggleBtnActive : {}) }}
                      onClick={() => setInputMode("markdown")}
                      title="Mode Markdown — gunakan # heading, **bold**, - list"
                    >📝 Markdown</button>
                    {inputMode === "markdown" && (
                      <span style={s.mdHintBadge}>Gunakan # heading, **bold**, - list</span>
                    )}
                  </div>
                )}

                {/* Tab Edit/Preview — hanya muncul saat markdown mode */}
                {activeSession.session_type === "summarize" && inputMode === "markdown" && (
                  <div style={s.previewTabRow}>
                    <button
                      id="btn-tab-edit"
                      style={{ ...s.previewTab, ...(!showPreview ? s.previewTabActive : {}) }}
                      onClick={() => setShowPreview(false)}
                    >Edit</button>
                    <button
                      id="btn-tab-preview"
                      style={{ ...s.previewTab, ...(showPreview ? s.previewTabActive : {}) }}
                      onClick={() => setShowPreview(true)}
                    >Preview</button>
                  </div>
                )}

                <div style={s.inputRow}>
                  {showPreview && inputMode === "markdown" && activeSession.session_type === "summarize" ? (
                    <div style={s.previewBox}>
                      {continueMsg.trim()
                        ? <div className="markdown-body" style={s.markdownBody}><ReactMarkdown remarkPlugins={[remarkGfm]}>{continueMsg}</ReactMarkdown></div>
                        : <p style={s.previewPlaceholder}>Ketik sesuatu di tab Edit untuk melihat preview...</p>
                      }
                    </div>
                  ) : (
                    <textarea
                      value={continueMsg}
                      onChange={e => setContinueMsg(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        activeSession.session_type === "image"
                          ? "Tulis prompt gambar baru..."
                          : activeSession.session_type === "ocr"
                            ? "Instruksi tambahan untuk dokumen ini..."
                            : inputMode === "markdown"
                              ? "# Judul\n\n## Bagian\n\n- poin satu\n- poin dua"
                              : "Masukkan teks baru yang ingin dirangkum..."
                      }
                      style={s.inputTextarea}
                      rows={2}
                      disabled={sending}
                    />
                  )}

                  {activeSession.session_type === "ocr" && (
                    <div style={{ flexShrink: 0 }}>
                      <input 
                        type="file" 
                        id="chatOcrUpload" 
                        accept="image/*,application/pdf" 
                        style={{ display: "none" }}
                        onChange={e => handleFileSelect(e, setContinueImageBase64, setContinueImageFile)} 
                      />
                      <label htmlFor="chatOcrUpload" style={s.btnUpload}>
                        {continueImageFile ? "📄 " + continueImageFile.name.slice(0, 10) + "..." : "📎 Pilih File"}
                      </label>
                    </div>
                  )}

                  <button
                    style={{ ...s.btnSend, ...(sending || (!continueMsg.trim() && activeSession.session_type !== "ocr") || (activeSession.session_type === "ocr" && !continueImageBase64) ? s.btnDisabled : {}) }}
                    onClick={handleContinue}
                    disabled={sending || (!continueMsg.trim() && activeSession.session_type !== "ocr") || (activeSession.session_type === "ocr" && !continueImageBase64)}
                  >
                    {sending ? <Spinner size={18} color="#111" /> : "Kirim ↑"}
                  </button>
                </div>
                <p style={s.inputHint}>Enter untuk kirim · Shift+Enter untuk baris baru</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── NEW SESSION MODAL ── */}
      {showNewModal && (
        <div style={s.modalOverlay} onClick={() => !creatingSession && setShowNewModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <p style={s.modalLabel}>Buat Sesi Baru di Inti Studio</p>
                <h3 style={s.modalTitle}>Pilih jenis aktivitas & mulai</h3>
              </div>
              <button style={s.btnClose} onClick={() => setShowNewModal(false)} disabled={creatingSession}>✕</button>
            </div>

            {/* Type selector */}
            <div style={s.typeGrid}>
              {[
                { val: "image", icon: "🖼️", label: "Image Generator", desc: "Generate gambar dari teks prompt" },
                { val: "summarize", icon: "📝", label: "Text Summarizer", desc: "Rangkum teks panjang jadi ringkasan" },
                { val: "ocr", icon: "📄", label: "Document OCR", desc: "Ekstrak teks dari foto dokumen" },
              ].map(t => (
                <button
                  key={t.val}
                  style={{ ...s.typeCard, ...(newType === t.val ? s.typeCardActive : {}) }}
                  onClick={() => setNewType(t.val)}
                  disabled={creatingSession}
                >
                  <span style={s.typeIcon}>{t.icon}</span>
                  <span style={s.typeLabel}>{t.label}</span>
                  <span style={s.typeDesc}>{t.desc}</span>
                </button>
              ))}
            </div>

            <div style={s.modalField}>
              <label style={s.modalFieldLabel}>Judul Sesi (opsional)</label>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={newType === "image" ? "Contoh: Eksplorasi karakter anime" : "Contoh: Rangkum artikel AI"}
                style={s.modalInput}
                disabled={creatingSession}
              />
            </div>

            {newType === "image" && (
              <div style={s.modalField}>
                <label style={s.modalFieldLabel}>Model</label>
                <select
                  value={newModel}
                  onChange={e => setNewModel(e.target.value)}
                  style={s.modalInput}
                  disabled={creatingSession}
                >
                  {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
            )}

            <div style={s.modalField}>
              <div style={s.modalFieldHeader}>
                <label style={s.modalFieldLabel}>
                  {newType === "image" ? "Prompt Gambar Pertama" : newType === "ocr" ? "Instruksi Ekstrak (Opsional)" : "Teks yang Ingin Dirangkum"}
                </label>
                {newType === "summarize" && (
                  <div style={s.modeToggleRow}>
                    <button
                      id="btn-modal-mode-plain"
                      style={{ ...s.modeToggleBtn, ...(newMsgInputMode === "plain" ? s.modeToggleBtnActive : {}) }}
                      onClick={() => { setNewMsgInputMode("plain"); setNewMsgShowPreview(false) }}
                    >✏️ Plain</button>
                    <button
                      id="btn-modal-mode-markdown"
                      style={{ ...s.modeToggleBtn, ...(newMsgInputMode === "markdown" ? s.modeToggleBtnActive : {}) }}
                      onClick={() => setNewMsgInputMode("markdown")}
                    >📝 Markdown</button>
                  </div>
                )}
              </div>

              {newType === "summarize" && newMsgInputMode === "markdown" && (
                <div style={s.previewTabRow}>
                  <button
                    id="btn-modal-tab-edit"
                    style={{ ...s.previewTab, ...(!newMsgShowPreview ? s.previewTabActive : {}) }}
                    onClick={() => setNewMsgShowPreview(false)}
                  >Edit</button>
                  <button
                    id="btn-modal-tab-preview"
                    style={{ ...s.previewTab, ...(newMsgShowPreview ? s.previewTabActive : {}) }}
                    onClick={() => setNewMsgShowPreview(true)}
                  >Preview</button>
                </div>
              )}

              {newType === "summarize" && newMsgInputMode === "markdown" && newMsgShowPreview ? (
                <div style={{ ...s.previewBox, minHeight: "110px" }}>
                  {newMessage.trim()
                    ? <div className="markdown-body" style={s.markdownBody}><ReactMarkdown remarkPlugins={[remarkGfm]}>{newMessage}</ReactMarkdown></div>
                    : <p style={s.previewPlaceholder}>Ketik sesuatu di tab Edit untuk melihat preview...</p>
                  }
                </div>
              ) : (
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={
                    newType === "image"
                      ? "Contoh: a futuristic city at night, neon lights, cyberpunk style"
                      : newType === "ocr"
                        ? "Contoh: Hanya ekstrak nama dan total harga saja (kosongkan jika ingin mengekstrak semua teks)"
                        : newMsgInputMode === "markdown"
                          ? "# Judul Artikel\n\n## Bagian Utama\n\n- poin satu\n- poin dua\n\nIsi teks panjang di sini..."
                          : "Tempel teks panjang yang ingin dirangkum di sini..."
                  }
                  style={{ ...s.modalInput, minHeight: "110px", resize: "vertical", fontFamily: newMsgInputMode === "markdown" ? "monospace" : "inherit" }}
                  rows={5}
                  disabled={creatingSession}
                />
              )}
            </div>

            {newType === "ocr" && (
              <div style={s.modalField}>
                <label style={s.modalFieldLabel}>Upload Dokumen/Gambar (Maks. 5MB PDF, 2MB Gambar)</label>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  style={{...s.modalInput, padding: "0.5rem"}}
                  onChange={e => handleFileSelect(e, setNewImageBase64, setNewImageFile)}
                  disabled={creatingSession}
                />
              </div>
            )}

            <div style={s.modalActions}>
              <button
                style={{ ...s.btnCreate, ...(creatingSession ? s.btnDisabled : {}) }}
                onClick={handleCreateSession}
                disabled={creatingSession}
              >
                {creatingSession
                  ? <><Spinner size={18} color="#111" /> <span style={{ marginLeft: "0.5rem" }}>Memproses AI...</span></>
                  : "Buat & Proses →"
                }
              </button>
              <button
                style={s.btnCancelModal}
                onClick={() => setShowNewModal(false)}
                disabled={creatingSession}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── STYLES ──────────────────────────────────────────────
const s = {
  pageWrapper: {
    width: "100%", minHeight: "100%", display: "flex", flexDirection: "column",
    gap: "1.75rem", fontFamily: "'SF Pro Display', 'SF Pro', system-ui, sans-serif", color: "#eef2ff",
  },
  hero: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    flexWrap: "wrap", gap: "1.5rem", padding: "2rem", borderRadius: "30px",
    background: "linear-gradient(135deg, rgba(255, 164, 82, 0.14), rgba(25, 39, 76, 0.92))",
    border: "1px solid rgba(255, 156, 59, 0.12)", boxShadow: "0 30px 80px rgba(0, 0, 0, 0.2)",
  },
  heroTextBlock: { flex: "1 1 440px", minWidth: "280px" },
  kicker: { margin: 0, color: "#ffc38d", fontSize: "0.9rem", letterSpacing: "0.24em", textTransform: "uppercase" },
  heroTitle: { margin: "0.75rem 0 0.85rem 0", fontSize: "clamp(2rem, 3vw, 2.8rem)", lineHeight: 1.05, letterSpacing: "-0.035em", color: "#fff1e4" },
  heroText: { margin: 0, color: "#d9d7e5", maxWidth: "720px", fontSize: "1rem", lineHeight: 1.75 },
  heroActions: { display: "flex", gap: "0.8rem", flexWrap: "wrap", alignItems: "center" },
  heroButton: { borderRadius: "999px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#f8f9ff", padding: "0.95rem 1.45rem", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem" },
  heroButtonActive: { border: "1px solid rgba(255, 151, 73, 0.22)", background: "linear-gradient(135deg, rgba(255, 166, 79, 0.22), rgba(255, 255, 255, 0.08))", color: "#fff4e7" },

  layout: { display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.5rem", alignItems: "start", minHeight: "620px" },

  // Sidebar
  sidebar: { borderRadius: "28px", background: "rgba(31, 41, 77, 0.94)", border: "1px solid rgba(255, 156, 60, 0.12)", boxShadow: "0 30px 70px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", overflow: "hidden" },
  sidebarHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  sidebarTitle: { fontWeight: 800, fontSize: "1rem", color: "#fff8f0" },
  btnNew: { borderRadius: "999px", border: "1px solid rgba(255,156,60,0.32)", background: "linear-gradient(135deg, rgba(255,166,79,0.22), rgba(255,255,255,0.06))", color: "#ffcf9a", padding: "0.5rem 1rem", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" },
  sessionList: { listStyle: "none", margin: 0, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "560px", overflowY: "auto" },
  sessionItem: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem 1rem", borderRadius: "18px", cursor: "pointer", border: "1px solid transparent", transition: "all 0.18s ease" },
  sessionItemActive: { background: "linear-gradient(135deg, rgba(255,156,60,0.14), rgba(255,255,255,0.06))", border: "1px solid rgba(255,156,60,0.24)" },
  sessionIcon: { fontSize: "1.4rem", flexShrink: 0 },
  sessionInfo: { flex: 1, minWidth: 0 },
  sessionTitle: { display: "block", fontWeight: 700, fontSize: "0.9rem", color: "#fff7ee", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  sessionMeta: { display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.25rem", alignItems: "center" },
  sessionType: { fontSize: "0.72rem", padding: "0.2rem 0.55rem", borderRadius: "999px", background: "rgba(255,148,66,0.16)", color: "#ffd8b2", fontWeight: 700 },
  sessionCount: { fontSize: "0.72rem", color: "#9aa0b8" },
  sessionDate: { fontSize: "0.72rem", color: "#9aa0b8" },
  sessionActions: { display: "flex", gap: "0.25rem", flexShrink: 0 },
  btnIcon: { background: "transparent", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: "0.3rem", borderRadius: "8px", opacity: 0.6, transition: "opacity 0.2s" },
  renameInput: { width: "100%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,156,60,0.32)", borderRadius: "8px", color: "#fff", padding: "0.25rem 0.5rem", fontSize: "0.9rem", outline: "none" },
  emptyList: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "2.5rem 1rem", textAlign: "center" },
  emptyListIcon: { fontSize: "2.5rem" },
  emptyListText: { color: "#9aa0b8", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 },

  // Chat panel
  chatPanel: { borderRadius: "28px", background: "rgba(28, 34, 57, 0.96)", border: "1px solid rgba(255, 156, 60, 0.12)", boxShadow: "0 30px 70px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", minHeight: "620px", overflow: "hidden" },
  chatHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1.25rem 1.75rem", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  chatHeaderLabel: { margin: 0, color: "#f2c29b", fontSize: "0.78rem", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 },
  chatHeaderTitle: { margin: "0.3rem 0 0", fontSize: "1.2rem", color: "#fff8f0", fontWeight: 800 },
  chatHeaderDate: { fontSize: "0.8rem", color: "#9aa0b8", flexShrink: 0, paddingTop: "0.2rem" },
  messagesArea: { flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  msgRow: { display: "flex", gap: "0.75rem", alignItems: "flex-start" },
  msgRowUser: { flexDirection: "row-reverse" },
  msgAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,148,66,0.18)", display: "grid", placeItems: "center", fontSize: "1rem", flexShrink: 0 },
  msgAvatarUser: { width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", fontSize: "1rem", flexShrink: 0 },
  msgBubble: { maxWidth: "75%", padding: "0.9rem 1.15rem", borderRadius: "20px 20px 20px 4px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" },
  msgBubbleUser: { borderRadius: "20px 20px 4px 20px", background: "rgba(255,148,66,0.14)", border: "1px solid rgba(255,156,60,0.2)" },
  msgText: { margin: 0, fontSize: "0.95rem", lineHeight: 1.7, color: "#f3e7d7", whiteSpace: "pre-wrap" },
  msgImage: { width: "100%", maxWidth: "480px", borderRadius: "16px", display: "block" },
  imgActions: { marginTop: "0.75rem" },
  msgTime: { display: "block", fontSize: "0.72rem", color: "#6b7394", marginTop: "0.5rem", textAlign: "right" },
  typingDots: { display: "flex", alignItems: "center", padding: "0.15rem 0" },

  // Input area
  inputArea: { padding: "1.25rem 1.75rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "0.75rem" },
  modelSelect: { width: "fit-content", padding: "0.6rem 0.9rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "#f7ede2", outline: "none", fontSize: "0.85rem" },
  inputRow: { display: "flex", gap: "0.75rem", alignItems: "flex-end" },
  inputTextarea: { flex: 1, padding: "0.85rem 1rem", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#f8f5ef", outline: "none", resize: "none", fontSize: "0.95rem", lineHeight: 1.6 },
  btnSend: { minWidth: "90px", minHeight: "52px", borderRadius: "18px", border: "none", background: "linear-gradient(135deg, #ffb56e, #ff8f48)", color: "#111827", fontWeight: 800, cursor: "pointer", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" },
  btnDisabled: { opacity: 0.55, cursor: "not-allowed" },
  inputHint: { margin: 0, fontSize: "0.75rem", color: "#6b7394" },

  // Markdown mode toggle
  modeToggleRow: { display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" },
  modeToggleBtn: { padding: "0.3rem 0.8rem", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)", color: "#c8bfb0", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.18s ease" },
  modeToggleBtnActive: { background: "rgba(255,156,60,0.2)", borderColor: "rgba(255,156,60,0.4)", color: "#ffcf9a" },
  mdHintBadge: { fontSize: "0.72rem", color: "#7a7f9a", fontStyle: "italic" },

  // Preview tabs
  previewTabRow: { display: "flex", gap: "0", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", width: "fit-content" },
  previewTab: { padding: "0.3rem 1rem", border: "none", background: "rgba(255,255,255,0.04)", color: "#9aa0b8", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease" },
  previewTabActive: { background: "rgba(255,156,60,0.18)", color: "#ffcf9a" },
  previewBox: { flex: 1, minHeight: "52px", maxHeight: "260px", overflowY: "auto", padding: "0.85rem 1rem", borderRadius: "18px", border: "1px solid rgba(255,156,60,0.2)", background: "rgba(255,156,60,0.04)" },
  previewPlaceholder: { margin: 0, color: "#5a6080", fontSize: "0.85rem", fontStyle: "italic" },

  // Markdown rendered output (AI bubble)
  markdownBody: { fontSize: "0.95rem", lineHeight: 1.75, color: "#f3e7d7", overflowWrap: "break-word", wordBreak: "break-word", maxWidth: "100%" },

  // Modal field header (label + toggle in same row)
  modalFieldHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" },

  // Empty state
  centered: { flex: 1, display: "grid", placeItems: "center", padding: "3rem" },
  emptyChat: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "3rem", textAlign: "center" },
  emptyIcon: { width: "76px", height: "76px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "grid", placeItems: "center", fontSize: "2.2rem" },
  emptyTitle: { margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#fff8ee" },
  emptyText: { margin: 0, maxWidth: "320px", color: "#9aa0b8", lineHeight: 1.7, fontSize: "0.95rem" },
  btnCreateFirst: { marginTop: "0.5rem", borderRadius: "999px", border: "1px solid rgba(255,156,60,0.32)", background: "linear-gradient(135deg, rgba(255,166,79,0.22), rgba(255,255,255,0.06))", color: "#ffcf9a", padding: "0.75rem 1.5rem", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem" },

  // Modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 999, padding: "1rem" },
  modal: { width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", borderRadius: "28px", background: "rgba(31, 41, 77, 0.98)", border: "1px solid rgba(255, 156, 60, 0.18)", boxShadow: "0 40px 100px rgba(0,0,0,0.5)", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  modalLabel: { margin: 0, color: "#f2c29b", fontSize: "0.78rem", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 },
  modalTitle: { margin: "0.3rem 0 0", fontSize: "1.3rem", color: "#fff8f0", fontWeight: 800 },
  btnClose: { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "999px", width: "36px", height: "36px", cursor: "pointer", color: "#edf2ff", fontWeight: 700, display: "grid", placeItems: "center" },
  typeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" },
  typeCard: { padding: "1rem", borderRadius: "18px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#f2ede8", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.35rem" },
  typeCardActive: { background: "linear-gradient(135deg, rgba(255,156,60,0.16), rgba(255,255,255,0.08))", borderColor: "rgba(255,156,60,0.32)", boxShadow: "0 8px 24px rgba(255,141,61,0.12)" },
  typeIcon: { fontSize: "1.5rem" },
  typeLabel: { fontWeight: 700, fontSize: "0.9rem", color: "#fff7ee" },
  typeDesc: { fontSize: "0.78rem", color: "#c8bfb0", lineHeight: 1.4 },
  modalField: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  modalFieldLabel: { fontSize: "0.88rem", fontWeight: 600, color: "#e6d8ca" },
  modalInput: { width: "100%", padding: "0.85rem 1rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "#f7f1e8", outline: "none", fontSize: "0.95rem", fontFamily: "inherit", boxSizing: "border-box" },
  modalActions: { display: "flex", gap: "0.75rem", marginTop: "0.25rem" },
  btnCreate: { flex: 1, minHeight: "50px", borderRadius: "18px", border: "none", background: "linear-gradient(135deg, #ffb56e, #ff8f48)", color: "#111827", fontWeight: 800, cursor: "pointer", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" },
  btnCancelModal: { minHeight: "50px", borderRadius: "18px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.08)", color: "#f7ece1", padding: "0 1.4rem", cursor: "pointer", fontWeight: 700 },
  btnDownload: { borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #ffb56e, #ff8f48)", color: "#111827", padding: "0.6rem 1rem", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" },
  btnUpload: { cursor: "pointer", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "18px", padding: "0 1rem", color: "#f3e7d7", fontSize: "0.85rem", display: "grid", placeItems: "center", minHeight: "52px", fontWeight: 600, whiteSpace: "nowrap" }
}
