import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/bnfix/:path*',
        destination: 'https://api.bnfix.com.br/:path*',
      },
    ];
  },
};

export default nextConfig;
