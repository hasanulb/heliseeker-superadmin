import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getServerSupabase } from '@/app/api/_lib/supabase';
import { getServiceRoleSupabase } from '@/app/api/_lib/supabase-admin';
import { createTRPCRouter, publicProcedure } from '@/trpc/init';

const MAX_METADATA_STRING_LENGTH = 512;

function stripOversizedUserMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) {
    return { changed: false, sanitized: null as Record<string, unknown> | null };
  }

  let changed = false;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      const isDataUrl = value.startsWith('data:');
      const isOversized = value.length > MAX_METADATA_STRING_LENGTH;

      if (isDataUrl || isOversized) {
        changed = true;
        continue;
      }
    }

    sanitized[key] = value;
  }

  return { changed, sanitized };
}

async function sanitizeMetadataBeforeLogin(email: string) {
  try {
    const adminSupabase = getServiceRoleSupabase();

    const { data: adminRow } = await adminSupabase
      .from('admins')
      .select('auth_user_id')
      .eq('email', email)
      .maybeSingle();

    const authUserId = adminRow?.auth_user_id as string | null | undefined;
    if (!authUserId) return;

    const { data: userData, error: userErr } = await adminSupabase.auth.admin.getUserById(authUserId);
    if (userErr || !userData?.user) return;

    const { changed, sanitized } = stripOversizedUserMetadata(
      (userData.user.user_metadata as Record<string, unknown> | undefined) ?? null,
    );

    if (!changed) return;

    await adminSupabase.auth.admin.updateUserById(authUserId, {
      user_metadata: sanitized ?? {},
    });
  } catch {
    // Do not block login if service-role env is missing or metadata scrub fails.
  }
}

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
      }),
    )
    .mutation(async ({ input }) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      await sanitizeMetadataBeforeLogin(normalizedEmail);

      const supabase = await getServerSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: input.password,
      });

      if (error) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: error.message });
      }

      const authUserId = data.user?.id;
      if (!authUserId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }

      const { data: adminRecord, error: adminErr } = await supabase
        .from('admins')
        .select('admin_id, email, is_active, role')
        .eq('auth_user_id', authUserId)
        .single();

      if (adminErr || !adminRecord) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }

      if (!adminRecord.is_active) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin account is inactive' });
      }

      await supabase
        .from('admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('admin_id', adminRecord.admin_id);

      const { changed, sanitized } = stripOversizedUserMetadata(
        (data.user?.user_metadata as Record<string, unknown> | undefined) ?? null,
      );

      if (changed) {
        const { error: updateErr } = await supabase.auth.updateUser({
          data: sanitized ?? {},
        });

        if (!updateErr) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          if (refreshed.session) data.session = refreshed.session;
          if (refreshed.user) data.user = refreshed.user;
        }
      }

      return { message: 'Logged in', data };
    }),
});
