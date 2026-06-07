# Panduan Git Workflow & Branching Strategy — Cloud Team STEAM

Dokumen ini berisi standar workflow Git dan strategi branching yang digunakan oleh tim Cloud STEAM untuk menjaga kualitas kode dan kolaborasi yang rapi.

---

## 1. Branch Naming Convention

Format nama branch harus mengikuti pola: `tipe/deskripsi-singkat` (menggunakan lowercase dan kebab-case).

| Tipe Branch | Keterangan | Contoh |
| :--- | :--- | :--- |
| `feature/` | Menambah fitur baru ke dalam aplikasi | `feature/dark-mode`, `feature/health-endpoint` |
| `fix/` | Memperbaiki bug atau error | `fix/login-token-expired` |
| `docs/` | Melakukan pembaruan pada dokumentasi | `docs/git-workflow-guide` |
| `refactor/` | Perbaikan struktur kode tanpa mengubah fungsionalitas | `refactor/cleanup-api` |
| `chore/` | Maintenance, konfigurasi dependency, atau setup repositori | `chore/update-requirements` |

---

## 2. Commit Message Convention

Kita menggunakan standar **Conventional Commits** dengan format:
`tipe: deskripsi singkat`

| Tipe | Keterangan | Contoh |
| :--- | :--- | :--- |
| `feat` | Fitur baru | `feat: add user profile page` |
| `fix` | Bug fix | `fix: resolve JWT token expiry issue` |
| `docs` | Dokumentasi | `docs: update API documentation` |
| `refactor` | Pembenahan kode | `refactor: extract auth logic` |
| `chore` | Maintenance / Config | `chore: add codeowners file` |

---

## 3. Pull Request (PR) & Code Review

Semua perubahan kode wajib digabungkan melalui Pull Request (PR). Direct push ke `main` diblokir oleh **Branch Protection Rules**.

### Alur Kerja Pull Request:
1. Pastikan Anda menarik kode terbaru dari main sebelum membuat branch baru:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/nama-fitur
   ```
2. Selesaikan fitur, commit, dan push branch Anda ke remote repositori.
3. Buat Pull Request di GitHub.
4. Gunakan PR template yang tersedia dan deskripsikan perubahan dengan jelas.
5. Reviewer otomatis akan ditugaskan berdasarkan file `.github/CODEOWNERS`:
   - `/backend/` -> `@IrfanZakiRiyanto`
   - `/frontend/` -> `@Incharaghil`
   - Docker & Makefile -> `@JonathanCristopherJetro`
   - README & `/docs/` -> `@Jonathan-Joseph-yudita`
6. Reviewer harus memberikan umpan balik substantif (approval atau request changes).
7. Setelah disetujui (minimal 1 approval), lakukan **Squash and Merge** untuk menjaga history branch `main` tetap bersih.
