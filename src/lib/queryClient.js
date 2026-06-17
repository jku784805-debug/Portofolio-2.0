import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  5  * 60 * 1000,  // données fraîches 5 min
      gcTime:     10 * 60 * 1000,  // garde en cache 10 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
