import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Retry once on transient failures (network blip, 5xx).
        // Skip retrying on 401 / 403 / 404 — those errors won't resolve by retrying.
        retry: (failureCount, error) => {
          if (failureCount >= 1) return false;
          const message = error instanceof Error ? error.message : "";
          // Don't retry client-side HTTP errors (4xx).
          if (/API error 4\d\d/.test(message)) return false;
          return true;
        },
        // 500 ms delay between attempts (instead of the default exponential back-off).
        retryDelay: 500,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
