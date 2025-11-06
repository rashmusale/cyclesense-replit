import { QueryClient } from "@tanstack/react-query";

/**
 * QueryClient for React Query
 * No default queryFn - each query defines its own queryFn using storageService
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
