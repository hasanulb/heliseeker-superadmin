import { createTRPCRouter } from '@/trpc/init';
import { authRouter } from '@/trpc/routers/auth';
import { centersRouter } from '@/trpc/routers/centers';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  centers: centersRouter,
});

export type AppRouter = typeof appRouter;
