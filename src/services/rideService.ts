import api from './api';

// Interfaces para tipado
export interface Ride {
  id: string;
  user_id: string;
  driver_id?: string;
  pickup_location: string;
  destination: string;
  pickup_latitude: number;
  pickup_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  estimated_distance: number;
  estimated_duration: number;
  estimated_cost: number;
  actual_cost?: number;
  commission_percentage: number;
  commission_amount?: number;
  status: 'pending' | 'in_progress' | 'on_the_way' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  rating?: number;
  review?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  user?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    vehicle_plate: string;
  };
}

export interface RideFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  user_phone?: string;
  driver_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface RideStatistics {
  total_rides: number;
  pending_rides: number;
  active_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  total_revenue: number;
  total_commission: number;
  average_rating: number;
}

export interface PaginatedRides {
  rides: Ride[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type Driver = {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle_plate: string;
  is_active: boolean;
  streetName: string;
  latitude?: number;
  longitude?: number;
};

// Interfaz para la respuesta de la API
export interface DriverApiResponse {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  profile_picture: string;
  vehicle: string;
  model: string;
  color: string;
  year: number;
  license_plate: string;
  driver_license: string;
  id_document: string;
  status: string;
  current_location: {
    type: string;
    coordinates: [number, number];
  };
  last_update: string;
  registration_date: string;
  average_rating: string;
  active: boolean;
  session_token: string;
  verified: boolean;
  otp_code: string | null;
  otp_expiry: string | null;
  street_name: string;
}

// Interfaz para la respuesta paginada de la API
export interface DriversApiResponse {
  data: DriverApiResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interfaces para la respuesta de rides de la API
export interface ClientApiResponse {
  id: number;
  first_name: string;
  last_name: string | null;
  phone_number: string;
  email: string;
  usual_address: string | null;
  address_reference: string | null;
  registration_date: string;
  active: boolean;
  notes: string | null;
}

export interface RideApiResponse {
  id: number;
  client_id: number;
  driver_id: number | null;
  pickup_location?: string;
  destination?: string;
  origin?: string; // Nuevo campo del backend
  pickup_latitude?: number;
  pickup_longitude?: number;
  destination_latitude?: number;
  destination_longitude?: number;
  // 🆕 NUEVO: Coordenadas GeoJSON del backend
  origin_coordinates?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude] en formato GeoJSON
  };
  destination_coordinates?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude] en formato GeoJSON
  };
  estimated_distance?: number;
  estimated_duration?: number;
  estimated_cost?: number;
  actual_cost?: number;
  commission_percentage?: number;
  commission_amount?: number;
  status: string;
  start_date?: string;
  end_date?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  rating?: number;
  review?: string;
  created_at: string;
  updated_at: string;
  client: ClientApiResponse;
  driver: DriverApiResponse | null;
  price?: string;
  payment_method?: string;
  tracking_code?: string;
  distance?: string;
  duration?: number;
}

export interface RidesApiResponse {
  data: RideApiResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class RideService {
  // Listar todas las carreras con filtros y paginación
  async getRides(filters: RideFilters = {}): Promise<PaginatedRides> {
    try {
      const params = new URLSearchParams();
      
      // Agregar filtros como parámetros de consulta
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      console.log('🔌 Intentando conectar con el backend en /rides con filtros:', params.toString());
      
      const {data:response}: any = await api.get(`/rides?${params.toString()}`);
      console.log('📥 Respuesta de API /rides (ya procesada por interceptor):', response);
      
      // Como el interceptor ya devuelve response.data, 'response' aquí son los datos directamente
      const apiResponse = response as RidesApiResponse;
      
      if (apiResponse.data && Array.isArray(apiResponse.data)) {
        console.log('✅ Procesando respuesta con estructura {data: []}');
        const mappedRides = apiResponse.data.map(ride => this.mapApiRideToRide(ride));
        console.log('🚗 Rides mapeados:', mappedRides);
        
        return {
          rides: mappedRides,
          total: apiResponse.total,
          page: apiResponse.page,
          limit: apiResponse.limit || 10,
          totalPages: apiResponse.totalPages || Math.ceil(apiResponse.total / (apiResponse.limit || 10))
        };
      }
      
      // Si no tiene la estructura esperada, intentar procesar como PaginatedRides directo
      if (response.rides && Array.isArray(response.rides)) {
        console.log('✅ Procesando respuesta con estructura PaginatedRides');
        console.log('🚗 Rides recibidos:', response.rides);
        
        // Mapear los rides de la estructura PaginatedRides
        const mappedRides = response.rides.map((ride: any) => {
          console.log('🔄 Mapeando ride individual:', ride);
          
          // Si el ride ya tiene la estructura de la API, mapearlo
          if (ride.client) {
            return this.mapApiRideToRide(ride as RideApiResponse);
          }
          
          // Si ya está en formato Ride, devolverlo tal como está
          return ride as Ride;
        });
        
        console.log('🚗 Rides mapeados desde PaginatedRides:', mappedRides);
        
        return {
          rides: mappedRides,
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages
        };
      }
      
      console.warn('⚠️ Respuesta de API no tiene formato esperado:', response);
      return {
        rides: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
      };
    } catch (error: any) {
      console.error('❌ Error conectando con el backend:', error);
      
      // Solo usar mock data si específicamente no se puede conectar al servidor
      if (error?.code === 'ECONNREFUSED' || error?.message?.includes('Network Error') || error?.message?.includes('fetch')) {
        console.warn('🔄 Usando datos mock debido a error de conexión');
        return this.getMockRides(filters);
      }
      
      // Para otros errores, propagar el error
      throw error;
    }
  }

  // Obtener una carrera específica
  async getRide(id: string): Promise<Ride> {
    const response: any = await api.get(`/rides/${id}`);
    return response;
  }

  // Actualizar cualquier campo de una carrera
  async updateRide(id: string, data: Partial<Ride>): Promise<Ride> {
    const response: any = await api.put(`/rides/${id}`, data);
    return response;
  }

  // Eliminar carrera
  async deleteRide(id: string): Promise<void> {
    await api.delete(`/rides/${id}`);
  }

  // Cambiar estado de la carrera
  async updateRideStatus(id: string, status: Ride['status'], reason?: string): Promise<Ride> {
    const data: { status: string; cancellation_reason?: string } = { status };
    if (reason) {
      data.cancellation_reason = reason;
    }
    
    const response: any = await api.patch(`/rides/${id}/status`, data);
    return response;
  }

  // Obtener carrera activa del conductor (en progreso o en vía)
  async getActiveRide(): Promise<Ride | null> {
    try {
      const {data: response}: any = await api.get('/drivers/current-ride');
      console.log('📥 Respuesta de carrera activa:', response);
      
      if (response && response.hasActiveRide && response.ride && response.ride.id) {
        // Mapear la respuesta simplificada a nuestro formato Ride
        const rideData = response.ride;
        
        // Extraer coordenadas de GeoJSON
        const originCoords = rideData.origin_coordinates?.coordinates || [0, 0];
        const destinationCoords = rideData.destination_coordinates?.coordinates || [0, 0];
        
        const mappedRide: Ride = {
          id: rideData.id.toString(),
          user_id: rideData.client?.id?.toString() || 'unknown',
          pickup_location: rideData.origin,
          destination: rideData.destination,
          pickup_latitude: originCoords[1], // GeoJSON format is [lng, lat]
          pickup_longitude: originCoords[0],
          destination_latitude: destinationCoords[1],
          destination_longitude: destinationCoords[0],
          estimated_distance: parseFloat(rideData.distance) || 0,
          estimated_duration: rideData.duration || 0,
          estimated_cost: parseFloat(rideData.price) || 0,
          commission_percentage: 20, // Valor por defecto
          status: this.mapApiStatusToRideStatus(rideData.status),
          created_at: rideData.request_date,
          updated_at: rideData.request_date,
          user: {
            id: rideData.client?.id?.toString() || 'unknown',
            name: rideData.client ? `${rideData.client.first_name} ${rideData.client.last_name || ''}`.trim() : 'Cliente',
            phone: rideData.client?.phone_number || '',
            email: ''
          }
        };
        
        console.log('✅ Carrera activa mapeada:', mappedRide);
        return mappedRide;
      }
      
      console.log('ℹ️ No hay carrera activa');
      return null;
    } catch (error: any) {
      // Si no hay carrera activa, el backend puede devolver 404
      if (error.status === 404 || error.response?.status === 404) {
        console.log('ℹ️ No hay carrera activa (404)');
        return null;
      }
      console.error('❌ Error obteniendo carrera activa:', error);
      throw error;
    }
  }

  // Cambiar estado a "en vía" (conductor va hacia el cliente)
  async startTrip(_rideId: string): Promise<Ride> {
    const response: any = await api.post(`/drivers/start-trip`);
    return this.mapApiRideToRide(response as RideApiResponse);
  }

  // Cambiar estado a "completado" (finalizar carrera)
  async completeTrip(_rideId: string, actualCost?: number): Promise<Ride> {
    const data: { actual_cost?: number } = {};
    if (actualCost) {
      data.actual_cost = actualCost;
    }
    
    const response: any = await api.post(`/drivers/complete-trip`, data);
    return this.mapApiRideToRide(response as RideApiResponse);
  }

  // Asignar conductor específico
  async assignDriver(rideId: string, driverId: string): Promise<Ride> {
    try {
      console.log(`🔌 Asignando conductor ${driverId} a ride ${rideId}`);
      const response: any = await api.patch(`/rides/${rideId}/assign-driver`, {
        driver_id: driverId
      });
      console.log('📥 Respuesta de asignación (ya procesada por interceptor):', response);
      
      // Si la respuesta es un objeto ride de la API, mapearlo
      if (response && response.id) {
        return this.mapApiRideToRide(response as RideApiResponse);
      }
      
      // Si es un objeto Ride ya formateado, devolverlo directamente
      return response as Ride;
    } catch (error) {
      console.error('❌ Error asignando conductor:', error);
      throw error;
    }
  }

  // Obtener estadísticas del sistema
  async getStatistics(): Promise<RideStatistics> {
    const response: any = await api.get('/rides/admin/statistics');
    return response;
  }

  // Obtener conductores disponibles (asumiendo que existe este endpoint)
  async getAvailableDrivers(): Promise<Driver[]> {
    try {
      console.log('🔌 Solicitando conductores activos...');
      const {data: response}: any = await api.get('/drivers/active');
      console.log('📥 Respuesta de API /drivers/active (ya procesada por interceptor):', response);
      
      // Como el interceptor ya devuelve response.data, 'response' aquí son los datos directamente
      const apiResponse = response as DriversApiResponse;
      
      if (apiResponse.data && Array.isArray(apiResponse.data)) {
        console.log('✅ Procesando respuesta con estructura {data: []}');
        const mappedDrivers = apiResponse.data.map(driver => this.mapApiDriverToDriver(driver));
        console.log('🚗 Conductores mapeados:', mappedDrivers);
        return mappedDrivers;
      }
      
      // Si no tiene la estructura esperada, intentar procesar como array directo
      if (Array.isArray(response)) {
        console.log('✅ Procesando respuesta como array directo');
        return response.map(driver => this.mapApiDriverToDriver(driver));
      }
      
      console.warn('⚠️ Respuesta de API no tiene formato esperado');
      return [];
    } catch (error) {
      // Fallback con datos mock si el endpoint no existe
      console.warn('Endpoint /drivers/active no disponible, usando datos mock:', error);
      return this.getMockDrivers();
    }
  }

  // Obtener todos los conductores
  async getDrivers(): Promise<Driver[]> {
    try {
      const response: any = await api.get('/drivers');
      
      // Como el interceptor ya devuelve response.data, 'response' aquí son los datos directamente
      const apiResponse = response as DriversApiResponse;
      
      if (apiResponse.data && Array.isArray(apiResponse.data)) {
        return apiResponse.data.map(driver => this.mapApiDriverToDriver(driver));
      }
      
      // Si no tiene la estructura esperada, intentar procesar como array directo
      if (Array.isArray(response)) {
        return response.map(driver => this.mapApiDriverToDriver(driver));
      }
      
      return [];
    } catch (error) {
      // Fallback con datos mock si el endpoint no existe
      console.warn('Endpoint /drivers no disponible, usando datos mock');
      return this.getMockDrivers();
    }
  }

  // Datos mock para conductores (mientras se implementa el endpoint)
  private getMockDrivers(): Driver[] {
    return [
    ];
  }

  // Función helper para mapear estados del backend a display names
  getStatusDisplayName(status: Ride['status']): string {
    const statusMap: Record<Ride['status'], string> = {
      'pending': 'Pendiente',
      'in_progress': 'En Progreso',
      'on_the_way': 'En Vía',
      'completed': 'Completado',
      'cancelled': 'Cancelado'
    };
    
    return statusMap[status] || status;
  }

  // Función helper para obtener el color del estado
  getStatusColor(status: Ride['status']): string {
    const colorMap: Record<Ride['status'], string> = {
      'pending': '#F39C13',
      'in_progress': '#FF9800',
      'on_the_way': '#FF9800',
      'completed': '#4CAF50',
      'cancelled': '#F44336'
    };
    
    return colorMap[status] || '#95888B';
  }

  // Función helper para determinar si una carrera puede ser editada
  canEditRide(status: Ride['status']): boolean {
    return ['pending', 'accepted'].includes(status);
  }

  // Función helper para determinar si se puede asignar conductor
  canAssignDriver(status: Ride['status']): boolean {
    return ['pending', 'accepted'].includes(status);
  }

  // Datos mock para rides (cuando no hay conexión al backend)
  private getMockRides(filters: RideFilters = {}): PaginatedRides {
    const mockRides: Ride[] = [
      {
        id: '1',
        user_id: '1',
        pickup_location: 'Centro Comercial Sambil, Caracas',
        destination: 'Aeropuerto Internacional Simón Bolívar',
        pickup_latitude: 10.4922,
        pickup_longitude: -66.8434,
        destination_latitude: 10.6013,
        destination_longitude: -67.0061,
        estimated_distance: 28.5,
        estimated_duration: 45,
        estimated_cost: 25.00,
        commission_percentage: 20,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: '1',
          name: 'Carla Sánchez',
          phone: '+58414123456',
          email: 'carla@example.com'
        }
      },
      {
        id: '2',
        user_id: '2',
        driver_id: '1',
        pickup_location: 'Plaza Venezuela, Caracas',
        destination: 'Centro Ciudad Comercial Tamanaco',
        pickup_latitude: 10.5049,
        pickup_longitude: -66.8532,
        destination_latitude: 10.4964,
        destination_longitude: -66.8597,
        estimated_distance: 8.2,
        estimated_duration: 20,
        estimated_cost: 12.00,
        actual_cost: 12.00,
        commission_percentage: 20,
        commission_amount: 2.40,
        status: 'in_progress',
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: '2',
          name: 'María González',
          phone: '+58424987654',
          email: 'maria@example.com'
        },
        driver: {
          id: '1',
          name: 'Carlos Sánchez',
          phone: '+58414123456',
          email: 'carlos@example.com',
          vehicle_plate: 'ABC123'
        }
      },
      {
        id: '3',
        user_id: '3',
        driver_id: '2',
        pickup_location: 'Altamira, Caracas',
        destination: 'La Candelaria, Caracas',
        pickup_latitude: 10.4973,
        pickup_longitude: -66.8528,
        destination_latitude: 10.4386,
        destination_longitude: -66.9065,
        estimated_distance: 15.3,
        estimated_duration: 35,
        estimated_cost: 18.00,
        actual_cost: 18.00,
        commission_percentage: 20,
        commission_amount: 3.60,
        status: 'completed',
        start_date: new Date(Date.now() - 3600000).toISOString(),
        end_date: new Date().toISOString(),
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date().toISOString(),
        rating: 5,
        user: {
          id: '3',
          name: 'Francisca Sánchez',
          phone: '+58412345678',
          email: 'francisca@example.com'
        },
        driver: {
          id: '2',
          name: 'María González',
          phone: '+58424123456',
          email: 'maria@example.com',
          vehicle_plate: 'DEF456'
        }
      }
    ];

    // Aplicar filtros básicos
    let filteredRides = mockRides;
    
    if (filters.status) {
      const statuses = filters.status.split(',');
      filteredRides = filteredRides.filter(ride => statuses.includes(ride.status));
    }
    
    if (filters.user_phone) {
      filteredRides = filteredRides.filter(ride => 
        ride.user?.phone.includes(filters.user_phone!)
      );
    }

    // Paginación mock
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRides = filteredRides.slice(startIndex, endIndex);

    return {
      rides: paginatedRides,
      total: filteredRides.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(filteredRides.length / limit)
    };
  }

  // Función privada para mapear datos de la API al formato Driver
  private mapApiDriverToDriver(apiDriver: DriverApiResponse): Driver {
    console.log('🔄 Mapeando conductor de API:', apiDriver);
    
    const mappedDriver: Driver = {
      id: apiDriver.id.toString(),
      name: `${apiDriver.first_name} ${apiDriver.last_name}`,
      phone: apiDriver.phone_number,
      email: apiDriver.email,
      vehicle_plate: apiDriver.license_plate,
      is_active: apiDriver.active && apiDriver.status === 'active',
      latitude: apiDriver.current_location?.coordinates?.[1],
      longitude: apiDriver.current_location?.coordinates?.[0],
      streetName: apiDriver.street_name || ''
    };
    
    console.log('✅ Conductor mapeado:', mappedDriver);
    return mappedDriver;
  }

  // Función privada para mapear datos de cliente de la API al formato esperado
  private mapApiClientToUser(apiClient: ClientApiResponse) {
    const fullName = apiClient.last_name 
      ? `${apiClient.first_name} ${apiClient.last_name}`
      : apiClient.first_name;
    
    const mappedUser = {
      id: apiClient.id.toString(),
      name: fullName,
      phone: apiClient.phone_number,
      email: apiClient.email
    };
    
    return mappedUser;
  }

  // Función privada para mapear rides de la API al formato esperado
  private mapApiRideToRide(apiRide: RideApiResponse): Ride {
    // Procesar precio - puede venir como price (string) o estimated_cost (number)
    const estimatedCost = apiRide.price ? parseFloat(apiRide.price) : (apiRide.estimated_cost || 0);
    
    // 🆕 NUEVO: Extraer coordenadas del formato GeoJSON si no hay coordenadas directas
    let pickupLat = apiRide.pickup_latitude || 0;
    let pickupLng = apiRide.pickup_longitude || 0;
    let destLat = apiRide.destination_latitude || 0;
    let destLng = apiRide.destination_longitude || 0;

    // Si no hay coordenadas directas, extraer del GeoJSON
    if (pickupLat === 0 && pickupLng === 0 && apiRide.origin_coordinates?.coordinates) {
      const coords = apiRide.origin_coordinates.coordinates;
      if (coords.length >= 2) {
        pickupLng = coords[0]; // longitude
        pickupLat = coords[1]; // latitude
      }
    }

    if (destLat === 0 && destLng === 0 && apiRide.destination_coordinates?.coordinates) {
      const coords = apiRide.destination_coordinates.coordinates;
      if (coords.length >= 2) {
        destLng = coords[0]; // longitude
        destLat = coords[1]; // latitude
      }
    }
    
    const mappedRide: Ride = {
      id: apiRide.id.toString(),
      user_id: apiRide.client_id.toString(),
      driver_id: apiRide.driver_id?.toString(),
      pickup_location: apiRide.origin || apiRide.pickup_location || '',
      destination: apiRide.destination || '',
      pickup_latitude: pickupLat,
      pickup_longitude: pickupLng,
      destination_latitude: destLat,
      destination_longitude: destLng,
      estimated_distance: apiRide.estimated_distance || (apiRide.distance ? parseFloat(apiRide.distance) : 0),
      estimated_duration: apiRide.estimated_duration || apiRide.duration || 0,
      estimated_cost: estimatedCost,
      actual_cost: apiRide.actual_cost,
      commission_percentage: apiRide.commission_percentage || 0,
      commission_amount: apiRide.commission_amount,
      status: this.mapApiStatusToRideStatus(apiRide.status),
      start_date: apiRide.start_date,
      end_date: apiRide.end_date,
      cancelled_at: apiRide.cancelled_at,
      cancellation_reason: apiRide.cancellation_reason,
      rating: apiRide.rating,
      review: apiRide.review,
      created_at: apiRide.created_at,
      updated_at: apiRide.updated_at,
      user: this.mapApiClientToUser(apiRide.client),
      driver: apiRide.driver ? {
        id: apiRide.driver.id.toString(),
        name: `${apiRide.driver.first_name} ${apiRide.driver.last_name}`,
        phone: apiRide.driver.phone_number,
        email: apiRide.driver.email,
        vehicle_plate: apiRide.driver.license_plate
      } : undefined
    };

    // 🆕 NUEVO: Agregar coordenadas GeoJSON al objeto mapeado para compatibilidad
    (mappedRide as any).origin_coordinates = apiRide.origin_coordinates;
    (mappedRide as any).destination_coordinates = apiRide.destination_coordinates;
    
    return mappedRide;
  }

  // Función privada para mapear estados de la API a estados del sistema
  private mapApiStatusToRideStatus(apiStatus: string): Ride['status'] {
    const statusMap: Record<string, Ride['status']> = {
      'pending': 'pending',
      'in_progress': 'in_progress',
      'on_the_way': 'on_the_way',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'active': 'in_progress',
      'finished': 'completed'
    };
    
    return statusMap[apiStatus] || 'pending';
  }
}

export default new RideService(); 