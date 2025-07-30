import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import rideService, { type Ride } from '../services/rideService';

export const useActiveRide = () => {
  const queryClient = useQueryClient();

  // Query para obtener carrera activa
  const { data: activeRide, isLoading, error, refetch } = useQuery<Ride | null>({
    queryKey: ['activeRide'],
    queryFn: () => rideService.getActiveRide(),
    refetchInterval: 5000, // Refrescar cada 5 segundos
    staleTime: 2500, // Considerar datos obsoletos después de 2.5 segundos
  });

  // Mutación para iniciar viaje (cambiar a "en vía")
  const startTripMutation = useMutation({
    mutationFn: (rideId: string) => rideService.startTrip(rideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
    },
  });

  // Mutación para completar viaje
  const completeTripMutation = useMutation({
    mutationFn: ({ rideId, actualCost }: { rideId: string; actualCost?: number }) =>
      rideService.completeTrip(rideId, actualCost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
    },
  });

  // Mutación para actualizar estado manualmente
  const updateStatusMutation = useMutation({
    mutationFn: ({ rideId, status }: { rideId: string; status: Ride['status'] }) =>
      rideService.updateRideStatus(rideId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeRide'] });
    },
  });

  return {
    activeRide,
    isLoading,
    error,
    refetch,
    startTrip: startTripMutation.mutate,
    completeTrip: completeTripMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    isStartingTrip: startTripMutation.isPending,
    isCompletingTrip: completeTripMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}; 