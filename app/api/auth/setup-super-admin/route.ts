import { NextRequest, NextResponse } from 'next/server'

import { getServiceRoleSupabase } from '@/app/api/_lib/supabase-admin'
import { hashPassword } from '@/app/api/_lib/password'

const DEFAULT_SUPER_ADMIN_EMAIL = 'superadmin@heliseeker.com'
const DEFAULT_SUPER_ADMIN_PASSWORD = 'Admin@123'
const DEFAULT_SUPER_ADMIN_NAME = 'Super Admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleSupabase()
    const setupToken = process.env.SUPER_ADMIN_SETUP_TOKEN
    const requestToken = request.headers.get('x-setup-token')

    if (process.env.NODE_ENV === 'production' && !setupToken) {
      return NextResponse.json(
        { message: 'Missing SUPER_ADMIN_SETUP_TOKEN in production' },
        { status: 500 },
      )
    }

    if (setupToken && requestToken !== setupToken) {
      return NextResponse.json({ message: 'Invalid setup token' }, { status: 401 })
    }

    const email = (process.env.SUPER_ADMIN_EMAIL || DEFAULT_SUPER_ADMIN_EMAIL).trim().toLowerCase()
    const password = process.env.SUPER_ADMIN_PASSWORD || DEFAULT_SUPER_ADMIN_PASSWORD
    const name = process.env.SUPER_ADMIN_NAME || DEFAULT_SUPER_ADMIN_NAME
    const passwordHash = await hashPassword(password)

    let authUserId: string | null = null

    const { data: createdUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        name,
      },
    })

    if (createErr) {
      const { data: userList, error: listErr } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })

      if (listErr) {
        return NextResponse.json({ message: listErr.message }, { status: 500 })
      }

      const existing = userList.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
      if (!existing) {
        return NextResponse.json({ message: createErr.message }, { status: 400 })
      }

      authUserId = existing.id

      const { error: updateErr } = await supabase.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        user_metadata: {
          role: 'super_admin',
          name,
        },
      })

      if (updateErr) {
        return NextResponse.json({ message: updateErr.message }, { status: 400 })
      }
    } else {
      authUserId = createdUser.user?.id || null
    }

    if (!authUserId) {
      return NextResponse.json({ message: 'Failed to resolve auth user' }, { status: 500 })
    }

    const { error: upsertErr } = await supabase.from('admins').upsert(
      {
        auth_user_id: authUserId,
        name,
        email,
        password_hash: passwordHash,
        role: 'super_admin',
        is_active: true,
      },
      {
        onConflict: 'email',
      },
    )

    if (upsertErr) {
      return NextResponse.json({ message: upsertErr.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Super admin ready',
      data: {
        email,
        password,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Failed to setup super admin' },
      { status: 500 },
    )
  }
}
