import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Opplastinger kan være store (ZIP med bilder). Gjelder server actions;
  // API-rutene leser body som stream og styres av MAX_UPLOAD_MB i .env.
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  async headers() {
    return [
      {
        // Appen selv skal aldri kunne bygges inn i andres sider.
        source: "/((?!serve).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
