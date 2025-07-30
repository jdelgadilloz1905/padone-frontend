import { QueryClient } from '@tanstack/react-query';

// Crea una instancia del cliente de consulta optimizada para desarrollo
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (nuevo nombre para cacheTime)
      refetchOnMount: false, // Evitar refetch innecesarios en desarrollo
      refetchOnReconnect: false, // Optimización para desarrollo
    },
    mutations: {
      retry: 1,
    }
  },
}); 