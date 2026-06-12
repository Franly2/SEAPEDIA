# SEAPEDIA - Marketplace Logistik UMKM

Selamat datang di repositori resmi **SEAPEDIA**, platform marketplace logistik cerdas yang dirancang untuk mempertemukan Pembeli, Penjual, Driver, dan Admin dalam satu ekosistem yang terintegrasi.

## 🚀 Tentang Proyek

SEAPEDIA adalah solusi e-commerce yang berfokus pada efisiensi logistik bagi UMKM. Aplikasi ini mendukung **Multi-Role Authentication**, di mana satu akun pengguna dapat memiliki lebih dari satu peran (Buyer, Seller, Driver) dengan fitur pemilihan *active role* untuk setiap sesi penggunaan.

## 🛠️ Stack Teknologi

* **Front-End:** React Native (Expo) dengan Expo Router, Zustand (State Management), dan TypeScript.
* **Back-End:** NestJS dengan Prisma ORM dan PostgreSQL.
* **Architecture:** *Clean Architecture* dengan modularisasi *feature-based*.

---

## 🏗️ Cara Menjalankan Aplikasi

### 📱 Front-End (Expo)

1. **Masuk ke direktori mobile:**
```bash
cd gui/mobile

```


2. **Install dependencies:**
```bash
npm install

```


3. **Run development server:**
```bash
npx expo start -c

```



### ⚙️ Back-End (NestJS)

1. **Masuk ke direktori backend:**
```bash
cd backend

```


2. **Install dependencies:**
```bash
npm install --legacy-peer-deps

```


3. **Setup Database (Prisma):**
```bash
npx prisma db push --force-reset
npx prisma generate
npx prisma db seed

```


4. **Run Server:**
```bash
npm run start:dev

```



---

## 📋 Fitur Utama (Level 1)

* [x] **Public Marketplace:** Pengunjung dapat melihat katalog produk dan detail produk tanpa login.
* [x] **Secure Auth:** Sistem registrasi & login dengan JWT dan enkripsi password.
* [x] **Multi-Role Aware:** Mendukung peran Admin, Seller, Buyer, dan Driver.
* [x] **Public Reviews:** Pengguna dapat memberikan ulasan pengalaman aplikasi (bukan produk).
* [x] **Role-Based Routing:** Proteksi rute otomatis berdasarkan sesi dan peran aktif.

## 🔑 Aturan Bisnis Penting

* **Single-Store Checkout:** Untuk menjaga efisiensi logistik, satu keranjang hanya boleh berisi produk dari satu toko.
* **Active Role Session:** Pengguna dengan peran ganda wajib memilih peran aktif setiap kali masuk ke sistem.
* **Guest Browsing:** Halaman publik dirancang agar tetap bisa diakses tanpa harus melakukan otentikasi.

---

## ✒️ Author

* **Nama:** Franly Budi Pramana
* **Email:** franlybudipramana588@gmail.com
* **Universitas:** Universitas Surabaya (Ubaya)

---

*Proyek ini dikembangkan sebagai bagian dari tantangan pengembangan perangkat lunak COMPFEST 2026.*

---
