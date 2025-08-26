import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  getDepartmentsInputSchema,
  getCommunesInputSchema,
  getPluZonesInputSchema
} from './schema';
import { z } from 'zod';

// Import handlers
import { getDepartments } from './handlers/get_departments';
import { getCommunes } from './handlers/get_communes';
import { getPluZones } from './handlers/get_plu_zones';
import { 
  syncDepartmentsFromGeoPortail,
  syncCommunesFromGeoPortail,
  syncPluZonesFromGeoPortail
} from './handlers/sync_geoportail_data';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Map data endpoints
  getDepartments: publicProcedure
    .input(getDepartmentsInputSchema.optional())
    .query(({ input }) => getDepartments(input)),

  getCommunes: publicProcedure
    .input(getCommunesInputSchema)
    .query(({ input }) => getCommunes(input)),

  getPluZones: publicProcedure
    .input(getPluZonesInputSchema)
    .query(({ input }) => getPluZones(input)),

  // Data synchronization endpoints
  syncDepartments: publicProcedure
    .mutation(() => syncDepartmentsFromGeoPortail()),

  syncCommunes: publicProcedure
    .input(z.object({
      department_code: z.string().optional()
    }).optional())
    .mutation(({ input }) => syncCommunesFromGeoPortail(input?.department_code)),

  syncPluZones: publicProcedure
    .input(z.object({
      commune_code: z.string().optional()
    }).optional())
    .mutation(({ input }) => syncPluZonesFromGeoPortail(input?.commune_code)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
  console.log('Available endpoints:');
  console.log('- healthcheck: GET /healthcheck');
  console.log('- getDepartments: POST /getDepartments');
  console.log('- getCommunes: POST /getCommunes');
  console.log('- getPluZones: POST /getPluZones');
  console.log('- syncDepartments: POST /syncDepartments');
  console.log('- syncCommunes: POST /syncCommunes');
  console.log('- syncPluZones: POST /syncPluZones');
}

start();