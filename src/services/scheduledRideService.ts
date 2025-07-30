import API from './api';

// Tipos para carreras programadas
export interface ScheduledRide {
  id: string;
  client_id?: string;
  client_name: string;
  client_phone: string;
  driver_id?: string;
  pickup_location: string;
  pickup_coordinates: { lat: number; lng: number };
  destination: string;
  destination_coordinates: { lat: number; lng: number };
  scheduled_date: string; // ISO 8601
  scheduled_time: string; // HH:MM
  estimated_duration: number;
  estimated_cost: number;
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    end_date?: string;
    days_of_week?: number[];
  };
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateScheduledRideDTO {
  client_name: string;
  client_phone: string;
  pickup_location: string;
  pickup_coordinates: { lat: number; lng: number };
  destination: string;
  destination_coordinates: { lat: number; lng: number };
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration: number;
  estimated_cost: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    end_date?: string;
    days_of_week?: number[];
  };
  notes?: string;
}

export interface UpdateScheduledRideDTO extends Partial<CreateScheduledRideDTO> {
  status?: ScheduledRide['status'];
  driver_id?: string;
}

export interface ScheduledRideFilters {
  page?: number;
  limit?: number;
  status?: ScheduledRide['status'];
  driver_id?: string;
  client_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  priority?: ScheduledRide['priority'];
}

export interface CalendarData {
  rides: ScheduledRide[];
  total: number;
  page: number;
  limit: number;
}

// Tipo correcto para crear una carrera programada según el backend
export interface ScheduledRideCreateDTO {
  client_id: number;
  driver_id?: number;
  client_name: string;
  client_phone: string;
  pickup_location: string;
  pickup_coordinates: { lat: number; lng: number };
  destination: string;
  destination_coordinates: { lat: number; lng: number };
  scheduled_at: string; // ISO 8601 completo: "2024-08-15T14:30:00Z"
  priority: string;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    end_date?: string;
    days_of_week?: number[];
  };
  notes?: string;
}

// Función para crear una carrera programada
export async function createScheduledRide(payload: ScheduledRideCreateDTO) {
  const response = await API.post('/scheduled-rides', payload);
  return response.data;
}

// Servicio de carreras programadas
export const scheduledRideService = {
  // Obtener todas las carreras programadas con filtros
  getAll: (filters: ScheduledRideFilters = {}) => 
    API.get('/scheduled-rides', { params: filters }),

  // Obtener una carrera programada por ID
  getById: (id: string) => 
    API.get(`/scheduled-rides/${id}`),

  // Crear nueva carrera programada
  create: (data: CreateScheduledRideDTO) => 
    API.post('/scheduled-rides', data),

  // Actualizar carrera programada
  update: (id: string, data: UpdateScheduledRideDTO) => 
    API.put(`/scheduled-rides/${id}`, data),

  // Cancelar carrera programada
  cancel: (id: string, reason?: string) => 
    API.delete(`/scheduled-rides/${id}`, { data: { reason } }),

  // Eliminar carrera programada
  delete: (id: string) => 
    API.delete(`/scheduled-rides/${id}`),

  // Asignar conductor a carrera
  assignDriver: (rideId: string, driverId: string) => 
    API.post(`/scheduled-rides/${rideId}/assign`, { driver_id: driverId }),

  // Desasignar conductor de carrera
  unassignDriver: (rideId: string) => 
    API.delete(`/scheduled-rides/${rideId}/unassign`),

  // Obtener carreras de un día específico
  getByDate: (date: string) => 
    API.get(`/calendar/rides/${date}`),

  // Obtener vista mensual
  getMonthView: (year: number, month: number) => 
    API.get(`/calendar/month/${year}/${month}`),

  // Obtener vista semanal
  getWeekView: (date: string) => 
    API.get(`/calendar/week/${date}`),

  // Obtener conductores disponibles
  getAvailableDrivers: (date: string, time: string) => 
    API.get(`/drivers/available/${date}/${time}`),

  // Enviar recordatorio manual
  sendReminder: (rideId: string) => 
    API.post(`/scheduled-rides/${rideId}/notify`),

  // Obtener carreras próximas
  getUpcoming: (hours: number = 24) => 
    API.get('/scheduled-rides/upcoming', { 
      params: { hours } 
    }),
}; 