import { Router } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// GET /api/detections - ganti localStorage.getItem('alpr_history')
router.get('/', async (_req, res) => {
  const detections = await prisma.detection.findMany({
    include: { cargoManifest: { include: { items: true } } },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });
  res.json(detections);
});

// POST /api/detections - ganti localStorage.setItem('alpr_history', ...)
router.post('/', async (req, res) => {
  const body = req.body;
  const created = await prisma.detection.create({
    data: {
      timestamp: BigInt(body.timestamp),
      sourceImageUrl: body.sourceImageUrl,
      plateCropImageUrl: body.plateCropImageUrl,
      enhancedPlateImageUrl: body.enhancedPlateImageUrl,
      plateNumber: body.plateNumber,
      formattedPlate: body.formattedPlate,
      expiryDate: body.expiryDate,
      confidence: body.confidence,
      bboxX: body.bbox.x,
      bboxY: body.bbox.y,
      bboxWidth: body.bbox.width,
      bboxHeight: body.bbox.height,
      method: body.method,
      vehicleType: body.vehicleType,
      status: body.status,
      notes: body.notes,
      processingTimeMs: body.processingTimeMs,
    },
  });
  res.status(201).json(created);
});

// DELETE /api/detections - ganti clear history
router.delete('/', async (_req, res) => {
  await prisma.detection.deleteMany({});
  res.status(204).send();
});

export default router;
