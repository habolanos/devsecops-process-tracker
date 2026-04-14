/** @type {import('next').NextConfig} */
const nextConfig = {
  // 'standalone' output is only needed for Docker deployments.
  // Vercel handles its own server and expects the default output format.
  // Docker sets NEXT_OUTPUT_STANDALONE=1 in the Dockerfile to enable this.
  ...(process.env.NEXT_OUTPUT_STANDALONE === '1' ? { output: 'standalone' } : {}),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
