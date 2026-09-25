import { defineConfig } from "drizzle-kit";
export default defineConfig({schema:"./infrastructure/db/schema.ts",out:"./drizzle",dialect:"postgresql",dbCredentials:{url:process.env.DATABASE_URL||"postgresql://jiang:change-me@localhost:5432/jiang_os"}});
