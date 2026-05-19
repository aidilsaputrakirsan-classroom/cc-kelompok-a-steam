# Deployment and Rollback Guide — Cloud App Full-Stack

Dokumentasi ini menjelaskan mekanisme deployment otomatis menggunakan pipeline CI/CD (GitHub Actions ke Railway), fitur automated health check, serta instruksi lengkap untuk melakukan **rollback manual** apabila terjadi kegagalan di production.

---

## 🚀 1. Alur CD (Continuous Deployment) Otomatis

Setiap kali kode di-merge ke branch `main`, GitHub Actions akan memicu job **`Deploy to Railway`**:
1. **Build Verification:** Seluruh pengujian (pytest & vitest) dan pembuatan Docker images harus sukses terlebih dahulu.
2. **Railway Push:** Kode backend dan frontend dikirim ke service masing-masing di Railway menggunakan Railway CLI.
3. **🩺 Automated Health Check (Baru):** 
   Setelah deployment dikirim, runner akan menunggu selama 20 detik, kemudian memanggil:
   * **Backend Health Check:** Memastikan endpoint `https://cc-kelompok-a-steam-production.up.railway.app/health` mengembalikan status `"healthy"`.
   * **Frontend Health Check:** Memastikan URL `https://cc-kelompok-a-steam-production-51bf.up.railway.app` merespons dengan HTTP status `200 OK`.
   * **Jika salah satu health check gagal**, workflow GitHub Actions akan ditandai sebagai **Failed (Gagal/Merah)** dan memberikan peringatan instan kepada tim.

---

## 🛠️ 2. Instruksi Rollback Manual di Railway

Jika terjadi situasi darurat di mana deployment baru lolos pengujian tetapi merusak sistem di production (atau jika automated health check di CD mendeteksi kegagalan), Anda harus melakukan **Rollback** ke versi stabil sebelumnya secara instan melalui dashboard Railway.

### Langkah-Langkah Rollback:

1. **Buka Dashboard Railway:**
   Masuk ke **[railway.app](https://railway.app/)** dan buka project **`inti-rupa`** (atau nama project Anda).

2. **Pilih Service yang Bermasalah:**
   Klik pada kotak service yang ingin Anda rollback (misalnya klik **`backend`** jika backend bermasalah, atau **`cc-kelompok-a-steam`** jika frontend bermasalah).

3. **Buka Tab Deployments:**
   Di menu detail service sebelah kanan, klik tab **`Deployments`** (terletak di antara tab *Variables* dan *Metrics*). Anda akan melihat daftar seluruh riwayat deployment Anda.

4. **Cari Versi Stabil Terakhir:**
   * Riwayat deployment diurutkan dari yang paling baru ke lama.
   * Temukan deployment sebelumnya yang berwarna **Hijau (Active)** sebelum deployment yang rusak dipublikasikan.

5. **Lakukan Redeploy (Rollback):**
   * Klik ikon **Tiga Titik (`...`)** di sebelah kanan baris deployment stabil yang Anda pilih.
   * Pilih opsi **`Redeploy`**.
   * Konfirmasikan tindakan tersebut.

6. **Verifikasi:**
   Railway akan mengaktifkan kembali image kontainer versi stabil tersebut dalam waktu kurang dari 10 detik. Periksa kembali URL production Anda untuk memastikan sistem telah pulih kembali ke kondisi normal.

---

## 🩺 3. Contoh Skenario Kegagalan & Penanganan

| Skenario | Dampak pada GitHub Actions | Tindakan Penanganan |
| :--- | :--- | :--- |
| Bug pada logika auth backend lolos pytest, tapi merusak koneksi DB di cloud. | **Workflow Gagal** di step `Automated Health Check` (karena API `/health` mengembalikan HTTP 500 atau timeout). | Lakukan **Rollback** pada service `backend` ke deployment hijau terakhir di Railway. Perbaiki bug secara lokal, buat commit baru, lalu dorong kembali ke `main`. |
| Bundle frontend gagal dimuat karena file Javascript utama corrupt setelah build. | **Workflow Gagal** di step `Automated Health Check` (karena homepage mengembalikan HTTP 502/404). | Lakukan **Rollback** pada service `cc-kelompok-a-steam` ke deployment hijau terakhir. |
