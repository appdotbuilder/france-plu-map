import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { 
  createGeographicFeatureInputSchema,
  searchGeographicFeaturesInputSchema,
  getFeaturesInBoundsInputSchema
} from './schema';

// Import handlers
import { createGeographicFeature } from './handlers/create_geographic_feature';
import { getGeographicFeatures } from './handlers/get_geographic_features';
import { searchGeographicFeatures } from './handlers/search_geographic_features';
import { getFeaturesInBounds } from './handlers/get_features_in_bounds';
import { getFranceBounds } from './handlers/get_france_bounds';
import { getInitialMapView } from './handlers/get_initial_map_view';

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

  // Geographic feature management
  createGeographicFeature: publicProcedure
    .input(createGeographicFeatureInputSchema)
    .mutation(({ input }) => createGeographicFeature(input)),

  getGeographicFeatures: publicProcedure
    .query(() => getGeographicFeatures()),

  searchGeographicFeatures: publicProcedure
    .input(searchGeographicFeaturesInputSchema)
    .query(({ input }) => searchGeographicFeatures(input)),

  getFeaturesInBounds: publicProcedure
    .input(getFeaturesInBoundsInputSchema)
    .query(({ input }) => getFeaturesInBounds(input)),

  // Map configuration endpoints
  getFranceBounds: publicProcedure
    .query(() => getFranceBounds()),

  getInitialMapView: publicProcedure
    .query(() => getInitialMapView()),
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
  console.log(`Geoportail TRPC server listening at port: ${port}`);
}

start();