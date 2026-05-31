import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getChatSessions, createChatSession, continueChatSession, setToken } from '../services/api'

// Mock fetch global bawaan browser
globalThis.fetch = vi.fn()

describe('API Service - Chat Sessions', () => {
  // Bersihkan riwayat mock sebelum tiap test
  beforeEach(() => {
    fetch.mockClear()
    // Set token agar terbaca di header Authorization
    setToken('fake-token-123')
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000')
  })

  it('getChatSessions memanggil endpoint yang benar dengan header Authorization', async () => {
    // Skenario API sukses
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: 1, title: 'Test Sesi' }],
    })

    const data = await getChatSessions(0, 30)

    // Pastikan fetch dipanggil ke URL yang benar
    expect(fetch).toHaveBeenCalledWith('http://localhost/chat/sessions?skip=0&limit=30', {
      headers: { 'Authorization': 'Bearer fake-token-123' }
    })
    
    // Pastikan data yang direturn sesuai
    expect(data).toEqual([{ id: 1, title: 'Test Sesi' }])
  })

  it('createChatSession mengirim payload POST dengan benar', async () => {
    // Skenario API sukses
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 2, title: 'Gambar Kucing', session_type: 'image' }),
    })

    const payload = { title: 'Gambar Kucing', session_type: 'image', first_message: 'Kucing oren' }
    const data = await createChatSession(payload)

    // Pastikan fetch dipanggil dengan method POST dan body JSON yang benar
    expect(fetch).toHaveBeenCalledWith('http://localhost/chat/sessions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-123' 
      },
      body: JSON.stringify(payload)
    })
    
    expect(data.id).toBe(2)
  })

  it('handle error saat server backend mati (Network Error)', async () => {
    // Skenario server down
    fetch.mockRejectedValueOnce(new Error('Failed to fetch'))

    // Pastikan fungsi kita melempar error yang sama
    await expect(
      getChatSessions()
    ).rejects.toThrow('Failed to fetch')
  })

  it('handle error saat backend mengembalikan status 400 Bad Request', async () => {
    // Skenario user salah masukin input
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Format teks tidak valid' }),
    })

    await expect(
      continueChatSession(1, { message: '' })
    ).rejects.toThrow('Format teks tidak valid')
  })
})
