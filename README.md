# SEAPEDIA 

**Live Deployment URL:** [Kunjungi SEAPEDIA Live](https://seapedia-delta.vercel.app/)

Selamat datang di repositori resmi **SEAPEDIA**, platform marketplace yang dirancang untuk mempertemukan Pembeli, Penjual, Kurir (Driver), dan Admin dalam satu ekosistem yang terintegrasi. 

---

## Fitur

Proyek ini dikembangkan dengan mematuhi seluruh spesifikasi sistem dan berfokus pada pencapaian *Bonus Points*:

1. **  Intuitive UI :** Antarmuka dibangun menggunakan React Native (Expo) untuk Web dan Mobile. Desain berfokus pada *Clean UI* dan *white-space* yang lega
2. ** Live Deployment :** Keseluruhan ekosistem telah di-*deploy* dan dapat diakses publik. (Lihat bagian **Cloud Deployment & Infrastructure**).
3. ** API Documentation:** Dokumentasi *endpoint* API secara interaktif telah disediakan melalui integrasi Swagger/OpenAPI dan Postman Collection. (Lihat bagian **Dokumentasi API**).
4. ** Security Notes:** Arsitektur keamanan telah dirancang agar aman. (Lihat bagian **Catatan Keamanan**).

---

##  Cloud Deployment & Infrastructure

Proyek ini dapat diakses langsung tanpa perlu instalasi lokal. Konfigurasi telah disiapkan agar terhubung dengan environment berikut:

* **Frontend Web (Vercel):** Aplikasi klien di-*hosting* menggunakan Vercel. [Buka Aplikasi](https://seapedia-8vdkd5wpp-franlys-projects.vercel.app/)
* **Backend API (Railway):** Server NestJS berjalan secara *live* menggunakan Railway CI/CD.
* **Database (Neon DB):** PostgreSQL Serverless berbasis *cloud* dengan integrasi *Connection Pooling*.

---

##  Akun Demo & Akses Admin

Untuk memudahkan proses pengujian dan evaluasi, *database* produksi telah diisi menggunakan *seeder* dengan beberapa akun demo. Anda dapat menggunakan akun berikut untuk menguji berbagai *flow* transaksi:

* **Akun Admin:**
    * Username: `admin_seapedia`
    * Password: `password123`
* **Akun Pembeli (Buyer):**
    * Username: `buyer_demo`
    * Password: `password123`
* **Akun Penjual (Seller):**
    * Username: `seller_demo`
    * Password: `password123`
* **Akun Kurir (Driver):**
    * Username: `driver_demo`
    * Password: `password123`

*(Anda juga dapat membuat akun baru melalui halaman Register, dan melakukan Switch Role langsung dari halaman Profile).*

---

##  Stack Teknologi

* **Front-End:** React Native (Expo) for Web & Mobile.
* **Back-End:** NestJS.
* **Database:** PostgreSQL dengan Prisma ORM.

---

##  Catatan Keamanan (Security Notes)

Sistem ini menerapkan prinsip keamanan ketat pada lapisan API maupun Klien:

1. **SQL Injection (SQLi) Prevention:** Seluruh interaksi *database* menggunakan Prisma ORM yang secara bawaan melakukan *parameterized queries* (safe-query). Tidak ada eksekusi *raw SQL* secara manual dari input pengguna.
2. **Cross-Site Scripting (XSS) Prevention:** Seluruh *input payload* dari pengguna, terutama pada form *checkout* dan ulasan publik (*Public Reviews*), disanitasi. React/Expo secara bawaan melakukan *escaping* pada string sebelum dirender ke DOM.
3. **Input Validation:** Penerapan DTO (Data Transfer Object) ketat menggunakan `class-validator` di NestJS. Anomali seperti harga negatif, stok minus, atau format string yang salah akan langsung ditolak oleh *server* dengan HTTP 400 Bad Request.
4. **Session Behavior:** Manajemen sesi menggunakan **JWT (JSON Web Token)**. Penyimpanan token di *client* dilakukan secara aman menggunakan `AsyncStorage`. *State Management* (Zustand) memastikan token dihancurkan seketika saat *logout* atau saat token terdeteksi kedaluwarsa.
5. **Role-Based Access Control (RBAC):** Backend menerapkan prinsip *Zero-Trust*. `RolesGuard` khusus dibuat di NestJS untuk memverifikasi ekstrak token JWT dan membandingkan *Active Role* pengguna. Contoh: Sebuah API toko hanya bisa dipanggil jika *Active Role* pengguna saat itu adalah `SELLER`, mencegah manipulasi lintas-peran meskipun dilakukan oleh akun yang sama.

---

##  Dokumentasi API

Seluruh rute, parameter *request*, dan skema *response* backend didokumentasikan secara lengkap. Kami menyediakan dua cara untuk menguji API SEAPEDIA:

1. **Swagger/OpenAPI (Interactive):** Jika menjalankan backend secara lokal, dokumentasi interaktif bawaan NestJS dapat diakses melalui: 
    `http://localhost:3000/api-docs`
2. **Postman Collection:** Kami juga menyediakan file ekspor Postman untuk memudahkan pengujian. Anda dapat menemukan filenya di dalam repositori ini pada path: 
    `seapedia/seapedia.postman_collection.json`
   *(Cukup lakukan "Import" file tersebut ke dalam aplikasi Postman Anda untuk melihat dan mengeksekusi seluruh endpoint).*

---

##  Cara Menjalankan Secara Lokal (Development)

Jika ingin menjalankan proyek secara lokal :

### ⚙️ Back-End (NestJS)

1. Masuk ke direktori backend:
```bash
cd nest/vrp-backend

    Install dependencies:

Bash

npm install

    Konfigurasi Environment:
    Buat file .env di root direktori backend Anda dengan konfigurasi berikut:

Cuplikan kode

JWT_SECRET="xxxxxxxxxxxxy"
PORT=3000
EXPIRES_IN="1d"
origin="http://localhost:8081"
DATABASE_URL="xxxxxxxxxxxxxxxxxxxxx"

    Setup Database & Jalankan Server:

Bash

npx prisma db push --force-reset
npx prisma generate
npx prisma db seed
npm run start:dev

 Front-End (Expo)

    Masuk ke direktori mobile:

Bash

cd gui/mobile

    Install dependencies:

Bash

npm install

    Konfigurasi Environment:
    Buat file .env di root direktori mobile. Ubah target API sesuai kebutuhan (Local atau Production).

Cuplikan kode

# Host
EXPO_PUBLIC_API_IP_ADDRESS="xxxxxxxxxxxxxxxxx"

# Local
# EXPO_PUBLIC_API_IP_ADDRESS="xxxxxxxxxxxxxxxxx"

    Jalankan Development Server:

Bash

npx expo start -c

(Tekan tombol w di terminal untuk membuka antarmuka Web).
 Aturan Bisnis & Logika Inti

    Single-Store Checkout: Satu keranjang (cart) hanya boleh berisi produk dari satu toko. Sistem akan menolak percampuran produk antar-toko (HTTP 409 Conflict) di level backend.

    Tax & Discount Calculation Rule: Kalkulasi diskon (Voucher/Promo) akan memotong Subtotal terlebih dahulu. PPN 12% kemudian dihitung dari Dasar Pengenaan Pajak (DPP) yaitu: (Subtotal - Diskon) + Ongkos Kirim.

    Transactional Integrity: Proses checkout menggunakan Prisma $transaction untuk memastikan sifat ACID. Pemotongan saldo dompet dan stok dilakukan serempak.

    Driver Job Concurrency: Endpoint pengambilan pesanan dikunci di level database untuk mencegah race condition apabila ada dua kurir mengambil pesanan yang sama di waktu bersamaan.

    Overdue SLA & Auto-Refund Policy: Mesin Overdue akan mengotomatisasi pengembalian dana penuh ke dompet pembeli, penyesuaian ledger, dan restorasi stok barang dalam satu transaksi kebal double-refund apabila pesanan melanggar tenggat waktu pengiriman (Instant: 24 Jam, Next Day: 48 Jam, Regular: 72 Jam).

 Author

    Nama: Franly Budi Pramana

    Email: franlybudipramana588@gmail.com

    Universitas: Universitas Surabaya (Ubaya)
