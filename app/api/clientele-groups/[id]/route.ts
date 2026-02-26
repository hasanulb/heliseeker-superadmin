import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../_lib/supabase';
import { withAuth } from '../../_lib/auth';

async function getHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('clientele_groups')
      .select(`
        *,
        client_logos (*)
      `)
      .eq('group_id', (await params).id)
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    if (data.client_logos) {
      data.client_logos.sort((a: any, b: any) => a.order_index - b.order_index);
    }

    return NextResponse.json({ message: 'Success', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}

async function putHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const supabase = await getServerSupabase();

    const { data, error } = await supabase
      .from('clientele_groups')
      .update(body)
      .eq('group_id', (await params).id)
      .select()
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Updated', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}

async function deleteHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getServerSupabase();

    await supabase
      .from('client_logos')
      .delete()
      .eq('group_id', (await params).id);

    const { error } = await supabase
      .from('clientele_groups')
      .delete()
      .eq('group_id', (await params).id);

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Deleted' });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);