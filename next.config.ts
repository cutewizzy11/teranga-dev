import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image deployed on Systalink Datacloud.
  output: "standalone",
  // PGlite ships a WASM build of Postgres; load it from node_modules instead of bundling it.
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
  // No next/image optimisation: keeps the LGPL-licensed sharp/libvips binaries out of the deployed app (CADEV rule 6).
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
