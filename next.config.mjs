/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build "standalone" — gera .next/standalone/server.js que o Dockerfile usa
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
