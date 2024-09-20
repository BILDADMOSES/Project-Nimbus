  /** @type {import('next').NextConfig} */
  const nextConfig = {
    typescript: {
      ignoreBuildErrors: true,
    },
    experimental: {
      serverComponentsExternalPackages: ["pdf-parse"],
    },
    reactStrictMode: true,
    images: {
      domains: ['firebasestorage.googleapis.com'],
    },
  }
  
  module.exports = nextConfig