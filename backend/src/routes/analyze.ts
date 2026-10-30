import { Router, Request, Response } from 'express';
import { validateUrl, checkSsrf } from '../utils/security';
import { detectProvider, analyzeUrl, getSupportedSources } from '../providers/registry';

const router = Router();

// POST /api/analyze
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { url: rawUrl } = req.body;

  // 1. Validate URL format
  const validation = validateUrl(rawUrl);
  if (!validation.valid || !validation.url) {
    res.status(400).json({ success: false, error: validation.error });
    return;
  }

  const parsedUrl = validation.url;

  // 2. SSRF protection
  const ssrfCheck = await checkSsrf(parsedUrl.hostname);
  if (!ssrfCheck.safe) {
    res.status(400).json({ success: false, error: ssrfCheck.reason });
    return;
  }

  // 3. Detect provider
  const detection = detectProvider(parsedUrl);
  if (!detection.supported) {
    res.status(422).json({
      success: false,
      error: detection.reason,
      unsupported: true,
    });
    return;
  }

  // 4. Analyze with provider
  const result = await analyzeUrl(parsedUrl, rawUrl);
  if (!result.success) {
    res.status(422).json({ success: false, error: result.error });
    return;
  }

  res.json({ success: true, data: result.data });
});

// GET /api/analyze/sources
router.get('/sources', (_req: Request, res: Response) => {
  res.json({ success: true, data: getSupportedSources() });
});

export default router;
