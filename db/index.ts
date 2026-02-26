import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "@/drizzle/schema"

function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const host = process.env.DB_HOST
  const port = process.env.DB_PORT || "5432"
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD
  const dbName = process.env.DB_NAME

  if (!host || !user || !password || !dbName) {
    throw new Error("Missing DB connection variables. Set DATABASE_URL or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME")
  }

  const encodedPassword = encodeURIComponent(password)
  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${dbName}?sslmode=require`
}

const connectionString = buildDatabaseUrl()
const client = postgres(connectionString, {
  prepare: false,
})

export const db = drizzle(client, { schema })
export { client }
