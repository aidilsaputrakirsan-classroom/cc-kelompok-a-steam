## Cloud App - STEAM 

### 📖 Deskripsi Proyek

**Inti Rupa** adalah platform asisten cerdas berbasis cloud yang dirancang untuk membantu pengguna mengolah informasi secara lebih efisien. Aplikasi ini menggabungkan kekuatan **Analisis Teks** dan **Kreativitas Visual** dalam satu platform terintegrasi.

Dengan fitur **Summarizer**, pengguna dapat mengekstrak *"Inti"* dari artikel panjang maupun foto dokumen hanya dalam hitungan detik. Didukung fitur **Generator**, pengguna juga dapat menciptakan *"Rupa"* visual baru cukup dengan memberikan perintah teks sederhana.

**Inti Rupa** hadir sebagai solusi *all-in-one* bagi siapa saja yang ingin **memahami informasi lebih cepat** dan **berkreasi tanpa batas**.

#### ✨ Fitur Utama
| Fitur | Deskripsi |
| :--- | :--- |
| 🌐 Web Scraper & Summarizer | Mengambil teks dari URL artikel yang diberikan|
| 🖼️ Visual-to-Text Summarizer | Melakukan OCR pada gambar yang diunggah untuk mengekstrak teks, kemudian merangkum isinya |
| 🗂️ History & Cache | Menyimpan riwayat ringkasan di database agar pengguna bisa melihat kembali hasil sebelumnya tanpa memproses ulang |
| 🎨 AI Image Generator ⭐ | Generate gambar secara otomatis berdasarkan deskripsi atau prompt yang diberikan pengguna |

---

### 🏗️ Architecture Overview

Sistem **Inti Rupa** menggunakan arsitektur **client-server** berbasis cloud. Frontend (React) berjalan di browser dan berkomunikasi dengan Backend (FastAPI) melalui HTTP request. Backend bertugas memproses setiap permintaan: scraping URL, OCR gambar, atau generate gambar sebelum diteruskan ke **Hugging Face API** sebagai AI nya. Setiap hasil diproses melalui **Cache Checker** terlebih dahulu untuk menghemat penggunaan API, lalu disimpan di **PostgreSQL Database** sebagai riwayat.

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│                      (React Frontend)                       │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP Request
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                        │
│                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐   │
│  │   Web     │  │   OCR     │  │  History  │  │  Image  │   │
│  │ Scraper   │  │  Module   │  │  Endpoint │  │  Gen    │   │
│  │ Endpoint  │  │ Endpoint  │  │           │  │Endpoint │   │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬───┘   │
│        └──────────────┼──────────────┘              │       │
│                       │        ┌────────────────────┘       │
│              ┌────────┴────────┐                            │
│              │  Cache Checker  │                            │
│              └────────┬────────┘                            │
└───────────────────────┼─────────────────────────────────────┘
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
┌──────────────────────┐  ┌────────────────────────┐
│  Hugging Face API    │  │  PostgreSQL Database   │
│  - Summarizer        │  │  (History & Cache)     │
│  - Image Generator   │  │                        │
└──────────────────────┘  └────────────────────────┘
```

---

### 👥 Team Member
| Nama | NIM | Peran |
| :--- | :--- | :--- |
| Irfan Zaki Riyanto  | 10231045 | Lead Backend |
| Incha Raghil | 10231043 | Lead Frontend |
| Jonathan Cristopher Jetro | 10231047 | Lead DevOps|
| Jonathan Joseph Yudita Tampubolon | 10231048 | Lead Lead QA & Docs |


### 🛠️ Tech Stack

| Teknologi | Fungsi |
| :--- | :--- | 
| FastAPI | Backend REST API |
| React | Frontend SPA |
| PostgreSQL | Database |
| Docker | Containerization |
| GitHub Actions | GitHub Actions |
| Railway/Render | Cloud Deployment |
| Hugging Face API | Generative AI (Summarizer & Image Generator) |

---

### 📅 Roadmap

| Minggu | Target | Status |
| :--- | :--- | :---: |
| 1 | Setup & Hello World | ✅ |
| 2 | REST API + Database | ⬜ |
| 3 | React Frontend | ⬜ |
| 4 | Full-Stack Integration | ⬜ |
| 5-7 | Docker & Compose | ⬜ |
| 8 | UTS Demo | ⬜ |
| 9-11 | CI/CD Pipeline | ⬜ |
| 12-14 | Microservices | ⬜ |
| 15-16 | Final & UAS | ⬜ |


## 🧪 Hasil Pengujian API 

Berikut adalah detail skenario pengujian yang telah dilakukan

### 1. POST /items — Inisialisasi Data
![POST Items](docs/image.png)
Tahap awal dilakukan dengan menambahkan 3 item ke dalam database untuk menguji fitur *Create*. Salah satu contoh data yang dimasukkan adalah:
* **Name**: "Laptop" (Wajib, 1-100 karakter)
* **Price**: 15.000.000 (Wajib, > 0)
* **Description**: "Laptop untuk cloud computing" (Opsional)
* **Quantity**: 5 (Default: 0)

### 2. GET /items — Verifikasi List Data
![GET All Items](docs/images/image-1.png)
Melakukan query `GET` untuk menarik seluruh data. Hasil menunjukkan bahwa item-item yang telah didaftarkan berhasil tersimpan secara persisten ke dalam database PostgreSQL dan ditampilkan dalam format JSON dengan total item yang sesuai.

### 3. GET /items/{id} — Pencarian Spesifik
![GET Item By ID](docs/images/image-2.png)
Menguji pengambilan data item tunggal menggunakan path parameter `id`. Pada pengujian ini, memanggil ID `4` berhasil mengembalikan data item "Laptop" secara akurat sesuai dengan record di database.

### 4. GET /items/stats — Analisis Statistik
![GET Stats](docs/images/image-8.png)
Menguji endpoint ringkasan untuk melihat performa inventaris. Fungsi ini mengembalikan:
* `total_items`: Menghitung kuantitas unik item di database.
* `total_value`: Akumulasi nilai aset (Price × Quantity).
* `most_expensive`: Identifikasi item dengan harga tertinggi.
* `cheapest`: Identifikasi item dengan harga terendah.

### 5. PUT /items/{id} — Pembaruan Data (Update)
![PUT Update Item](docs/images/image-3.png)
Melakukan pengujian perubahan data pada item ID `4`. Skenario yang dijalankan adalah menurunkan harga Laptop dari **15.000.000** menjadi **14.000.000**. Sistem berhasil merespon dengan status `200 OK`.

### 6. GET /items/{id} — Verifikasi Pasca-Update
![Verify Update](docs/images/image-4.png)
Melakukan pengecekan ulang pada ID `4` untuk memastikan perubahan bersifat permanen. Gambar menunjukkan database telah sukses memperbarui field `price` menjadi **14.000.000**.

### 7. GET /items (Search) — Filter & Query Parameter
![Search Item](docs/images/image-5.png)
Menguji fitur pencarian menggunakan query parameter `?search=laptop`. Sistem berhasil melakukan filter dan hanya menampilkan item yang relevan dengan kata kunci tersebut.

### 8. DELETE /items/{id} — Penghapusan Data
![DELETE Item](docs/images/image-6.png)
Melaku  kan penghapusan data item "Laptop" (ID `4`). Proses ini menghasilkan respon **204 No Content**, yang berarti permintaan berhasil diproses dan data telah dihapus dari server.

### 9. GET /items/{id} — Uji Validasi 404
![GET 404 Not Found](docs/images/image-7.png)
Sebagai tahap akhir QA, dilakukan pemanggilan kembali terhadap ID `4` yang sudah dihapus. Sistem dengan benar mengembalikan status **404 Not Found**, membuktikan bahwa proses penghapusan data telah sinkron antara API dan Database.

---

## Kesimpulan 
Berdasarkan serangkaian tes di atas, seluruh fungsionalitas **Backend REST API** pada Modul 2 dinyatakan **Stabil** dan layak untuk dilanjutkan ke tahap integrasi Frontend pada minggu berikutnya.




---

## 🧪 Analisis Authentication & API

Laporan ini mendokumentasikan hasil pengujian fitur keamanan menggunakan **JWT (JSON Web Token)** dan integrasi sistem autentikasi 

---

### 1. Form Login — Gerbang Autentikasi
![Login Page](docs/images/modul4_1.jpeg)
Tahap awal pengujian dilakukan pada halaman Login untuk memastikan sistem keamanan aktif. Pengguna diwajibkan memasukkan kredensial berupa Email dan Password (minimal 8 karakter) sebelum diizinkan mengakses resource inventaris.

### 2. Form Registrasi — Pendaftaran Akun Baru
![Register Page](docs/images/modul4_2.jpeg)
Dilakukan pengujian pada fitur pendaftaran user baru. Input yang divalidasi meliputi Nama Lengkap, Email institusi (@student.itk.ac.id), dan Password yang nantinya akan diproses menggunakan algoritma hashing di sisi database.

### 3. Redirect Login — Validasi Pasca-Registrasi
![Redirect to Login](docs/images/modul4_3.jpeg)
Setelah proses registrasi berhasil, sistem secara otomatis mengalihkan pengguna kembali ke halaman Login. Hal ini membuktikan bahwa alur pendaftaran telah tersinkronisasi dengan baik antara Frontend dan API pendaftaran.

### 4. Toast Sukses Login — Verifikasi Token JWT
![Login Success Toast](docs/images/modul4_4.jpeg)
Saat kredensial benar, sistem menampilkan notifikasi "Login berhasil! Selamat datang kembali!". Secara teknis, ini menandakan bahwa browser telah berhasil menerima **Access Token (JWT)** dari server dan menyimpannya untuk otorisasi akses selanjutnya.

### 5. Toast Validasi Input — Proteksi Form Kosong
![Validation Error Toast](docs/images/modul4_5.jpeg)
Pengujian dilakukan dengan mencoba menambah data tanpa mengisi field "Nama Item". Sistem merespons dengan pesan peringatan merah "Nama item wajib diisi", membuktikan adanya validasi client-side yang mencegah pengiriman data tidak lengkap ke database.

### 6. Toast Tambah Item — Konfirmasi Create Data
![Add Item Success Toast](docs/images/modul4_6.jpeg)
Gambar menunjukkan notifikasi sukses setelah item baru berhasil diinput ke dalam sistem. Hal ini mengonfirmasi bahwa permintaan `POST` telah menyertakan token autentikasi yang sah sehingga diizinkan oleh sistem Middleware.

### 7. Toast Update Item — Konfirmasi Perubahan Data
![Update Item Success Toast](docs/images/modul4_7.jpeg)
Dilakukan pengujian pada fitur pembaruan data yang menghasilkan pesan "Item berhasil diperbarui!". Respon ini memastikan bahwa perubahan data pada item spesifik telah berhasil disimpan secara permanen di server.

### 8. Header Dinamis — Manajemen Sesi Aktif
![Header Authenticated](docs/images/modul4_8.jpeg)
Setelah login, komponen Header diperbarui secara dinamis dengan menampilkan alamat email pengguna yang sedang aktif dan status "Online". Selain itu, tersedia tombol "Logout" yang berfungsi untuk menghapus sesi dan token pengguna.

### 9. Persistensi Data — Relasi User & Items
![Data Persistence](docs/images/modul4_9.jpeg)
Pengujian dilakukan dengan keluar (*logout*) dan masuk kembali untuk melihat data inventaris (contoh: item "Nimbus 7000"). Sistem berhasil menampilkan kembali data yang relevan dengan akun tersebut, membuktikan relasi antar tabel user dan items di database berfungsi sempurna.

### 10. Loading Spinner — Pengalaman Pengguna (UX)
![Loading State](docs/images/modul4_10.jpeg)
Saat sistem sedang melakukan pengambilan data dari API, muncul indikator pemuatan berupa spinner. Komponen ini penting untuk memberi tahu pengguna bahwa proses sinkronisasi sedang berlangsung, sehingga aplikasi terasa lebih responsif.

---

## Kesimpulan QA
Berdasarkan hasil pengujian Gambar 1-10, seluruh fungsionalitas **Authentication & Middleware** pada Modul 4 dinyatakan **Lulus Uji**. Integrasi JWT berhasil mengamankan akses data, sementara elemen UI (Toast & Spinner) memberikan pengalaman pengguna yang informatif dan profesional.