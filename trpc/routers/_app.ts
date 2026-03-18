import { createTRPCRouter } from '@/trpc/init';
import { authRouter } from '@/trpc/routers/auth';
import { centersRouter } from '@/trpc/routers/centers';
import { leadsRouter } from '@/trpc/routers/leads';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  centers: centersRouter,
  leads: leadsRouter,
});

export type AppRouter = typeof appRouter;
