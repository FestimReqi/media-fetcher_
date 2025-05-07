"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  Facebook,
  Github,
  Linkedin,
  ChevronsLeftRightEllipsis,
  Youtube,
} from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    Cookies.set("visited", "true", { expires: 7 });
    const alreadyVisited = Cookies.get("visited");
    console.log("Visited before?", alreadyVisited);
  }, []);

  const isValidYoutubeUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ["www.youtube.com", "youtube.com", "youtu.be"].includes(parsed.hostname);
    } catch {
      return false;
    }
  };

  const getCleanUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      // Remove any unnecessary query parameters except 'v'
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
      // Handle youtu.be format
      if (urlObj.hostname === 'youtu.be') {
        return `https://www.youtube.com/watch?v=${urlObj.pathname.slice(1)}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const handleDownload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!url || !isValidYoutubeUrl(url)) {
      alert("Please enter a valid YouTube URL");
      return;
    }
    setDownloaded(true);
    setProgress(0); // reset

    try {
      const formData = new FormData();
      formData.append("url", getCleanUrl(url));  // Use the cleaning function

      const cookiesInput = e.currentTarget.querySelector(
        'input[name="cookies_file"]'
      ) as HTMLInputElement;

      if (cookiesInput?.files?.length) {
        formData.append("cookies_file", cookiesInput.files[0]);
      }

      const res = await axios.post(
        "https://media-fetcher-backend.onrender.com/download",
        formData,
        {
          responseType: "blob",
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setProgress(percentCompleted);
            }
          },
          validateStatus: () => true,
        }
      );

      const contentType = res.headers["content-type"] || "";
      if (!res.status.toString().startsWith("2")) {
        if (contentType.includes("application/json")) {
          // Convert Blob to text safely
          const errorText = await new Response(res.data).text();
          const { detail } = JSON.parse(errorText);
          throw new Error(detail || "Unknown error");
        } else {
          throw new Error(`Download failed (status ${res.status})`);
        }
      }

      const blob = new Blob([res.data], { type: "video/mp4" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "video.mp4";
      link.click();
    } catch (err: unknown) {
      let msg = "Something went wrong.";

      if (axios.isAxiosError(err)) {
        const contentType = err.response?.headers["content-type"] || "";

        if (
          err.response &&
          err.response.status === 400 &&
          contentType.includes("application/json")
        ) {
          const errorBlob = err.response.data;
          const errorText = await new Response(errorBlob).text();
          try {
            const { detail } = JSON.parse(errorText);
            msg = detail || msg;
          } catch {
            msg = errorText || msg;
          }
        }
      }

      console.error("Download error:", msg);
      alert(msg);
    } finally {
      setDownloaded(false);
      setProgress(0); // reset after complete
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1 className="text-2xl font-bold mb-4 text-center underline underline-offset-4 text-red-500 flex items-center justify-center gap-2">
        <Youtube className="text-2xl" />
        video-extractor
      </h1>
      <form
        onSubmit={handleDownload}
        className="flex flex-col items-center justify-center gap-4"
        encType="multipart/form-data"
      >
        {/* Input for YouTube URL */}
        <input
          type="text"
          name="url" // Correct name for the URL
          placeholder="Enter YouTube URL"
          value={url}
          className="border-2 border-red-300 rounded-md p-2 w-80"
          onChange={(e) => setUrl(e.target.value)}
        />

        {/* Input for cookies.txt file upload */}

        <input
          type="file"
          name="cookies_file"
          accept=".txt"
          className="border-2 border-red-300 rounded-md p-2 w-80"
        />

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-600 w-40 h-10 relative"
          disabled={downloaded}
        >
          {downloaded ? "Downloading..." : "Download"}
        </button>

        {/* Progress Bar (only when downloading) */}
        {downloaded && (
          <div className="w-80 mt-2 text-sm">
            <div className="text-center mb-1">{progress}%</div>
            <div className="w-full h-2 bg-gray-200 rounded">
              <div
                className="h-full bg-red-500 rounded transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </form>
      <p className="text-center text-gray-500 mt-4">
        This is a simple media fetching tool built with Next.js and Tailwind
        CSS.
        <br />
        It allows users to extract and download publicly accessible video
        content in MP4 format using a video URL.
      </p>
      <p className="text-center text-gray-500 mt-4 flex items-center justify-center gap-2 sm:flex-row flex-col">
        Made with ❤️ by{" "}
        <a
          href="https://github.com/festimrecic"
          target="_blank"
          className="text-white hover:text-white mx-2 gap-2 flex bg-gray-900 rounded-xs p-2 hover:bg-gray-700 font-bold"
        >
          Festim Reçi
        </a>
      </p>
      <p className="text-center text-gray-500 mt-4 flex items-center justify-center gap-2 flex-col md:flex-row">
        <a
          href="https://github.com/FestimReqi"
          target="_blank"
          className="text-white hover:text-white w-[130px] h-[40px] mx-2 gap-2 flex bg-gray-900 rounded-xs p-2 hover:bg-gray-700"
        >
          <Github />
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/festimreçi/"
          target="_blank"
          className="text-white hover:text-white w-[130px] h-[40px] gap-2 mx-2 flex bg-blue-500 rounded-xs p-2 hover:bg-blue-600"
        >
          <Linkedin />
          LinkedIn
        </a>
        <a
          href="https://www.facebook.com/festim00/"
          target="_blank"
          className="text-white hover:text-white-600 w-[130px] h-[40px] mx-2 flex bg-blue-500 rounded-xs p-2 hover:bg-blue-600"
        >
          <Facebook />
          Facebook
        </a>
        <a
          href="https://festimreqi.github.io/festim/"
          target="_blank"
          className="text-white hover:text-white w-[130px] h-[40px] mx-2 flex gap-2 bg-yellow-500 rounded-xs p-2 hover:bg-yellow-600"
        >
          <ChevronsLeftRightEllipsis />
          Portfolio
        </a>
      </p>
    </main>
  );
}
