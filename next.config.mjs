/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable to avoid double renders and duplicate API calls
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
