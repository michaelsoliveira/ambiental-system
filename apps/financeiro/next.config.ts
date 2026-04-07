import dotenv from "dotenv";
import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Raiz do monorepo: `.env` aqui não é lido automaticamente pelo Next (só `apps/financeiro/.env*`). */
const monorepoRoot = path.join(__dirname, "../..");
const isDev = process.env.NODE_ENV !== "production";
const envFiles = isDev
  ? [".env", ".env.local", ".env.development", ".env.development.local"]
  : [".env", ".env.local", ".env.production", ".env.production.local"];
for (const f of envFiles) {
  const p = path.join(monorepoRoot, f);
  if (existsSync(p)) dotenv.config({ path: p, override: true });
}

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
