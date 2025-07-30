import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conductorService } from '../services/conductorService';
import type { 
  Conductor, 
  UpdateDriverDocumentsDto, 
  UpdateVehicleDocumentsDto,
  UpdateProfilePictureDto,
  GetConductoresParams,
  PaginatedResponse 
} from '../services/conductorService';

export const useConductores = () => {
  const queryClient = useQueryClient();

  // Obtener todos los conductores con paginación
  const getConductores = (params?: GetConductoresParams) => 
    useQuery<PaginatedResponse<Conductor>>({
      queryKey: ['conductores', params],
      queryFn: async () => {
        console.log('Llamando a getConductores con params:', params);
        const response = await conductorService.getdrivers(params);
        console.log('Respuesta del servicio getConductores:', response);
        return response;
      }
    });

  // Obtener conductores con ubicación actual
  const getConductoresConUbicacion = (params?: GetConductoresParams) => 
    useQuery<PaginatedResponse<Conductor>>({
      queryKey: ['conductores', 'ubicacion', params],
      queryFn: async () => {
        console.log('Llamando a getConductoresConUbicacion con params:', params);
        const response = await conductorService.getConductoresConUbicacion(params);
        console.log('Respuesta del servicio getConductoresConUbicacion:', response);
        return response;
      }
    });

  // Obtener un conductor por ID
  const getConductor = (id: string) => 
    useQuery({
      queryKey: ['conductores', id],
      queryFn: () => conductorService.getConductorById(id),
      enabled: !!id
    });

  // Crear un nuevo conductor
  const crearConductor = () => 
    useMutation({
      mutationFn: conductorService.crearConductor,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['conductores'] });
      }
    });

  // Actualizar un conductor
  const actualizarConductor = () => 
    useMutation({
      mutationFn: ({ id, datos }: { id: string, datos: Partial<Conductor> }) => 
        conductorService.actualizarConductor(id, datos),
      onSuccess: (_, variables) => {
        // Invalidar todas las queries relacionadas con conductores
        queryClient.invalidateQueries({ queryKey: ['conductores'] });
        queryClient.invalidateQueries({ queryKey: ['conductores', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['conductores', 'ubicacion'] });
        // Invalidar cualquier query que contenga el ID del conductor
        queryClient.invalidateQueries({ 
          predicate: (query) => 
            query.queryKey[0] === 'conductores' && 
            query.queryKey.includes(variables.id)
        });
      }
    });

  // Eliminar un conductor
  const eliminarConductor = () => 
    useMutation({
      mutationFn: conductorService.eliminarConductor,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['conductores'] });
      }
    });

  // Reactivar un conductor inactivo
  const reactivarConductor = () => 
    useMutation({
      mutationFn: conductorService.reactivarConductor,
      onSuccess: (_, id) => {
        queryClient.invalidateQueries({ queryKey: ['conductores'] });
        queryClient.invalidateQueries({ queryKey: ['conductores', id] });
      }
    });

  // Actualizar documentos del conductor (admin)
  const actualizarDocumentosConductor = () => 
    useMutation({
      mutationFn: ({ id, documentos }: { id: string, documentos: UpdateDriverDocumentsDto }) => 
        conductorService.actualizarDocumentosConductor(id, documentos),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['conductores'] });
        queryClient.invalidateQueries({ queryKey: ['conductores', variables.id] });
      }
    });

  // Actualizar documentos del vehículo (admin)
  const actualizarDocumentosVehiculo = () => 
    useMutation({
      mutationFn: ({ id, documentos }: { id: string, documentos: UpdateVehicleDocumentsDto }) => 
        conductorService.actualizarDocumentosVehiculo(id, documentos),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['conductores'] });
        queryClient.invalidateQueries({ queryKey: ['conductores', variables.id] });
      }
    });

  // Actualizar foto de perfil del conductor (admin)
  const actualizarFotoConductor = () => 
    useMutation({
      mutationFn: ({ id, foto }: { id: string, foto: UpdateProfilePictureDto }) => 
        conductorService.actualizarFotoConductor(id, foto),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['conductores'] });
        queryClient.invalidateQueries({ queryKey: ['conductores', variables.id] });
      }
    });

  // Obtener estadísticas del conductor (admin)
  const obtenerEstadisticasConductor = (id: string) => 
    useQuery({
      queryKey: ['conductores', id, 'estadisticas'],
      queryFn: () => conductorService.obtenerEstadisticasConductor(id),
      enabled: !!id
    });

  // Cambiar estado del conductor (activo/inactivo)
  const toggleConductorStatus = () => 
    useMutation({
      mutationFn: ({ id, newStatus }: { id: number; newStatus: string }) => 
        conductorService.updateStatus(id, newStatus),
      onSuccess: (_, variables) => {
        // Invalidar cache para actualizar la tabla inmediatamente
        queryClient.invalidateQueries({ queryKey: ['conductores'] });
        queryClient.invalidateQueries({ queryKey: ['conductores', 'ubicacion'] });
        queryClient.invalidateQueries({ queryKey: ['conductores', variables.id.toString()] });
      }
    });

  // Cambiar campo active del conductor (activo/inactivo)
  const toggleConductorActive = () => 
    useMutation({
      mutationFn: ({ id, active }: { id: number; active: boolean }) => 
        conductorService.updateActive(id, active),
      onSuccess: (_, variables) => {
        // Invalidar cache para actualizar la tabla inmediatamente
        queryClient.invalidateQueries({ queryKey: ['conductores'] });
        queryClient.invalidateQueries({ queryKey: ['conductores', 'ubicacion'] });
        queryClient.invalidateQueries({ queryKey: ['conductores', variables.id.toString()] });
      }
    });

  return {
    getConductores,
    getConductoresConUbicacion,
    getConductor,
    crearConductor,
    actualizarConductor,
    eliminarConductor,
    reactivarConductor,
    actualizarDocumentosConductor,
    actualizarDocumentosVehiculo,
    actualizarFotoConductor,
    obtenerEstadisticasConductor,
    toggleConductorStatus,
    toggleConductorActive
  };
}; 