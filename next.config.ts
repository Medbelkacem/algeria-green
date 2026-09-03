import type { NextConfig } from "next";

const blobHost = process.env.BLOB_READ_WRITE_TOKEN ? "*.public.blob.vercel-storage.com" : null;

const nextConfig: NextConfig = {
  // The repository root, so Turbopack does not walk up into unrelated projects.
  turbopack: { root: __dirname },

  images: {
    remotePatterns: blobHost
      ? [{ protocol: "https", hostname: blobHost }]
      : [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    formats: ["image/webp"],
  },

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            // Geolocation and camera are requested from the planting form only.
            value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      {
        // The worker must be re-fetched so users pick up new caching rules.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
