from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import subprocess
import os
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/download")
async def download_video(url: str = Form(...)):
    try:
        output_filename = f"{uuid.uuid4()}.mp4"
        output_path = os.path.join(os.getcwd(), output_filename)

        command = [
            "yt-dlp",
            "-f", "best[ext=mp4]",
            "-o", output_path,
            url
        ]

        subprocess.run(command, check=True)

        return FileResponse(path=output_path, filename="video.mp4", media_type='video/mp4')

    except subprocess.CalledProcessError as e:
        print("🔥 yt-dlp error:", e)
        raise HTTPException(status_code=400, detail="yt-dlp failed to download the video.")
