import { initTRPC } from '@trpc/server';
import type { TRPCContext } from '@/trpc/context';

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
