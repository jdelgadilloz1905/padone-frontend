import API from './api';

// Interfaces

export interface Zone {
  id?: number;
  name: string;
  description?: string;
  pricePerMinute: number;
  minimumFare: number;
  nightRatePercentage: number;
  weekendRatePercentage: number;
  commission_percentage: number;
  area: GeoJSON.Polygon; // Área geográfica en formato GeoJSON
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Interfaz para filtrar zonas
export interface ZoneFilter {
  active?: boolean;
  inactive?: boolean;
  name?: string;
  page?: number;
  limit?: number;
}

// Interfaz para la respuesta paginada de la API
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ZoneService {


  /**
   * Obtiene todas las zonas con paginación
   */
  async getZones(filters?: ZoneFilter): Promise<PaginatedResponse<Zone>> {
    try {
      const params = {
        ...filters,
        search: filters?.name || '',
        name: undefined
      };
      
      const response = await API.get('/zones', {
        params
      }) as {data: PaginatedResponse<any>};
      
      // Verificar si la respuesta tiene la estructura paginada
      if (response && response.data.data && Array.isArray(response.data.data)) {
        // Mapear los datos de la API al formato que espera la aplicación
        const mappedData = response.data.data.map((zone: any) => ({
          id: zone.id,
          name: zone.name,
          description: zone.description || '',
          pricePerMinute: parseFloat(zone.price_per_minute || 0),
          minimumFare: parseFloat(zone.minimum_fare || 0),
          nightRatePercentage: parseFloat(zone.night_rate_percentage || 0),
          weekendRatePercentage: parseFloat(zone.weekend_rate_percentage || 0),
          commission_percentage: parseFloat(zone.commission_percentage || 0),
          area: zone.area,
          active: zone.active,
          createdAt: zone.created_at,
          updatedAt: zone.updated_at
        }));

        return {
          data: mappedData,
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          totalPages: response.data.totalPages
        };
      }
      
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };
    } catch (error) {
      console.error('Error al obtener zonas:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las zonas sin paginación (útil para selectores)
   */
  async getAllZones(filters?: Omit<ZoneFilter, 'page' | 'limit'>): Promise<Zone[]> {
    try {
      const response = await this.getZones({ ...filters, limit: 1000 });
      return response.data;
    } catch (error) {
      console.error('Error al obtener todas las zonas:', error);
      throw error;
    }
  }

  /**
   * Obtiene una zona por su ID
   */
  async getZone(id: number): Promise<Zone> {
    try {
      const response = await API.get(`/zones/${id}`);
      
      // Mapear el dato recibido al formato esperado por la aplicación
      if (response) {
        return {
          id: response.id,
          name: response.name,
          description: response.description || '',
          pricePerMinute: parseFloat(response.price_per_minute || 0),
          minimumFare: parseFloat(response.minimum_fare || 0),
          nightRatePercentage: parseFloat(response.night_rate_percentage || 0),
          weekendRatePercentage: parseFloat(response.weekend_rate_percentage || 0),
          commission_percentage: parseFloat(response.commission_percentage || 0),
          area: response.area,
          active: response.active,
          createdAt: response.created_at,
          updatedAt: response.updated_at
        };
      }
      
      throw new Error('Failed to fetch zone');
    } catch (error) {
      console.error(`Error al obtener zona con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea una nueva zona
   */
  async createZone(zone: Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>): Promise<Zone> {
    try {
      // Convertir al formato esperado por la API
      const apiZone = {
        name: zone.name,
        description: zone.description,
        price_per_minute: zone.pricePerMinute.toString(),
        minimum_fare: zone.minimumFare.toString(),
        night_rate_percentage: zone.nightRatePercentage.toString(),
        weekend_rate_percentage: zone.weekendRatePercentage.toString(),
        commission_percentage: zone.commission_percentage.toString(),
        area: zone.area,
        active: zone.active
      };
      
      const {data: response} = await API.post('/zones', apiZone);
      return this.getZone(response.id);
    } catch (error) {
      console.error('Error al crear zona:', error);
      throw error;
    }
  }

  /**
   * Actualiza una zona existente
   */
  async updateZone(id: number, zone: Partial<Zone>): Promise<Zone> {
    try {
      // Convertir al formato esperado por la API
      const apiZone: any = {};
      
      if (zone.name !== undefined) apiZone.name = zone.name;
      if (zone.description !== undefined) apiZone.description = zone.description;
      if (zone.pricePerMinute !== undefined) apiZone.price_per_minute = zone.pricePerMinute.toString();
      if (zone.minimumFare !== undefined) apiZone.minimum_fare = zone.minimumFare.toString();
      if (zone.nightRatePercentage !== undefined) apiZone.night_rate_percentage = zone.nightRatePercentage.toString();
      if (zone.weekendRatePercentage !== undefined) apiZone.weekend_rate_percentage = zone.weekendRatePercentage.toString();
      if (zone.commission_percentage !== undefined) apiZone.commission_percentage = zone.commission_percentage.toString();
      if (zone.area !== undefined) apiZone.area = zone.area;
      if (zone.active !== undefined) apiZone.active = zone.active;
      
      await API.patch(`/zones/${id}`, apiZone);
      return this.getZone(id);
    } catch (error) {
      console.error(`Error al actualizar zona con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Desactiva una zona (no la elimina físicamente)
   */
  async deleteZone(id: number): Promise<void> {
    try {
      await API.delete(`/zones/${id}`);
    } catch (error) {
      console.error(`Error al desactivar zona con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Convierte un polígono dibujado en el mapa a formato GeoJSON
   */
  convertPolygonToGeoJSON(path: google.maps.LatLng[]): GeoJSON.Polygon {
    // Un polígono GeoJSON requiere un array de arrays (rings), donde el primer ring
    // representa el límite exterior y los siguientes (si los hay) son huecos
    const coordinates = path.map(point => [point.lng(), point.lat()]);
    
    // Cerrar el polígono (el primer y último punto deben ser idénticos)
    if (
      coordinates.length > 0 &&
      (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
      coordinates[0][1] !== coordinates[coordinates.length - 1][1])
    ) {
      coordinates.push([coordinates[0][0], coordinates[0][1]]);
    }
    
    return {
      type: 'Polygon',
      coordinates: [coordinates]
    };
  }

  /**
   * Convierte un GeoJSON a un arreglo de coordenadas para Google Maps
   */
  convertGeoJSONToPath(polygon: GeoJSON.Polygon): google.maps.LatLngLiteral[] {
    // Tomamos solo el anillo exterior (el primer array de coordenadas)
    if (!polygon.coordinates || !polygon.coordinates[0]) {
      return [];
    }
    
    // Convertir de [lng, lat] a {lat, lng}
    return polygon.coordinates[0].map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));
  }
}

export default new ZoneService(); 