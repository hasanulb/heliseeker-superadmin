import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getServiceRoleSupabase } from "@/app/api/_lib/supabase-admin"

const createLeadSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(4).optional().or(z.literal("")),
  message: z.string().trim().min(1),
  source: z.string().trim().min(1).optional(),
  pageUrl: z.string().trim().min(1).optional(),
})

function requireApiKey(request: NextRequest) {
  const expected = process.env.LEADS_API_KEY?.trim()
  const received = request.headers.get("x-leads-api-key")?.trim()

  if (!expected) {
    return { ok: false as const, response: NextResponse.json({ message: "LEADS_API_KEY is not configured" }, { status: 500 }) }
  }

  if (!received || received !== expected) {
    return { ok: false as const, response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) }
  }

  return { ok: true as const }
}

export async function POST(request: NextRequest) {
  const auth = requireApiKey(request)
  if (!auth.ok) return auth.response

  try {
    const json = await request.json().catch(() => null)
    const parsed = createLeadSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid payload", issues: parsed.error.issues }, { status: 400 })
    }

    const input = parsed.data
    const supabase = getServiceRoleSupabase()

    const phone = input.phone && input.phone.trim().length > 0 ? input.phone.trim() : null
    const baseRow = {
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      message: input.message,
      source: input.source ?? null,
    } as const

    // Support both schemas:
    // - New: { id, first_name, last_name, email, phone, message, source, page_url, created_at }
    // - Legacy: { lead_id, created_at, first_name, last_name, email, mobile, message, source }
    const attemptNew = await supabase
      .from("leads")
      .insert({
        ...baseRow,
        phone,
        page_url: input.pageUrl ?? null,
      })
      .select("*")
      .single()

    if (attemptNew.error) {
      const attemptLegacy = await supabase
        .from("leads")
        .insert({
          ...baseRow,
          mobile: phone,
        })
        .select("*")
        .single()

      if (attemptLegacy.error) {
        return NextResponse.json(
          {
            message: "Failed to create lead",
            reason: `Insert failed (new schema): ${attemptNew.error.message}; (legacy schema): ${attemptLegacy.error.message}`,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({ data: attemptLegacy.data }, { status: 201 })
    }

    return NextResponse.json({ data: attemptNew.data }, { status: 201 })
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ message: "Failed to create lead", reason }, { status: 500 })
  }
}
