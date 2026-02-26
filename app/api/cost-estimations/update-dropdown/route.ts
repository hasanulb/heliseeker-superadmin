import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../_lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { type, oldValue, newValue } = await req.json();

    if (!type || !oldValue || !newValue) {
      return NextResponse.json({ message: 'type, oldValue and newValue are required' }, { status: 400 });
    }

    let field: string | undefined;
    if (type === 'projectType') field = 'project_type';
    else if (type === 'stylePreference') field = 'style_preference';
    else if (type === 'specification') field = 'project_specification';

    if (!field) return NextResponse.json({ message: 'Invalid dropdown type' }, { status: 400 });

    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .from('cost_estimations')
      .update({ [field]: newValue })
      .eq(field, oldValue)
      .select();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Updated', data });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}
