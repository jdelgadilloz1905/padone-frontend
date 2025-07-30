import api from './api';

// Tipos para el servicio de clientes
export interface Client {
  id: number;
  first_name: string;
  last_name: string | null;
  phone_number: string;
  email?: string;
  address?: string;
  notes?: string;
  registration_date: string;
  active: boolean;
  total_rides: number;
  last_ride_date?: string;
  created_at?: string;
  updated_at?: string;
  is_vip?: boolean;
  vip_rate_type?: 'flat_rate' | 'minute_rate' | null;
  flat_rate?: string;
  minute_rate?: string;
}

// DTO para crear nuevo cliente
export interface CreateClientDto {
  first_name: string;
  last_name?: string;
  phone_number: string;
  email?: string;
  address?: string;
  notes?: string;
  is_vip?: boolean;
  vip_rate_type?: 'flat_rate' | 'minute_rate' | null;
  flat_rate?: string | number;
  minute_rate?: string | number;
  active?: boolean;
}

// DTO para actualizar cliente
export interface UpdateClientDto {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  notes?: string;
  active?: boolean;
  is_vip?: boolean;
  vip_rate_type?: 'flat_rate' | 'minute_rate' | null;
  flat_rate?: string | number;
  minute_rate?: string | number;
}

export interface ClientFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  active?: boolean;
  limit?: number;
}

// Estructura real del API
export interface ApiResponse {
  data: Client[];
  meta: {
    currentPage: string;
    itemsPerPage: string;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  queryInfo: {
    filters: Record<string, any>;
  };
}

// Estructura que usamos internamente
export interface ClientsResponse {
  clients: Client[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ClientStats {
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
  new_clients_this_month: number;
  total_rides_all_clients: number;
}

// Interfaces para historial de rides
export interface RideDriver {
  id: number;
  first_name: string;
  last_name: string;
  license_plate: string;
}

export interface ClientRide {
  id: number;
  origin: string;
  destination: string;
  origin_coordinates: string;
  destination_coordinates: string;
  status: string;
  price: number;
  duration: number;
  distance: number;
  request_date: string;
  start_date: string;
  end_date: string;
  payment_method: string;
  client_rating: number | null;
  driver_rating: number | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  tracking_code: string;
  driver: RideDriver;
}

export interface ClientRidesResponse {
  client: {
    id: number;
    first_name: string;
    last_name: string | null;
    phone_number: string;
  };
  rides: ClientRide[];
  total_rides: number;
  total_spent: number;
}

class ClientService {
  // Obtener lista de clientes con filtros
  async getClients(filters: ClientFilters = {}): Promise<ClientsResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      // Convertir status a active para el API
      if (filters.status && filters.status !== 'all') {
        params.append('active', filters.status === 'active' ? 'true' : 'false');
      }
      if (filters.active) params.append('active', filters.active.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const url = `/clients?${params.toString()}`;
      console.log('Llamando a API:', url);
      
      const { data: response} = await api.get(url);
      console.log('Respuesta completa del API:', response);
      
      const apiData: ApiResponse = response;
      console.log('Datos del API:', apiData);
      
      // Transformar la respuesta del API a nuestro formato interno
      const result = {
        clients: apiData.data,
        total: apiData.meta.totalItems,
        page: parseInt(apiData.meta.currentPage),
        totalPages: apiData.meta.totalPages
      };
      
      console.log('Resultado transformado:', result);
      return result;
    } catch (error) {
      console.error('Error en getClients:', error);
      throw error;
    }
  }

  // Obtener cliente por ID
  async getClient(id: number): Promise<Client> {
    const { data: response} = await api.get(`/clients/${id}`);
    return response.data;
  }

  // Obtener estadísticas de clientes
  async getClientStats(): Promise<ClientStats> {
    const { data: response} = await api.get('/clients/stats');
    return response.data;
  }

  // Buscar clientes
  async searchClients(searchTerm: string): Promise<Client[]> {
    const { data: response} = await api.get(`/clients/search?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  }

  // Crear nuevo cliente (nuevo método alineado a conductores)
  async crearCliente(cliente: CreateClientDto): Promise<Client> {
    console.log('Creando cliente:', cliente);
    const { data } = await api.post('/clients/admin', cliente);
    return data;
  }

  // Actualizar cliente existente
  async updateClient(id: number, clientData: UpdateClientDto): Promise<Client> {
    try {
      console.log('Actualizando cliente:', id, clientData);
      const { data: response } = await api.put(`/clients/${id}`, clientData);
      console.log('Cliente actualizado:', response);
      return response.data || response;
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  }

  // Eliminar cliente
  async deleteClient(id: number): Promise<void> {
    try {
      console.log('Eliminando cliente:', id);
      await api.delete(`/clients/${id}`);
      console.log('Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  }

  // Cambiar estado del cliente (activo/inactivo)
  async toggleClientStatus(id: number): Promise<any> {
    try {
      console.log('Toggling estado del cliente:', id);
      const response = await api.patch(`/clients/${id}/toggle-active`);
      console.log('Estado del cliente actualizado:', response.data);
      return response.data.client || response.data;
    } catch (error) {
      console.error('Error al cambiar estado del cliente:', error);
      throw error;
    }
  }

  // Exportar clientes
  async exportClients(filters: ClientFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') {
      params.append('active', filters.status === 'active' ? 'true' : 'false');
    }

    const queryString = params.toString();
    const url = queryString ? `/clients/export?${queryString}` : '/clients/export';

    const response = await api.get(url, {
      responseType: 'blob'
    });
    
    // Cuando responseType es 'blob', axios devuelve el blob directamente en response.data
    return response.data;
  }

  // Obtener historial de rides de un cliente
  async getClientRides(id: number): Promise<ClientRidesResponse> {
    try {
      console.log('Obteniendo historial de rides del cliente:', id);
      const { data: response } = await api.get(`/clients/${id}/rides`);
      console.log('Historial de rides obtenido:', response);
      return response;
    } catch (error) {
      console.error('Error al obtener historial de rides:', error);
      throw error;
    }
  }
}

export default new ClientService(); 