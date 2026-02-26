import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../_lib/supabase';
import { withAuth } from '../../_lib/auth';

async function putHandler(req: NextRequest) {
  try {
    const { items } = await req.json();
    const supabase = await getServerSupabase();

    // Update order_index for each group
    const updatePromises = items.map((item: { id: string; order_index: number }) =>
      supabase
        .from('clientele_groups')
        .update({ order_index: item.order_index })
        .eq('group_id', item.id)
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ message: 'Reordered successfully' });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}

export const PUT = withAuth(putHandler);