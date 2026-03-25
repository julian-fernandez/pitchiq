import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'crests.football-data.org',
      },
      {
        // country flag SVGs from football-data.org
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
};

export default nextConfig;
