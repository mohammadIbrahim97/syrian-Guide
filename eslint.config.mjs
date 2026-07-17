import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Every image in this app is dynamic user-uploaded or remote content
      // served from Supabase storage (arbitrary dimensions and hosts), so we
      // use plain <img> throughout rather than next/image. Disable the rule
      // deliberately instead of leaving it as tolerated warnings.
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "generated/**",
    // Coverage report output (see /coverage in .gitignore).
    "coverage/**",
  ]),
]);

export default eslintConfig;
