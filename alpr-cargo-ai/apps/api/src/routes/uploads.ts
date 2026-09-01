import { Router } from 'express';
import multer from 'multer';
import path from 'path';

const router = Router();

// Simpan sementara ke folder lokal /uploads. Nanti bisa diganti ke S3/Cloudinary
// tanpa mengubah kontrak endpoint ini (tetap return { url }).
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

// POST /api/uploads - terima base64/blob dari canvas hasil deteksi plat
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ url });
});

export default router;
