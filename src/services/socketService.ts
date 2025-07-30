import { io, Socket } from 'socket.io-client';
import mapService from './mapService';

// Obtener la URL base sin el /api para Socket.io
const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = API_URL 
  ? API_URL.split('/api')[0] // Remover /api si existe
  : 'http://localhost:3000'; // Fallback por defecto

console.log('🔌 Socket.io conectándose a:', SOCKET_URL);

class SocketService {
  private socket: Socket | null = null;
  private driverId: string | null = null;
  private isAdmin: boolean = false;
  private lastConnectionWarning: number = 0;
  private lastRegistrationWarning: number = 0;
  private lastLocationUpdate: number = 0;

  // Conectar al WebSocket del servidor
  connect(token: string, asAdmin = false): void {
    if (this.socket?.connected) {
      console.log('WebSocket ya está conectado');
      return;
    }

    this.isAdmin = asAdmin;

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'], // Permitir fallback a polling
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: false
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado correctamente a:', SOCKET_URL);
      
      // Si estamos conectando como admin, suscribirse a todas las actualizaciones
      if (this.isAdmin) {
        this.registerAdminListener();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Error de conexión WebSocket:', {
        message: error.message,
        description: error.description || 'No description available',
        context: error.context || 'No context available',
        type: error.type || 'Unknown error type',
        url: SOCKET_URL
      });
      
      // Si el error es de namespace, intentar sin namespace
      if (error.message?.includes('Invalid namespace')) {
        console.log('🔄 Reintentando conexión sin namespace específico...');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket desconectado:', reason);
      if (reason === 'io server disconnect') {
        // El servidor forzó la desconexión, reconectar manualmente
        this.socket?.connect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconectado después de', attemptNumber, 'intentos');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Intento de reconexión #', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Error de reconexión WebSocket:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Falló la reconexión WebSocket después de todos los intentos');
    });
  }

  // Registrar el admin para recibir actualizaciones de todos los conductores
  registerAdminListener(): void {
    if (!this.socket || !this.socket.connected) {
      console.error('No se puede registrar como admin: Socket no conectado');
      return;
    }

    // Emitir evento para registrarse como admin
    this.socket.emit('admin:register');
    console.log('Administrador registrado para recibir actualizaciones');

    // Configurar listeners para actualizaciones de conductores
    this.socket.on('admin:driverLocationUpdate', (data: { 
      driverId: number, 
      location: { lat: number, lng: number } 
    }) => {
      console.log('Actualización de ubicación de conductor recibida:', data);
      
      // Actualizar el mapa con la nueva ubicación del conductor
      mapService.updateDriverLocation(data.driverId, data.location);
    });

    // Escuchar cuando un conductor cambia su estado (online/offline/busy)
    this.socket.on('admin:driverStatusUpdate', (data: {
      driverId: number,
      status: 'online' | 'offline' | 'busy'
    }) => {
      console.log('Actualización de estado de conductor recibida:', data);
      // Aquí podríamos actualizar el estado en el mapService
    });
  }

  // Desconectar del WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.driverId = null;
      this.isAdmin = false;
      
      // Resetear timestamps de warnings
      this.lastConnectionWarning = 0;
      this.lastRegistrationWarning = 0;
      this.lastLocationUpdate = 0;
      
      console.log('WebSocket desconectado manualmente');
    }
  }

  // Registrar el conductor en el sistema de WebSockets
  registerDriver(driverId: string, token: string): void {
    this.driverId = driverId;

    if (!this.socket || !this.socket.connected) {
      console.log('🔄 Socket no conectado, iniciando conexión...');
      this.connect(token);
      
      // Esperar un momento para que se conecte antes de registrar
      setTimeout(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit('driver:register', { driverId, token });
          console.log('✅ Conductor registrado en WebSocket tras reconexión');
        }
      }, 1000);
      return;
    }

    if (this.socket) {
      this.socket.emit('driver:register', { driverId, token });
      console.log('✅ Conductor registrado en WebSocket');
    }
  }

  // Actualizar la ubicación del conductor en tiempo real
  updateDriverLocation(location: { lat: number; lng: number; timestamp?: number }): void {
    // Verificar conexión y registro de forma silenciosa
    if (!this.socket || !this.socket.connected) {
      // Solo loggear una vez por problema de conexión
      if (!this.lastConnectionWarning || Date.now() - this.lastConnectionWarning > 30000) {
        console.warn('⚠️ Socket no conectado, saltando actualización de ubicación');
        this.lastConnectionWarning = Date.now();
      }
      return;
    }

    if (!this.driverId) {
      // Solo loggear una vez por problema de registro
      if (!this.lastRegistrationWarning || Date.now() - this.lastRegistrationWarning > 30000) {
        console.warn('⚠️ Conductor no registrado en socket, saltando actualización de ubicación');
        this.lastRegistrationWarning = Date.now();
      }
      return;
    }

    // Emitir la actualización de ubicación
    this.socket.emit('driver:updateLocation', {
      driverId: this.driverId,
      location
    });
    
    // Log de debug cada 30 segundos
    if (!this.lastLocationUpdate || Date.now() - this.lastLocationUpdate > 30000) {
      console.log('📍 Ubicación actualizada via socket:', location);
      this.lastLocationUpdate = Date.now();
    }
  }

  // Escuchar eventos de solicitudes nuevas
  onNewRequest(callback: (request: any) => void): void {
    if (this.socket) {
      this.socket.on('driver:newRequest', callback);
    }
  }

  // Escuchar eventos de cancelación de solicitudes
  onRequestCancelled(callback: (requestId: string) => void): void {
    if (this.socket) {
      this.socket.on('driver:requestCancelled', callback);
    }
  }

  // Método para verificar si está conectado
  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  // Métodos adicionales para compatibilidad con mapService
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.warn('Socket no está conectado, no se puede registrar listener para:', event);
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    } else {
      console.warn('Socket no está conectado, no se puede remover listener para:', event);
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket no está conectado, no se puede emitir evento:', event);
    }
  }
}

export default new SocketService(); 