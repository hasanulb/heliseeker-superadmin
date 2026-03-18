import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "@/drizzle/schema"

type PostgresClient = ReturnType<typeof postgres>

function buildDatabaseUrl(): string {
  const ensureSearchPath = (url: string) => {
    if (url.includes("search_path%3Dpublic") || url.includes("search_path=public")) return url
    const joiner = url.includes("?") ? "&" : "?"
    return `${url}${joiner}options=-c%20search_path%3Dpublic`
  }

  if (process.env.DATABASE_URL) {
    return ensureSearchPath(process.env.DATABASE_URL)
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
  return ensureSearchPath(`postgresql://${user}:${encodedPassword}@${host}:${port}/${dbName}?sslmode=require`)
}

function parsePoolSize(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined
  return Math.floor(parsed)
}

function buildPostgresClient(): PostgresClient {
  const connectionString = buildDatabaseUrl()

  const max =
    parsePoolSize(process.env.DB_POOL_SIZE) ??
    parsePoolSize(process.env.PG_POOL_SIZE) ??
    (process.env.NODE_ENV === "development" ? 1 : 5)

  return postgres(connectionString, {
    prepare: false,
    max,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  })
}

const globalForDb = globalThis as typeof globalThis & {
  __burjcon_postgres_client?: PostgresClient
  __burjcon_drizzle_db?: ReturnType<typeof drizzle<typeof schema>>
}

const client = globalForDb.__burjcon_postgres_client ?? buildPostgresClient()
if (process.env.NODE_ENV !== "production") globalForDb.__burjcon_postgres_client = client

export const db = globalForDb.__burjcon_drizzle_db ?? drizzle(client, { schema })
if (process.env.NODE_ENV !== "production") globalForDb.__burjcon_drizzle_db = db
export { client }
