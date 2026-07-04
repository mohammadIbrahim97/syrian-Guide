import "dotenv/config"
import { defineConfig } from "@prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Read directly rather than via env(), which throws at config load when
    // the variable is absent. `prisma generate` (run by postinstall and the
    // build) never connects, so it must not hard-fail when DATABASE_URL is
    // unset on a build host. migrate/seed still use the real value and error
    // clearly if it is genuinely missing when they try to connect.
    url: process.env.DATABASE_URL ?? "",
  },
})
