/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com', 'media.licdn.com', 'img.youtube.com'],
  },
  async rewrites() {
    return [
      {
        source: '/Sanchit_Vijay_Resume.pdf',
        destination: '/api/resume',
      },
    ];
  },
}

module.exports = nextConfig 