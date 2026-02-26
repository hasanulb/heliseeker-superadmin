import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../_lib/supabase';

export async function POST() {
  try {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Logged out' });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Logout failed' }, { status: 500 });
  }
}
