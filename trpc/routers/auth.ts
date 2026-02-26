import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getServerSupabase } from '@/app/api/_lib/supabase';
import { createTRPCRouter, publicProcedure } from '@/trpc/init';

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

      return { message: 'Logged in', data };
    }),
});
