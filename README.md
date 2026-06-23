# SEAPEDIA - Marketplace Logistik UMKM

Selamat datang di repositori resmi **SEAPEDIA**, platform marketplace logistik cerdas yang dirancang untuk mempertemukan Pembeli, Penjual, Driver, dan Admin dalam satu ekosistem yang terintegrasi.

## 🚀 Tentang Proyek

SEAPEDIA adalah solusi e-commerce terukur yang berfokus pada efisiensi logistik bagi UMKM. Aplikasi ini dibangun secara progresif untuk mendukung **Multi-Role Authentication**, di mana satu entitas pengguna dapat mengelola lebih dari satu peran (Buyer, Seller, Driver) dengan mengedepankan keamanan sesi, otorisasi data yang ketat, dan pengalaman pengguna yang mulus.

## 🛠️ Stack Teknologi

* **Front-End:** React Native (Expo) dengan Expo Router, Zustand (State Management), dan TypeScript.
* **Back-End:** NestJS dengan Prisma ORM.
* **Database:** PostgreSQL.
* **Architecture:** *Clean Architecture* dengan modularisasi *feature-based* dan penerapan prinsip *Zero-Trust* pada level API.

---

## ☁️ Cloud Deployment & Infrastructure

Sistem backend dan database SEAPEDIA telah di-*deploy* ke lingkungan *cloud production* untuk memastikan aksesibilitas, skalabilitas, dan performa yang optimal di dunia nyata:

* **Database (Neon):** Menggunakan infrastruktur PostgreSQL berbasis *serverless* dari **Neon DB**. Memastikan koneksi database yang cepat, aman, dan efisien dengan integrasi *Connection Pooling*.
* **Backend API (Railway):** Server NestJS berjalan secara *live* di **Railway**. Proses *deployment* terintegrasi secara langsung menggunakan CI/CD dari repositori GitHub, lengkap dengan injeksi *Environment Variables* dan proteksi CORS yang ketat.

---

## 🏗️ Cara Menjalankan Aplikasi

### 📱 Front-End (Expo)

1. Masuk ke direktori mobile:
```bash
cd gui/mobile

```

2. Install dependencies:

```bash
npm install

```

3. Konfigurasi Environment:
Buat file `.env` dan arahkan variabel ke server Railway (Production) atau IP lokal Anda (Development).

```env
# ENV PRODUCTION (RAILWAY)
EXPO_PUBLIC_API_IP_ADDRESS=[https://seapedia-production.up.railway.app](https://seapedia-production.up.railway.app)

```

4. Run development server (gunakan `-c` untuk *clear cache* jika baru mengubah `.env`):

```bash
npx expo start -c

```

### ⚙️ Back-End (NestJS) - *Untuk Development Lokal*

*Catatan: Langkah ini hanya diperlukan jika Anda ingin menjalankan server backend secara lokal. Untuk penggunaan normal, aplikasi mobile sudah otomatis terhubung ke server Railway.*

1. Masuk ke direktori backend:

```bash
cd nest/vrp-backend

```

2. Install dependencies:

```bash
npm install

```

3. Setup Database (Prisma):

```bash
npx prisma db push --force-reset
npx prisma generate
npx prisma db seed

```

4. Run Server:

```bash
npm run start:dev

```

---

## 📋 Fitur Utama & Progres Pengembangan

### Level 1: Public Marketplace & Role Awareness

* **[x] Public Marketplace:** Katalog produk dan detail baca-saja (read-only) dapat diakses oleh pengunjung (Guest) tanpa harus login.
* **[x] Secure Auth:** Pendaftaran dan proses login menggunakan JWT, dengan enkripsi password menggunakan bcrypt.
* **[x] Multi-Role Aware:** Sistem mendukung identitas tunggal yang dapat memiliki multi-peran (Seller, Buyer, Driver).
* **[x] Active Role Selection:** Memaksa pengguna memilih active role untuk membatasi otorisasi navigasi.
* **[x] Public Reviews:** Pengguna dapat memberikan ulasan pengalaman aplikasi (dilengkapi dengan filter pencegahan XSS).

### Level 2: Building the Seller Experience

* **[x] Store Management:** Penjual dapat membuka dan mengubah profil toko. Sistem memastikan validasi keunikan nama toko di seluruh platform.
* **[x] Product CRUD (Seller):** Antarmuka dan API khusus bagi penjual untuk menambah, melihat, mengedit, dan menghapus produk di etalase mereka.
* **[x] Strict Ownership Authorization:** Proteksi berlapis di backend (Guard Clauses) untuk memastikan Penjual hanya dapat mengubah atau menghapus produk dari tokonya sendiri.
* **[x] Integrated Public Catalog:** Katalog publik langsung menarik data dinamis dari database produk penjual.

### Level 3: Buyer Wallet, Cart, and Checkout

* **[x] Buyer Wallet & Address:** Sistem manajemen alamat pengiriman (CRUD) dan dompet digital pembeli yang dilengkapi simulasi top-up serta pencatatan riwayat buku besar (ledger) transaksi.
* **[x] Cart Management (Single-Store Rule):** Sistem keranjang cerdas yang menolak pencampuran produk antar-toko (HTTP 409 Conflict) di level backend, dilengkapi dengan Alert konfirmasi pergantian toko di frontend.
* **[x] ACID Checkout Engine:** Mesin transaksi database (Prisma `$transaction`) yang mengkalkulasi subtotal, ongkos kirim dinamis (Instant, Next Day, Regular), dan PPN 12% secara real-time. Memotong saldo dompet dan stok produk secara aman tanpa anomali data.
* **[x] Unified Order Interface:** Satu halaman Orders yang beradaptasi secara cerdas: menampilkan "Riwayat Pesanan" bagi Pembeli, dan berubah wujud menjadi "Pesanan Masuk" bagi Penjual.

### Level 4: Discounts and Seller Order Processing

* **[x] Smart Discount System:** Dukungan untuk `Voucher` (berbasis kuota & tenggat waktu) dan `Promo` (berbasis tenggat waktu). Terdapat API validasi yang memotong harga secara *real-time* saat *checkout*.
* **[x] Order Fulfillment (Seller Action):** Fitur otorisasi khusus penjual untuk memproses pesanan masuk, memajukan status pesanan dari `SEDANG_DIKEMAS` menjadi `MENUNGGU_PENGIRIM` yang disertai pencatatan riwayat waktu (*timestamp*).
* **[x] Financial Reports & Dashboard:** API analitik finansial yang menghitung total pengeluaran pembeli (Buyer Expense) dan pendapatan kotor penjual (Seller Gross Income), disajikan secara dinamis di halaman Profil.
* **[x] Expandable Order Details (Accordion UI):** Implementasi antarmuka dinamis pada riwayat pesanan yang memungkinkan pengguna melihat rincian komprehensif tanpa berpindah halaman (meliputi detail alamat, subtotal, potongan diskon, ongkos kirim, dan PPN 12%).

### Level 5: Delivery and Driver Workflow

* **[x] Driver Dashboard & Job Market:** Dasbor interaktif khusus Kurir dengan *Segmented Control* yang memisahkan "Bursa Pekerjaan", "Tugas Aktif", dan "Riwayat" yang dirender secara aman dari bentrok state UI.
* **[x] Race-Condition Safe Job Taking:** API `POST /take` yang dikunci menggunakan `Prisma $transaction` untuk memastikan sebuah pesanan `MENUNGGU_PENGIRIM` hanya bisa diambil oleh SATU kurir. Mencegah duplikasi data tugas di tengah konkurensi.
* **[x] Delivery Completion & Earning Payout:** Sistem konfirmasi penyelesaian otomatis yang memajukan pesanan menjadi `PESANAN_SELESAI`, sekaligus mencairkan ongkos kirim ke dalam Saldo Dompet kurir yang disertai rekam jejak (*ledger*).

### Level 6: Admin Monitoring and Overdue Handling

* **[x] Admin Monitoring Dashboard:** Pusat kendali untuk memantau metrik agregasi platform secara *real-time*, meliputi total pengguna, toko, pesanan aktif, pengiriman, hingga angka pesanan yang berstatus *overdue*.
* **[x] Discount Management UI:** Antarmuka khusus Administrator untuk menghasilkan (*generate*) *Voucher* dan *Promo* dengan validasi DTO ketat.
* **[x] Time Travel Simulation:** *Endpoint* khusus untuk mensimulasikan pergeseran waktu (memundurkan umur pesanan) guna mendemonstrasikan proses SLA secara instan tanpa memanipulasi waktu server.
* **[x] ACID Overdue & Auto-Refund Engine:** Mesin logistik yang mengeksekusi pembatalan pesanan yang melanggar SLA. Mengotomatisasi pengembalian dana ke dompet pembeli, penyesuaian riwayat pengeluaran, serta pemulihan stok barang di dalam satu transaksi database yang kebal *double-refund*.

### Level 7: Security Hardening and Finalization

* **[x] SQLi & XSS Prevention:** Pengamanan interaksi database menggunakan metode *safe-query* (Prisma ORM) untuk mencegah SQL Injection. Seluruh input dari pengguna, terutama form *checkout* dan *public reviews*, disanitasi secara ketat untuk mencegah eksekusi *script* berbahaya (XSS).
* **[x] Strict DTO & Input Validation:** Implementasi validasi data di level API untuk menolak input yang tidak valid atau berbahaya (seperti anomali harga, stok, atau tipe data) dengan mengembalikan pesan *error* yang jelas dan terstruktur.
* **[x] RBAC & Session Hardening:** Penegakan aturan otorisasi berbasis *Zero-Trust* di sisi *backend*. Sistem tidak mempercayai *role* hanya dari rute UI, melainkan memverifikasi kepemilikan token, batas kedaluwarsa sesi, dan *active role* pengguna untuk mencegah akses lintas entitas (misal: Penjual tidak dapat memodifikasi produk penjual lain).
* **[x] Comprehensive API Documentation:** Penyediaan dokumentasi API interaktif dan terstandarisasi menggunakan Swagger/OpenAPI untuk memetakan seluruh *endpoint*, format *request*, dan respons sistem.
* **[x] Ready-to-Test Demo Environment:** Implementasi *database seeder* yang komprehensif untuk menghasilkan akun demo (Admin, Seller, Buyer, Driver) dan data awal secara otomatis.
* **[x] End-to-End Testing Guide:** Pendokumentasian aturan bisnis secara mendetail (aturan *single-store checkout*, kombinasi diskon, kalkulasi PPN 12%, pendapatan kurir, simulasi *time-travel* SLA) beserta panduan pengujian alur e-commerce yang utuh.

---

## 🔑 Aturan Bisnis & Logika Inti

Penting untuk dicatat bahwa SEAPEDIA mematuhi aturan bisnis yang ketat dalam penanganan transaksinya:

* **Single-Store Checkout:** Untuk mencegah kerumitan pengiriman dan menjaga SLA logistik yang akurat, satu keranjang (cart) hanya boleh berisi produk dari **satu toko**. Jika pembeli mencoba menambahkan produk dari toko yang berbeda, sistem akan menolak dan meminta pembeli untuk menyelesaikan atau mengosongkan keranjang sebelumnya.
* **Tax & Discount Calculation Rule:** Kalkulasi diskon (Voucher/Promo) akan memotong `Subtotal` terlebih dahulu. PPN 12% kemudian dihitung secara akurat dari Dasar Pengenaan Pajak (DPP), yang rumusnya adalah: `(Subtotal - Diskon) + Ongkos Kirim`. Pemotongan kuota diskon dikunci secara atomik untuk mencegah *race condition*.
* **Transactional Integrity:** Proses checkout bersifat absolut. Jika di tengah proses stok ternyata habis atau saldo dompet tiba-tiba kurang, seluruh rangkaian transaksi dibatalkan (rollback) untuk mencegah uang hilang atau pesanan hantu.
* **Driver Job Concurrency:** Sebuah pengiriman hanya bisa dieksekusi oleh satu Kurir. Transaksi pengambilan paket di-lock di level database untuk mencegah *race condition* apabila ada dua kurir mengeklik pesanan yang sama di milidetik yang berbarengan.
* **Overdue SLA & Auto-Refund Policy:** Batas waktu pengiriman diatur berdasarkan metode yang dipilih (Instant: 24 Jam, Next Day: 48 Jam, Regular: 72 Jam). Jika pesanan melewati SLA dan belum diambil kurir, sistem dapat membatalkan pesanan (status: `DIKEMBALIKAN`). Saldo dikembalikan secara utuh ke dompet pembeli, pengeluaran pembeli disesuaikan, pendapatan penjual dihapus, dan stok direstorasi secara atomik.
* **Role-Based Backend Authorization:** Akses ke endpoint API tidak hanya mengecek validitas token JWT, tetapi juga secara aktif mencocokkan Active Role yang di-klaim dengan database untuk mencegah akses ilegal.
* **Guest Browsing:** Halaman publik dirancang aman dari interaksi transaksional. Fungsi checkout dan manajemen toko dinonaktifkan secara otomatis hingga pengguna masuk dengan peran yang sesuai.

---

## ✒️ Author

* **Nama:** Franly Budi Pramana
* **Email:** franlybudipramana588@gmail.com
* **Universitas:** Universitas Surabaya (Ubaya)

Proyek ini dikembangkan secara bertahap sebagai bagian dari tantangan pengembangan perangkat lunak COMPFEST 2026.

```
