import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Pin the workspace root to THIS project. Without it, Turbopack infers the root from the nearest
  // lockfile and picks up a stray ~/package-lock.json (home dir) — which mislocates its persistent
  // cache and caused "Loading persistence directory failed". Also silences the multi-lockfile warning.
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
