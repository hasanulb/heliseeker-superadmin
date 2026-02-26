import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../_lib/supabase';

export async function GET() {
  try {
    const supabase = await getServerSupabase();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user?.id) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    const authUserId = userData.user.id;

    const { data: admin, error } = await supabase
      .from('admins')
      .select('admin_id, auth_user_id, name, email, role, img, is_active, last_login_at, created_at, updated_at')
      .eq('auth_user_id', authUserId)
      .single();
    if (error || !admin) return NextResponse.json({ message: 'Admin profile not found' }, { status: 404 });
    return NextResponse.json({ message: 'Success', data: admin });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const updates = await req.json();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user?.id) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    const authUserId = userData.user.id;

    const safeUpdates: { name?: string; email?: string; img?: string } = {}
    if (typeof updates?.name === 'string') safeUpdates.name = updates.name
    if (typeof updates?.email === 'string') safeUpdates.email = updates.email
    if (typeof updates?.img === 'string') safeUpdates.img = updates.img

    const { data: admin, error } = await supabase
      .from('admins')
      .update(safeUpdates)
      .eq('auth_user_id', authUserId)
      .select('admin_id, auth_user_id, name, email, role, img, is_active, last_login_at, created_at, updated_at')
      .single();
    if (error || !admin) return NextResponse.json({ message: 'Failed to update profile' }, { status: 400 });
    return NextResponse.json({ message: 'Updated', data: admin });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}
