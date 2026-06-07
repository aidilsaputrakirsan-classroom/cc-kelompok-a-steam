import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AboutUs from '../AboutUs'

describe('AboutUs Component', () => {
  it('merender halaman About dengan judul utama yang benar', () => {
    render(<AboutUs />)
    // Heading h1 harus ada
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    // Gunakan exact heading role untuk menghindari ambiguity
    expect(screen.getByRole('heading', { name: /About/i, level: 1 })).toBeInTheDocument()
  })

  it('menampilkan section Tech Stack dengan 4 kategori teknologi', () => {
    render(<AboutUs />)
    // Heading section Tech Stack
    expect(screen.getByText(/Tech Stack/i)).toBeInTheDocument()
    // Empat kategori tech stack harus terlihat (match heading h3 exact)
    expect(screen.getByRole('heading', { name: 'Backend', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Frontend', level: 3 })).toBeInTheDocument()
    expect(screen.getByText('Container & Infra')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'CI/CD', level: 3 })).toBeInTheDocument()
  })

  it('menampilkan section Our Team dengan tabel anggota tim', () => {
    render(<AboutUs />)
    // Heading "Our Team" harus ada
    expect(screen.getByRole('heading', { name: /Our Team/i, level: 2 })).toBeInTheDocument()
    // Kolom tabel Nama, NIM, Peran harus ada
    expect(screen.getByText('Nama')).toBeInTheDocument()
    expect(screen.getByText('NIM')).toBeInTheDocument()
    expect(screen.getByText('Peran')).toBeInTheDocument()
    // Minimal 1 baris anggota tim ada
    expect(screen.getByText('Irfan Zaki Riyanto')).toBeInTheDocument()
    expect(screen.getByText('Lead Backend')).toBeInTheDocument()
  })

  it('menampilkan Core Features dengan AI Image Generator dan AI Summarizer', () => {
    render(<AboutUs />)
    // Target heading h3 secara spesifik agar tidak ambiguous dengan teks di paragraf
    expect(screen.getByRole('heading', { name: 'AI Image Generator', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'AI Summarizer', level: 3 })).toBeInTheDocument()
  })

  it('menampilkan section Vision dan Mission', () => {
    render(<AboutUs />)
    expect(screen.getByRole('heading', { name: /Vision/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Mission/i, level: 2 })).toBeInTheDocument()
  })
})
