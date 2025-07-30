import API from './api';

// Interfaces para las comisiones basadas en la documentación de la API
export interface Comision {
  date: string;
  ride_id: number;
  tracking_code: string;
  client_name: string;
  client_phone: string;
  origin: string;
  destination: string;
  amount: string | number; // El API puede devolver string o number
  commission_percentage: string | number; // El API puede devolver string o number
  commission_amount: string | number; // El API puede devolver string o number
  distance: string | number; // El API puede devolver string o number
  duration: number;
  payment_method: string;
}

export interface ComisionConductor {
  driver_id: number;
  driver_name: string;
  driver_phone: string;
  total_rides: number;
  total_billed: number;
  total_commissions: number;
  average_commission_percentage: number;
}

export interface ResumenComisiones {
  data: ComisionConductor[];
  total: number;
  page: number;
  totalPages: number;
  driverInfo?: {
    id: number;
    name: string;
    phone: string;
  };
  summary?: {
    totalRides: number;
    totalBilled: number;
    totalCommissions: number;
    averageCommissionPercentage: number;
  };
}

export interface EstadisticasComisiones {
  totalDrivers: number;
  totalRides: number;
  totalBilled: number;
  totalCommissions: number;
  averageCommissionPercentage: number;
  topDrivers: Array<{
    driverId: number;
    driverName: string;
    totalCommissions: number;
    totalRides: number;
  }>;
  monthlyStats: Array<{
    month: string;
    totalCommissions: number;
    totalRides: number;
  }>;
}

export interface FiltrosComision {
  fecha_inicio?: string;
  fecha_fin?: string;
  conductor_id?: number;
  estado?: string;
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  driver_name?: string;
}

class ComisionService {
  // Obtener resumen general de comisiones por conductor
  async getResumenComisiones(filtros?: FiltrosComision): Promise<ResumenComisiones> {
    const params = new URLSearchParams();
    if (filtros?.page) params.append('page', filtros.page.toString());
    if (filtros?.limit) params.append('limit', filtros.limit.toString());
    if (filtros?.start_date || filtros?.fecha_inicio) {
      params.append('start_date', filtros.start_date || filtros.fecha_inicio!);
    }
    if (filtros?.end_date || filtros?.fecha_fin) {
      params.append('end_date', filtros.end_date || filtros.fecha_fin!);
    }
    if (filtros?.driver_name) params.append('driver_name', filtros.driver_name);
    
    const queryString = params.toString();
    const url = queryString ? `/commissions?${queryString}` : '/commissions';
    
    console.log('🔍 ComisionService - Llamando a:', url);
    console.log('🔍 ComisionService - Filtros:', filtros);
    
    try {
      const response = await API.get(url);
      console.log('🔍 ComisionService - Respuesta completa:', response);
      console.log('🔍 ComisionService - Tipo de respuesta:', typeof response);
      console.log('🔍 ComisionService - Keys de respuesta:', Object.keys(response));
      
      // Manejar la estructura de respuesta del API
      if (response.data && Array.isArray(response.data)) {
        // Si response.data es un array directamente
        console.log('✅ ComisionService - Estructura: Array directo en response.data');
        return {
          data: response.data,
          total: response.data.length,
          page: filtros?.page || 1,
          totalPages: 1
        };
      } else if (response.data) {
        // Si response.data tiene la estructura esperada
        console.log('✅ ComisionService - Estructura: Objeto en response.data');
        console.log('🔍 ComisionService - response.data:', response.data);
        return response.data;
      } else {
        // Si response es la estructura directa
        console.log('✅ ComisionService - Estructura: Objeto directo en response');
        return response;
      }
    } catch (error) {
      console.error('❌ ComisionService - Error:', error);
      throw error;
    }
  }

  // Obtener lista de conductores con sus comisiones (mismo endpoint que resumen)
  async getConductoresComisiones(filtros?: FiltrosComision): Promise<ComisionConductor[]> {
    console.log('🔍 getConductoresComisiones - Iniciando con filtros:', filtros);
    const response = await this.getResumenComisiones(filtros);
    console.log('🔍 getConductoresComisiones - Respuesta del resumen:', response);
    console.log('🔍 getConductoresComisiones - response.data:', response.data);
    console.log('🔍 getConductoresComisiones - Es array?', Array.isArray(response.data));
    
    // Extraer los datos del conductor de la respuesta
    const result = Array.isArray(response.data) ? response.data : [];
    console.log('🔍 getConductoresComisiones - Resultado final:', result);
    
    return result;
  }

  // Obtener detalles de comisiones de un conductor específico
  async getComisionesConductor(
    conductorId: number, 
    filtros?: FiltrosComision
  ): Promise<{
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
  }> {
    const params = new URLSearchParams();
    if (filtros?.start_date || filtros?.fecha_inicio) {
      params.append('start_date', filtros.start_date || filtros.fecha_inicio!);
    }
    if (filtros?.end_date || filtros?.fecha_fin) {
      params.append('end_date', filtros.end_date || filtros.fecha_fin!);
    }
    
    const queryString = params.toString();
    const url = queryString 
      ? `/commissions/driver/${conductorId}?${queryString}` 
      : `/commissions/driver/${conductorId}`;
    
    const response = await API.get(url);
    return response.data;
  }

  // Marcar comisiones como pagadas
  async marcarComoPagado(conductorId: number, comisionIds: number[]): Promise<void> {
    return API.post(`/commissions/conductor/${conductorId}/pagar`, {
      comision_ids: comisionIds
    });
  }

  // Exportar comisiones a CSV
  async exportarComisiones(filtros?: FiltrosComision): Promise<Blob> {
    const params = new URLSearchParams();
    if (filtros?.start_date || filtros?.fecha_inicio) {
      params.append('start_date', filtros.start_date || filtros.fecha_inicio!);
    }
    if (filtros?.end_date || filtros?.fecha_fin) {
      params.append('end_date', filtros.end_date || filtros.fecha_fin!);
    }
    if (filtros?.driver_name) params.append('driver_name', filtros.driver_name);
    
    const queryString = params.toString();
    const url = queryString ? `/commissions/export?${queryString}` : '/commissions/export';
    
    // Para descargas de archivos, necesitamos manejar la respuesta diferente
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const response = await fetch(`${API_URL}${url}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to export commissions');
    }
    
    return response.blob();
  }

  // Obtener estadísticas generales de comisiones
  async getEstadisticasComisiones(filtros?: FiltrosComision): Promise<{
    data: EstadisticasComisiones;
  }> {
    const params = new URLSearchParams();
    if (filtros?.start_date || filtros?.fecha_inicio) {
      params.append('start_date', filtros.start_date || filtros.fecha_inicio!);
    }
    if (filtros?.end_date || filtros?.fecha_fin) {
      params.append('end_date', filtros.end_date || filtros.fecha_fin!);
    }
    if (filtros?.driver_name) params.append('driver_name', filtros.driver_name);
    
    const queryString = params.toString();
    const url = queryString ? `/commissions/statistics?${queryString}` : '/commissions/statistics';
    
    console.log('🔍 getEstadisticasComisiones - Llamando a:', url);
    console.log('🔍 getEstadisticasComisiones - Filtros:', filtros);
    
    try {
      const response = await API.get(url);
      console.log('🔍 getEstadisticasComisiones - Respuesta:', response);
      return response;
    } catch (error) {
      console.error('❌ getEstadisticasComisiones - Error:', error);
      throw error;
    }
  }

  // Generar reporte de comisiones (mantener para compatibilidad)
  async generarReporte(filtros?: FiltrosComision): Promise<Blob> {
    return this.exportarComisiones(filtros);
  }

  // Obtener todos los conductores para el filtro
  async getConductores(): Promise<Array<{id: number, nombre: string}>> {
    return API.get('/drivers');
  }
}

export const comisionService = new ComisionService();
export default comisionService; 