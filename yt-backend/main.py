import logging
import re
import subprocess
import uuid
from pathlib import Path
import tempfile

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI()

def is_valid_youtube_url(url: str) -> bool:
    patterns = [
        r"(https?://)?(www\.)?youtube\.com/watch\?v=.*",
        r"(https?://)?youtu\.be/.*",
        r"(https?://)?(www\.)?youtube\.com/shorts/.*"
    ]
    return any(re.match(p, url) for p in patterns)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mediafetchfr.netlify.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/download")
async def download_video(
    background_tasks: BackgroundTasks,
    url: str = Form(...),
    cookies_file: UploadFile = File(...),
):
    logger = logging.getLogger("yt-dlp")
    logger.debug("Processing download request for URL: %s", url)

    if not is_valid_youtube_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL.")

    try:
        # Create temp directory (works better on Render's filesystem)
        temp_dir = Path(tempfile.mkdtemp())
        cookies_path = temp_dir / "cookies.txt"
        output_path = temp_dir / f"{uuid.uuid4()}.mp4"

        # Process cookies file
        raw_content = await cookies_file.read()
        
        if not raw_content:
            raise HTTPException(status_code=400, detail="Cookies file is empty")
            
        if raw_content.strip().startswith(b"{") or raw_content.strip().startswith(b"["):
            raise HTTPException(
                status_code=400,
                detail="Invalid cookies format. Please use the 'Get cookies.txt' Chrome extension.",
            )

        cookies_path.write_bytes(raw_content)
        logger.debug("Cookies file saved successfully")

        # Build yt-dlp command with better error handling
        command = [
            "yt-dlp",
            "--cookies", str(cookies_path),
            "--ignore-errors",
            "--no-warnings",
            "--socket-timeout", "30",
            "--retries", "3",
            "-f", "best[ext=mp4]",
            "-o", str(output_path),
            url
        ]
        logger.debug(f"Executing command: {' '.join(command)}")

        # Execute with full error capture
        try:
            result = subprocess.run(
                command,
                check=True,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(
                status_code=400,
                detail="Download timed out. Please try again with a shorter video.",
            )
            
        if not output_path.exists():
            error_msg = result.stderr.strip().split('\n')[-1] if result.stderr else "Unknown download error"
            logger.error(f"yt-dlp failed: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail=self._parse_yt_dlp_error(error_msg),
            )

        # Cleanup function for background tasks
        def cleanup():
            try:
                output_path.unlink(missing_ok=True)
                cookies_path.unlink(missing_ok=True)
                temp_dir.rmdir()
            except Exception as e:
                logger.warning(f"Cleanup failed: {e}")

        background_tasks.add_task(cleanup)

        # Return streaming response
        def generate():
            with output_path.open('rb') as f:
                while chunk := f.read(1024 * 1024):  # 1MB chunks
                    yield chunk

        return StreamingResponse(
            generate(),
            media_type="video/mp4",
            headers={
                "Content-Disposition": f'attachment; filename="{output_path.name}"',
                "Content-Length": str(output_path.stat().st_size),
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in download endpoint")
        raise HTTPException(
            status_code=500,
            detail="Internal server error. Please try again later.",
        )

def _parse_yt_dlp_error(self, error_msg: str) -> str:
    """Parse yt-dlp error messages into user-friendly format"""
    if "Sign in" in error_msg:
        return "YouTube requires login. Please provide valid cookies."
    if "Private video" in error_msg:
        return "This is a private video. Cannot download."
    if "Unsupported URL" in error_msg:
        return "Unsupported YouTube URL."
    if "This video is unavailable" in error_msg:
        return "Video is unavailable (may be age-restricted or removed)."
    return f"Download failed: {error_msg.split('.')[0]}"