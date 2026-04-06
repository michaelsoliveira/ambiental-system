import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  /** Rastreia dependências do monorepo (pnpm) no bundle standalone. */
  outputFileTracingRoot: path.join(__dirname, "../.."),
  /** Build Docker/CI: o projeto ainda tem muitos avisos/erros de ESLint; rode `pnpm lint` localmente. */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { hostname: "github.com" },
      { hostname: "avatars.githubusercontent.com" },
      { hostname: "cdn.jsdelivr.net" },
    ],
  },
};

export default nextConfig;
