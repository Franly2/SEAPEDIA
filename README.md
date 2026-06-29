# SEAPEDIA - Marketplace  

 **Web App (Live):** [Kunjungi SEAPEDIA Live](https://seapedia-delta.vercel.app/)
 **Mobile App (Android):** [⬇️ Download SEAPEDIA .apk](PASTE_LINK_YANG_KAMU_COPY_DI_SINI)

Selamat datang di repositori resmi **SEAPEDIA**, platform marketplace yang dirancang buat mempertemukan Pembeli, Penjual, Kurir (Driver), dan Admin dalam satu ekosistem yang terintegrasi.


---

## Fitur dan Poin Penilaian

Proyek ini dikembangkan dengan mematuhi seluruh spesifikasi sistem dan berfokus pada pencapaian poin bonus:

1. **Intuitive UI:** Antarmuka dibangun pakai React Native (Expo) buat Web dan Mobile. Desainnya fokus pada Clean UI dan white-space yang lega biar navigasinya enak dan ga bikin pusing pengguna.
2. **Live Deployment:** Keseluruhan ekosistem udah di-deploy dan bisa diakses publik secara live. Detail infrastrukturnya bisa dilihat di bagian Cloud Deployment & Infrastructure.
3. **API Documentation:** Dokumentasi endpoint API secara interaktif udah disediakan lewat integrasi Swagger/OpenAPI dan Postman Collection.
4. **Security Notes:** Arsitektur keamanan dari awal udah didesain defensif biar aman dari exploit umum.

---

## Cloud Deployment & Infrastructure

Proyek ini bisa diakses langsung tanpa perlu instalasi lokal karena udah terhubung dengan environment cloud berikut:

* **Frontend Web (Vercel):** Aplikasi client di-hosting menggunakan Vercel.
* **Backend API (Railway):** Server NestJS berjalan secara live menggunakan Railway CI/CD.
* **Database (Neon DB):** Pakai PostgreSQL Serverless berbasis cloud dengan integrasi Connection Pooling.

---

## Akun Demo & Akses Admin

Buat gampangin proses pengujian dan evaluasi, database production udah diisi pake seeder dengan beberapa akun demo. Bisa pakai beberapa akun ini buat nyoba alur transaksinya:

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

*(Kamu juga bisa bikin akun baru lewat halaman Register, dan nyobain fitur Switch Role langsung dari halaman Profile).*

---

## Stack Teknologi

* **Front-End:** React Native (Expo) buat Web & Mobile, Expo Router, Zustand (State Management), Feather Icons, TypeScript.
* **Back-End:** NestJS, JWT Authentication, Bcrypt, Swagger UI.
* **Database:** PostgreSQL dengan Prisma ORM.

---

## Catatan Keamanan (Security Notes)

Sistem ini menerapkan prinsip keamanan ketat pada lapisan API maupun Client:

1. **SQL Injection (SQLi) Prevention:** Semua interaksi database pakai Prisma ORM yang secara bawaan udah ngelakuin parameterized queries (safe-query). Ga ada eksekusi raw SQL secara manual dari input user.
2. **Cross-Site Scripting (XSS) Prevention:** Semua input payload dari user, terutama pada form checkout dan ulasan publik (Public Reviews), disanitasi. React/Expo secara bawaan juga ngelakuin escaping pada string sebelum dirender ke DOM.
3. **Input Validation:** Penerapan DTO (Data Transfer Object) ketat menggunakan class-validator di NestJS. Anomali kayak harga negatif, stok minus, atau format string yang ngaco bakal langsung ditolak oleh server dengan HTTP 400 Bad Request.
4. **Session Behavior:** Manajemen sesi menggunakan JWT (JSON Web Token). Penyimpanan token di client dilakukan secara aman menggunakan AsyncStorage. State Management (Zustand) memastikan token dihancurkan seketika pas user logout atau saat token terdeteksi expired.
5. **Role-Based Access Control (RBAC):** Backend nerapin prinsip Zero-Trust. RolesGuard khusus dibuat di NestJS buat memverifikasi ekstrak token JWT dan membandingkan Active Role pengguna. Contohnya: API toko cuma bisa dipanggil kalau Active Role pengguna saat itu beneran SELLER, jadi ngehindarin manipulasi lintas-peran meskipun dicoba oleh akun yang sama.

---

## Dokumentasi API

Seluruh rute, parameter request, dan skema response backend didokumentasikan secara lengkap. Ada dua cara buat menguji API SEAPEDIA:

1. **Swagger/OpenAPI (Interactive):** Kalau ngejalankan backend secara lokal, dokumentasi interaktif bawaan NestJS bisa diakses melalui: 
   `http://localhost:3000/api-docs`
2. **Postman Collection:** File ekspor Postman ditaruh di dalam repositori ini pada path: 
   `seapedia/seapedia.postman_collection.json`
   *(Tinggal import file tersebut ke aplikasi Postman buat melihat dan nge-test semua endpoint secara langsung).*

---

## Cara Menjalankan Secara Lokal (Development)

Kalau mau menjalankan proyek ini di mesin lokal, ikutin langkah-langkah berikut:

### Back-End (NestJS)

1. Masuk ke direktori backend:
```bash
cd nest/vrp-backend

```

2. Install dependencies:

```bash
npm install

```

3. Konfigurasi Environment:
Buat file `.env` di root direktori backend dengan konfigurasi berikut:

```env
JWT_SECRET="xxxxxxxxxxxxy"
PORT=3000
EXPIRES_IN="1d"
origin="http://localhost:8081"
DATABASE_URL="xxxxxxxxxxxxxxxxxxxxx"

```

4. Setup Database & Jalankan Server:

```bash
npx prisma db push --force-reset
npx prisma generate
npx prisma db seed
npm run start:dev

```

### Front-End (Expo)

1. Masuk ke direktori mobile:

```bash
cd gui/mobile

```

2. Install dependencies:

```bash
npm install

```

3. Konfigurasi Environment:
Buat file `.env` di root direktori mobile. Ubah target API sesuai kebutuhan (Local atau Production).

```env
# Host Target API
EXPO_PUBLIC_API_IP_ADDRESS="xxxxxxxxxxxxxxxxx"

```

4. Jalankan Development Server:

```bash
npx expo start -c

```

*(Tekan tombol 'w' di terminal buat membuka antarmuka versi Web).*

---

## Aturan Bisnis & Logika Inti

* **Single-Store Checkout:** Satu keranjang (cart) cuma boleh berisi produk dari satu toko. Sistem bakal menolak percampuran produk antar-toko (HTTP 409 Conflict) di level backend.
* **Tax & Discount Calculation Rule:** Kalkulasi diskon (Voucher/Promo) bakal memotong Subtotal duluan. PPN 12% kemudian dihitung dari Dasar Pengenaan Pajak (DPP) yaitu: `(Subtotal - Diskon) + Ongkos Kirim`.
* **Transactional Integrity:** Proses checkout menggunakan `Prisma $transaction` buat memastikan sifat ACID. Pemotongan saldo dompet pembeli dan stok barang dilakuin serempak secara atomic.
* **Driver Job Concurrency:** Endpoint pengambilan pesanan dikunci di level database buat mencegah race condition kalau ada dua kurir rebutan ngambil pesanan yang sama di waktu bersamaan.
* **Overdue SLA & Auto-Refund Policy:** Mesin Overdue bakal otomatis ngembaliin dana penuh ke dompet pembeli, nyesuain ledger pembukuan, dan ngebalikin stok barang dalam satu transaksi aman biar ga terjadi double-refund kalau pesanan ngelanggar batas waktu pengiriman (Instant: 24 Jam, Next Day: 48 Jam, Regular: 72 Jam).

---

## Author

* **Nama:** Franly Budi Pramana
* **Email:** franlybudipramana588@gmail.com
* **Universitas:** Universitas Surabaya (Ubaya)