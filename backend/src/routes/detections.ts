import { Router } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

function formatDetection(d: any) {
  return {
    id: d.id,
    timestamp: Number(d.timestamp),
    sourceImage: d.sourceImageUrl,
    sourceImageUrl: d.sourceImageUrl,
    plateCropImage: d.plateCropImageUrl,
    plateCropImageUrl: d.plateCropImageUrl,
    enhancedPlateImage: d.enhancedPlateImageUrl || undefined,
    enhancedPlateImageUrl: d.enhancedPlateImageUrl || undefined,
    plateNumber: d.plateNumber,
    formattedPlate: d.formattedPlate,
    expiryDate: d.expiryDate || undefined,
    confidence: d.confidence,
    bbox: {
      x: d.bboxX,
      y: d.bboxY,
      width: d.bboxWidth,
      height: d.bboxHeight,
    },
    bboxX: d.bboxX,
    bboxY: d.bboxY,
    bboxWidth: d.bboxWidth,
    bboxHeight: d.bboxHeight,
    method: d.method,
    vehicleType: d.vehicleType || undefined,
    status: d.status,
    notes: d.notes || undefined,
    processingTimeMs: d.processingTimeMs,
    cargoManifest: d.cargoManifest
      ? {
          ...d.cargoManifest,
          updatedAt: d.cargoManifest.updatedAt ? new Date(d.cargoManifest.updatedAt).getTime() : undefined,
          items: d.cargoManifest.items || [],
        }
      : undefined,
  };
}

// GET /api/detections - ganti localStorage.getItem('alpr_history')
router.get('/', async (_req, res) => {
  try {
    const detections = await prisma.detection.findMany({
      include: { cargoManifest: { include: { items: true } } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(detections.map(formatDetection));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/detections - ganti localStorage.setItem('alpr_history', ...)
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const bbox = body.bbox || {
      x: body.bboxX ?? 0,
      y: body.bboxY ?? 0,
      width: body.bboxWidth ?? 0,
      height: body.bboxHeight ?? 0,
    };

    const created = await prisma.detection.create({
      data: {
        timestamp: BigInt(body.timestamp || Date.now()),
        sourceImageUrl: body.sourceImageUrl || body.sourceImage || '',
        plateCropImageUrl: body.plateCropImageUrl || body.plateCropImage || '',
        enhancedPlateImageUrl: body.enhancedPlateImageUrl || body.enhancedPlateImage || null,
        plateNumber: body.plateNumber,
        formattedPlate: body.formattedPlate || body.plateNumber,
        expiryDate: body.expiryDate || null,
        confidence: Number(body.confidence || 0),
        bboxX: Number(bbox.x || 0),
        bboxY: Number(bbox.y || 0),
        bboxWidth: Number(bbox.width || 0),
        bboxHeight: Number(bbox.height || 0),
        method: body.method || 'cv_contour',
        vehicleType: body.vehicleType || null,
        status: body.status || 'unknown',
        notes: body.notes || null,
        processingTimeMs: Number(body.processingTimeMs || 0),
        cargoManifest: body.cargoManifest
          ? {
              create: {
                driverName: body.cargoManifest.driverName || '',
                driverPhone: body.cargoManifest.driverPhone || null,
                companyName: body.cargoManifest.companyName || null,
                destination: body.cargoManifest.destination || null,
                documentNumber: body.cargoManifest.documentNumber || null,
                cargoCategory: body.cargoManifest.cargoCategory || null,
                loadStatus: body.cargoManifest.loadStatus || 'Penuh (Full Load)',
                totalWeightKg: body.cargoManifest.totalWeightKg ? Number(body.cargoManifest.totalWeightKg) : null,
                totalItemsCount: body.cargoManifest.totalItemsCount ? Number(body.cargoManifest.totalItemsCount) : null,
                sealNumber: body.cargoManifest.sealNumber || null,
                inspectionStatus: body.cargoManifest.inspectionStatus || 'Sesuai (Approved)',
                inspectorNotes: body.cargoManifest.inspectorNotes || null,
                items: body.cargoManifest.items?.length
                  ? {
                      create: body.cargoManifest.items.map((item: any) => ({
                        name: item.name || '',
                        category: item.category || 'Lainnya',
                        quantity: Number(item.quantity || 1),
                        unit: item.unit || 'Pcs',
                        weightKg: item.weightKg ? Number(item.weightKg) : null,
                        notes: item.notes || null,
                      })),
                    }
                  : undefined,
              },
            }
          : undefined,
      },
      include: { cargoManifest: { include: { items: true } } },
    });

    res.status(201).json(formatDetection(created));
  } catch (err: any) {
    console.error('Error creating detection:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/detections - ganti clear history
router.delete('/', async (_req, res) => {
  try {
    await prisma.detection.deleteMany({});
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
