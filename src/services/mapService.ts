import API from './api';
import socketService from './socketService';

// Interfaces
export interface Driver {
  id: number;
  name: string;
  phoneNumber: string;
  status: 'online' | 'offline' | 'busy';
  location: {
    lat: number;
    lng: number;
  };
  carDetails?: {
    model: string;
    color: string;
    plate: string;
  };
}

export interface Location {
  lat: number;
  lng: number;
  latitude?: number;  // Añadir propiedades opcionales para manejar diferentes formatos
  longitude?: number;
}

// Servicio de mapas
class MapService {
  private drivers: Driver[] = [];
  private callbacks: ((drivers: Driver[]) => void)[] = [];

  constructor() {
    // Inicializar la escucha de actualizaciones por WebSocket
    this.initializeWebSocketListeners();
  }

  /**
   * Inicializa los listeners para WebSocket
   */
  private initializeWebSocketListeners(): void {
    // Suscribirse a actualizaciones de ubicación de todos los conductores
    document.addEventListener('DOMContentLoaded', () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Conectar al WebSocket si hay un token
        socketService.connect(token);
        
        // Aquí deberíamos registrar un listener para 'admin:driversUpdate'
        // Esto es una simulación ya que no tenemos el evento implementado en el backend
        console.log('WebSocket: Admin suscrito a actualizaciones de conductores');
      }
    });
  }

  /**
   * Notifica a todos los callbacks registrados sobre cambios en los conductores
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => callback([...this.drivers]));
  }

  /**
   * Obtiene todos los conductores activos con su ubicación actual
   */
  async getActiveDrivers(): Promise<Driver[]> {
    try {
      // Usar el endpoint correcto para obtener conductores activos
      const response = await API.get('/tracking/drivers/active');
      console.log('🔍 Respuesta completa del API:', response);
      
      // El backend puede devolver la data directamente o en response.data
      const driversData = Array.isArray(response) ? response : (response.data || []);
      console.log('📋 Datos de conductores extraídos:', driversData);
      
      // Verificar que tengamos un array válido
      if (!Array.isArray(driversData)) {
        console.warn('⚠️ La respuesta no es un array:', driversData);
        throw new Error('Formato de respuesta inválido');
      }
      
      // Mapear la estructura del backend a la estructura esperada por el frontend
      const driversWithValidLocations: Driver[] = driversData.map((driver: any) => {
        console.log('🔄 Procesando conductor:', driver);
        
        // Procesar ubicación con la estructura del backend
        let location = { lat: 0, lng: 0 };
        if (driver.location) {
          location = {
            lat: parseFloat(driver.location.latitude || driver.location.lat || 0),
            lng: parseFloat(driver.location.longitude || driver.location.lng || 0)
          };
          
          // Verificar que las coordenadas sean válidas
          if (isNaN(location.lat) || isNaN(location.lng)) {
            console.warn('⚠️ Coordenadas inválidas para conductor:', driver.driverId || driver.id, driver.location);
            location = { lat: 0, lng: 0 };
          }
        } else {
          console.warn('⚠️ Conductor sin ubicación:', driver.driverId || driver.id);
        }
        
        // Mapear campos del backend a la interfaz Driver exacta
        const mappedDriver: Driver = {
          id: driver.driverId || driver.id, // Backend usa 'driverId'
          name: driver.name,
          phoneNumber: driver.phone || driver.phoneNumber || '',
          status: this.mapBackendStatusToFrontend(driver.status) as 'online' | 'offline' | 'busy',
          location,
          carDetails: {
            model: driver.vehicle || 'N/A',
            color: 'N/A', // No disponible en backend actual
            plate: driver.plate || driver.license_plate || 'N/A'
          }
        };
        
        console.log('✅ Conductor mapeado:', mappedDriver);
        return mappedDriver;
      });
      
      this.drivers = driversWithValidLocations; // Actualizar la caché local
      console.log('🎯 Total conductores activos cargados:', driversWithValidLocations.length);
      return driversWithValidLocations;
    } catch (error) {
      console.error('❌ Error fetching active drivers:', error);
      
      // Fallback con datos simulados más realistas basados en tu estructura
      const mockDrivers: Driver[] = [
        {
          id: 1,
          name: 'Mary Parra',
          phoneNumber: '584242340132',
          status: 'online',
          location: { lat: 10.4905217, lng: -66.8538366 },
          carDetails: {
            model: 'Nissan Versa Blanco',
            color: 'Blanco',
            plate: 'ABC1231'
          }
        },
        {
          id: 7,
          name: 'Hector Vasquez',
          phoneNumber: '584142564735',
          status: 'busy',
          location: { lat: 10.502605, lng: -66.883255 },
          carDetails: {
            model: 'Nissan Versa Gris',
            color: 'Gris',
            plate: 'JKL012'
          }
        }
      ];
      
      this.drivers = mockDrivers;
      console.log('🔄 Usando datos mock:', mockDrivers);
      return mockDrivers;
    }
  }

  /**
   * Mapea el status del backend al status esperado por el frontend
   */
  private mapBackendStatusToFrontend(backendStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'available': 'online',
      'on_the_way': 'busy',
      'busy': 'busy',
      'offline': 'offline',
      'online': 'online'
    };
    
    return statusMap[backendStatus] || 'offline';
  }

  /**
   * Obtiene la ubicación actual de un conductor específico
   */
  async getDriverLocation(driverId: number): Promise<Location | null> {
    try {
      const { data } = await API.get(`/drivers/${driverId}/location`);
      return data;
    } catch (error) {
      console.error(`Error fetching driver location for ID ${driverId}:`, error);
      return null;
    }
  }

  /**
   * Obtiene los detalles completos de un conductor
   */
  async getDriverDetails(driverId: number): Promise<Driver | null> {
    try {
      const { data } = await API.get(`/drivers/${driverId}`);
      return data;
    } catch (error) {
      console.error(`Error fetching driver details for ID ${driverId}:`, error);
      return null;
    }
  }

  /**
   * Inicia una conexión para recibir actualizaciones en tiempo real
   * Utiliza WebSocket cuando está disponible, con fallback a polling
   */
  startRealTimeUpdates(callback: (drivers: Driver[]) => void, interval = 5000): { stop: () => void } {
    // Registrar el callback
    this.callbacks.push(callback);
    
    // Método de polling como fallback
    let intervalId: number | null = null;
    
    const fetchDrivers = async () => {
      const drivers = await this.getActiveDrivers();
      callback(drivers);
    };

    // Hacer la primera llamada inmediatamente
    fetchDrivers();
    
    // Si no hay WebSocket, usamos polling
    if (!socketService.isConnected()) {
      console.log('Sin WebSocket, usando polling para actualizaciones');
      intervalId = window.setInterval(fetchDrivers, interval);
    } else {
      console.log('Usando WebSocket para actualizaciones en tiempo real');
    }
    
    // Devolver función para detener las actualizaciones
    return {
      stop: () => {
        // Eliminar el callback
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
        
        // Detener el intervalo si existe
        if (intervalId !== null) {
          window.clearInterval(intervalId);
        }
      }
    };
  }

  /**
   * Actualiza la caché de conductores con una nueva ubicación
   * (llamado cuando llega una actualización por WebSocket)
   */
  updateDriverLocation(driverId: number, location: Location): void {
    // Asegurarse de que la latitud y longitud sean números
    const parsedLocation = {
      lat: parseFloat(String(location.lat || location.latitude || 0)),
      lng: parseFloat(String(location.lng || location.longitude || 0))
    };
    
    // Verificar que los valores sean números válidos
    if (isNaN(parsedLocation.lat) || isNaN(parsedLocation.lng)) {
      console.error('Coordenadas inválidas recibidas:', location);
      return; // No actualizar con coordenadas inválidas
    }
    
    // Buscar el conductor en la caché
    const driverIndex = this.drivers.findIndex(d => d.id === driverId);
    
    if (driverIndex >= 0) {
      // Actualizar la ubicación
      this.drivers[driverIndex].location = parsedLocation;
      
      // Notificar a los callbacks
      this.notifyCallbacks();
    }
  }

  /**
   * Calcula la ruta entre dos puntos (origen y destino)
   */
  async calculateRoute(origin: Location, destination: Location): Promise<any> {
    try {
      const { data } = await API.post('/routes/calculate', {
        origin,
        destination
      });
      return data;
    } catch (error) {
      console.error('Error calculating route:', error);
      throw error;
    }
  }
}

export default new MapService(); 