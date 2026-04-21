import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**/*",
      "node_modules/**/*",
      "next.config.js",
      "tailwind.config.ts",
      "next-env.d.ts",
      "postcss.config.js",
      "scripts/**/*",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      // New strict rule from eslint-plugin-react-hooks 7 (shipped with next 16).
      // Demoted to warn while we refactor the offending effects incrementally.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;