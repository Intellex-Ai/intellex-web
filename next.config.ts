import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

const apiHost = process.env.API_HOST || 'http://localhost';
const apiPort = process.env.API_PORT || '8000';
const defaultProdApi =
  process.env.API_DEFAULT_TARGET ||
  (process.env.VERCEL ? 'https://intellex-api.vercel.app' : undefined);

// Prefer explicit targets; otherwise fall back to local dev API.
const envProxyTarget = process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_BASE_URL;
const inferredDefaultTarget = defaultProdApi || `${apiHost}:${apiPort}`;
const resolvedProxyTarget =
  envProxyTarget && envProxyTarget.startsWith('http')
    ? envProxyTarget
    : inferredDefaultTarget;
const apiProxyTarget = resolvedProxyTarget.replace(/\/$/, '');
const shouldProxyApi = apiProxyTarget.startsWith('http');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {},
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      supabaseHost
        ? { protocol: 'https', hostname: supabaseHost, pathname: '/**' }
        : { protocol: 'https', hostname: '*.supabase.co', pathname: '/**' },
    ],
  },
  async rewrites() {
    if (!shouldProxyApi) return [];

    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default withSerwist(nextConfig);
