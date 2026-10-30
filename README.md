# 🎬 VidGrab – Universal Video Downloader PWA

A professional mobile-first Progressive Web App for downloading videos from direct URLs, HLS streams, and public Vimeo. Works entirely locally — no cloud, no third-party service required.

---

## ✅ Features

- **Mobile-first design** — looks and feels like a native Android app
- **Real downloads** — files saved to your device's Downloads folder
- **Supported sources:**
  - Direct video files: MP4, WebM, MOV, AVI, MKV, and other formats
  - HLS streams (`.m3u8` playlists)
  - Public Vimeo videos
- **Download manager** — active, completed, and failed downloads
- **History** — search, filter, and manage download history
- **PWA** — installable on Android and desktop
- **Light/dark/system themes**
- **SSRF protection** — blocks private IP access
- **No storage of video content** — only metadata is stored locally

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ (v24 works)
- **npm** v9+
- No Python required for the core MVP

```bash
# 1. Clone / open the project folder
cd VideoDownloader

# 2. Install all dependencies
npm run install:all

# 3. Start both servers (frontend + backend)
npm run dev
```

- Frontend: http://localhost:3000  
- Backend API: http://localhost:3001/api  
- Health check: http://localhost:3001/api/health

---

## 📁 Project Structure

```
VideoDownloader/
├── frontend/              # Next.js 16 PWA (TypeScript + Tailwind v4)
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # Shared UI components
│   │   ├── screens/       # Home, Downloads, History, Settings
│   │   ├── context/       # Global React context (AppContext)
│   │   └── lib/           # API client, types, download logic
│   └── public/
│       ├── manifest.json  # PWA manifest
│       ├── sw.js          # Service Worker
│       └── icons/         # App icons
│
├── backend/               # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── providers/     # Pluggable video source providers
│   │   │   ├── directMedia.ts   # MP4, WebM, direct URLs
│   │   │   ├── hlsProvider.ts   # HLS .m3u8 streams
│   │   │   ├── vimeoProvider.ts # Public Vimeo videos
│   │   │   └── registry.ts      # Provider registry
│   │   ├── routes/        # API routes (analyze, downloads, history, stream)
│   │   ├── utils/         # Security (SSRF), cleanup, sanitization
│   │   ├── db.ts          # JSON file-based storage
│   │   └── index.ts       # Express server
│   └── data/              # Runtime data (auto-created)
│       ├── jobs.json      # Download jobs
│       └── history.json   # Download history
│
└── python-service/        # Optional FFmpeg service (Python + FastAPI)
    ├── main.py
    └── requirements.txt
```

---

## 🔧 Manual Startup (Without `npm run dev`)

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📱 Testing on a Physical Android Phone

The frontend listens on your local network at `http://192.168.x.x:3000` (shown in the terminal).

For the backend to be accessible from your phone:
1. Update `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://192.168.x.x:3001/api
   ```
2. Replace `192.168.x.x` with your computer's actual LAN IP.
3. Restart the frontend server.

---

## 🧪 Test URLs

| Type | URL |
|------|-----|
| MP4 (small) | `https://www.w3schools.com/html/mov_bbb.mp4` |
| MP4 (medium) | `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4` |
| WebM | `https://www.w3schools.com/html/movie.webm` |
| HLS | `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8` |
| Vimeo | `https://vimeo.com/76979871` |
| ❌ Unsupported | `https://www.youtube.com/watch?v=test` |
| ❌ Not found | `https://example.com/notexist.mp4` |

---

## 🔌 API Reference

### POST `/api/analyze`
Analyzes a URL and returns video metadata with available formats.

**Request:**
```json
{ "url": "https://example.com/video.mp4" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "video",
    "sourceDomain": "example.com",
    "provider": "Direct Media",
    "formats": [
      {
        "id": "direct",
        "label": "MP4 – Direct Download",
        "quality": "original",
        "format": "mp4",
        "mimeType": "video/mp4",
        "fileSize": 1234567,
        "url": "https://example.com/video.mp4",
        "hasVideo": true,
        "hasAudio": true
      }
    ]
  }
}
```

### GET `/api/stream/proxy?url=...&filename=...`
Proxies the download through the backend with proper `Content-Disposition: attachment` headers so the browser saves the file to disk.

### POST `/api/downloads`
Creates a download job.

### GET `/api/downloads`
Lists all download jobs.

### GET `/api/history`
Lists download history with optional `?search=` and `?status=` filters.

---

## 🐍 Optional Python Service (FFmpeg)

The Python service adds HLS-to-MP4 conversion and advanced media processing.

**Requirements:**
- Python 3.9+
- FFmpeg installed: https://ffmpeg.org/download.html

```bash
cd python-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Test: http://localhost:8000/health

---

## 🛡️ Security

- **SSRF protection**: Private/internal IP ranges are blocked
- **DNS rebinding protection**: Resolved IPs are validated
- **Rate limiting**: 100 requests per 15 minutes per IP
- **File size limit**: 2 GB max per download
- **Safe filenames**: Path traversal prevention
- **No DRM bypass**: DRM-protected content is explicitly rejected

---

## ❌ Unsupported Sources

| Platform | Reason |
|----------|--------|
| YouTube | Official API authorization required |
| Netflix, Disney+, Hulu | DRM-protected (Widevine/FairPlay) |
| Amazon Prime | DRM-protected |
| Instagram | Requires authentication |
| TikTok | Not currently supported |
| Twitter/X | API authorization required |

---

## 🔧 Troubleshooting

**Backend won't start:**
- Check Node.js version: `node --version` (need v18+)
- Check port conflict: something else using port 3001?
- Check `backend/data/` directory permissions

**"Backend not running" warning in app:**
- Make sure `npm run dev:backend` is running
- Check `http://localhost:3001/api/health` in browser

**Analysis returns 403:**
- The source server is blocking server-side requests (common with Google CDN)
- Try a different URL or use the direct download if you have browser access

**Frontend not loading on phone:**
- Use your computer's LAN IP instead of `localhost`
- Update `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
- Make sure Windows Firewall allows ports 3000 and 3001

**Download doesn't appear in Downloads folder:**
- Check browser download settings
- On Android Chrome: check the Downloads app or notification bar
- Large files may take a moment to appear
