/**
 * Next.js Image Configuration
 * Covers all image sources used in car listings.
 *
 * Paste this into your next.config.ts.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow all relative paths served by the Vite/Laravel static server
    remotePatterns: [
      // Local Laravel dev server — car images served at /car1/...
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/car/**",
      },
      // BringATrailer listing thumbnails (source images)
      {
        protocol: "https",
        hostname: "bringatrailer.com",
        pathname: "/**",
      },
      // Unsplash fallbacks
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes:  [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
