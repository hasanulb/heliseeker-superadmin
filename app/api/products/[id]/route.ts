import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../_lib/supabase';
import { withAuth } from '../../_lib/auth';

export const GET = withAuth(async function(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.from('products').select('*').eq('product_id', (await params).id).single();
    if (error) return NextResponse.json({ message: error.message }, { status: 404 });
    return NextResponse.json({ message: 'Success', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async function(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await req.json();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.from('products').update(payload).eq('product_id', (await params).id).select().single();
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Updated', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
});

export const DELETE = withAuth(async function(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getServerSupabase();
    const { error } = await supabase.from('products').delete().eq('product_id', (await params).id);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Deleted', data: { id: (await params).id } });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
});
