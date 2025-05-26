"use client";

import { useState } from "react";
import axios from "axios";
// import Cookies from "js-cookie";
import {
  Github,
  Youtube,
  Linkedin,
  Facebook,
  Instagram,
  AlertCircle,
  ChevronsLeftRightEllipsis,
} from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isValidYoutubeUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ["www.youtube.com", "youtube.com", "youtu.be"].includes(
        parsed.hostname
      );
    } catch {
      return false;
    }
  };

  const handleDownload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!url || !isValidYoutubeUrl(url)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    const cookiesInput = e.currentTarget.querySelector(
      'input[name="cookies_file"]'
    ) as HTMLInputElement;

    if (!cookiesInput?.files?.length) {
      setError("Cookies file is required for downloading");
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("url", url);
      formData.append("cookies_file", cookiesInput.files[0]);

      const res = await axios.post(
        "https://media-fetcher-backend-2mcm.onrender.com/download",
        formData,
        {
          responseType: "blob",
          timeout: 300000,
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              setProgress(
                Math.round((progressEvent.loaded * 100) / progressEvent.total)
              );
            }
          },
        }
      );

      // Handle successful download
      const blob = new Blob([res.data], { type: "video/mp4" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setSuccess("Download completed successfully!");
    } catch (err) {
      let errorMessage = "Download failed. Please try again.";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          // Try to parse error message from backend
          if (err.response.data instanceof Blob) {
            try {
              const errorText = await err.response.data.text();
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.detail || errorMessage;
            } catch {
              errorMessage = "Invalid server response";
            }
          } else if (typeof err.response.data === "object") {
            errorMessage = err.response.data.message || errorMessage;
          }
        } else if (err.request) {
          errorMessage =
            "No response from server. Please check your connection.";
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center underline underline-offset-4 text-red-500 flex items-center justify-center gap-2">
        <Youtube className="text-2xl" />
        YouTube Video Downloader
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-start gap-2">
          <AlertCircle className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleDownload} className="space-y-4">
        <div>
          <label htmlFor="url" className="block mb-1 font-medium">
            YouTube URL
          </label>
          <input
            id="url"
            type="text"
            name="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="cookies_file" className="block mb-1 font-medium">
            Cookies File (required)
            <span className="text-xs block text-gray-500 mt-1">
              Use the{" "}
              <a
                href="https://chrome.google.com/webstore/detail/get-cookiestxt/kjbnjopbmjenkgaacgkildjjfjjgmjlg"
                target="_blank"
                className="underline text-blue-600"
              >
                Get cookies.txt
              </a>{" "}
              Chrome extension after logging into YouTube. Upload the generated
              `.txt` file here.
            </span>
          </label>
          <input
            id="cookies_file"
            type="file"
            name="cookies_file"
            accept=".txt"
            className="w-full p-2 border rounded file:mr-2 file:py-1 file:px-3 file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <span className="mr-2">Downloading ({progress}%)</span>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            "Download Video"
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-gray-600">
        <p className="mb-4">
          This tool allows you to download YouTube videos by providing a valid
          cookies file.
        </p>
        <div className="mt-10 text-center text-gray-600 space-y-4">
          <p className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
            Made with ❤️ by
            <a
              href="https://github.com/FestimReqi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-bold bg-gray-900 hover:bg-gray-700 px-3 py-1 rounded transition"
            >
              Festim Reçi
            </a>
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <a
              href="https://github.com/FestimReqi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-[130px] h-[40px] text-white bg-gray-900 hover:bg-gray-700 rounded p-2"
            >
              <Github />
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/festimreçi/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-[130px] h-[40px] text-white bg-blue-500 hover:bg-blue-600 rounded p-2"
            >
              <Linkedin />
              LinkedIn
            </a>
            <a
              href="https://www.facebook.com/festim00/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-[130px] h-[40px] text-white bg-blue-500 hover:bg-blue-600 rounded p-2"
            >
              <Facebook />
              Facebook
            </a>
            <a
              href="https://www.instagram.com/festim.reqi15/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-[130px] h-[40px] text-white bg-fuchsia-500 hover:bg-fuchsia-600 rounded p-2"
            >
              <Instagram />
              Instagram
            </a>
            <a
              href="https://festimreci-dev.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-[130px] h-[40px] text-white bg-yellow-500 hover:bg-yellow-600 rounded p-2"
            >
              <ChevronsLeftRightEllipsis />
              Portfolio
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
