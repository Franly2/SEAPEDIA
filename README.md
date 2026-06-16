SEAPEDIA - Marketplace Logistik UMKM

Selamat datang di repositori resmi SEAPEDIA, platform marketplace logistik cerdas yang dirancang untuk mempertemukan Pembeli, Penjual, Driver, dan Admin dalam satu ekosistem yang terintegrasi.
🚀 Tentang Proyek

SEAPEDIA adalah solusi e-commerce terukur yang berfokus pada efisiensi logistik bagi UMKM. Aplikasi ini dibangun secara progresif untuk mendukung Multi-Role Authentication, di mana satu entitas pengguna dapat mengelola lebih dari satu peran (Buyer, Seller, Driver) dengan mengedepankan keamanan sesi, otorisasi data yang ketat, dan pengalaman pengguna yang mulus.
🛠️ Stack Teknologi

    Front-End: React Native (Expo) dengan Expo Router, Zustand (State Management), dan TypeScript.

    Back-End: NestJS dengan Prisma ORM dan PostgreSQL.

    Architecture: Clean Architecture dengan modularisasi feature-based dan penerapan prinsip Zero-Trust pada level API.

🏗️ Cara Menjalankan Aplikasi
📱 Front-End (Expo)

    Masuk ke direktori mobile:
    Bash

    cd gui/mobile

    Install dependencies:
    Bash

    npm install

    Run development server:
    Bash

    npx expo start -c

⚙️ Back-End (NestJS)

    Masuk ke direktori backend:
    Bash

    cd backend

    Install dependencies:
    Bash

    npm install --legacy-peer-deps

    Setup Database (Prisma):
    Bash

    npx prisma db push --force-reset
    npx prisma generate
    npx prisma db seed

    Run Server:
    Bash

    npm run start:dev

📋 Fitur Utama & Progres Pengembangan
Level 1: Public Marketplace & Role Awareness

    [x] Public Marketplace: Katalog produk dan detail baca-saja (read-only) dapat diakses oleh pengunjung (Guest) tanpa harus login.

    [x] Secure Auth: Pendaftaran dan proses login menggunakan JWT, dengan enkripsi password menggunakan bcrypt.

    [x] Multi-Role Aware: Sistem mendukung identitas tunggal yang dapat memiliki multi-peran (Seller, Buyer, Driver).

    [x] Active Role Selection: Memaksa pengguna memilih active role untuk membatasi otorisasi navigasi.

    [x] Public Reviews: Pengguna dapat memberikan ulasan pengalaman aplikasi (dilengkapi dengan filter pencegahan XSS).

Level 2: Building the Seller Experience

    [x] Store Management: Penjual dapat membuka dan mengubah profil toko. Sistem memastikan validasi keunikan nama toko di seluruh platform.

    [x] Product CRUD (Seller): Antarmuka dan API khusus bagi penjual untuk menambah, melihat, mengedit, dan menghapus produk di etalase mereka.

    [x] Strict Ownership Authorization: Proteksi berlapis di backend (Guard Clauses) untuk memastikan Penjual hanya dapat mengubah atau menghapus produk dari tokonya sendiri.

    [x] Integrated Public Catalog: Katalog publik langsung menarik data dinamis dari database produk penjual.

Level 3: Buyer Wallet, Cart, and Checkout

    [x] Buyer Wallet & Address: Sistem manajemen alamat pengiriman (CRUD) dan dompet digital pembeli yang dilengkapi simulasi top-up serta pencatatan riwayat buku besar (ledger) transaksi.

    [x] Cart Management (Single-Store Rule): Sistem keranjang cerdas yang menolak pencampuran produk antar-toko (HTTP 409 Conflict) di level backend, dilengkapi dengan Alert konfirmasi pergantian toko di frontend.

    [x] ACID Checkout Engine: Mesin transaksi database (Prisma $transaction) yang mengkalkulasi subtotal, ongkos kirim dinamis (Instant, Next Day, Regular), dan PPN 12% secara real-time. Memotong saldo dompet dan stok produk secara aman tanpa anomali data.

    [x] Unified Order Interface: Satu halaman Orders yang beradaptasi secara cerdas: menampilkan "Riwayat Pesanan" bagi Pembeli, dan berubah wujud menjadi "Pesanan Masuk" bagi Penjual.

🔑 Aturan Bisnis & Logika Inti

Penting untuk dicatat bahwa SEAPEDIA mematuhi aturan bisnis yang ketat dalam penanganan transaksinya:

    Single-Store Checkout: Untuk mencegah kerumitan pengiriman dan menjaga SLA logistik yang akurat, satu keranjang (cart) hanya boleh berisi produk dari satu toko. Jika pembeli mencoba menambahkan produk dari toko yang berbeda, sistem akan menolak dan meminta pembeli untuk menyelesaikan atau mengosongkan keranjang sebelumnya.

    Transactional Integrity: Proses checkout bersifat absolut. Jika di tengah proses stok ternyata habis atau saldo dompet tiba-tiba kurang, seluruh rangkaian transaksi dibatalkan (rollback) untuk mencegah uang hilang atau pesanan hantu.

    Role-Based Backend Authorization: Akses ke endpoint API tidak hanya mengecek validitas token JWT, tetapi juga secara aktif mencocokkan Active Role yang di-klaim dengan database untuk mencegah akses ilegal.

    Guest Browsing: Halaman publik dirancang aman dari interaksi transaksional. Fungsi checkout dan manajemen toko dinonaktifkan secara otomatis hingga pengguna masuk dengan peran yang sesuai.

✒️ Author

    Nama: Franly Budi Pramana

    Email: franlybudipramana588@gmail.com

    Universitas: Universitas Surabaya (Ubaya)

Proyek ini dikembangkan secara bertahap sebagai bagian dari tantangan pengembangan perangkat lunak COMPFEST 2026.
