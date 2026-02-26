import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../_lib/supabase';
import { withAuth } from '../_lib/auth';

async function getHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeLogos = searchParams.get('includeLogos') === 'true';

    const supabase = await getServerSupabase();

    if (includeLogos) {
      // Get groups with their logos
      const { data, error } = await supabase
        .from('clientele_groups')
        .select(`
          *,
          client_logos (*)
        `)
        .order('order_index', { ascending: true });

      if (error) return NextResponse.json({ message: error.message }, { status: 400 });

      // Sort logos within each group by order_index
      const sortedData = data?.map(group => ({
        ...group,
        client_logos: group.client_logos?.sort((a: any, b: any) => a.order_index - b.order_index) || []
      }));

      return NextResponse.json({ message: 'Success', data: sortedData });
    } else {
      // Get only groups
      const { data, error } = await supabase
        .from('clientele_groups')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) return NextResponse.json({ message: error.message }, { status: 400 });
      return NextResponse.json({ message: 'Success', data });
    }
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}

async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await getServerSupabase();

    // Get the next order_index
    const { data: lastGroup } = await supabase
      .from('clientele_groups')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrderIndex = (lastGroup?.order_index || 0) + 1;

    const { data, error } = await supabase
      .from('clientele_groups')
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