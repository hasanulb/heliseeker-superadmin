import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../_lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.from('blogs').select('*').eq('blog_id',  (await params).id).single();
    if (error) return NextResponse.json({ message: error.message }, { status: 404 });
    return NextResponse.json({ message: 'Success', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await req.json();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.from('blogs').update(payload).eq('blog_id', (await params).id).select().single();
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Updated', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getServerSupabase();
    const { error } = await supabase.from('blogs').delete().eq('blog_id', (await params).id);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Deleted', data: { id: (await params).id } });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}
