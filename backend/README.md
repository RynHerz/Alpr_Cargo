# ALPR Cargo AI — Backend API (BE_ALPR)

Server backend REST API untuk sistem **ALPR Cargo AI** (Automatic License Plate Recognition & Manifest Inspector).

> 🔗 **Frontend Repository:** [https://github.com/RynHerz/Alpr_Cargo](https://github.com/RynHerz/Alpr_Cargo)

---

## Tech Stack
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js
- **Language:** TypeScript
- **Database & ORM:** PostgreSQL / SQLite via Prisma ORM
- **File Upload:** Multer

---

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
# atau
npm install
```

### 2. Environment Variables
Salin file `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi:
```env
PORT=4000
DATABASE_URL="postgresql://user:password@localhost:5432/alpr_db"
FRONTEND_URL="http://localhost:3001"
```

### 3. Setup Database
```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Run Server
```bash
# Mode Development
npm run dev

# Build & Start Production
npm run build
npm start
```

Server akan aktif di `http://localhost:4000`.

---

## API Endpoints

- `GET /health` — Health check endpoint
- `GET /api/detections` — Mengambil daftar riwayat deteksi plat kendaraan
- `POST /api/detections` — Menyimpan hasil deteksi plat baru & data kargo
- `DELETE /api/detections` — Menghapus seluruh riwayat deteksi
- `GET /api/whitelist` — Mengambil daftar aturan whitelist / blacklist plat
- `POST /api/whitelist` — Menambah atau memperbarui aturan plat
- `DELETE /api/whitelist/:plateNumber` — Menghapus aturan plat tertentu
- `POST /api/uploads` — Upload gambar bukti/crop plat kendaraan
