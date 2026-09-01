import { Router } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// GET /api/whitelist
router.get('/', async (_req, res) => {
  const rules = await prisma.whitelistRule.findMany({ orderBy: { addedAt: 'desc' } });
  res.json(rules);
});

// POST /api/whitelist - upsert (sesuai perilaku handleAddRule di frontend lama)
router.post('/', async (req, res) => {
  const body = req.body;
  const rule = await prisma.whitelistRule.upsert({
    where: { plateNumber: body.plateNumber },
    update: {
      ownerName: body.ownerName,
      status: body.status,
      vehicleType: body.vehicleType,
      notes: body.notes,
    },
    create: {
      plateNumber: body.plateNumber,
      ownerName: body.ownerName,
      status: body.status,
      vehicleType: body.vehicleType,
      notes: body.notes,
      addedAt: BigInt(body.addedAt ?? Date.now()),
    },
  });
  res.status(201).json(rule);
});

// DELETE /api/whitelist/:plateNumber
router.delete('/:plateNumber', async (req, res) => {
  await prisma.whitelistRule.delete({ where: { plateNumber: req.params.plateNumber } });
  res.status(204).send();
});

export default router;
