import type { NextConfig } from "next";

const apiHost = process.env.API_HOST || 'http://localhost';
const apiPort = process.env.API_PORT || '8000';

// Default to the deployed API when running on Vercel so we don't point at localhost.
const vercelDefaultApi = 'https://intellex-api.vercel.app';
const inferredDefaultTarget = process.env.VERCEL ? vercelDefaultApi : `${apiHost}:${apiPort}`;

const envProxyTarget = process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_BASE_URL;
const resolvedProxyTarget =
  envProxyTarget && envProxyTarget.startsWith('http')
    ? envProxyTarget
    : inferredDefaultTarget;
const apiProxyTarget = resolvedProxyTarget.replace(/\/$/, '');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
