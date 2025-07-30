import api from './api';
import axios from 'axios';

export interface Conductor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  vehicle: string;
  model: string;
  color: string;
  license_plate: string;
  year: number;
  status: 'active' | 'inactive' | 'pending' | 'available' | 'busy' | 'on_the_way' | 'offline';
  active: boolean;
  verified: boolean;
  current_location?: {
    type: string;
    coordinates: number[];
  };
  last_update?: string;
  driver_license: string;
  id_document: string;
  profile_picture?: string;
  profile_picture_url?: string | null;
  profile_picture_s3_key?: string | null;
  additional_photos?: any | null;
  photos_updated_at?: string | null;
  // URLs de documentos del vehículo
  vehicle_insurance_url?: string | null;
  vehicle_registration_url?: string | null;
  vehicle_photo_url?: string | null;
  driver_license_url?: string | null;
  average_rating?: string;
  registration_date: string;
  session_token?: string;
  otp_code?: string | null;
  otp_expiry?: string | null;
}

export interface ConductorLocation {
  lat: number;
  lng: number;
  timestamp?: number;
}

export interface UpdateDriverDocumentsDto {
  documentos: {
    licencia?: File;
    seguro?: File;
    identificacion?: File;
  };
}

export interface UpdateVehicleDocumentsDto {
  documentos: {
    vehicle_insurance?: File;
    vehicle_registration?: File;
    vehicle_photo?: File;
    driver_license?: File;
  };
}

export interface UpdateProfilePictureDto {
  foto: File;
}

export interface ReportIncidentDto {
  tipo: string;
  descripcion: string;
  ubicacion?: {
    lat: number;
    lng: number;
  };
  fecha?: string;
}

export interface GetConductoresParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  status?: string;
  search?: string;
  verified?: boolean;
  active?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const conductorService = {
  getdrivers: async (params: GetConductoresParams = {}): Promise<PaginatedResponse<Conductor>> => {
    const queryParams = new URLSearchParams();
    
    // Añadir parámetros a la URL si existen
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.verified !== undefined) queryParams.append('verified', params.verified.toString());
    if (params.active !== undefined) queryParams.append('active', params.active.toString());
    
    const url = `/drivers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('getdrivers: Llamando a API con URL:', url);
    const data = await api.get(url) as {data: PaginatedResponse<Conductor>};
    console.log('getdrivers: Respuesta de API:', data);
    return data.data;
  },
  
  getConductorById: async (id: string): Promise<Conductor> => {
    const data = await api.get(`/drivers/${id}`) as {data: Conductor};
    return data.data;
  },
  
  crearConductor: async (conductor: Omit<Conductor, 'id'>): Promise<Conductor> => {
    const {data:response} = await api.post('/drivers', {
      ...conductor,
      verified: undefined
    }) as {data: Conductor  };
    return response;
  },
  
  actualizarConductor: async (id: string, conductor: Partial<Conductor>): Promise<Conductor> => {
    const data = await api.put(`/drivers/${id}`, conductor) as Conductor;
    return data;
  },
  
  eliminarConductor: async (id: string): Promise<void> => {
    await api.delete(`/drivers/${id}`);
  },

  // Cambiar estado del conductor
  actualizarEstadoConductor: async (id: number, status: 'active' | 'inactive'): Promise<Conductor> => {
    const { data } = await api.patch(`/drivers/${id}/status`, { status });
    return data;
  },

  // Actualizar ubicación del conductor
  actualizarUbicacion: async (id: number, ubicacion: ConductorLocation): Promise<void> => {
    await api.post('/tracking/location', {
      latitude: ubicacion.lat,
      longitude: ubicacion.lng,
      driverId: id
    });
  },

  // Iniciar sesión del conductor (para la vista del conductor) - MÉTODO OBSOLETO
  loginConductor: async (email: string, password: string): Promise<{ driver: Conductor, access_token: string }> => {
    try {
      const { data } = await api.post('/drivers/login', { email, password });
      console.log('Respuesta login conductor:', data);
      return data;
    } catch (error) {
      console.error('Error en loginConductor:', error);
      throw error;
    }
  },

  // Solicitar OTP para el conductor (nuevo método de autenticación)
  requestOtp: async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('📞 Solicitando OTP para:', phoneNumber);
      const { data } = await api.post('/drivers/request-otp', { phone_number: phoneNumber });
      console.log('✅ OTP solicitado exitosamente:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Error al solicitar OTP:', {
        phoneNumber,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      });
      throw error;
    }
  },

  // Verificar OTP y obtener token (nuevo método de autenticación)
  verifyOtp: async (phoneNumber: string, otp: string): Promise<any> => {
    try {
      console.log('🔐 Verificando OTP:', { phoneNumber, otp });
      
      // Hacemos la llamada sin destructuring para ver la estructura completa
      const response = await api.post('/drivers/verify-otp', { 
        phone_number: phoneNumber, 
        otp_code: otp 
      });
      
      console.log('🔍 DEBUGGING - Respuesta completa del backend:', {
        response,
        responseType: typeof response,
        hasDataWrapper: response && typeof response === 'object' && 'data' in response,
        keys: response ? Object.keys(response) : [],
        sessionToken: response?.session_token,
        accessToken: response?.access_token,
        token: response?.token,
        dataSessionToken: response?.data?.session_token,
        dataAccessToken: response?.data?.access_token,
        dataToken: response?.data?.token
      });
      
      // Retornar la respuesta completa para que LoginConductor pueda procesarla
      return response;
    } catch (error: any) {
      console.error('❌ Error al verificar OTP:', {
        phoneNumber,
        otp,
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      });
      throw error;
    }
  },

  // Obtener información del perfil del conductor actual
  getPerfilConductor: async (): Promise<Conductor> => {
    // este enpoint no trae data en el body por lo que no hay que hacer destructuring
    const  {data}  = await api.get('/drivers/profile');
    return data;
  },

  // Iniciar el modo activo del conductor (cambiar status a available)
  iniciarModoActivo: async (): Promise<Conductor> => {
    const { data } = await api.post('/drivers/profile/active');
    return data;
  },

  // Finalizar el modo activo del conductor (cambiar status a offline)
  finalizarModoActivo: async (): Promise<Conductor> => {
    const { data } = await api.delete('/drivers/profile/active');
    return data;
  },

  // Para que el conductor actualice su perfil
  actualizarPerfilConductor: async (datos: Partial<Conductor>): Promise<Conductor> => {
    try {
      const { data } = await api.post('/drivers/profile/update', datos);
      return data;
    } catch (error) {
      console.error('Error actualizando perfil del conductor:', error);
      throw error;
    }
  },

  // Para reactivar conductores desactivados
  reactivarConductor: async (id: string): Promise<Conductor> => {
    try {
      const { data } = await api.post(`/drivers/${id}/reactivate`);
      return data;
    } catch (error) {
      console.error(`Error reactivando conductor ID ${id}:`, error);
      throw error;
    }
  },

  // Para que el admin actualice los documentos del conductor
  actualizarDocumentosConductor: async (id: string, documentos: UpdateDriverDocumentsDto): Promise<Conductor> => {
    try {
      const formData = new FormData();
      
      if (documentos.documentos.licencia) {
        formData.append('licencia', documentos.documentos.licencia);
      }
      
      if (documentos.documentos.seguro) {
        formData.append('seguro', documentos.documentos.seguro);
      }
      
      if (documentos.documentos.identificacion) {
        formData.append('identificacion', documentos.documentos.identificacion);
      }
      
      const { data } = await api.post(`/drivers/${id}/documents`, formData);
      
      return data;
    } catch (error) {
      console.error(`Error actualizando documentos del conductor ID ${id}:`, error);
      throw error;
    }
  },

  // Para que el conductor actualice sus propios documentos
  actualizarDocumentosPerfilConductor: async (documentos: UpdateDriverDocumentsDto): Promise<Conductor> => {
    try {
      const formData = new FormData();
      
      if (documentos.documentos.licencia) {
        formData.append('licencia', documentos.documentos.licencia);
      }
      
      if (documentos.documentos.seguro) {
        formData.append('seguro', documentos.documentos.seguro);
      }
      
      if (documentos.documentos.identificacion) {
        formData.append('identificacion', documentos.documentos.identificacion);
      }
      
      const { data } = await api.post('/drivers/profile/documents', formData);
      
      return data;
    } catch (error) {
      console.error('Error actualizando documentos del perfil del conductor:', error);
      throw error;
    }
  },

  // Para que el admin actualice la foto de perfil del conductor
  actualizarFotoConductor: async (id: string, foto: UpdateProfilePictureDto): Promise<Conductor> => {
    try {
      const formData = new FormData();
      formData.append('foto', foto.foto);
      
      const { data } = await api.post(`/drivers/${id}/profile-picture`, formData);
      
      return data;
    } catch (error) {
      console.error(`Error actualizando foto del conductor ID ${id}:`, error);
      throw error;
    }
  },

  // Para que el conductor actualice su propia foto de perfil
  actualizarFotoPerfilConductor: async (foto: UpdateProfilePictureDto): Promise<Conductor> => {
    try {
      const formData = new FormData();
      formData.append('foto', foto.foto);
      
      const { data } = await api.post('/drivers/profile/picture', formData);
      
      return data;
    } catch (error) {
      console.error('Error actualizando foto del perfil del conductor:', error);
      throw error;
    }
  },

  // Para reportar incidentes
  reportarIncidente: async (incidente: ReportIncidentDto): Promise<any> => {
    try {
      const { data } = await api.post('/drivers/incidents/report', incidente);
      return data;
    } catch (error) {
      console.error('Error reportando incidente:', error);
      throw error;
    }
  },

  // Para ver estadísticas del conductor (admin)
  obtenerEstadisticasConductor: async (id: string): Promise<any> => {
    try {
      const { data } = await api.get(`/drivers/statistics/${id}`);
      return data;
    } catch (error) {
      console.error(`Error obteniendo estadísticas del conductor ID ${id}:`, error);
      throw error;
    }
  },

  // Para que el conductor vea sus propias estadísticas
  obtenerEstadisticasPropias: async (): Promise<any> => {
    try {
      const { data } = await api.get('/drivers/statistics/profile/me');
      return data;
    } catch (error) {
      console.error('Error obteniendo estadísticas propias del conductor:', error);
      throw error;
    }
  },

  // Obtener conductores con su ubicación actual y estado
  getConductoresConUbicacion: async (params: GetConductoresParams = {}): Promise<PaginatedResponse<Conductor>> => {
    try {
      console.log('getConductoresConUbicacion: Llamando a getdrivers con params:', params);
      const result = await conductorService.getdrivers(params);
      console.log('getConductoresConUbicacion: Resultado de getdrivers:', result);
      return result;
    } catch (error) {
      console.error('Error obteniendo conductores con ubicación:', error);
      throw error;
    }
  },

  // Para subir avatar de conductor (como admin)
  uploadDriverAvatar: async (driverId: number, avatarFile: File): Promise<{ url: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', avatarFile);
      formData.append('photo_type', 'profile');
      formData.append('replace_existing', 'true');

      // Usar axios directamente para este caso especial
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/uploads/admin/drivers/${driverId}/photos`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al subir avatar del conductor:', error);
      throw error;
    }
  },

  // Para subir avatar (como conductor)
  uploadOwnAvatar: async (avatarFile: File): Promise<{ url: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', avatarFile);
      
      // Usar axios directamente para este caso especial
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/uploads/drivers/avatar`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error al subir avatar propio:', error);
      throw error;
    }
  },

  // Para actualizar avatar usando URL
  updateAvatarWithUrl: async (driverId: number, imageUrl: string): Promise<Conductor> => {
    try {
      const { data } = await api.post(`/drivers/${driverId}/update-avatar-with-url`, {
        profile_picture: imageUrl
      });
      
      return data;
    } catch (error) {
      console.error('Error al actualizar avatar con URL:', error);
      throw error;
    }
  },

  // Para actualizar el propio avatar usando URL (como conductor)
  updateOwnAvatarWithUrl: async (imageUrl: string): Promise<Conductor> => {
    try {
      const { data } = await api.post('/drivers/profile/update-avatar-with-url', {
        profile_picture: imageUrl
      });
      
      return data;
    } catch (error) {
      console.error('Error al actualizar avatar propio con URL:', error);
      throw error;
    }
  },

  // Para cambiar el estado del conductor (activo/inactivo)
  updateStatus: async (id: number, status: string): Promise<Conductor> => {
    try {
      const { data } = await api.patch(`/drivers/${id}/status`, { status });
      return data;
    } catch (error) {
      console.error(`Error al actualizar estado del conductor ID ${id}:`, error);
      throw new Error('Error al actualizar estado del conductor');
    }
  },

  // Para cambiar el campo active del conductor (activo/inactivo)
  updateActive: async (id: number, active: boolean): Promise<Conductor> => {
    try {
      const { data } = await api.patch(`/drivers/${id}/active`, { active });
      return data;
    } catch (error) {
      console.error(`Error al actualizar campo active del conductor ID ${id}:`, error);
      throw new Error('Error al actualizar campo active del conductor');
    }
  },

  // Para actualizar documentos del vehículo (admin)
  actualizarDocumentosVehiculo: async (id: string | number, documentos: UpdateVehicleDocumentsDto): Promise<Conductor> => {
    try {
      const formData = new FormData();
      
      console.log(documentos.documentos);
      if (documentos.documentos.vehicle_insurance) {
        formData.append('vehicle_insurance', documentos.documentos.vehicle_insurance);
      }
      
      if (documentos.documentos.vehicle_registration) {
        formData.append('vehicle_registration', documentos.documentos.vehicle_registration);
      }
      
      if (documentos.documentos.vehicle_photo) {
        formData.append('vehicle_photo', documentos.documentos.vehicle_photo);
      }

      if (documentos.documentos.driver_license) {
        formData.append('driver_license', documentos.documentos.driver_license);
      }
      console.log(formData);
      const { data } = await api.postFormData(`/drivers/${id}/vehicle-documents`, formData);
      
      return data;
    } catch (error) {
      console.error(`Error actualizando documentos del vehículo del conductor ID ${id}:`, error);
      throw error;
    }
  },
}; 