/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "https://insightful-iguana-350.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
