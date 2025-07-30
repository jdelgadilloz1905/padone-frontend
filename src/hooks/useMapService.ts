import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import mapService from '../services/mapService';
import type { Driver, Location } from '../services/mapService';

// Query Keys para mejor organización del cache
export const MAP_QUERY_KEYS = {
  activeDrivers: ['map', 'activeDrivers'] as const,
  driverLocation: (driverId: number) => ['map', 'driverLocation', driverId] as const,
  driverDetails: (driverId: number) => ['map', 'driverDetails', driverId] as const,
  routeCalculation: (origin: Location, destination: Location) => [
    'map', 
    'routeCalculation', 
    { origin, destination }
  ] as const,
};

/**
 * Hook para obtener conductores activos con cache y actualizaciones automáticas
 * OPTIMIZACIÓN: Cache de 2 minutos, actualizaciones background cada 30 segundos
 */
export const useActiveDrivers = () => {
  return useQuery({
    queryKey: MAP_QUERY_KEYS.activeDrivers,
    queryFn: () => mapService.getActiveDrivers(),
    staleTime: 30 * 1000, // 30 segundos - datos "frescos"
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
    refetchInterval: 30 * 1000, // Refetch cada 30 segundos en background
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false, // Evitar refetch excesivo
    retry: 2,
  });
};

/**
 * Hook para obtener ubicación específica de un conductor
 * OPTIMIZACIÓN: Cache corto pero inteligente para ubicaciones
 */
export const useDriverLocation = (driverId: number, enabled = true) => {
  return useQuery({
    queryKey: MAP_QUERY_KEYS.driverLocation(driverId),
    queryFn: () => mapService.getDriverLocation(driverId),
    staleTime: 15 * 1000, // 15 segundos - ubicaciones cambian rápido
    gcTime: 2 * 60 * 1000, // 2 minutos en cache
    refetchInterval: 15 * 1000, // Refetch cada 15 segundos
    enabled: enabled && !!driverId,
    retry: 1, // Solo un retry para ubicaciones
  });
};

/**
 * Hook para obtener detalles completos de un conductor
 * OPTIMIZACIÓN: Cache largo para datos que no cambian frecuentemente
 */
export const useDriverDetails = (driverId: number, enabled = true) => {
  return useQuery({
    queryKey: MAP_QUERY_KEYS.driverDetails(driverId),
    queryFn: () => mapService.getDriverDetails(driverId),
    staleTime: 10 * 60 * 1000, // 10 minutos - datos de perfil estables
    gcTime: 30 * 60 * 1000, // 30 minutos en cache
    enabled: enabled && !!driverId,
    retry: 2,
  });
};

/**
 * Hook para cálculo de rutas con cache inteligente
 * OPTIMIZACIÓN: Cache por origen-destino para evitar recálculos
 */
export const useRouteCalculation = (
  origin: Location | null, 
  destination: Location | null,
  enabled = true
) => {
  return useQuery({
    queryKey: origin && destination 
      ? MAP_QUERY_KEYS.routeCalculation(origin, destination)
      : ['map', 'routeCalculation', 'disabled'],
    queryFn: () => origin && destination 
      ? mapService.calculateRoute(origin, destination)
      : Promise.resolve(null),
    staleTime: 15 * 60 * 1000, // 15 minutos - rutas no cambian frecuentemente
    gcTime: 60 * 60 * 1000, // 1 hora en cache
    enabled: enabled && !!origin && !!destination,
    retry: 1,
  });
};

/**
 * Hook para invalidar y refrescar datos del mapa
 * OPTIMIZACIÓN: Control granular del cache
 */
export const useMapActions = () => {
  const queryClient = useQueryClient();

  const invalidateActiveDrivers = () => {
    queryClient.invalidateQueries({ 
      queryKey: MAP_QUERY_KEYS.activeDrivers 
    });
  };

  const invalidateDriverLocation = (driverId: number) => {
    queryClient.invalidateQueries({ 
      queryKey: MAP_QUERY_KEYS.driverLocation(driverId) 
    });
  };

  const invalidateAllDriverData = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['map'] 
    });
  };

  const updateDriverLocationCache = (driverId: number, location: Location) => {
    // Actualizar cache sin hacer request
    queryClient.setQueryData(
      MAP_QUERY_KEYS.driverLocation(driverId), 
      location
    );
    
    // También actualizar en la lista de conductores activos
    queryClient.setQueryData(MAP_QUERY_KEYS.activeDrivers, (oldData: Driver[] | undefined) => {
      if (!oldData) return oldData;
      
      return oldData.map(driver => 
        driver.id === driverId 
          ? { ...driver, location }
          : driver
      );
    });
  };

  return {
    invalidateActiveDrivers,
    invalidateDriverLocation,
    invalidateAllDriverData,
    updateDriverLocationCache,
  };
};

/**
 * Hook compuesto para obtener todos los datos de un conductor
 * OPTIMIZACIÓN: Combina múltiples queries eficientemente
 */
export const useDriverComplete = (driverId: number, enabled = true) => {
  const locationQuery = useDriverLocation(driverId, enabled);
  const detailsQuery = useDriverDetails(driverId, enabled);

  return {
    location: locationQuery.data,
    details: detailsQuery.data,
    isLoading: locationQuery.isLoading || detailsQuery.isLoading,
    isError: locationQuery.isError || detailsQuery.isError,
    error: locationQuery.error || detailsQuery.error,
    refetch: () => {
      locationQuery.refetch();
      detailsQuery.refetch();
    }
  };
};

/**
 * Hook para real-time updates optimizado
 * OPTIMIZACIÓN: Integra WebSocket con React Query cache
 */
export const useRealTimeDrivers = () => {
  const { data: drivers, ...query } = useActiveDrivers();
  const { updateDriverLocationCache } = useMapActions();

  // Simular integración con WebSocket real-time updates
  // En una implementación real, esto se conectaría al WebSocket
  useEffect(() => {
    if (!drivers) return;

    // Aquí se registraría el listener del WebSocket
    // const handleDriverLocationUpdate = (driverId: number, location: Location) => {
    //   updateDriverLocationCache(driverId, location);
    // };

    // Simular conexión WebSocket
    console.log('🔄 Real-time driver updates initialized with React Query optimization');

    return () => {
      console.log('🔄 Real-time driver updates cleaned up');
    };
  }, [drivers, updateDriverLocationCache]);

  return {
    drivers,
    ...query
  };
}; 