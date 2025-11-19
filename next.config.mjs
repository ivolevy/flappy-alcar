/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Desactivar turbopack temporalmente si hay problemas
  // Puedes activarlo con: npm run dev -- --turbo
}

export default nextConfig
