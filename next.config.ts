import type { NextConfig } from "next";

/**
 * The voice models run entirely in the browser, so the Node builds of
 * onnxruntime and sharp that Transformers.js mentions must never be bundled.
 * Aliasing them to an empty module keeps both bundlers from chasing them.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      sharp: "./src/lib/empty-module.ts",
      "onnxruntime-node": "./src/lib/empty-module.ts",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };
    return config;
  },
};

export default nextConfig;
