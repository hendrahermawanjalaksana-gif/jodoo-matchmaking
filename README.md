Jodoo - Premium Real-time Matchmaking App

Jodoo adalah aplikasi matchmaking modern dengan pengalaman pengguna yang mewah. Dirancang dengan estetika **Luxury 3D UI** dan fitur keamanan canggih untuk menghubungkan individu melalui resonansi jawaban yang presisi.

---

Fitur Unggulan

-   ** Luxury UI/UX**: Antarmuka berbasis *Glassmorphism* dengan animasi 3D halus menggunakan **Framer Motion**.
-   ** Real-time Matchmaking**: Sistem antrian pintar yang menghubungkan pengguna secara instan berdasarkan profil.
-   ** Secure Transactions**: Menggunakan **Firestore Transactions** untuk memastikan matching dan pengumpulan jawaban berjalan 100% akurat tanpa *race conditions*.
-   ** Resonance Chat**: Fitur chat langsung dengan perlindungan privasi otomatis (memblokir nomor HP, WA, dan link sosmed).
-   ** Session Timer**: Timer 5 menit di setiap sesi chat untuk menjaga dinamisme dan urgensi interaksi.
-   ** Skeleton Loading**: Transisi halus dengan *skeleton pulse* untuk pengalaman memuat data yang lebih premium.

---

Tech Stack

-   **Frontend**: React.js (Vite)
-   **Styling**: Vanilla CSS with Glassmorphism
-   **State & Animations**: Framer Motion, Lucide React
-   **Backend & Database**: Firebase Auth & Firestore
-   **Deployment**: Firebase Hosting

---

Cara Menjalankan

Persiapan
1. Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/).
2. Clone repository ini.
3. Jalankan `npm install` untuk menginstal dependensi.

Development
Jalankan aplikasi di mode pengembangan:
```bash
npm run dev
```

Build & Deployment
Untuk membuat versi produksi dan deploy ke Firebase:
```bash
npm run build
npx firebase deploy --only hosting
```

---

Keamanan & Privasi
-   Filter teks otomatis untuk mencegah pertukaran kontak pribadi demi keamanan pengguna.
-   Pembersihan antrian otomatis saat pengguna meninggalkan halaman.
