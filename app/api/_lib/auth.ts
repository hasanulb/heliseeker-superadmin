import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from './supabase';

export async function validateAuthSession(req?: NextRequest) {
  try {
    const supabase = await getServerSupabase();

    // Use getUser() instead of getSession() for security as recommended by Supabase
    const { data: userData, error: userErr } = await supabase.auth.getUser();

    if (userErr || !userData?.user) {
      return {
        user: null,
        error: 'Not authenticated',
        response: NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
      };
    }

    // Verify the user exists in the admins table
    const { data: admin, error: adminErr } = await supabase
      .from('admins')
      .select('*')
      .eq('email', userData.user.email)
      .single();

    if (adminErr || !admin) {
      return {
        user: null,
        error: 'Admin profile not found',
        response: NextResponse.json({ message: 'Unauthorized: Admin access required' }, { status: 403 })
      };
    }

    return {
      user: userData.user,
      admin: admin,
      error: null,
      response: null
    };
  } catch (e: any) {
    return {
      user: null,
      error: e.message || 'Authentication failed',
      response: NextResponse.json({ message: 'Authentication failed' }, { status: 500 })
    };
  }
}

// Higher-order function to wrap API route handlers with authentication
export function withAuth(handler: Function) {
  return async function(req: NextRequest, context?: any) {
    const authResult = await validateAuthSession(req);

    if (authResult.error) {
      return authResult.response;
    }

    // Add user info to the request context
    const enrichedReq = Object.assign(req, {
      user: authResult.user,
      admin: authResult.admin
    });

    return handler(enrichedReq, context);
  };
}