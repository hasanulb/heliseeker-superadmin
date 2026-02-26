import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { defaultAdminDb } from "./default-data"
import { AdminPanelDb } from "./types"

const dataDir = path.join(process.cwd(), "data")
const dataFile = path.join(dataDir, "admin-panel.json")

async function ensureDataFile() {
  await mkdir(dataDir, { recursive: true })
  try {
    await readFile(dataFile, "utf8")
  } catch {
    await writeFile(dataFile, JSON.stringify(defaultAdminDb, null, 2), "utf8")
  }
}

export async function readDb(): Promise<AdminPanelDb> {
  await ensureDataFile()
  const raw = await readFile(dataFile, "utf8")
  return JSON.parse(raw) as AdminPanelDb
}

export async function writeDb(next: AdminPanelDb): Promise<void> {
  await ensureDataFile()
  await writeFile(dataFile, JSON.stringify(next, null, 2), "utf8")
}

export async function updateDb(updater: (current: AdminPanelDb) => AdminPanelDb | Promise<AdminPanelDb>): Promise<AdminPanelDb> {
  const current = await readDb()
  const next = await updater(current)
  await writeDb(next)
  return next
}

export function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
