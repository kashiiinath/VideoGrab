import { Router, Request, Response } from 'express';
import { getAllHistory, getTotalHistory, deleteHistory, clearHistory } from '../db';

const router = Router();

// GET /api/history
router.get('/', (req: Request, res: Response) => {
  const { search, status, limit = '50', offset = '0' } = req.query;
  const items = getAllHistory(
    typeof search === 'string' ? search : undefined,
    typeof status === 'string' ? status : undefined,
    parseInt(limit as string),
    parseInt(offset as string),
  );
  const total = getTotalHistory();
  res.json({ success: true, data: items, total });
});

// DELETE /api/history/:id
router.delete('/:id', (req: Request, res: Response) => {
  deleteHistory(req.params.id);
  res.json({ success: true });
});

// DELETE /api/history
router.delete('/', (_req: Request, res: Response) => {
  clearHistory();
  res.json({ success: true });
});

export default router;
