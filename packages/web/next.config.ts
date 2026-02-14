import type { NextConfig } from "next";

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
