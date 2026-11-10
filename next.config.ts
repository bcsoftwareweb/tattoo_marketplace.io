import type { NextConfig } from "next";

const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? "/tattoo_marketplace.io" : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
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
