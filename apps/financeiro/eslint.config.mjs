import { nextJsConfig } from "@saas/eslint/next-js";

/** ESLint 9 flat config — use `pnpm lint` (eslint CLI), não `next lint`. */
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "next-env.d.ts",
      "*.config.ts",
      "*.config.mjs",
    ],
  },
  ...nextJsConfig,
];
