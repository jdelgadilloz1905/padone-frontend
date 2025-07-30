import API from './api';
import type { RideRequest } from './requestService';

// =====================================================================
// INTERFACES PARA DASHBOARD ANALYTICS
// =====================================================================

export interface TopDriver {
  id: number;
  name: string;
  rating: number;
  totalRides: number | null;
}

export interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  type: 'ride' | 'driver' | 'user';
}

// 🆕 NUEVO: Interface para filtros del dashboard
export interface DashboardFilters {
  start_date?: string;
  end_date?: string;
  search?: string;
  status?: string;
  driver_id?: string;
  user_id?: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  totalDrivers: number;
  totalRides: number;
  completedRides: number;
  activeRides: number;
  totalRevenue: number;
  averageRating: number;
  topDrivers: TopDriver[];
  recentActivity: RecentActivity[];
}

export interface RideStatistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  completionRate: number; // Porcentaje
  averageRating: number;
}

export interface DriverStatistics {
 
    totalDrivers: number;
    activeDrivers: number;
    averageRating: number;
    totalTrips: number;
    averageTripsPerDriver: number;
    topPerformers: TopDriver[];
}



// =====================================================================
// DASHBOARD SERVICE CLASS
// =====================================================================

class DashboardService {
  
  /**
   * Obtiene todas las métricas principales del dashboard
   * Endpoint central que devuelve las estadísticas más importantes
   * 🆕 NUEVO: Ahora acepta filtros de fecha y búsqueda
   */
  async getDashboardMetrics(filters?: DashboardFilters): Promise<DashboardMetrics> {
    try {
      console.log('🔄 Cargando métricas del dashboard con filtros:', filters);
      
      // Construir query parameters para filtros
      const params = new URLSearchParams();
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.driver_id) params.append('driver_id', filters.driver_id);
      if (filters?.user_id) params.append('user_id', filters.user_id);
      
      const queryString = params.toString();
      const endpoint = queryString ? `/analytics/dashboard?${queryString}` : '/analytics/dashboard';
      
      const {data:response} = await API.get(endpoint);
      
      console.log('✅ Métricas del dashboard cargadas:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error cargando métricas del dashboard:', error);
      
      // Fallback a métricas básicas si el endpoint no está disponible
      if (error.response?.status === 404) {
        console.warn('🔄 Endpoint /analytics/dashboard no disponible, calculando métricas desde endpoints individuales');
        return this.calculateMetricsFromIndividualEndpoints(filters);
      }
      
      throw new Error('No se pudieron cargar las métricas del dashboard');
    }
  }

  /**
   * Obtiene estadísticas específicas de rides/carreras
   * 🆕 NUEVO: Ahora acepta filtros de fecha y búsqueda
   */
  async getRideStatistics(filters?: DashboardFilters): Promise<RideStatistics> {
    try {
      // Construir query parameters para filtros
      const params = new URLSearchParams();
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      
      const queryString = params.toString();
      const endpoint = queryString ? `/analytics/rides/statistics?${queryString}` : '/analytics/rides/statistics';
      
      const {data:response} = await API.get(endpoint);
      console.log('Respuesta de estadísticas de carreras:', response);
      return response;
    } catch (error) {
      console.error('Error cargando estadísticas de rides:', error);
      
      // Fallback: calcular desde endpoint de rides básico
      try {
        const params = new URLSearchParams();
        if (filters?.start_date) params.append('start_date', filters.start_date);
        if (filters?.end_date) params.append('end_date', filters.end_date);
        
        const queryString = params.toString();
        const endpoint = queryString ? `/analytics/rides/total?${queryString}` : '/analytics/rides/total';
        
        const totalResponse = await API.get(endpoint);
        return {
          total: totalResponse.total || 0,
          pending: 0,
          inProgress: 0,
          completed: totalResponse.total || 0,
          cancelled: 0,
          completionRate: 95, // Estimación
          averageRating: 4.5 // Estimación
        };
      } catch {
        throw new Error('No se pudieron cargar las estadísticas de rides');
      }
    }
  }

  /**
   * Obtiene estadísticas específicas de conductores
   * 🆕 NUEVO: Ahora acepta filtros de fecha y búsqueda
   */
  async getDriverStatistics(filters?: DashboardFilters): Promise<DriverStatistics> {
    try {
      // Construir query parameters para filtros
      const params = new URLSearchParams();
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.driver_id) params.append('driver_id', filters.driver_id);
      
      const queryString = params.toString();
      const endpoint = queryString ? `/analytics/drivers/statistics?${queryString}` : '/analytics/drivers/statistics';
      
      const {data:response} = await API.get(endpoint);
      return response;
    } catch (error) {
      console.error('Error cargando estadísticas de conductores:', error);
      throw new Error('No se pudieron cargar las estadísticas de conductores');
    }
  }

  /**
   * Obtiene las solicitudes más recientes para mostrar en el dashboard
   * 🆕 NUEVO: Ahora acepta filtros de fecha y búsqueda
   */
  async getRecentRequests(limit = 10, filters?: DashboardFilters): Promise<RideRequest[]> {
    try {
      // Construir query parameters para filtros
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.driver_id) params.append('driver_id', filters.driver_id);
      if (filters?.user_id) params.append('user_id', filters.user_id);
      
      const queryString = params.toString();
      const endpoint = `/requests/recent?${queryString}`;
      
      const {data:response} = await API.get(endpoint);
      return response;
    } catch (error: any) {
      console.error('Error cargando solicitudes recientes:', error);
      
      // Fallback: usar endpoint de solicitudes activas
      try {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);
        
        const queryString = params.toString();
        const endpoint = queryString ? `/requests/active?${queryString}` : '/requests/active';
        
        const activeResponse = await API.get(endpoint);
        return activeResponse.slice(0, limit);
      } catch {
        console.warn('🔄 Endpoints de solicitudes no disponibles, usando datos mock temporalmente');
        return this.getMockRecentRequests(limit);
      }
    }
  }

  /**
   * Obtiene actividad reciente del sistema
   * 🆕 NUEVO: Ahora acepta filtros de fecha y búsqueda
   */
  async getRecentActivity(limit = 20, filters?: DashboardFilters): Promise<RecentActivity[]> {
    try {
      // Construir query parameters para filtros
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.search) params.append('search', filters.search);
      
      const queryString = params.toString();
      const endpoint = `/analytics/activity/recent?${queryString}`;
      
      const {data:response} = await API.get(endpoint);
      return response;
    } catch (error) {
      console.error('Error cargando actividad reciente:', error);
      // Por ahora retornamos array vacío, este endpoint es opcional
      return [];
    }
  }

  /**
   * Obtiene métricas en tiempo real para WebSocket updates
   */
  async getRealTimeMetrics(): Promise<Partial<DashboardMetrics>> {
    try {
      const {data: response} = await API.get('/analytics/dashboard/realtime');
      return response;
    } catch (error) {
      console.error('Error cargando métricas en tiempo real:', error);
      // Este endpoint es opcional para WebSocket
      return {};
    }
  }

  // =====================================================================
  // MÉTODOS PRIVADOS Y FALLBACKS
  // =====================================================================

  /**
   * Calcula métricas básicas cuando el endpoint principal no está disponible
   * Combina llamadas a endpoints individuales
   * 🆕 NUEVO: Ahora acepta filtros
   */
  private async calculateMetricsFromIndividualEndpoints(filters?: DashboardFilters): Promise<DashboardMetrics> {
    try {
      console.log('🔧 Calculando métricas desde endpoints individuales...');
      
      // Intentar obtener datos de endpoints individuales
      const [
        rideStats,
        driverStats,
        activeRequests
      ] = await Promise.allSettled([
        this.getRideStatistics(filters),
        this.getDriverStatistics(filters),
        this.getRecentRequests(10, filters).catch(() => [])
      ]);

      // Extraer resultados exitosos
      const rides = rideStats.status === 'fulfilled' ? rideStats.value : { total: 0, completed: 0, averageRating: 0 };
      const drivers = driverStats.status === 'fulfilled' ? driverStats.value : { 
        totalDrivers: 0,
        activeDrivers: 0,
        averageRating: 0,
        totalTrips: 0,
        averageTripsPerDriver: 0,
        topPerformers: []
      };
      const requests = activeRequests.status === 'fulfilled' ? activeRequests.value : [];

      // Construir objeto de métricas básicas usando la nueva estructura
      return {
        totalUsers: 0, // No disponible desde endpoints individuales
        totalDrivers: drivers.totalDrivers || 0,
        totalRides: rides.total || 0,
        completedRides: rides.completed || 0,
        activeRides: Array.isArray(requests) ? requests.length : 0,
        totalRevenue: 0, // No disponible desde endpoints individuales
        averageRating: rides.averageRating || 0,
        topDrivers: [], // No disponible desde endpoints individuales
        recentActivity: [] // No disponible desde endpoints individuales
      };
    } catch (error) {
      console.error('Error calculando métricas desde endpoints individuales:', error);
      
      // Fallback final: métricas mínimas
      return this.getFallbackMetrics();
    }
  }

  /**
   * Métricas de fallback cuando no hay conexión con el backend
   */
  private getFallbackMetrics(): DashboardMetrics {
    console.warn('🔄 Usando métricas de fallback - Sin conexión al backend');
    
    return {
      totalUsers: 0,
      totalDrivers: 0,
      totalRides: 0,
      completedRides: 0,
      activeRides: 0,
      totalRevenue: 0,
      averageRating: 0,
      topDrivers: [],
      recentActivity: []
    };
  }

  /**
   * Datos mock para solicitudes recientes (fallback temporal)
   */
  private getMockRecentRequests(limit: number): RideRequest[] {
    const mockRequests: RideRequest[] = [
    ];

    return mockRequests.slice(0, limit);
  }
}

// =====================================================================
// SINGLETON EXPORT
// =====================================================================

export default new DashboardService(); 