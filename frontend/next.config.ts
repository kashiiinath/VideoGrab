import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
  },
  eslint: {
    // Warnings and errors from ESLint won't fail the production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds even with type warnings
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
