import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../_lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const sortField = searchParams.get('sortField') || 'updated_at';
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';

    const supabase = await getServerSupabase();
    let query = supabase.from('testimonials').select('*', { count: 'exact' });
    if (search) query = query.ilike('name->>en', `%${search}%`);
    query = query.order(sortField, { ascending: sortDir === 'asc' });
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await query;
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Success', data: { data, count } });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.from('testimonials').insert([body]).select().single();
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Created', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}
