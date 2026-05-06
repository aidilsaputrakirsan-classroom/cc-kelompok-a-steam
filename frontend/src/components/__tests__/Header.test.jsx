import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Header from '../Header'

describe('Header Component', () => {
  it('menampilkan judul aplikasi dengan benar', () => {
    render(<Header totalItems={0} isConnected={true} />)
    
    // Sesuaikan dengan teks judul di Header proyekmu (Inti Rupa)
    expect(screen.getByText(/Inti Rupa/i)).toBeInTheDocument()
    // Mengecek sub-judul
    expect(screen.getByText(/AI Platform — Komputasi Awan ITK/i)).toBeInTheDocument()
  })

  it('menampilkan jumlah total sesi/items dengan format yang benar', () => {
    render(<Header totalItems={5} isConnected={true} />)
    
    // Sesuaikan dengan format teks badge milikmu
    expect(screen.getByText(/📦 5 items/i)).toBeInTheDocument()
  })

  it('menampilkan status koneksi Online saat isConnected true', () => {
    render(<Header totalItems={0} isConnected={true} />)
    
    expect(screen.getByText(/🟢 Online/i)).toBeInTheDocument()
  })

  it('menampilkan status koneksi Offline saat isConnected false', () => {
    render(<Header totalItems={0} isConnected={false} />)
    
    expect(screen.getByText(/🔴 Offline/i)).toBeInTheDocument()
  })

  it('menampilkan nama user dan tombol logout jika user login', () => {
    const mockUser = { full_name: "Aidil Saputra", email: "aidil@example.com" }
    
    render(<Header totalItems={0} isConnected={true} user={mockUser} />)
    
    // Harus memunculkan nama
    expect(screen.getByText(/👤 Aidil Saputra/i)).toBeInTheDocument()
    // Harus memunculkan tombol logout
    expect(screen.getByText(/🚪 Logout/i)).toBeInTheDocument()
  })
})
