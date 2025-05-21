"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
      <h1 className="text-[100px] sm:text-[120px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse drop-shadow-lg">
        404
      </h1>

      <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
        Page Not Found
      </h2>

      <p className="text-gray-600 max-w-md mb-6 text-base sm:text-lg">
        Sorry, the page you’re looking for doesn’t exist or may have been moved.
      </p>

      <Link
        href="/"
        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full text-sm font-medium transition duration-300 shadow-md"
      >
        ← Back to Home
      </Link>

      <div className="mt-12 text-xs text-gray-400">
        StayEase © 2025 — All rights reserved
      </div>
    </div>
  );
}
