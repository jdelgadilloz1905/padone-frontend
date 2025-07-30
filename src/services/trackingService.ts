// Interfaces para el tracking público
export interface TrackingResponse {
  success: boolean;
  ride: {
    id: number;
    tracking_code: string;
    origin: string;
    destination: string;
    origin_coordinates: {
      type: string;
      coordinates: [number, number]; // [lng, lat]
    };
    destination_coordinates: {
      type: string;
      coordinates: [number, number]; // [lng, lat]
    };
    status: string;
    price: string;
    distance: string;
    duration: number;
    request_date: string;
    start_date?: string;
    end_date?: string;
    client: {
      id: number;
      first_name: string;
      last_name?: string;
      phone_number: string;
    };
    driver?: {
      id: number;
      first_name: string;
      last_name: string;
      phone_number: string;
      license_plate: string;
      profile_image?: string;
      current_location?: {
        type: string;
        coordinates: [number, number]; // [lng, lat]
      };
    };
  };
}

class TrackingService {
  // Obtener información de la carrera usando tracking code (público)
  async getTrackingInfo(trackingCode: string): Promise<TrackingResponse> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    
    try {
      // Este endpoint es público, no requiere autenticación
      const response = await fetch(`${API_URL}/drivers/track/${trackingCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Código de seguimiento no encontrado');
        }
        throw new Error('Failed to get tracking information');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // Si es un error de red o conexión
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }
      
      // Propagar otros errores
      throw error;
    }
  }
}

export default new TrackingService(); 