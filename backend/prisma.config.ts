import "dotenv/config";
import dns from "node:dns";
import { defineConfig } from "prisma/config";

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"],
  },
});
