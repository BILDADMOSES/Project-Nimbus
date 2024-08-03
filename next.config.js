  /** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
}

module.exports = nextConfig