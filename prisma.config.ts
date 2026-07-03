import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // CLI-only (migrate/studio/db push) — must be the session-mode/direct
  // connection (port 5432). Supabase's transaction-mode pooler (6543, used
  // by DATABASE_URL for the app's runtime PrismaClient in lib/prisma.ts)
  // doesn't support the session-level features Prisma Migrate needs
  // (advisory locks, prepared statements) — it doesn't error, it just
  // hangs with the connection established and no protocol progress.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
