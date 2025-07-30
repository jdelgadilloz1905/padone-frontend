import api from './api';

export interface Solicitud {
  id: string;
  cliente: {
    nombre: string;
    telefono: string;
  };
  origen: {
    direccion: string;
    lat: number;
    lng: number;
  };
  destino: {
    direccion: string;
    lat: number;
    lng: number;
  };
  estado: 'pendiente' | 'asignada' | 'en_curso' | 'completada' | 'cancelada';
  conductorId?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  precio?: number;
}

export const solicitudService = {
  getSolicitudes: async (): Promise<Solicitud[]> => {
    const { data } = await api.get('/solicitudes');
    return data;
  },
  
  getSolicitudById: async (id: string): Promise<Solicitud> => {
    const { data } = await api.get(`/solicitudes/${id}`);
    return data;
  },
  
  crearSolicitud: async (solicitud: Omit<Solicitud, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Solicitud> => {
    const { data } = await api.post('/solicitudes', solicitud);
    return data;
  },
  
  actualizarSolicitud: async (id: string, solicitud: Partial<Solicitud>): Promise<Solicitud> => {
    const { data } = await api.put(`/solicitudes/${id}`, solicitud);
    return data;
  },
  
  asignarConductor: async (solicitudId: string, conductorId: string): Promise<Solicitud> => {
    const { data } = await api.patch(`/solicitudes/${solicitudId}/asignar`, { conductorId });
    return data;
  },
  
  cancelarSolicitud: async (id: string, motivo: string): Promise<void> => {
    await api.patch(`/solicitudes/${id}/cancelar`, { motivo });
  }
}; 