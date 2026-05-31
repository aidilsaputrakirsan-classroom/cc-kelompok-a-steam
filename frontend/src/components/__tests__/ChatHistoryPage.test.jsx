import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ChatHistoryPage from '../ChatHistoryPage'
import * as api from '../../services/api'

// Memalsukan (Mock) pemanggilan API agar tidak menembak backend sungguhan saat testing UI
vi.mock('../../services/api', () => ({
  getChatSessions: vi.fn(),
  getChatSessionById: vi.fn(),
  createChatSession: vi.fn(),
}))

const mockSessions = [
  { id: 1, title: 'Sesi Generate AI Anime', session_type: 'image', message_count: 2, updated_at: '2026-05-01T10:00:00Z' },
  { id: 2, title: 'Rangkuman Materi Kuliah', session_type: 'summarize', message_count: 4, updated_at: '2026-05-02T11:00:00Z' }
]

describe('ChatHistoryPage Component', () => {
  // Reset mock sebelum setiap pengujian agar tidak saling bertabrakan
  beforeEach(() => {
    vi.resetAllMocks()
    
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem(key) { return store[key] || null; },
        setItem(key, value) { store[key] = value.toString(); },
        removeItem(key) { delete store[key]; },
        clear() { store = {}; }
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  })

  it('menampilkan status kosong jika user belum pernah membuat sesi chat', async () => {
    // Skenario: API mengembalikan array kosong
    api.getChatSessions.mockResolvedValue([])

    render(<ChatHistoryPage showToast={vi.fn()} />)

    // Karena proses fetch API bersifat asinkron, kita harus memakai waitFor
    await waitFor(() => {
      expect(screen.getByText(/Belum ada sesi/i)).toBeInTheDocument()
      expect(screen.getByText(/Mulai berkarya di Inti Studio/i)).toBeInTheDocument()
    })
  })

  it('menampilkan daftar riwayat chat/sesi dari API dengan benar', async () => {
    // Skenario: API mengembalikan 2 data dummy
    api.getChatSessions.mockResolvedValue(mockSessions)

    render(<ChatHistoryPage showToast={vi.fn()} />)

    await waitFor(() => {
      // Pastikan kedua judul muncul di sidebar
      expect(screen.getByText('Sesi Generate AI Anime')).toBeInTheDocument()
      expect(screen.getByText('Rangkuman Materi Kuliah')).toBeInTheDocument()
    })
  })

  it('memunculkan popup/modal saat tombol "+ Baru" diklik', async () => {
    api.getChatSessions.mockResolvedValue([])
    render(<ChatHistoryPage showToast={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText(/Belum ada sesi/i)).toBeInTheDocument()
    })

    // Cari tombol "+ Baru" dan klik (simulasi klik user)
    const newButtons = screen.getAllByText(/\+ Baru/i)
    fireEvent.click(newButtons[0]) // Klik tombol + Baru yang ada di sidebar

    // Pastikan Modal UI muncul
    expect(screen.getByText(/Buat Sesi Baru di Inti Studio/i)).toBeInTheDocument()
    expect(screen.getByText(/Pilih jenis aktivitas & mulai/i)).toBeInTheDocument()
  })
})
