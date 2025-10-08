import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: Disables ESLint errors from causing build failures.
    // Lint errors will still be shown in the console.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
