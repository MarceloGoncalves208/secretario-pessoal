import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Skip middleware on Vercel to avoid Edge runtime issues
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;
