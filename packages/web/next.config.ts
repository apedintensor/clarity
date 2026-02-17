import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import type { NextConfig } from "next";

// Load .env from monorepo root so API keys are available to Next.js API routes
dotenvConfig({ path: resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@clarity/core", "@clarity/db", "@clarity/types"],
  serverExternalPackages: ["better-sqlite3"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("better-sqlite3");
    }
    return config;
  },
};

export default nextConfig;
