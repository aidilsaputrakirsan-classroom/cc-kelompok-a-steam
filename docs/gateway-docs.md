# API Gateway Documentation

## Overview
Layanan **Gateway** pada proyek Inti Rupa berfungsi sebagai pintu masuk tunggal (API Gateway) berbasis Nginx untuk merutekan seluruh traffic dari frontend menuju microservices yang tepat (Auth Service dan AI Service) yang berjalan di backend. Gateway ini juga menangani rate limiting dan custom DNS resolver IPv6 internal dari Railway.

## Arsitektur Routing Nginx
Konfigurasi utama berada di `services/gateway/nginx.conf`. Berikut adalah arsitektur routing yang diterapkan:

1. **Auth Service (`/auth/`)**
   - Merutekan traffic ke `auth-service.railway.internal:8001`.
   - Rate Limit: 5 requests/sec.
   - Digunakan untuk proses login, register, dan manajemen sesi.

2. **AI Service (`/chat/`, `/items/`)**
   - Merutekan traffic ke `ai-service.railway.internal:8002`.
   - Rate Limit: 20 requests/sec.
   - Digunakan untuk fitur AI chat dan status manajemen item.

3. **Global Health Check (`/health`)**
   - Endpoint internal Nginx untuk memastikan container gateway berjalan normal (mengembalikan JSON status healthy).
   - Dimanfaatkan oleh pipeline GitHub Actions (CI/CD) untuk memastikan proses deploy selesai dan live.

## Penanganan Variabel `proxy_pass` di Nginx
Terdapat aturan khusus di Nginx terkait penggunaan variabel pada arahan `proxy_pass`. Jika tujuan routing didefinisikan menggunakan variabel (seperti `$auth_host`), Nginx secara default **tidak menyertakan sisa path/URI** dari request asli jika tidak ditentukan secara eksplisit. 

**Solusi yang diterapkan:**
```nginx
location /auth/ {
    set $auth_host "auth-service.railway.internal";
    # Menggunakan $request_uri agar path utuh seperti /auth/login tidak terpotong
    proxy_pass http://$auth_host:8001$request_uri; 
}
```

## Dockerfile & IPv6 DNS Resolver (Railway)
Railway menggunakan Custom DNS Resolver IPv6 (`fd12::10`) untuk komunikasi antar layanan internal. Nginx mewajibkan alamat IPv6 dibungkus menggunakan tanda kurung siku `[]` agar tidak memicu error parsing port saat service dijalankan.

**Solusi di Dockerfile:**
Pada `services/gateway/Dockerfile`, shell script digunakan untuk mengekstrak nameserver dari `/etc/resolv.conf`, dan jika berupa IPv6, otomatis ditambahkan kurung siku:
```bash
NAMESERVERS=$(awk '$1=="nameserver" {if ($2 ~ /:/) printf "[%s] ", $2; else printf "%s ", $2}' /etc/resolv.conf)
```
Script di atas menjamin Nginx Gateway dapat men-resolve hostname internal Railway dengan sempurna tanpa mengalami crash (error: `invalid port in resolver`).
