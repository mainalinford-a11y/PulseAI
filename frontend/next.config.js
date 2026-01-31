/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    N8N_BASE_URL: process.env.N8N_BASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

module.exports = nextConfig;