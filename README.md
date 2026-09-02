# ALPR Cargo AI — Frontend Application (Alpr_Cargo)

Aplikasi Web Client untuk sistem **ALPR Cargo AI** (Automatic License Plate Recognition & Manifest Cargo Inspector) berbasis Next.js 16, React 19, Tailwind CSS, dan inferensi ONNX Runtime Web di sisi peramban (browser-based AI).

> 🔗 **Backend Repository:** [https://github.com/RynHerz/BE_ALPR](https://github.com/RynHerz/BE_ALPR)

---

## Fitur Utama
- **Live Camera Scanner:** Deteksi plat nomor real-time langsung melalui kamera web/ponsel.
- **Client-Side AI Inference:** Deteksi plat kendaraan menggunakan model YOLOv8 ONNX (`plate_detector.onnx`, `char_detector.onnx`) yang dieksekusi secara lokal di browser melalui WebAssembly/WebGL tanpa membebani server.
- **OCR Engine:** Pembacaan karakter plat nomor Indonesia menggunakan OCR engine & rule-based parser.
- **Cargo Manifest & Gate Pass:** Manajemen muatan kargo, status muatan (*Full*, *Half*, *Empty*), validasi segel kontainer, dan cetak slip akses gerbang.
- **Access Manager:** Pengelolaan whitelist, VIP, dan blacklist nomor plat kendaraan.
- **Dataset Tester:** Pengujian akurasi deteksi plat berbasis batch dataset gambar.

---

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **UI & Styling:** React 19, Tailwind CSS 4, Lucide Icons, Shadcn UI
- **AI / ML Runtime:** ONNX Runtime Web (`onnxruntime-web`), Tesseract.js
- **State & Communication:** REST API Client ke [BE_ALPR](https://github.com/RynHerz/BE_ALPR)

---

## Panduan Instalasi & Menjalankan

### 1. Prasyarat
- Node.js versi 20+
- pnpm (`npm install -g pnpm`)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Konfigurasi Lingkungan
Tambahkan file `.env.local` di dalam folder `apps/web/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```
*(Ganti URL di atas jika backend di-deploy ke Railway/Render/VPS)*

### 4. Menjalankan Server Development
```bash
pnpm dev:web
# atau
cd apps/web && pnpm dev
```
Buka peramban di [http://localhost:3001](http://localhost:3001).

### 5. Build Produksi
```bash
pnpm build:web
```

---

## Repositori Terkait
- **Backend API Server (Express + Prisma):** [https://github.com/RynHerz/BE_ALPR](https://github.com/RynHerz/BE_ALPR)
