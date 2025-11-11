/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" },
    { hostname: "res.cloudinary.com" },
    ],

  },
  experimental: {
    serverComponentsExternalPackages: ["bcrypt", "@mapbox/node-pre-gyp"]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Ignore problematic files from node_modules
    config.module.rules.push({
      test: /\.html$/,
      use: 'ignore-loader',
    });

    // Exclude bcrypt and related packages from client-side bundling
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        bcrypt: false,
        '@mapbox/node-pre-gyp': false,
      };
    }

    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // Ignore all files in node-pre-gyp directories
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@mapbox\/node-pre-gyp$/,
      })
    );

    return config;
  },
};

export default nextConfig;
