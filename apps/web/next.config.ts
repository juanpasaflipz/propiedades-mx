import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during production builds
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.mlstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'http2.mlstatic.com',
      },
      {
        protocol: 'http',
        hostname: '**.mlstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'mco-s1-p.mlstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'mlm-s1-p.mlstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'mla-s1-p.mlstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'mlb-s1-p.mlstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.easybroker.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.easybroker.com',
      },
    ],
  },
};

export default nextConfig;
