import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../_lib/supabase';
import { withAuth } from '../_lib/auth';

async function getHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    const supabase = await getServerSupabase();
    let query = supabase.from('client_logos').select('*');

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    query = query.order('order_index', { ascending: true });

    const { data, error } = await query;
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Success', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}

async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await getServerSupabase();

    // Get the next order_index for this group
    const { data: lastLogo } = await supabase
      .from('client_logos')
      .select('order_index')
      .eq('group_id', body.group_id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrderIndex = (lastLogo?.order_index || 0) + 1;

    const { data, error } = await supabase
      .from('client_logos')
      .insert([{ ...body, order_index: nextOrderIndex }])
      .select()
      .single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Created', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);