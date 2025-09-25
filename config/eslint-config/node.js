// node.js
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for Node.js services/libraries.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const nodeConfig = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node, // habilita globals do Node.js (require, process, __dirname, etc)
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      // boas práticas para Node
      "no-console": "warn",
      "no-process-exit": "error",
      "callback-return": "off", // se usar callbacks
      "global-require": "off", // se usar require condicional
      "handle-callback-err": "off",
    },
  },
  {
    plugins: {
      "simple-import-sort": require("eslint-plugin-simple-import-sort"),
    },
    rules: {
      "simple-import-sort/imports": "error",
    },
  },
];
