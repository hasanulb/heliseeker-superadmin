import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../_lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const source = searchParams.get('source') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const sortField = searchParams.get('sortField') || 'created_at';
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc';

    const supabase = await getServerSupabase();
    let query = supabase.from('leads').select('*', { count: 'exact' });

    if (search) {
      const safeSearch = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(`first_name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%,mobile.ilike.%${safeSearch}%`);
    }

    if (source) query = query.eq('source', source);

    query = query.order(sortField, { ascending: sortDir === 'asc' });
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await query;
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Success', data: { data, count } });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}
