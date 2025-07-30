import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import rideService, { 
  type Ride, 
  type RideFilters, 
  type RideStatistics,
  type Driver 
} from '../services/rideService';

// ============================================================================
// QUERY KEYS - Centralizadas para cache management
// ============================================================================

export const rideKeys = {
  all: ['rides'] as const,
  lists: () => [...rideKeys.all, 'list'] as const,
  list: (filters?: RideFilters) => [...rideKeys.lists(), filters] as const,
  details: () => [...rideKeys.all, 'detail'] as const,
  detail: (id: string) => [...rideKeys.details(), id] as const,
  active: () => [...rideKeys.all, 'active'] as const,
  statistics: () => [...rideKeys.all, 'statistics'] as const,
  drivers: () => [...rideKeys.all, 'drivers'] as const,
  availableDrivers: () => [...rideKeys.drivers(), 'available'] as const,
  allDrivers: () => [...rideKeys.drivers(), 'all'] as const,
};

// ============================================================================
// QUERY HOOKS - Optimizados para performance crítica
// ============================================================================

/**
 * Hook para obtener rides con filtros y paginación
 * Cache: 2 minutos (datos de consulta con filtros)
 * Background refetch cada 2 minutos para mantener datos frescos
 */
export const useRides = (filters?: RideFilters) => {
  return useQuery({
    queryKey: rideKeys.list(filters),
    queryFn: () => rideService.getRides(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 2 * 60 * 1000, // Auto-refresh cada 2 minutos
    refetchOnWindowFocus: true, // Refetch al volver a la ventana
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Solo ejecutar si no hay filtros demasiado específicos que cambien constantemente
    enabled: true,
  });
};

/**
 * Hook para obtener detalle específico de un ride
 * Cache: 5 minutos (datos de detalle estables)
 */
export const useRideDetail = (rideId: string) => {
  return useQuery({
    queryKey: rideKeys.detail(rideId),
    queryFn: () => rideService.getRide(rideId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false, // Detalle no cambia frecuentemente
    enabled: !!rideId, // Solo ejecutar si hay ID válido
    retry: 1,
  });
};

/**
 * Hook para obtener ride activo del conductor
 * Cache: 30s (datos críticos que cambian frecuentemente)
 * Auto-refresh cada 30s para tracking en tiempo real
 */
export const useActiveRide = () => {
  return useQuery({
    queryKey: rideKeys.active(),
    queryFn: () => rideService.getActiveRide(),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 30 * 1000, // Auto-refresh cada 30s
    refetchOnWindowFocus: true, // Refetch al volver a la ventana
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook para obtener estadísticas de rides
 * Cache: 5 minutos (datos estadísticos que cambian lentamente)
 */
export const useRideStatistics = () => {
  return useQuery({
    queryKey: rideKeys.statistics(),
    queryFn: () => rideService.getStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false, // Estadísticas no necesitan refetch constante
    retry: 1,
  });
};

/**
 * Hook para obtener conductores disponibles
 * Cache: 1 minuto (disponibilidad cambia frecuentemente)
 * Background refetch cada minuto para datos frescos
 */
export const useAvailableDrivers = () => {
  return useQuery({
    queryKey: rideKeys.availableDrivers(),
    queryFn: () => rideService.getAvailableDrivers(),
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 3 * 60 * 1000, // 3 minutos
    refetchInterval: 1 * 60 * 1000, // Auto-refresh cada minuto
    refetchOnWindowFocus: true,
    retry: 2,
  });
};

/**
 * Hook para obtener todos los conductores
 * Cache: 10 minutos (lista completa cambia menos frecuentemente)
 */
export const useAllDrivers = () => {
  return useQuery({
    queryKey: rideKeys.allDrivers(),
    queryFn: () => rideService.getDrivers(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// ============================================================================
// MUTATION HOOKS - Optimizados con invalidaciones inteligentes
// ============================================================================

/**
 * Hook para actualizar estado de ride
 * Invalidaciones críticas para sincronización en tiempo real
 */
export const useUpdateRideStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rideId, status, reason }: { 
      rideId: string; 
      status: Ride['status']; 
      reason?: string 
    }) => rideService.updateRideStatus(rideId, status, reason),
    onMutate: async ({ rideId, status }) => {
      // Cancelar queries relacionadas para evitar conflictos
      await queryClient.cancelQueries({ queryKey: rideKeys.detail(rideId) });
      await queryClient.cancelQueries({ queryKey: rideKeys.active() });

      // Optimistic update para UX instantáneo
      const previousRide = queryClient.getQueryData<Ride>(rideKeys.detail(rideId));
      if (previousRide) {
        queryClient.setQueryData<Ride>(rideKeys.detail(rideId), {
          ...previousRide,
          status,
          updated_at: new Date().toISOString()
        });
      }

      // Si es ride activo, también actualizar
      const previousActiveRide = queryClient.getQueryData<Ride | null>(rideKeys.active());
      if (previousActiveRide?.id === rideId) {
        queryClient.setQueryData<Ride | null>(rideKeys.active(), {
          ...previousActiveRide,
          status,
          updated_at: new Date().toISOString()
        });
      }

      return { previousRide, previousActiveRide };
    },
    onError: (_err, { rideId }, context) => {
      // Revertir optimistic updates en caso de error
      if (context?.previousRide) {
        queryClient.setQueryData(rideKeys.detail(rideId), context.previousRide);
      }
      if (context?.previousActiveRide) {
        queryClient.setQueryData(rideKeys.active(), context.previousActiveRide);
      }
    },
    onSuccess: (updatedRide, { rideId }) => {
      // Actualizar cache con datos reales del servidor
      queryClient.setQueryData(rideKeys.detail(rideId), updatedRide);
      
      // Invalidar listas para refrescar datos
      queryClient.invalidateQueries({ queryKey: rideKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rideKeys.active() });
      queryClient.invalidateQueries({ queryKey: rideKeys.statistics() });
    },
  });
};

/**
 * Hook para iniciar viaje
 * Critical path: debe actualizar múltiples caches
 */
export const useStartTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rideId: string) => rideService.startTrip(rideId),
    onMutate: async (rideId) => {
      // Optimistic update del estado
      await queryClient.cancelQueries({ queryKey: rideKeys.detail(rideId) });
      await queryClient.cancelQueries({ queryKey: rideKeys.active() });

      const previousRide = queryClient.getQueryData<Ride>(rideKeys.detail(rideId));
      if (previousRide) {
        const optimisticRide = {
          ...previousRide,
          status: 'in_progress' as const,
          start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        queryClient.setQueryData<Ride>(rideKeys.detail(rideId), optimisticRide);
        queryClient.setQueryData<Ride | null>(rideKeys.active(), optimisticRide);
      }

      return { previousRide };
    },
    onError: (_err, rideId, context) => {
      // Revertir optimistic update
      if (context?.previousRide) {
        queryClient.setQueryData(rideKeys.detail(rideId), context.previousRide);
        queryClient.setQueryData(rideKeys.active(), context.previousRide);
      }
    },
    onSuccess: (updatedRide, rideId) => {
      // Actualizar con datos reales
      queryClient.setQueryData(rideKeys.detail(rideId), updatedRide);
      queryClient.setQueryData(rideKeys.active(), updatedRide);
      
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: rideKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rideKeys.statistics() });
    },
  });
};

/**
 * Hook para completar viaje
 * Critical path: debe limpiar ride activo y actualizar estadísticas
 */
export const useCompleteTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rideId, actualCost }: { rideId: string; actualCost?: number }) => 
      rideService.completeTrip(rideId, actualCost),
    onMutate: async ({ rideId, actualCost }) => {
      await queryClient.cancelQueries({ queryKey: rideKeys.detail(rideId) });
      await queryClient.cancelQueries({ queryKey: rideKeys.active() });

      const previousRide = queryClient.getQueryData<Ride>(rideKeys.detail(rideId));
      if (previousRide) {
        const optimisticRide = {
          ...previousRide,
          status: 'completed' as const,
          end_date: new Date().toISOString(),
          actual_cost: actualCost || previousRide.estimated_cost,
          updated_at: new Date().toISOString()
        };
        
        queryClient.setQueryData<Ride>(rideKeys.detail(rideId), optimisticRide);
        // Limpiar ride activo cuando se completa
        queryClient.setQueryData<Ride | null>(rideKeys.active(), null);
      }

      return { previousRide };
    },
    onError: (_err, { rideId }, context) => {
      // Revertir optimistic update
      if (context?.previousRide) {
        queryClient.setQueryData(rideKeys.detail(rideId), context.previousRide);
        queryClient.setQueryData(rideKeys.active(), context.previousRide);
      }
    },
    onSuccess: (updatedRide, { rideId }) => {
      // Actualizar con datos reales
      queryClient.setQueryData(rideKeys.detail(rideId), updatedRide);
      queryClient.setQueryData(rideKeys.active(), null); // No hay ride activo tras completar
      
      // Invalidar múltiples caches (estadísticas cambiarán)
      queryClient.invalidateQueries({ queryKey: rideKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rideKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: rideKeys.availableDrivers() });
    },
  });
};

/**
 * Hook para asignar conductor a ride
 * Invalidaciones críticas: drivers disponibles cambian
 */
export const useAssignDriverToRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rideId, driverId }: { rideId: string; driverId: string }) =>
      rideService.assignDriver(rideId, driverId),
    onMutate: async ({ rideId, driverId }) => {
      await queryClient.cancelQueries({ queryKey: rideKeys.detail(rideId) });

      const previousRide = queryClient.getQueryData<Ride>(rideKeys.detail(rideId));
      if (previousRide) {
        queryClient.setQueryData<Ride>(rideKeys.detail(rideId), {
          ...previousRide,
          driver_id: driverId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        });
      }

      return { previousRide };
    },
    onError: (_err, { rideId }, context) => {
      if (context?.previousRide) {
        queryClient.setQueryData(rideKeys.detail(rideId), context.previousRide);
      }
    },
    onSuccess: (updatedRide, { rideId }) => {
      // Actualizar datos reales
      queryClient.setQueryData(rideKeys.detail(rideId), updatedRide);
      
      // Invalidar múltiples caches relacionados
      queryClient.invalidateQueries({ queryKey: rideKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rideKeys.availableDrivers() });
      queryClient.invalidateQueries({ queryKey: rideKeys.statistics() });
      
      // También invalidar del mapService (drivers activos)
      queryClient.invalidateQueries({ queryKey: ['drivers', 'active'] });
    },
  });
};

/**
 * Hook para actualizar datos generales de ride
 * Para ediciones menos críticas (descripción, notas, etc.)
 */
export const useUpdateRide = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rideId, data }: { rideId: string; data: Partial<Ride> }) =>
      rideService.updateRide(rideId, data),
    onSuccess: (updatedRide, { rideId }) => {
      // Actualizar cache específico
      queryClient.setQueryData(rideKeys.detail(rideId), updatedRide);
      
      // Invalidar listas para refrescar
      queryClient.invalidateQueries({ queryKey: rideKeys.lists() });
      queryClient.invalidateQueries({ queryKey: rideKeys.active() });
    },
  });
};

// ============================================================================
// UTILITY HOOKS - Cache management helpers
// ============================================================================

/**
 * Hook para invalidar manualmente caches de rides
 */
export const useInvalidateRides = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: rideKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: rideKeys.lists() }),
    invalidateActive: () => queryClient.invalidateQueries({ queryKey: rideKeys.active() }),
    invalidateStatistics: () => queryClient.invalidateQueries({ queryKey: rideKeys.statistics() }),
    invalidateDrivers: () => queryClient.invalidateQueries({ queryKey: rideKeys.drivers() }),
    invalidateDetail: (rideId: string) => 
      queryClient.invalidateQueries({ queryKey: rideKeys.detail(rideId) }),
  };
};

/**
 * Hook para obtener datos en cache sin hacer requests
 */
export const useRidesCache = () => {
  const queryClient = useQueryClient();

  return {
    getRideDetail: (rideId: string) => queryClient.getQueryData<Ride>(rideKeys.detail(rideId)),
    getActiveRide: () => queryClient.getQueryData<Ride | null>(rideKeys.active()),
    getStatistics: () => queryClient.getQueryData<RideStatistics>(rideKeys.statistics()),
    getAvailableDrivers: () => queryClient.getQueryData<Driver[]>(rideKeys.availableDrivers()),
    
    setRideDetail: (rideId: string, data: Ride) =>
      queryClient.setQueryData(rideKeys.detail(rideId), data),
    setActiveRide: (data: Ride | null) =>
      queryClient.setQueryData(rideKeys.active(), data),
  };
};

/**
 * Hook para prefetch de rides (mejora perceived performance)
 */
export const usePrefetchRides = () => {
  const queryClient = useQueryClient();

  return {
    prefetchRideDetail: (rideId: string) => {
      queryClient.prefetchQuery({
        queryKey: rideKeys.detail(rideId),
        queryFn: () => rideService.getRide(rideId),
        staleTime: 5 * 60 * 1000,
      });
    },
    prefetchActiveRide: () => {
      queryClient.prefetchQuery({
        queryKey: rideKeys.active(),
        queryFn: () => rideService.getActiveRide(),
        staleTime: 30 * 1000,
      });
    },
    prefetchStatistics: () => {
      queryClient.prefetchQuery({
        queryKey: rideKeys.statistics(),
        queryFn: () => rideService.getStatistics(),
        staleTime: 5 * 60 * 1000,
      });
    },
  };
};

/**
 * Hook para actualizar cache desde eventos WebSocket
 */
export const useRideWebSocketSync = () => {
  const queryClient = useQueryClient();

  return {
    updateRideFromWebSocket: (rideUpdate: Partial<Ride> & { id: string }) => {
      const { id, ...updateData } = rideUpdate;
      
      // Actualizar cache del ride específico
      queryClient.setQueryData<Ride>(rideKeys.detail(id), (oldData) => 
        oldData ? { ...oldData, ...updateData } : undefined
      );
      
      // Si es el ride activo, también actualizar
      const activeRide = queryClient.getQueryData<Ride | null>(rideKeys.active());
      if (activeRide?.id === id) {
        queryClient.setQueryData<Ride | null>(rideKeys.active(), { ...activeRide, ...updateData });
      }
      
      // Invalidar listas para refrescar otros datos
      queryClient.invalidateQueries({ queryKey: rideKeys.lists() });
    },
    
    invalidateOnDriverStatusChange: () => {
      queryClient.invalidateQueries({ queryKey: rideKeys.availableDrivers() });
      queryClient.invalidateQueries({ queryKey: rideKeys.active() });
    },
  };
}; 