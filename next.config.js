/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', '@prisma/client'],
  },
  transpilePackages: ['react-pageflip'],
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/read/:slug',
        destination: '/flipbook/:slug',
        permanent: true,
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/data/**', '**/.next/**'],
      };
    }
    return config;
  },
};

module.exports = nextConfig;
