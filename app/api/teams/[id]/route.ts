import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../_lib/supabase';
import { withAuth } from '../../_lib/auth';

export const GET = withAuth(async function(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.from('teams').select('*').eq('team_id', (await params).id).single();
    if (error) return NextResponse.json({ message: error.message }, { status: 404 });
    return NextResponse.json({ message: 'Success', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async function(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await req.json();

    // Ensure img_urls has a default value if not provided or is undefined/null
    if (!payload.img_urls) {
      payload.img_urls = [];
    }

    const supabase = await getServerSupabase();
    const { data, error } = await supabase.from('teams').update(payload).eq('team_id', (await params).id).select().single();
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Updated', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
});

export const DELETE = withAuth(async function(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getServerSupabase();
    const { error } = await supabase.from('teams').delete().eq('team_id', (await params).id);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Deleted', data: { id: (await params).id } });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
});
