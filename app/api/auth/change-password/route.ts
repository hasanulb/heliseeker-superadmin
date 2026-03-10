import { NextRequest, NextResponse } from "next/server"

import { getServerSupabase } from "@/app/api/_lib/supabase"

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { password?: string }
  const password = payload.password?.trim()

  if (!password || password.length < 8) {
    return NextResponse.json({ message: "Password must be at least 8 characters." }, { status: 400 })
  }

  const supabase = await getServerSupabase()
  const { error } = await supabase.auth.updateUser({
    password,
    data: { must_change_password: false },
  })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Password updated" })
}
