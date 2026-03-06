import { NextRequest, NextResponse } from "next/server"

import { getServerSupabase } from "@/app/api/_lib/supabase"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = (await request.json()) as { isVerified: boolean }
  const supabase = await getServerSupabase()

  const { data, error } = await supabase
    .from("users")
    .update({ is_verified: payload.isVerified })
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
