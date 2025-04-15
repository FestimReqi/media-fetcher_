'use client';

import { useState } from 'react';
import axios from 'axios';

import { Facebook } from 'lucide-react';
import { Github } from 'lucide-react';
import { Linkedin } from 'lucide-react';
import { ChevronsLeftRightEllipsis } from 'lucide-react';
import { Youtube } from 'lucide-react';


export default function Home() {
  const [url, setUrl] = useState('');
  const [downloaded, setDownloaded] = useState(false);

  const getCleanUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const v = urlObj.searchParams.get('v');
      return v ? `https://www.youtube.com/watch?v=${v}` : url;
    } catch (err) {
      return url;
    }
  };

  const handleDownload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!url || !url.includes('youtube.com')) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    setDownloaded(true);

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/download',
        new URLSearchParams({ url: getCleanUrl(url) }),
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const blob = new Blob([response.data], { type: 'video/mp4' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'video.mp4';
      link.click();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        alert(`Error: ${err.response?.data?.detail || err.message}`);
      } else {
        alert('Something went wrong');
      }
    } finally {
      setDownloaded(false);
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1 className="text-2xl font-bold mb-4 text-center underline underline-offset-4 text-red-500 flex items-center justify-center gap-2  ">
        <Youtube className='text-2xl' />
        video-extractor
      </h1>
      <form onSubmit={handleDownload} className="flex items-center justify-center gap-2">
        <input
          type="text"
          placeholder="Enter YouTube URL"
          value={url}
          className="border-2 border-red-300 rounded-md p-2"
          onChange={(e) => setUrl(e.target.value)}
          style={{ padding: '0.5rem', width: '300px' }}
        />
        <button
          type="submit"
          className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-600"
          disabled={downloaded}
          style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
        >
          {downloaded ? 'Downloading...' : 'Download'}
        </button>
      </form>
      <p className="text-center text-gray-500 mt-4">
      This is a simple media fetching tool built with Next.js and Tailwind CSS.<br />
      It allows users to extract and download publicly accessible video content in MP4 format using a video URL.
      </p>
      <p className="text-center text-gray-500 mt-4 flex items-center justify-center gap-2">
        Made with ❤️ by{' '}
        <a href="https://github.com/festimrecic" target="_blank" className="text-white hover:text-white mx-2 gap-2 flex bg-gray-900 rounded-xs p-2 hover:bg-gray-700 font-bold" >
          Festim Reçi
        </a>
      </p>
      <p className="text-center text-gray-500 mt-4 flex items-center justify-center gap-2">
        <a href="https://github.com/FestimReqi" target="_blank" className="text-white hover:text-white mx-2 gap-2 flex bg-gray-900 rounded-xs p-2 hover:bg-gray-700">
          <Github />
          GitHub
        </a>
        <a href="https://www.linkedin.com/in/festimreçi/" target="_blank" className="text-white hover:text-white gap-2 mx-2 flex bg-blue-500 rounded-xs p-2 hover:bg-blue-600">
          <Linkedin />
          LinkedIn
        </a>
        <a href="https://www.facebook.com/festim00/" target="_blank" className="text-white hover:text-white-600 mx-2 flex bg-blue-500 rounded-xs p-2 hover:bg-blue-600">
          <Facebook />
          Facebook
        </a>
        <a href="https://festimreqi.github.io/festim/" target="_blank" className="text-white hover:text-white mx-2 flex gap-2 bg-yellow-500 rounded-xs p-2 hover:bg-yellow-600">
          <ChevronsLeftRightEllipsis />
          Web Portfolio
        </a>
      </p>
    </main>
  );
}
