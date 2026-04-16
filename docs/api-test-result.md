## Hasil Test API
### auth/login 
![alt text](images/auth-login.png)
Gambar menunjukkan hasil dari proses login pengguna berupa:
- access_token: Token JWT yang digunakan untuk akses API secara aman.
- token_type: Jenis token yang digunakan adalah "bearer".
- user details: Detail pengguna dengan username "jona" dan email "tampubolonjonathan181@gmail.com".
- api_quota: Informasi kuota API yang dimiliki pengguna sebanyak 100.

### Generate/image
![alt text](images/gen-image.jpeg)
Gambar menunjukkan hasil dari permintaan pembuatan gambar (generate image) berupa:
- image_base64: Data gambar yang dihasilkan dalam format string Base64 yang sangat panjang (siap untuk dirender oleh aplikasi front-end).


### Authorize
![alt text](images/auth.png)
- HTTPBearer: Status sistem yang sudah "Authorized", menunjukkan bahwa token akses telah berhasil dimasukkan untuk mengakses endpoint yang dilindungi.

### Gnerate/summarize
![alt text](images/summ.png)
Gambar menunjukkan hasil dari fungsi peringkasan teks berupa:
- summary: Hasil ringkasan teks mengenai definisi komputasi awan (Cloud Computing).
- source: Teks asli yang digunakan sebagai sumber data untuk diringkas.
- model: Model AI yang digunakan untuk memproses data yaitu "gemini-2.5-flash".