/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', '@prisma/client'],
  },
  transpilePackages: ['react-pageflip'],
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
