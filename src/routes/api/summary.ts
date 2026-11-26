import { createFileRoute } from '@tanstack/react-router';
import { getRetailGuardSummary } from '@/lib/retailguard';

export const Route = createFileRoute('/api/summary')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const summary = await getRetailGuardSummary();

          if (!summary) {
            return new Response(JSON.stringify({ error: 'No summary found' }), {
              status: 404,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
              },
            });
          }

          return new Response(JSON.stringify(summary), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
            },
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
            },
          });
        }
      },
    },
  },
});
