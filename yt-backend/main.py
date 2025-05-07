import json
import logging
import os
import subprocess
import uuid
from typing import Annotated
from urllib.parse import urlparse

import browser_cookie3
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

logging.basicConfig(level=logging.DEBUG)

app = FastAPI()


def is_valid_youtube_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.netloc in ["www.youtube.com", "youtube.com", "youtu.be"]


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


def cleanup_file(path: str):
    try:
        os.remove(path)
    except Exception as e:
        print(f"Failed to delete file {path}: {e}")


def file_streamer(file_path: str, chunk_size: int = 1024 * 1024):
    with open(file_path, "rb") as f:
        while chunk := f.read(chunk_size):
            yield chunk


@app.post("/download")
async def download_video(
    background_tasks: BackgroundTasks,
    url: str = Form("http://localhost:3000"),
    cookies_file: UploadFile | None = File(default=None),
):
    logger = logging.getLogger("yt-dlp")
    logger.debug("Incoming URL: %s", url)

    if not is_valid_youtube_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL.")

    cookies_file_path = os.path.join(os.getcwd(), "cookies.txt")

    try:
        if cookies_file:
            raw_content = await cookies_file.read()

            # ✅ Detect JSON format (invalid for yt-dlp)
            if raw_content.strip().startswith(b"{") or raw_content.strip().startswith(
                b"["
            ):
                raise HTTPException(
                    status_code=400,
                    detail="❌ Invalid cookies file format. Please use the 'Get cookies.txt' Chrome extension to export cookies in Netscape format.",
                )

            with open(cookies_file_path, "wb") as f:
                f.write(raw_content)
            logging.debug("Uploaded cookies file saved.")
        else:
            try:
                with open("cookies.json") as f:
                    cookies = json.load(f)

                with open(cookies_file_path, "w") as out:
                    out.write("# Netscape HTTP Cookie File\n")
                    for c in cookies:
                        if "expires" not in c:
                            logging.warning(
                                f"Skipping cookie without 'expires': {c.get('name', '')}"
                            )
                            continue
                        out.write(
                            f"{c['domain']}\tTRUE\t{c['path']}\t"
                            f"{str(c['secure']).upper()}\t{c['expires']}\t"
                            f"{c['name']}\t{c['value']}\n"
                        )
                logging.debug("cookies.json loaded and written to cookies.txt.")
            except FileNotFoundError:
                logging.warning("cookies.json not found. Trying browser cookies...")
                try:
                    cj = browser_cookie3.chrome(domain_name="youtube.com")
                    if not cj:
                        raise ValueError("No YouTube cookies found in browser.")
                    with open(cookies_file_path, "w") as f:
                        f.write("# Netscape HTTP Cookie File\n")
                        for c in cj:
                            if c.expires:
                                f.write(
                                    f"{c.domain}\tTRUE\t{c.path}\t"
                                    f"{str(c.secure).upper()}\t{int(c.expires)}\t"
                                    f"{c.name}\t{c.value}\n"
                                )
                    logging.debug("Browser cookies written to cookies.txt.")
                except Exception as e:
                    logging.error(f"Error extracting browser cookies: {e}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Could not extract or write cookies: {e}",
                    )

        output_filename = f"{uuid.uuid4()}.mp4"
        temp_dir = os.path.join(os.getcwd(), "downloads")
        os.makedirs(temp_dir, exist_ok=True)
        output_path = os.path.join(temp_dir, output_filename)

        command = [
            "yt-dlp",
            "--cookies",
            cookies_file_path,
            "-f",
            "best[ext=mp4]",
            "-o",
            output_path,
            url,
        ]

        subprocess.run(command, check=True)

        background_tasks.add_task(cleanup_file, output_path)
        file_size = os.path.getsize(output_path)

        headers = {
            "Content-Disposition": 'attachment; filename="video.mp4"',
            "Content-Length": str(file_size),
        }

        return StreamingResponse(
            file_streamer(output_path),
            media_type="video/mp4",
            headers=headers,
        )

    except subprocess.CalledProcessError as e:
        logging.error(f"🔥 yt-dlp error: {e}")
        if "Sign in to confirm you're not a bot" in str(e):
            raise HTTPException(
                status_code=400,
                detail="YouTube requires login to download this video. Please provide valid cookies.",
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="yt-dlp failed to download the video.",
            )
