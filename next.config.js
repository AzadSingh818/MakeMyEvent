/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   appDir: true,
  // },
  images: {
    domains: [
      'localhost',
      'conference-files.s3.amazonaws.com',
      'res.cloudinary.com',
      'uploadthing.com',
      'utfs.io'
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack config for handling PDFs and other files
    config.module.rules.push({
      test: /\.(pdf|doc|docx)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/files/',
          outputPath: 'static/files/',
        },
      },
    });

    return config;
  },
  // Enable source maps in production for better debugging
  productionBrowserSourceMaps: true,
  
  // Compress responses
  compress: true,
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // SWC minify for better performance
  swcMinify: true,
};

module.exports = nextConfig;