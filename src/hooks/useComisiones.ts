import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import comisionService, { 
  type FiltrosComision, 
  type ResumenComisiones, 
  type ComisionConductor, 
  type EstadisticasComisiones,
  type Comision
} from '../services/comisionService';

// Keys para React Query
const QUERY_KEYS = {
  resumen: (filtros?: FiltrosComision) => ['comisiones', 'resumen', filtros],
  conductores: (filtros?: FiltrosComision) => ['comisiones', 'conductores', filtros],
  detalles: (conductorId: number, filtros?: FiltrosComision) => 
    ['comisiones', 'detalles', conductorId, filtros],
  conductoresList: () => ['conductores', 'lista'],
  estadisticas: () => ['comisiones', 'estadisticas']
};

export const useComisiones = () => {
  const queryClient = useQueryClient();

  // Hook para obtener resumen de comisiones
  const useResumenComisiones = (filtros?: FiltrosComision) => {
    return useQuery<ResumenComisiones>({
      queryKey: QUERY_KEYS.resumen(filtros),
      queryFn: () => comisionService.getResumenComisiones(filtros),
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
  };

  // Hook para obtener conductores con comisiones
  const useConductoresComisiones = (filtros?: FiltrosComision) => {
    return useQuery<ComisionConductor[]>({
      queryKey: QUERY_KEYS.conductores(filtros),
      queryFn: () => comisionService.getConductoresComisiones(filtros),
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
  };

  // Hook para obtener detalles de comisiones de un conductor
  const useComisionesConductor = (conductorId: number, filtros?: FiltrosComision) => {
    return useQuery<{
      data: Comision[];
      total: number;
      page: number;
      totalPages: number;
      driverInfo: {
        id: number;
        name: string;
        phone: string;
      };
      summary: {
        totalRides: number;
        totalBilled: number;
        totalCommissions: number;
        averageCommissionPercentage: number;
      };
    }>({
      queryKey: QUERY_KEYS.detalles(conductorId, filtros),
      queryFn: () => comisionService.getComisionesConductor(conductorId, filtros),
      enabled: !!conductorId,
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
  };

  // Hook para obtener estadísticas generales
  const useEstadisticasComisiones = (filtros?: FiltrosComision) => {
    return useQuery<{
      data: EstadisticasComisiones;
    }>({
      queryKey: [...QUERY_KEYS.estadisticas(), filtros],
      queryFn: () => comisionService.getEstadisticasComisiones(filtros),
      staleTime: 2 * 60 * 1000, // 2 minutos (reducido para mejor actualización)
    });
  };

  // Hook para obtener lista de conductores para filtros
  const useConductoresList = () => {
    return useQuery({
      queryKey: QUERY_KEYS.conductoresList(),
      queryFn: () => comisionService.getConductores(),
      staleTime: 10 * 60 * 1000, // 10 minutos
    });
  };

  // Mutación para marcar como pagado
  const useMarcarComoPagado = () => {
    return useMutation({
      mutationFn: ({ conductorId, comisionIds }: { conductorId: number; comisionIds: number[] }) =>
        comisionService.marcarComoPagado(conductorId, comisionIds),
      onSuccess: (_, variables) => {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['comisiones'] });
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.detalles(variables.conductorId) 
        });
      },
    });
  };

  // Mutación para exportar comisiones
  const useExportarComisiones = () => {
    return useMutation({
      mutationFn: (filtros?: FiltrosComision) => comisionService.exportarComisiones(filtros),
      onSuccess: (blob) => {
        // Crear URL para descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `comisiones-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
    });
  };

  // Mutación para generar reporte (mantener para compatibilidad)
  const useGenerarReporte = () => {
    return useMutation({
      mutationFn: (filtros?: FiltrosComision) => comisionService.generarReporte(filtros),
      onSuccess: (blob) => {
        // Crear URL para descargar el archivo
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-comisiones-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
    });
  };

  return {
    useResumenComisiones,
    useConductoresComisiones,
    useComisionesConductor,
    useEstadisticasComisiones,
    useConductoresList,
    useMarcarComoPagado,
    useExportarComisiones,
    useGenerarReporte,
  };
}; 