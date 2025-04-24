/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com', 'media.licdn.com', 'img.youtube.com'],
  },
}

module.exports = nextConfig 