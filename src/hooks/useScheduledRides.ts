import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduledRideService } from '../services/scheduledRideService';
import type { 
  CreateScheduledRideDTO, 
  UpdateScheduledRideDTO, 
  ScheduledRideFilters 
} from '../services/scheduledRideService';

// Hook para obtener todas las carreras programadas
export const useScheduledRides = (filters: ScheduledRideFilters = {}) => {
  return useQuery({
    queryKey: ['scheduled-rides', filters],
    queryFn: () => scheduledRideService.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
    refetchInterval: 30 * 1000, // 30 segundos
  });
};

// Hook para obtener una carrera programada específica
export const useScheduledRide = (id: string) => {
  return useQuery({
    queryKey: ['scheduled-rides', id],
    queryFn: () => scheduledRideService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para crear una nueva carrera programada
export const useCreateScheduledRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateScheduledRideDTO) => scheduledRideService.create(data),
    onSuccess: () => {
      // Invalidar todas las consultas de carreras programadas
      queryClient.invalidateQueries({ queryKey: ['scheduled-rides'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
};

// Hook para actualizar una carrera programada
export const useUpdateScheduledRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduledRideDTO }) => 
      scheduledRideService.update(id, data),
    onSuccess: (updatedRide) => {
      // Actualizar la cache con los nuevos datos
      queryClient.setQueryData(['scheduled-rides', updatedRide.id], updatedRide);
      queryClient.invalidateQueries({ queryKey: ['scheduled-rides'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
};

// Hook para cancelar una carrera programada
export const useCancelScheduledRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      scheduledRideService.cancel(id, reason),
    onSuccess: (_, { id }) => {
      // Remover de la cache y invalidar consultas
      queryClient.removeQueries({ queryKey: ['scheduled-rides', id] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-rides'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
};

// Hook para asignar conductor a una carrera
export const useAssignDriver = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ rideId, driverId }: { rideId: string; driverId: string }) => 
      scheduledRideService.assignDriver(rideId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-rides'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
};

// Hook para desasignar conductor de una carrera
export const useUnassignDriver = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rideId: string) => scheduledRideService.unassignDriver(rideId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-rides'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
};

// Hook para obtener carreras de un día específico
export const useScheduledRidesByDate = (date: string) => {
  return useQuery({
    queryKey: ['scheduled-rides', 'date', date],
    queryFn: () => scheduledRideService.getByDate(date),
    enabled: !!date,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

// Hook para obtener vista mensual
export const useMonthView = (year: number, month: number) => {
  return useQuery({
    queryKey: ['calendar', 'month', year, month],
    queryFn: () => scheduledRideService.getMonthView(year, month),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener vista semanal
export const useWeekView = (date: string) => {
  return useQuery({
    queryKey: ['calendar', 'week', date],
    queryFn: () => scheduledRideService.getWeekView(date),
    enabled: !!date,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para obtener conductores disponibles
export const useAvailableDrivers = (date: string, time: string) => {
  return useQuery({
    queryKey: ['available-drivers', date, time],
    queryFn: () => scheduledRideService.getAvailableDrivers(date, time),
    enabled: !!date && !!time,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

// Hook para enviar recordatorio
export const useSendReminder = () => {
  return useMutation({
    mutationFn: (rideId: string) => scheduledRideService.sendReminder(rideId),
  });
};

// Hook para obtener carreras próximas
export const useUpcomingRides = (hours: number = 24) => {
  return useQuery({
    queryKey: ['scheduled-rides', 'upcoming', hours],
    queryFn: () => scheduledRideService.getUpcoming(hours),
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 2 * 60 * 1000, // 2 minutos
  });
}; 