/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  async rewrites() {
    return [
      // Forward any non-handled /api/* to the Go new-api backend during dev
      {
        source: '/upstream/:path*',
        destination: `${process.env.NEW_API_BASE_URL || 'http://127.0.0.1:3000'}/:path*`,
      },
    ];
  },
};
export default nextConfig;
