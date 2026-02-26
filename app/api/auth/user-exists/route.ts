import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../_lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ message: 'Email is required' }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('admins')
      .select('admin_id')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    if (error || !data) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json({ message: 'Exists', data: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}
