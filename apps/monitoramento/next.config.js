/** @type {import('next').NextConfig} */

const isDev = process.env.ENVIRONMENT  === 'development';
const revision = crypto.randomUUID();

const withSerwist = require('@serwist/next').default({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: true,
  disable: process.env.ENVIRONMENT === 'development',
  additionalPrecacheEntries: [{ url: '/offline', revision }],
});

const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      }
    ]
  },
  transpilePackages: ['geist'],
  output: "standalone",
};

module.exports = withSerwist(nextConfig);