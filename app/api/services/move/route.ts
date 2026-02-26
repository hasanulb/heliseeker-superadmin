import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../_lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { serviceId, newIndex } = await req.json();
    if (!serviceId || typeof newIndex !== 'number') {
      return NextResponse.json({ message: 'serviceId and newIndex are required' }, { status: 400 });
    }
    const supabase = await getServerSupabase();
    const { error } = await supabase.rpc('move_service', { _id: serviceId, _new_index: newIndex });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Moved' });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}
