import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../_lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ message: 'Missing email or password' }, { status: 400 });
    const normalizedEmail = String(email).trim().toLowerCase();

    const supabase = await getServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) return NextResponse.json({ message: error.message }, { status: 401 });

    const authUserId = data.user?.id;
    if (!authUserId) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const { data: adminRecord, error: adminErr } = await supabase
      .from('admins')
      .select('admin_id, email, is_active, role')
      .eq('auth_user_id', authUserId)
      .single();

    if (adminErr || !adminRecord) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (!adminRecord.is_active) {
      return NextResponse.json({ message: 'Admin account is inactive' }, { status: 403 });
    }

    await supabase
      .from('admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('admin_id', adminRecord.admin_id);

    return NextResponse.json({ message: 'Logged in', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Login failed' }, { status: 500 });
  }
}
