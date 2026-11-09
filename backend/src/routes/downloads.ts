import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createJob, getJob, getAllJobs, updateJob, deleteJob, clearAllJobs, createHistory, updateHistory, DownloadJob, HistoryEntry } from '../db';
import { validateUrl, checkSsrf, sanitizeFilename } from '../utils/security';

const router = Router();

// POST /api/downloads — Create a download job
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { url, title, artist, mediaType, thumbnail, sourceDomain, format, quality, mimeType, fileSize, formatUrl } = req.body;

  if (!url || !formatUrl) {
    res.status(400).json({ success: false, error: 'url and formatUrl are required' });
    return;
  }

  // Handle ytdlp: URLs by extracting the underlying video URL for validation
  let targetUrlToValidate = formatUrl;
  if (formatUrl.startsWith('ytdlp:')) {
    const parts = formatUrl.slice(6).split('||');
    targetUrlToValidate = parts[1] || '';
  }

  const validation = validateUrl(targetUrlToValidate);
  if (!validation.valid) {
    res.status(400).json({ success: false, error: `Invalid format URL: ${validation.error}` });
    return;
  }

  const ssrfCheck = await checkSsrf(validation.url!.hostname);
  if (!ssrfCheck.safe) {
    res.status(400).json({ success: false, error: ssrfCheck.reason });
    return;
  }

  const id = uuidv4();
  const now = Date.now();
  const ext = format || 'mp4';
  const rawTitle = title || 'video';
  const filename = sanitizeFilename(rawTitle.substring(0, 80)) + '.' + ext;

  const job: DownloadJob = {
    id,
    url,
    title,
    artist,
    mediaType: mediaType || (['mp3', 'm4a', 'wav', 'flac'].includes((format || '').toLowerCase()) ? 'music' : 'video'),
    thumbnail,
    sourceDomain,
    format,
    quality,
    mimeType,
    fileSize,
    filename,
    status: 'ready',
    progress: 0,
    downloadUrl: formatUrl,
    createdAt: now,
    updatedAt: now,
  };

  createJob(job);

  const historyEntry: HistoryEntry = {
    id: uuidv4(),
    jobId: id,
    url,
    title,
    artist,
    mediaType: job.mediaType,
    thumbnail,
    sourceDomain,
    format,
    quality,
    fileSize,
    filename,
    status: 'started',
    createdAt: now,
  };
  createHistory(historyEntry);

  res.json({ success: true, data: { id, filename, status: 'ready' } });
});

// GET /api/downloads
router.get('/', (_req: Request, res: Response) => {
  const jobs = getAllJobs();
  res.json({ success: true, data: jobs });
});

// GET /api/downloads/:id
router.get('/:id', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }
  res.json({ success: true, data: job });
});

// DELETE /api/downloads (Clear all download jobs)
router.delete('/', (_req: Request, res: Response) => {
  clearAllJobs();
  res.json({ success: true });
});

// DELETE /api/downloads/:id
router.delete('/:id', (req: Request, res: Response) => {
  deleteJob(req.params.id);
  res.json({ success: true });
});

// POST /api/downloads/:id/pause
router.post('/:id/pause', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (job) {
    updateJob(req.params.id, { status: 'paused' });
  }
  res.json({ success: true });
});

// POST /api/downloads/:id/resume
router.post('/:id/resume', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (job) {
    updateJob(req.params.id, { status: 'processing' });
  }
  res.json({ success: true });
});

// POST /api/downloads/:id/cancel
router.post('/:id/cancel', (req: Request, res: Response) => {
  const job = getJob(req.params.id);
  if (job && ['pending', 'ready', 'processing'].includes(job.status)) {
    updateJob(req.params.id, { status: 'cancelled' });
  }
  res.json({ success: true });
});

// POST /api/downloads/:id/complete
router.post('/:id/complete', (req: Request, res: Response) => {
  const { fileSize } = req.body;
  updateJob(req.params.id, { status: 'completed', progress: 100, ...(fileSize ? { fileSize } : {}) });
  updateHistory(req.params.id, { status: 'completed', completedAt: Date.now(), ...(fileSize ? { fileSize } : {}) });
  res.json({ success: true });
});

// POST /api/downloads/:id/fail
router.post('/:id/fail', (req: Request, res: Response) => {
  const { error } = req.body;
  updateJob(req.params.id, { status: 'failed', errorMessage: error || 'Unknown error' });
  updateHistory(req.params.id, { status: 'failed', errorMessage: error || 'Unknown error' });
  res.json({ success: true });
});

export default router;
