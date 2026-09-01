import { Router } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

function formatRule(r: any) {
  return {
    plateNumber: r.plateNumber,
    ownerName: r.ownerName,
    status: r.status,
    vehicleType: r.vehicleType,
    notes: r.notes || undefined,
    addedAt: Number(r.addedAt),
  };
}

// GET /api/whitelist
router.get('/', async (_req, res) => {
  try {
    const rules = await prisma.whitelistRule.findMany({ orderBy: { addedAt: 'desc' } });
    res.json(rules.map(formatRule));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whitelist - upsert (sesuai perilaku handleAddRule di frontend lama)
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const rule = await prisma.whitelistRule.upsert({
      where: { plateNumber: body.plateNumber },
      update: {
        ownerName: body.ownerName,
        status: body.status,
        vehicleType: body.vehicleType,
        notes: body.notes || null,
      },
      create: {
        plateNumber: body.plateNumber,
        ownerName: body.ownerName,
        status: body.status,
        vehicleType: body.vehicleType,
        notes: body.notes || null,
        addedAt: BigInt(body.addedAt ?? Date.now()),
      },
    });
    res.status(201).json(formatRule(rule));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/whitelist/:plateNumber
router.delete('/:plateNumber', async (req, res) => {
  try {
    await prisma.whitelistRule.delete({ where: { plateNumber: req.params.plateNumber } });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
