import { NextRequest, NextResponse } from "next/server"

import { getServerSupabase } from "@/app/api/_lib/supabase"

const masterTableMap = {
  departments: {
    table: "departments",
    required: ["name"],
    allowed: ["name", "description", "status", "auth_user_id", "updated_at"],
  },
  languages: {
    table: "languages",
    required: ["name"],
    allowed: ["name", "description", "auth_user_id", "updated_at"],
  },
  services: {
    table: "services",
    required: ["service_name", "department_id"],
    allowed: ["service_name", "description", "department_id", "age_group_id", "status", "auth_user_id", "updated_at"],
  },
  specializations: {
    table: "specializations",
    required: ["name"],
    allowed: ["name", "description", "auth_user_id", "updated_at"],
  },
  "age-groups": {
    table: "age_groups",
    required: ["name"],
    allowed: ["name", "description", "auth_user_id", "updated_at"],
  },
} as const

type MasterSlug = keyof typeof masterTableMap

function getConfig(slug: string) {
  return masterTableMap[slug as MasterSlug]
}

function pickAllowed(payload: Record<string, unknown>, allowed: readonly string[]) {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => allowed.includes(key)))
}

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const config = getConfig(params.slug)
  if (!config) {
    return NextResponse.json({ message: "Unknown master type" }, { status: 400 })
  }

  const supabase = await getServerSupabase()
  const { data, error } = await supabase.from(config.table).select("*").order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const config = getConfig(params.slug)
  if (!config) {
    return NextResponse.json({ message: "Unknown master type" }, { status: 400 })
  }

  const payload = (await request.json()) as Record<string, unknown>
  const supabase = await getServerSupabase()

  const { data: userData } = await supabase.auth.getUser()
  const authUserId = userData?.user?.id

  const missing = config.required.filter((key) => payload[key] === undefined || payload[key] === null || payload[key] === "")
  if (missing.length > 0) {
    return NextResponse.json({ message: `Missing required fields: ${missing.join(", ")}` }, { status: 400 })
  }

  const insertPayload = {
    ...pickAllowed(payload, config.allowed),
    ...(authUserId ? { auth_user_id: authUserId } : {}),
  }

  const { data, error } = await supabase.from(config.table).insert([insertPayload]).select().single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  const config = getConfig(params.slug)
  if (!config) {
    return NextResponse.json({ message: "Unknown master type" }, { status: 400 })
  }

  const payload = (await request.json()) as Record<string, unknown>
  const id = payload.id as string | undefined
  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 })
  }

  const supabase = await getServerSupabase()
  const updatePayload = {
    ...pickAllowed(payload, config.allowed),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from(config.table).update(updatePayload).eq("id", id).select().single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  const config = getConfig(params.slug)
  if (!config) {
    return NextResponse.json({ message: "Unknown master type" }, { status: 400 })
  }

  const payload = (await request.json()) as { id?: string }
  if (!payload.id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 })
  }

  const supabase = await getServerSupabase()
  const { error } = await supabase.from(config.table).delete().eq("id", payload.id)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id: payload.id } })
}
