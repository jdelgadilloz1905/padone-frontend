import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { solicitudService } from '../services/solicitudService';
import type { Solicitud } from '../services/solicitudService';

export const useSolicitudes = () => {
  const queryClient = useQueryClient();

  // Obtener todas las solicitudes
  const getSolicitudes = () => 
    useQuery({
      queryKey: ['solicitudes'],
      queryFn: solicitudService.getSolicitudes
    });

  // Obtener una solicitud por ID
  const getSolicitud = (id: string) => 
    useQuery({
      queryKey: ['solicitudes', id],
      queryFn: () => solicitudService.getSolicitudById(id),
      enabled: !!id
    });

  // Crear una nueva solicitud
  const crearSolicitud = () => 
    useMutation({
      mutationFn: solicitudService.crearSolicitud,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      }
    });

  // Actualizar una solicitud
  const actualizarSolicitud = () => 
    useMutation({
      mutationFn: ({ id, datos }: { id: string, datos: Partial<Solicitud> }) => 
        solicitudService.actualizarSolicitud(id, datos),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
        queryClient.invalidateQueries({ queryKey: ['solicitudes', variables.id] });
      }
    });

  // Asignar un conductor a una solicitud
  const asignarConductor = () => 
    useMutation({
      mutationFn: ({ solicitudId, conductorId }: { solicitudId: string, conductorId: string }) => 
        solicitudService.asignarConductor(solicitudId, conductorId),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
        queryClient.invalidateQueries({ queryKey: ['solicitudes', variables.solicitudId] });
        queryClient.invalidateQueries({ queryKey: ['conductores', variables.conductorId] });
      }
    });

  // Cancelar una solicitud
  const cancelarSolicitud = () => 
    useMutation({
      mutationFn: ({ id, motivo }: { id: string, motivo: string }) => 
        solicitudService.cancelarSolicitud(id, motivo),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
        queryClient.invalidateQueries({ queryKey: ['solicitudes', variables.id] });
      }
    });

  return {
    getSolicitudes,
    getSolicitud,
    crearSolicitud,
    actualizarSolicitud,
    asignarConductor,
    cancelarSolicitud
  };
}; 