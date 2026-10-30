"""
VidGrab Python Processing Service
Handles FFmpeg-based media processing, HLS downloading, and format conversion.

NOTE: This service is OPTIONAL for the MVP.
The Node.js backend handles direct downloads without needing this service.
This service is needed for:
  - HLS-to-MP4 conversion
  - Format transcoding
  - Advanced media inspection (ffprobe metadata)

Requirements:
  - Python 3.9+
  - FFmpeg installed and on PATH
  - pip install fastapi uvicorn pydantic aiohttp aiofiles

Start:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import uuid
import asyncio
import tempfile
import subprocess
import shutil
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

app = FastAPI(title="VidGrab Processing Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path(os.environ.get("TEMP_DIR", "./temp"))
TEMP_DIR.mkdir(exist_ok=True)

MAX_DURATION_SECONDS = 7200  # 2 hours max


# ─────────────────── Models ───────────────────

class InspectRequest(BaseModel):
    url: HttpUrl
    format: Optional[str] = None


class InspectResult(BaseModel):
    title: str
    duration: Optional[float]
    width: Optional[int]
    height: Optional[int]
    bitrate: Optional[int]
    codec: Optional[str]
    audio_codec: Optional[str]
    formats: list


class ConvertRequest(BaseModel):
    url: HttpUrl
    output_format: str = "mp4"
    quality: str = "best"
    job_id: str


# ─────────────────── Helpers ───────────────────

def check_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


def safe_filename(name: str) -> str:
    return "".join(c for c in name if c.isalnum() or c in " ._-").strip() or "video"


# ─────────────────── Routes ───────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "ffmpeg": check_ffmpeg(),
        "service": "VidGrab Python Processing Service",
    }


@app.post("/inspect")
async def inspect_media(req: InspectRequest):
    """Use ffprobe to inspect a media URL and return metadata."""
    if not check_ffmpeg():
        raise HTTPException(503, "FFmpeg is not installed on this server.")

    url = str(req.url)

    try:
        proc = await asyncio.create_subprocess_exec(
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            url,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)
    except asyncio.TimeoutError:
        raise HTTPException(408, "Media inspection timed out.")
    except Exception as e:
        raise HTTPException(500, f"ffprobe failed: {str(e)}")

    if proc.returncode != 0:
        raise HTTPException(422, f"Cannot inspect URL: {stderr.decode()[:200]}")

    import json
    data = json.loads(stdout.decode())
    fmt = data.get("format", {})
    streams = data.get("streams", [])

    video_stream = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), None)

    return {
        "title": fmt.get("tags", {}).get("title", Path(url).stem),
        "duration": float(fmt.get("duration", 0)) if fmt.get("duration") else None,
        "width": video_stream.get("width") if video_stream else None,
        "height": video_stream.get("height") if video_stream else None,
        "bitrate": int(fmt.get("bit_rate", 0)) if fmt.get("bit_rate") else None,
        "codec": video_stream.get("codec_name") if video_stream else None,
        "audio_codec": audio_stream.get("codec_name") if audio_stream else None,
        "size": int(fmt.get("size", 0)) if fmt.get("size") else None,
        "format_name": fmt.get("format_name"),
    }


@app.post("/convert")
async def convert_media(req: ConvertRequest, background_tasks: BackgroundTasks):
    """
    Convert/download a media URL to a local file using FFmpeg.
    Returns a job ID. Poll /status/{job_id} for progress.
    File is available at /download/{job_id} when complete.
    """
    if not check_ffmpeg():
        raise HTTPException(503, "FFmpeg is not installed on this server.")

    job_id = req.job_id or str(uuid.uuid4())
    out_path = TEMP_DIR / f"{job_id}.{req.output_format}"

    # Start conversion in background
    background_tasks.add_task(run_ffmpeg, str(req.url), str(out_path), job_id)

    return {"job_id": job_id, "status": "processing"}


async def run_ffmpeg(url: str, output_path: str, job_id: str):
    """Run FFmpeg to download/convert media."""
    cmd = [
        "ffmpeg",
        "-y",                        # Overwrite output
        "-i", url,                   # Input URL
        "-c", "copy",                # Copy streams (no re-encode = fast)
        "-movflags", "+faststart",   # Web-optimized MP4
        "-t", str(MAX_DURATION_SECONDS),
        output_path,
    ]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await asyncio.wait_for(proc.communicate(), timeout=MAX_DURATION_SECONDS + 30)
        if proc.returncode == 0:
            print(f"✅ FFmpeg completed job {job_id}")
        else:
            print(f"❌ FFmpeg failed job {job_id}")
    except Exception as e:
        print(f"❌ FFmpeg exception for job {job_id}: {e}")


@app.get("/download/{job_id}")
async def download_file(job_id: str):
    """Download a processed file. Deletes after serving."""
    # Validate job_id (no path traversal)
    if not job_id.replace("-", "").replace("_", "").isalnum():
        raise HTTPException(400, "Invalid job ID")

    # Find file
    for ext in ["mp4", "webm", "mkv", "ts"]:
        path = TEMP_DIR / f"{job_id}.{ext}"
        if path.exists():
            return FileResponse(
                str(path),
                media_type=f"video/{ext}",
                headers={
                    "Content-Disposition": f'attachment; filename="{job_id}.{ext}"',
                    "Cache-Control": "no-store",
                },
            )

    raise HTTPException(404, "File not found or expired")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
