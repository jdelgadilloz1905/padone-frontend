import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService';
import type { DashboardFilters } from '../services/dashboardService';

// =====================================================================
// QUERY KEYS - Centralizadas para consistencia
// =====================================================================

export const DASHBOARD_QUERY_KEYS = {
  metrics: (filters?: DashboardFilters) => ['dashboard', 'metrics', filters] as const,
  requests: (limit?: number, filters?: DashboardFilters) => ['dashboard', 'requests', limit, filters] as const,
  rideStats: (filters?: DashboardFilters) => ['dashboard', 'ride-stats', filters] as const,
  driverStats: (filters?: DashboardFilters) => ['dashboard', 'driver-stats', filters] as const,
} as const;

// =====================================================================
// CONFIGURACIÓN DE QUERIES
// =====================================================================

const QUERY_CONFIG = {
  // Métricas principales - Se actualizan cada 30 segundos
  metrics: {
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 30 * 1000, // Refetch cada 30 segundos
    refetchOnWindowFocus: true,
    retry: 3,
  },
  // Solicitudes recientes - Se actualizan cada 15 segundos  
  requests: {
    staleTime: 15 * 1000, // 15 segundos
    refetchInterval: 15 * 1000, // Refetch cada 15 segundos
    refetchOnWindowFocus: true,
    retry: 2,
  },
  // Estadísticas - Se actualizan cada 60 segundos
  statistics: {
    staleTime: 60 * 1000, // 60 segundos
    refetchInterval: 60 * 1000, // Refetch cada 60 segundos
    refetchOnWindowFocus: false, // No tan crítico
    retry: 2,
  },
} as const;

// =====================================================================
// HOOK PRINCIPAL DEL DASHBOARD
// =====================================================================

// 🆕 NUEVO: Hook actualizado para aceptar filtros
export const useDashboardData = (filters?: DashboardFilters) => {
  const queryClient = useQueryClient();

  // Query para métricas principales del dashboard con filtros
  const metricsQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.metrics(filters),
    queryFn: () => dashboardService.getDashboardMetrics(filters),
    ...QUERY_CONFIG.metrics,
  });

  // Query para solicitudes recientes con filtros
  const requestsQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.requests(10, filters),
    queryFn: () => dashboardService.getRecentRequests(10, filters),
    ...QUERY_CONFIG.requests,
  });

  // Query para estadísticas de rides con filtros
  const rideStatsQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.rideStats(filters),
    queryFn: () => dashboardService.getRideStatistics(filters),
    ...QUERY_CONFIG.statistics,
  });

  // Query para estadísticas de conductores con filtros
  const driverStatsQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.driverStats(filters),
    queryFn: () => dashboardService.getDriverStatistics(filters),
    ...QUERY_CONFIG.statistics,
  });

  // =====================================================================
  // WEBSOCKET INTEGRATION PARA TIEMPO REAL
  // =====================================================================

  const setupRealTimeUpdates = useCallback(() => {
    console.log('🔄 Configurando actualizaciones en tiempo real del dashboard...');
    
    // Nota: El socketService actual necesita ser extendido para soportar eventos del dashboard
    // Por ahora, usamos los eventos existentes que ya están implementados
    
    // TEMPORAL: Simulación de actualizaciones cada 30 segundos hasta que se implementen los eventos WebSocket
    const metricsUpdateInterval = setInterval(() => {
      console.log('🔄 Actualizando métricas automáticamente (temporal)...');
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.metrics(filters) });
    }, 30000); // 30 segundos

    const requestsUpdateInterval = setInterval(() => {
      console.log('🔄 Actualizando solicitudes automáticamente (temporal)...');
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.requests(10, filters) });
    }, 15000); // 15 segundos

    // Limpieza de intervalos
    return () => {
      clearInterval(metricsUpdateInterval);
      clearInterval(requestsUpdateInterval);
    };

    // TODO: Implementar cuando se agreguen los eventos WebSocket al socketService:
    /*
    socketService.on('dashboard:metrics-updated', (updatedMetrics: Partial<DashboardMetrics>) => {
      console.log('📊 Métricas actualizadas vía WebSocket:', updatedMetrics);
      
      queryClient.setQueryData(
        DASHBOARD_QUERY_KEYS.metrics(filters),
        (oldData: DashboardMetrics | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...updatedMetrics };
        }
      );
    });

    socketService.on('requests:new', (newRequest: RideRequest) => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.requests(10, filters) });
      
      queryClient.setQueryData(
        DASHBOARD_QUERY_KEYS.metrics(filters),
        (oldData: DashboardMetrics | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            activeRequests: oldData.activeRequests + 1
          };
        }
      );
    });

    socketService.on('requests:completed', (completedRequest: { id: string; revenue?: number }) => {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.requests(10, filters) });
      
      queryClient.setQueryData(
        DASHBOARD_QUERY_KEYS.metrics(filters),
        (oldData: DashboardMetrics | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            activeRequests: Math.max(0, oldData.activeRequests - 1),
            totalRides: oldData.totalRides + 1,
            revenue: {
              ...oldData.revenue,
              today: oldData.revenue.today + (completedRequest.revenue || 0)
            }
          };
        }
      );
    });
    */

  }, [queryClient, filters]);

  const cleanupRealTimeUpdates = useCallback(() => {
    console.log('🔄 Limpiando actualizaciones en tiempo real del dashboard...');
    
    // TODO: Implementar cleanup cuando se agreguen los eventos WebSocket
    /*
    socketService.off('dashboard:metrics-updated');
    socketService.off('requests:new');
    socketService.off('requests:completed');
    socketService.off('drivers:status-changed');
    socketService.off('drivers:online');
    socketService.off('drivers:offline');
    */
  }, []);

  // Setup y cleanup de actualizaciones automáticas
  useEffect(() => {
    const cleanup = setupRealTimeUpdates();
    return () => {
      cleanup?.();
      cleanupRealTimeUpdates();
    };
  }, [setupRealTimeUpdates, cleanupRealTimeUpdates]);

  // =====================================================================
  // FUNCIONES DE UTILIDAD
  // =====================================================================

  const refreshAllData = useCallback(() => {
    
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.metrics(filters) });
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.requests(10, filters) });
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.rideStats(filters) });
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.driverStats(filters) });
  }, [queryClient, filters]);

  const refreshMetrics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.metrics(filters) });
  }, [queryClient, filters]);

  const refreshRequests = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.requests(10, filters) });
  }, [queryClient, filters]);

  // =====================================================================
  // DATOS DERIVADOS Y COMPUTED VALUES
  // =====================================================================

  const isLoading = metricsQuery.isLoading || requestsQuery.isLoading;
  const hasError = metricsQuery.isError || requestsQuery.isError;
  const isRefetching = metricsQuery.isRefetching || requestsQuery.isRefetching;

  // Datos combinados para fácil acceso
  const dashboardData = {
    metrics: metricsQuery.data,
    requests: requestsQuery.data || [],
    rideStats: rideStatsQuery.data,
    driverStats: driverStatsQuery.data,
  };

  // Indicadores de conexión
  const connectionStatus = {
    metricsConnected: !metricsQuery.isError,
    requestsConnected: !requestsQuery.isError,
    rideStatsConnected: !rideStatsQuery.isError,
    driverStatsConnected: !driverStatsQuery.isError,
  };

  // =====================================================================
  // RETURN DEL HOOK
  // =====================================================================

  return {
    // Datos principales
    data: dashboardData,
    
    // Estados de carga
    isLoading,
    hasError,
    isRefetching,
    
    // Queries individuales para acceso granular
    queries: {
      metrics: metricsQuery,
      requests: requestsQuery,
      rideStats: rideStatsQuery,
      driverStats: driverStatsQuery,
    },
    
    // Estado de conexión
    connectionStatus,
    
    // Funciones de control
    actions: {
      refreshAllData,
      refreshMetrics,
      refreshRequests,
    },
    
    // Datos para debugging
    debug: {
      lastUpdate: {
        metrics: metricsQuery.dataUpdatedAt,
        requests: requestsQuery.dataUpdatedAt,
        rideStats: rideStatsQuery.dataUpdatedAt,
        driverStats: driverStatsQuery.dataUpdatedAt,
      },
    },
  };
};

// =====================================================================
// HOOKS AUXILIARES PARA DATOS ESPECÍFICOS
// =====================================================================

/**
 * Hook simplificado solo para métricas principales
 * 🆕 NUEVO: Ahora acepta filtros
 */
export const useDashboardMetrics = (filters?: DashboardFilters) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.metrics(filters),
    queryFn: () => dashboardService.getDashboardMetrics(filters),
    ...QUERY_CONFIG.metrics,
  });
};

/**
 * Hook simplificado solo para solicitudes recientes
 * 🆕 NUEVO: Ahora acepta filtros
 */
export const useRecentRequests = (limit = 10, filters?: DashboardFilters) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.requests(limit, filters),
    queryFn: () => dashboardService.getRecentRequests(limit, filters),
    ...QUERY_CONFIG.requests,
  });
};

/**
 * Hook para estadísticas de conductores
 * 🆕 NUEVO: Ahora acepta filtros
 */
export const useDriverStatistics = (filters?: DashboardFilters) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.driverStats(filters),
    queryFn: () => dashboardService.getDriverStatistics(filters),
    ...QUERY_CONFIG.statistics,
  });
}; 