import { useQuery } from '@tanstack/react-query';
import trackingService from '../services/trackingService';
import type { TrackingResponse } from '../services/trackingService';

export const useTracking = (trackingCode: string) => {
  return useQuery<TrackingResponse, Error>({
    queryKey: ['tracking', trackingCode],
    queryFn: () => trackingService.getTrackingInfo(trackingCode),
    enabled: !!trackingCode,
    refetchInterval: 5000, // Actualizar cada 5 segundos
    staleTime: 2000, // Considerar datos obsoletos después de 2 segundos
    retry: (failureCount, error) => {
      // No reintentar si el tracking code no existe
      if (error.message.includes('no encontrado')) {
        return false;
      }
      // Reintentar hasta 3 veces para otros errores
      return failureCount < 3;
    }
  });
}; 