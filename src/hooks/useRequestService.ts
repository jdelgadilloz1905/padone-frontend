import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import requestService, { type RideRequest, type CreateRideRequest } from '../services/requestService';
import socketService from '../services/socketService';

// ============================================================================
// QUERY KEYS - Centralizadas para cache management
// ============================================================================

export const requestKeys = {
  all: ['requests'] as const,
  lists: () => [...requestKeys.all, 'list'] as const,
  list: (filters?: { status?: string; date?: string }) => [...requestKeys.lists(), filters] as const,
  active: () => [...requestKeys.all, 'active'] as const,
  details: () => [...requestKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
};

// ============================================================================
// QUERY HOOKS - Optimizados para performance
// ============================================================================

/**
 * Hook para obtener solicitudes activas
 * Cache: 30s (datos críticos que cambian frecuentemente)
 * Refetch: Cada 30s en background para mantener actualizado
 */
export const useActiveRequests = () => {
  return useQuery({
    queryKey: requestKeys.active(),
    queryFn: () => requestService.getActiveRequests(),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos (datos críticos)
    refetchInterval: 30 * 1000, // Auto-refresh cada 30s
    refetchOnWindowFocus: true, // Refetch al volver a la ventana
    refetchOnMount: true,
    retry: 2, // Reintentar 2 veces en caso de error
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook para obtener todas las solicitudes con filtros
 * Cache: 2 minutos (datos de consulta menos críticos)
 */
export const useRequests = (filters?: { status?: string; date?: string }) => {
  return useQuery({
    queryKey: requestKeys.list(filters),
    queryFn: () => requestService.getAllRequests(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false, // No auto-refetch (datos históricos)
    retry: 1,
    enabled: true, // Siempre habilitado
  });
};

/**
 * Hook para obtener solicitud específica por ID
 * Cache: 5 minutos (detalle de solicitud estable)
 */
export const useRequestDetail = (requestId: string) => {
  return useQuery({
    queryKey: requestKeys.detail(requestId),
    queryFn: () => requestService.getRequestById(requestId),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    enabled: !!requestId, // Solo ejecutar si hay ID válido
    retry: 1,
  });
};

// ============================================================================
// MUTATION HOOKS - Optimizados con invalidaciones inteligentes
// ============================================================================

/**
 * Hook para crear nueva solicitud
 * Invalida: solicitudes activas y listas
 */
export const useCreateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestData: CreateRideRequest) => requestService.createRequest(requestData),
    onMutate: async (newRequest) => {
      // Cancelar queries relacionadas para evitar conflictos
      await queryClient.cancelQueries({ queryKey: requestKeys.active() });
      await queryClient.cancelQueries({ queryKey: requestKeys.lists() });

      // Optimistic update para UX instantáneo
      const previousActiveRequests = queryClient.getQueryData<RideRequest[]>(requestKeys.active());
      
      if (previousActiveRequests) {
        queryClient.setQueryData<RideRequest[]>(requestKeys.active(), (old) => [
          ...(old || []),
          {
            id: `temp-${Date.now()}`, // ID temporal
            ...newRequest,
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
          } as RideRequest
        ]);
      }

      return { previousActiveRequests };
    },
    onError: (_err, _newRequest, context) => {
      // Revertir optimistic update en caso de error
      if (context?.previousActiveRequests) {
        queryClient.setQueryData(requestKeys.active(), context.previousActiveRequests);
      }
    },
    onSuccess: (data) => {
      // Invalidar cache para refrescar con datos del servidor
      queryClient.invalidateQueries({ queryKey: requestKeys.active() });
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      
      // Si tenemos el ID real, actualizar cache específico
      if (data?.id) {
        queryClient.setQueryData(requestKeys.detail(data.id), data);
      }
    },
  });
};

/**
 * Hook para actualizar estado de solicitud
 * Invalida: solicitud específica y listas relacionadas
 */
export const useUpdateRequestStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: RideRequest['status'] }) =>
      requestService.updateRequestStatus(requestId, status),
    onMutate: async ({ requestId, status }) => {
      // Cancelar queries relacionadas
      await queryClient.cancelQueries({ queryKey: requestKeys.detail(requestId) });
      await queryClient.cancelQueries({ queryKey: requestKeys.active() });

      // Optimistic update
      const previousRequest = queryClient.getQueryData<RideRequest>(requestKeys.detail(requestId));
      if (previousRequest) {
        queryClient.setQueryData<RideRequest>(requestKeys.detail(requestId), {
          ...previousRequest,
          status
        });
      }

      return { previousRequest };
    },
    onError: (_err, { requestId }, context) => {
      // Revertir en caso de error
      if (context?.previousRequest) {
        queryClient.setQueryData(requestKeys.detail(requestId), context.previousRequest);
      }
    },
    onSuccess: (success, { requestId }) => {
      if (success) {
        // Invalidar cache para datos frescos
        queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) });
        queryClient.invalidateQueries({ queryKey: requestKeys.active() });
        queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      }
    },
  });
};

/**
 * Hook para asignar conductor a solicitud
 * Invalida: solicitud específica, solicitudes activas y drivers disponibles
 */
export const useAssignDriver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, driverId }: { requestId: string; driverId: number }) =>
      requestService.assignDriver(requestId, driverId),
    onMutate: async ({ requestId, driverId }) => {
      // Cancelar queries pendientes
      await queryClient.cancelQueries({ queryKey: requestKeys.detail(requestId) });
      
      // Guardar estado anterior
      const previousRequest = queryClient.getQueryData(requestKeys.detail(requestId));
      
      // Optimistic update
      queryClient.setQueryData(requestKeys.detail(requestId), (old: any) => ({
        ...old,
        driver_id: driverId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      }));
      
      return { previousRequest };
    },
    onError: (error, { requestId }, context) => {
      // Revertir a estado anterior en caso de error
      if (context?.previousRequest) {
        queryClient.setQueryData(requestKeys.detail(requestId), context.previousRequest);
      }
      console.error('Error assigning driver:', error);
    },
    onSuccess: (updatedRequest, { requestId }) => {
      // Actualizar con datos reales
      queryClient.setQueryData(requestKeys.detail(requestId), updatedRequest);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.active() });
      queryClient.invalidateQueries({ queryKey: ['drivers', 'available'] });
      queryClient.invalidateQueries({ queryKey: ['drivers', 'active'] });
      
      // Notificar por WebSocket
      socketService.emit('request_updated', {
        requestId,
        type: 'driver_reassigned',
        driverId: updatedRequest.driver
      });
    }
  });
};

/**
 * Hook para cancelar solicitud
 * Invalida: todas las listas y detalles relacionados
 */
export const useCancelRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      requestService.cancelRequest(requestId, reason),
    onMutate: async ({ requestId }) => {
      // Optimistic update del estado
      await queryClient.cancelQueries({ queryKey: requestKeys.detail(requestId) });
      
      const previousRequest = queryClient.getQueryData<RideRequest>(requestKeys.detail(requestId));
      if (previousRequest) {
        queryClient.setQueryData<RideRequest>(requestKeys.detail(requestId), {
          ...previousRequest,
          status: 'cancelled'
        });
      }

      return { previousRequest };
    },
    onError: (_err, { requestId }, context) => {
      // Revertir optimistic update
      if (context?.previousRequest) {
        queryClient.setQueryData(requestKeys.detail(requestId), context.previousRequest);
      }
    },
    onSuccess: (success, { requestId }) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) });
        queryClient.invalidateQueries({ queryKey: requestKeys.active() });
        queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      }
    },
  });
};

// ============================================================================
// UTILITY HOOKS - Cache management helpers
// ============================================================================

/**
 * Hook para invalidar manualmente el cache de requests
 */
export const useInvalidateRequests = () => {
  const queryClient = useQueryClient();

  return {
    invalidateActive: () => queryClient.invalidateQueries({ queryKey: requestKeys.active() }),
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: requestKeys.all }),
    invalidateDetail: (requestId: string) => 
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: requestKeys.lists() }),
  };
};

/**
 * Hook para obtener datos en cache sin hacer requests
 */
export const useRequestsCache = () => {
  const queryClient = useQueryClient();

  return {
    getActiveRequests: () => queryClient.getQueryData<RideRequest[]>(requestKeys.active()),
    getRequestDetail: (requestId: string) => 
      queryClient.getQueryData<RideRequest>(requestKeys.detail(requestId)),
    setRequestDetail: (requestId: string, data: RideRequest) =>
      queryClient.setQueryData(requestKeys.detail(requestId), data),
  };
};

// ============================================================================
// PREFETCH HELPERS - Para mejorar perceived performance
// ============================================================================

/**
 * Hook para prefetch de solicitudes (ej: al hacer hover en enlaces)
 */
export const usePrefetchRequest = () => {
  const queryClient = useQueryClient();

  return {
    prefetchActiveRequests: () => {
      queryClient.prefetchQuery({
        queryKey: requestKeys.active(),
        queryFn: () => requestService.getActiveRequests(),
        staleTime: 30 * 1000,
      });
    },
    prefetchRequestDetail: (requestId: string) => {
      queryClient.prefetchQuery({
        queryKey: requestKeys.detail(requestId),
        queryFn: () => requestService.getRequestById(requestId),
        staleTime: 5 * 60 * 1000,
      });
    },
  };
}; 