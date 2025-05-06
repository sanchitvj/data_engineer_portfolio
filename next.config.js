/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com', 'media.licdn.com', 'img.youtube.com', 'substackcdn.com', 'substack-post-media.s3.amazonaws.com'],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    unoptimized: true, // Allow direct loading of external images without optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'substackcdn.com',
        pathname: '/image/fetch/**',
      },
      {
        protocol: 'https',
        hostname: 'substack-post-media.s3.amazonaws.com',
        pathname: '/public/images/**',
      }
    ],
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