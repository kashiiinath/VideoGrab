import { URL } from 'url';
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

// Private IP ranges (SSRF protection)
const PRIVATE_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,       // Link-local
  /^::1$/,             // IPv6 loopback
  /^fc[0-9a-f]{2}:/i, // IPv6 ULA
  /^fe80:/i,           // IPv6 link-local
  /^localhost$/i,
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  url?: URL;
}

export function validateUrl(rawUrl: string): ValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL is too long' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' };
  }

  return { valid: true, url: parsed };
}

export async function checkSsrf(hostname: string): Promise<{ safe: boolean; reason?: string }> {
  // Block numeric IPs that are private
  if (isPrivateHostname(hostname)) {
    return { safe: false, reason: 'Private/internal addresses are not allowed' };
  }

  // Resolve DNS and check resolved IP
  try {
    const { address } = await dnsLookup(hostname);
    if (isPrivateIp(address)) {
      return { safe: false, reason: 'URL resolves to a private/internal IP address' };
    }
  } catch {
    return { safe: false, reason: 'Unable to resolve hostname' };
  }

  return { safe: true };
}

function isPrivateHostname(hostname: string): boolean {
  return PRIVATE_RANGES.some(r => r.test(hostname));
}

function isPrivateIp(ip: string): boolean {
  return PRIVATE_RANGES.some(r => r.test(ip));
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 200)
    .trim() || 'download';
}

export function getFileExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/x-matroska': 'mkv',
    'video/mpeg': 'mpeg',
    'application/x-mpegURL': 'm3u8',
    'application/vnd.apple.mpegurl': 'm3u8',
    'video/MP2T': 'ts',
  };
  return map[mimeType] || 'mp4';
}
