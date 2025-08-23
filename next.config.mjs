/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" },
      { hostname: "res.cloudinary.com" },
    ],
    
  },
  experimental: {
    serverComponentsExternalPackages: ["bcrypt"]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  }
};

export default nextConfig;
