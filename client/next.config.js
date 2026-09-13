/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Local development only: proxy /api/* to the local Express backend.
    // Production uses the Route Handler at app/api/[...proxy]/route.js
    // which forwards to BACKEND_URL with proper cookie management.
    if (process.env.NODE_ENV === 'production') return [];
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
