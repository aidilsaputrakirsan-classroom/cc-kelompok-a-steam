import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Header from '../Header'

describe('Header Component', () => {
  it('menampilkan judul aplikasi dengan benar', () => {
    render(<Header totalItems={0} isConnected={true} isDark={true} onToggleDark={() => {}} />)

    // Sesuaikan dengan teks judul di Header proyekmu (Inti Rupa)
    expect(screen.getByText(/Inti Rupa/i)).toBeInTheDocument()
    // Mengecek sub-judul
    expect(screen.getByText(/AI Platform — Komputasi Awan ITK/i)).toBeInTheDocument()
  })

  it('menampilkan nama user dan tombol logout jika user login', () => {
    const mockUser = { full_name: "Aidil Saputra", email: "aidil@example.com" }

    render(<Header totalItems={0} isConnected={true} user={mockUser} isDark={true} onToggleDark={() => {}} />)

    // Harus memunculkan nama
    expect(screen.getByText(/👤 Aidil Saputra/i)).toBeInTheDocument()
    // Harus memunculkan tombol logout
    expect(screen.getByText(/🚪 Logout/i)).toBeInTheDocument()
  })

  it('menampilkan tombol dark mode toggle di header', () => {
    render(<Header isDark={true} onToggleDark={() => {}} />)

    // Tombol toggle harus ada (dengan id unik)
    const toggleBtn = screen.getByRole('button', { name: /switch to light mode/i })
    expect(toggleBtn).toBeInTheDocument()
    // Dalam mode dark, icon harus ☀️
    expect(toggleBtn).toHaveTextContent('☀️')
    expect(toggleBtn).toHaveTextContent('Light')
  })

  it('menampilkan ikon 🌙 saat sedang dalam light mode', () => {
    render(<Header isDark={false} onToggleDark={() => {}} />)

    const toggleBtn = screen.getByRole('button', { name: /switch to dark mode/i })
    expect(toggleBtn).toBeInTheDocument()
    expect(toggleBtn).toHaveTextContent('🌙')
    expect(toggleBtn).toHaveTextContent('Dark')
  })

  it('memanggil onToggleDark saat tombol toggle diklik', () => {
    const mockToggle = vi.fn()
    render(<Header isDark={false} onToggleDark={mockToggle} />)

    const toggleBtn = screen.getByRole('button', { name: /switch to dark mode/i })
    fireEvent.click(toggleBtn)

    expect(mockToggle).toHaveBeenCalledTimes(1)
  })
})
