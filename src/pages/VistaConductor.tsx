import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Button,
  IconButton
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import MapView from '../components/MapView';
import ActiveRideView from '../components/ActiveRideView';
import LocationPermissionModal from '../components/LocationPermissionModal';
import { conductorService } from '../services/conductorService';
import type { ConductorLocation } from '../services/conductorService';
import { useActiveRide } from '../hooks/useActiveRide';
import { useGeolocation } from '../hooks/useGeolocation';
import socketService from '../services/socketService';
import { useTokenValidation } from '../hooks/useTokenValidation';
import authService from '../services/authService';

const VistaConductor = () => {
  // Hook para validación automática de tokens
  useTokenValidation();
  
  const navigate = useNavigate();
  const [modoActivo, setModoActivo] = useState(false);
  const [ubicacionActual, setUbicacionActual] = useState<ConductorLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const conductorId = useRef<string | null>(null);
  const [conectadoWebSocket, setConectadoWebSocket] = useState(false);
  const ubicacionIntervalId = useRef<number | null>(null);

  // ✅ NUEVO: Estado para prevenir clicks múltiples
  const [isProcessingToggle, setIsProcessingToggle] = useState(false);
  const lastToggleTime = useRef<number>(0);
  const processTimeoutRef = useRef<number | null>(null);

  // ✅ NUEVO: Hook de geolocalización robusto
  const geolocation = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000,
    watchPosition: modoActivo, // Solo rastrear cuando esté activo
    onLocationUpdate: (coordinates) => {
      const ubicacion = {
        lat: coordinates.lat,
        lng: coordinates.lng,
        timestamp: coordinates.timestamp
      };
      setUbicacionActual(ubicacion);
      
      // Enviar al WebSocket si está conectado y el socket está realmente activo
      if (conectadoWebSocket && modoActivo && socketService.isConnected()) {
        socketService.updateDriverLocation(ubicacion);
      }
    },
    onError: (errorMsg) => {
      console.error('❌ Error de geolocalización:', errorMsg);
      setError(errorMsg);
      
      // Mostrar modal de ayuda si es problema de permisos
      if (errorMsg.toLowerCase().includes('permisos') || errorMsg.toLowerCase().includes('denegado')) {
        setShowLocationModal(true);
      }
    }
  });

  // ✅ NUEVO: Función helper para limpiar estado de procesamiento
  const clearProcessingState = useCallback((reason = 'completed', shouldRefetch = false) => {
    console.log(`🧹 Limpiando estado de procesamiento (${reason})`);
    setIsProcessingToggle(false);
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
      processTimeoutRef.current = null;
    }
    // Refetch si se solicita (para timeout o reset manual)
    if (shouldRefetch && reason === 'timeout') {
      console.log('🔄 Refrescando perfil tras timeout para sincronizar estado...');
      // Note: refetchPerfil será llamado desde donde se invoque esta función
    }
  }, []);

  // ✅ NUEVO: Timeout de seguridad para limpiar estado stuck
  const setProcessingWithTimeout = useCallback(() => {
    setIsProcessingToggle(true);
    // Timeout de seguridad: limpiar estado después de 15 segundos máximo
    processTimeoutRef.current = window.setTimeout(async () => {
      console.log('⏰ Timeout de seguridad: verificando estado tras 15 segundos...');
      
      try {
        // Verificar estado actual en el servidor antes de limpiar
        const perfilActualizado = await conductorService.getPerfilConductor();
        const isOnlineInServer = ['available', 'busy', 'on_the_way'].includes(perfilActualizado.status);
        
        console.log('📊 Verificación timeout - Estado en servidor:', perfilActualizado.status, '→ Online:', isOnlineInServer);
        
        // Sincronizar estado local con servidor
        if (isOnlineInServer !== modoActivo) {
          console.log('🔄 Sincronizando estado local con servidor...');
          setModoActivo(isOnlineInServer);
        }
        
        clearProcessingState('timeout-verified');
      } catch (error) {
        console.error('❌ Error al verificar estado en timeout:', error);
        clearProcessingState('timeout-error');
      }
    }, 15000);
  }, [clearProcessingState, modoActivo]);

  // Obtener datos del conductor actual
  const { data: perfilConductor, isLoading, refetch: refetchPerfil } = useQuery({
    queryKey: ['perfilConductor'],
    queryFn: () => conductorService.getPerfilConductor(),
  });

  // Efecto para actualizar el estado y el ID cuando se carga el perfil
  useEffect(() => {
    if (perfilConductor) {
      if (perfilConductor.id) {
        console.log('🚗 perfilConductor cargado:', perfilConductor);
        conductorId.current = String(perfilConductor.id);
      }
      
      // ✅ CORRECCIÓN: Usar campo status en lugar de active para el estado online/offline
      const isOnlineInBackend = ['available', 'busy', 'on_the_way'].includes(perfilConductor.status);
      
      console.log('📊 Estado del conductor en backend - Active:', perfilConductor.active, 'Status:', perfilConductor.status, '→ Online:', isOnlineInBackend);
      
      // ✅ CORRECCIÓN: No sincronizar si hay procesamiento en curso
      if (isProcessingToggle) {
        console.log('⚠️ Sincronización pausada: proceso de activación en curso...');
        return;
      }
      
      // Si el conductor ya estaba online en el servidor, actualizamos el estado
      if (isOnlineInBackend && !modoActivo) {
        console.log('✅ Recuperando estado online del conductor desde backend');
        setModoActivo(true);
        // Para recuperación automática NO usamos forceActivation
        iniciarRastreoUbicacion(false);
      } else if (!isOnlineInBackend && modoActivo) {
        console.log('❌ Conductor está offline en backend, desactivando modo activo');
        setModoActivo(false);
        detenerRastreoUbicacion();
      }
    }
  }, [perfilConductor, modoActivo, isProcessingToggle]);

  // Hook para manejar carrera activa (después de obtener el conductorId)
  const {
    activeRide,
    startTrip,
    completeTrip,
    isStartingTrip,
    isCompletingTrip
  } = useActiveRide();

  // Manejar callbacks de carrera activa
  const handleStartTrip = (rideId: string) => {
    startTrip(rideId);
    setNotification('Iniciando viaje hacia el cliente...');
  };

  const handleCompleteTrip = (params: { rideId: string; actualCost?: number }) => {
    completeTrip(params);
    setNotification('Completando viaje...');
  };

  // Inicializar WebSocket cuando se carga el perfil del conductor
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (perfilConductor && perfilConductor.id && token && !conectadoWebSocket) {
      console.log('🔌 Inicializando conexión WebSocket para conductor:', perfilConductor.id);
      
      // Inicializar conexión WebSocket
      socketService.connect(token);
      
      // Registrar el conductor en el WebSocket
      socketService.registerDriver(String(perfilConductor.id), token);
      
      setConectadoWebSocket(true);
    }
    
    return () => {
      // Solo desconectar al desmontar el componente, no en cada re-render
      if (conectadoWebSocket) {
        console.log('🔌 Desconectando WebSocket...');
        socketService.disconnect();
        setConectadoWebSocket(false);
      }
    };
  }, [perfilConductor?.id]); // Solo depender del ID, no del objeto completo

  // Mutación para iniciar modo activo
  const iniciarActivoMutation = useMutation({
    mutationFn: () => {
      return conductorService.iniciarModoActivo();
    },
    onSuccess: () => {
      console.log('✅ Modo activo iniciado exitosamente');
      setNotification('Modo activo iniciado correctamente');
      clearProcessingState('success'); // ✅ Limpiar estado de procesamiento
      refetchPerfil();
    },
    onError: (error) => {
      console.error('❌ Error al iniciar modo activo:', error);
      setError('Error al iniciar el modo activo');
      setModoActivo(false); // ✅ Revertir estado en caso de error
      clearProcessingState('error'); // ✅ Limpiar estado de procesamiento
      detenerRastreoUbicacion();
    }
  });

  // Mutación para finalizar modo activo
  const finalizarActivoMutation = useMutation({
    mutationFn: () => {
      return conductorService.finalizarModoActivo();
    },
    onSuccess: () => {
      console.log('✅ Modo activo finalizado exitosamente');
      setNotification('Modo activo finalizado correctamente');
      clearProcessingState('success'); // ✅ Limpiar estado de procesamiento
      refetchPerfil();
    },
    onError: (error) => {
      console.error('❌ Error al finalizar modo activo:', error);
      setError('Error al finalizar el modo activo');
      setModoActivo(true); // ✅ Revertir estado en caso de error
      clearProcessingState('error'); // ✅ Limpiar estado de procesamiento
    }
  });

  // Mutación para actualizar ubicación
  const actualizarUbicacionMutation = useMutation({
    mutationFn: (ubicacion: ConductorLocation) => {
      const id = conductorId.current;
      if (!id) throw new Error('ID de conductor no disponible');
      return conductorService.actualizarUbicacion(Number(id), ubicacion);
    },
    onError: () => {
      console.error('Error al actualizar la ubicación');
    }
  });

  // Enviar ubicación cada segundo en background
  const enviarUbicacionPeriodicamente = () => {
    // Usar las coordenadas del hook de geolocalización si están disponibles
    const coordenadas = geolocation.coordinates || ubicacionActual;
    
    if (!coordenadas || !modoActivo || !conductorId.current) return;

    console.log('📍 Enviando ubicación actualizada:', {
      coordenadas,
      accuracy: geolocation.accuracy,
      timestamp: coordenadas.timestamp
    });

    // Método REST API
    actualizarUbicacionMutation.mutate(coordenadas);
    
    // Método WebSocket si está conectado y funcionando
    if (conectadoWebSocket && socketService.isConnected()) {
      socketService.updateDriverLocation(coordenadas);
    }
  };

  // Iniciar el rastreo de ubicación
  const iniciarRastreoUbicacion = async (forceActivation = false) => {
    console.log('🗺️ Iniciando rastreo de ubicación...', { forceActivation, modoActivo, conductorId: conductorId.current });

    // Verificar soporte de geolocalización
    if (!geolocation.isSupported) {
      setError('Tu dispositivo no soporta geolocalización');
      return false;
    }

    try {
      // Obtener ubicación inicial usando el hook robusto
      const success = await geolocation.getCurrentLocation();
      
      if (!success) {
        console.error('❌ No se pudo obtener la ubicación');
        return false;
      }

      // Si se está activando manualmente O si ya estaba activo, enviar al servidor
      const shouldActivate = forceActivation || modoActivo;
      if (shouldActivate && conductorId.current && geolocation.coordinates) {
        console.log('🚀 Enviando ubicación inicial al servidor...');
        iniciarActivoMutation.mutate();
        
        if (conectadoWebSocket && socketService.isConnected()) {
          socketService.updateDriverLocation(geolocation.coordinates);
        }

        // Iniciar envío periódico de ubicación cada 5 segundos cuando esté activo
        ubicacionIntervalId.current = setInterval(enviarUbicacionPeriodicamente, 5000);
      } else {
        console.log('ℹ️ No se envía al servidor:', { shouldActivate, conductorId: conductorId.current });
      }

      return true;
    } catch (error) {
      console.error('❌ Error al iniciar rastreo:', error);
      return false;
    }
  };

  // Detener el rastreo de ubicación
  const detenerRastreoUbicacion = () => {
    console.log('🛑 Deteniendo rastreo de ubicación...');
    
    // Detener el seguimiento del hook de geolocalización
    geolocation.stopWatching();
    
    // Limpiar el intervalo de envío periódico
    if (ubicacionIntervalId.current !== null) {
      clearInterval(ubicacionIntervalId.current);
      ubicacionIntervalId.current = null;
    }
  };

  // Efecto para manejar el envío periódico de ubicación
  useEffect(() => {
    if (modoActivo && ubicacionActual) {
      ubicacionIntervalId.current = setInterval(enviarUbicacionPeriodicamente, 5000);
    } else {
      if (ubicacionIntervalId.current) {
        clearInterval(ubicacionIntervalId.current);
        ubicacionIntervalId.current = null;
      }
    }

    return () => {
      if (ubicacionIntervalId.current) {
        clearInterval(ubicacionIntervalId.current);
      }
    };
  }, [modoActivo, ubicacionActual]);

  // ✅ MEJORADO: Manejar el cambio de estado activo con protecciones
  const handleModoActivoChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoEstado = event.target.checked;
    const currentTime = Date.now();
    
    console.log('🎯 Toggle manual activado:', { 
      nuevoEstado, 
      estadoAnterior: modoActivo,
      isProcessing: isProcessingToggle,
      timeSinceLastClick: currentTime - lastToggleTime.current
    });
    
    // ✅ PROTECCIÓN 1: Prevenir clicks múltiples muy rápidos (debounce 500ms)
    if (currentTime - lastToggleTime.current < 500) {
      console.log('⚠️ Click muy rápido, ignorando...');
      return;
    }
    
    // ✅ PROTECCIÓN 2: No procesar si ya hay una operación en progreso
    if (isProcessingToggle || iniciarActivoMutation.isPending || finalizarActivoMutation.isPending) {
      console.log('⚠️ Operación en progreso, ignorando click...');
      return;
    }
    
    // ✅ PROTECCIÓN 3: No hacer nada si el estado ya es el deseado
    if (modoActivo === nuevoEstado) {
      console.log('ℹ️ Estado ya es el deseado, no hay cambios...');
      return;
    }
    
    // Actualizar timestamps y estados
    lastToggleTime.current = currentTime;
    setProcessingWithTimeout(); // ✅ Usar nuevo método con timeout de seguridad
    setModoActivo(nuevoEstado);
    
    if (nuevoEstado) {
      console.log('🚀 Activando conductor...');
      // Verificar permisos y activar rastreo
      iniciarRastreoUbicacion(true).then(success => {
        if (!success) {
          // Si no se pudo obtener ubicación, revertir estado
          setModoActivo(false);
          clearProcessingState('location-failed');
        }
      });
    } else {
      console.log('🛑 Desactivando conductor...');
      // Finalizar el modo activo en el servidor
      if (conductorId.current) {
        console.log('🛑 Finalizando modo activo en servidor...');
        finalizarActivoMutation.mutate();
      }
      detenerRastreoUbicacion();
      
      // Para desactivación, limpiar estado inmediatamente si no hay conductorId
      if (!conductorId.current) {
        clearProcessingState('no-driver-id');
      }
    }
  }, [modoActivo, isProcessingToggle, ubicacionActual, iniciarActivoMutation.isPending, finalizarActivoMutation.isPending]);

  // Manejar modal de permisos de ubicación
  const handleLocationModalClose = () => {
    setShowLocationModal(false);
  };

  const handleLocationRetry = async () => {
    setShowLocationModal(false);
    setError(null);
    
    // Intentar obtener ubicación nuevamente
    const success = await geolocation.getCurrentLocation();
    if (success && modoActivo) {
      // Si se obtuvo la ubicación y está en modo activo, continuar con la activación
      if (conductorId.current) {
        iniciarActivoMutation.mutate();
      }
    }
  };

  // Obtener estadísticas del conductor
  const { data: estadisticasConductor, isLoading: loadingEstadisticas } = useQuery({
    queryKey: ['estadisticasConductor'],
    queryFn: () => conductorService.obtenerEstadisticasPropias(),
    refetchInterval: 30000, // Actualizar cada 30 segundos
    enabled: !!conductorId.current, // Solo ejecutar si hay conductor ID
  });

  // Manejar logout
  const handleLogout = () => {
    console.log('🚪 Cerrando sesión del conductor...');
    // Detener rastreo antes de cerrar sesión
    detenerRastreoUbicacion();
    // Limpiar sesión
    authService.logout();
    // Redirigir al login de conductores
    navigate('/login-conductor', { replace: true });
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Limpiar el rastreo al desmontar el componente
  useEffect(() => {
    return () => {
      // Detener geolocalización
      geolocation.stopWatching();
      
      if (ubicacionIntervalId.current !== null) {
        clearInterval(ubicacionIntervalId.current);
      }
      if (processTimeoutRef.current !== null) {
        clearTimeout(processTimeoutRef.current);
      }
      socketService.disconnect();
    };
  }, [geolocation]);

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          backgroundColor: '#FFFFFF'
        }}
      >
        <CircularProgress size={60} sx={{ color: '#E33096' }} />
      </Box>
    );
  }

  // Si hay una carrera activa, mostrar la vista de carrera
  if (activeRide && (activeRide.status === 'in_progress' || activeRide.status === 'on_the_way')) {
    return (
      <ActiveRideView
        ride={activeRide}
        driverLocation={ubicacionActual}
        onStartTrip={handleStartTrip}
        onCompleteTrip={handleCompleteTrip}
        isStartingTrip={isStartingTrip}
        isCompletingTrip={isCompletingTrip}
        driverId={conductorId.current ? parseInt(conductorId.current) : undefined}
      />
    );
  }

  return (
    <Box 
      sx={{ 
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Snackbars para notificaciones */}
      <Snackbar 
        open={!!notification} 
        autoHideDuration={6000} 
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setNotification(null)} severity="success" sx={{ width: '100%' }}>
          {notification}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Botón de logout discreto */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: { xs: 16, sm: 20 },
          right: { xs: 16, sm: 20 },
          zIndex: 10
        }}
      >
        <IconButton
          onClick={handleLogout}
          sx={{
            color: '#666',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
              color: '#E33096'
            }
          }}
          size="small"
        >
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Logo TAXI ROSA */}
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: { xs: 3, sm: 4 },
          pb: { xs: 1.5, sm: 2 }
        }}
      >
        <Box
          sx={{
            width: { xs: '40vw', sm: '35vw', md: 150 },
            height: { xs: '40vw', sm: '35vw', md: 150 },
            maxWidth: 200,
            maxHeight: 200,
            minWidth: 120,
            minHeight: 120,
            backgroundColor: '#E33096',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: { xs: 2, sm: 3 }
          }}
        >
          <Typography
            sx={{
              color: 'white',
              fontSize: { xs: '4.5vw', sm: '4vw', md: '24px' },
              fontWeight: 'bold',
              fontFamily: 'Poppins',
              textAlign: 'center',
              lineHeight: 1.2
            }}
          >
            TAXI ROSA
          </Typography>
        </Box>
      </Box>

      {/* Toggle Switch */}
      <Box 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 2, sm: 3 },
          mb: { xs: 1.5, sm: 2 },
          px: { xs: 2, sm: 3 }
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Poppins',
            fontSize: { xs: '3.5vw', sm: '3vw', md: '14px' },
            color: '#201B1B'
          }}
        >
          Offline
        </Typography>
        
        {/* ✅ MEJORADO: Toggle Switch con protecciones visuales */}
        <Box
          sx={{
            width: { xs: '20vw', sm: '18vw', md: 87 },
            height: { xs: '10vw', sm: '9vw', md: 42 },
            maxWidth: 100,
            maxHeight: 48,
            minWidth: 70,
            minHeight: 34,
            backgroundColor: modoActivo ? '#E33096' : '#E8E5E5',
            borderRadius: '50px',
            position: 'relative',
            cursor: isProcessingToggle || iniciarActivoMutation.isPending || finalizarActivoMutation.isPending 
              ? 'not-allowed' 
              : 'pointer',
            transition: 'background-color 0.3s',
            opacity: isProcessingToggle || iniciarActivoMutation.isPending || finalizarActivoMutation.isPending 
              ? 0.7 
              : 1,
            border: isProcessingToggle || iniciarActivoMutation.isPending || finalizarActivoMutation.isPending 
              ? '2px solid #FFA726' 
              : 'none',
          }}
          onClick={() => {
            // ✅ PROTECCIÓN: No permitir clicks si está procesando
            if (isProcessingToggle || iniciarActivoMutation.isPending || finalizarActivoMutation.isPending) {
              console.log('⚠️ Toggle deshabilitado durante procesamiento');
              return;
            }
            handleModoActivoChange({ target: { checked: !modoActivo } } as any);
          }}
        >
          {/* ✅ NUEVO: Indicador de loading dentro del toggle */}
          {(isProcessingToggle || iniciarActivoMutation.isPending || finalizarActivoMutation.isPending) && (
            <CircularProgress
              size={16}
              sx={{
                color: modoActivo ? '#FFFFFF' : '#E33096',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1
              }}
            />
          )}
          
          {/* Círculo del toggle */}
          <Box
            sx={{
              width: { xs: '8.5vw', sm: '7.5vw', md: 36 },
              height: { xs: '8.5vw', sm: '7.5vw', md: 36 },
              maxWidth: 42,
              maxHeight: 42,
              minWidth: 28,
              minHeight: 28,
              backgroundColor: '#FFFFFF',
              borderRadius: '50%',
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              left: modoActivo ? 'calc(100% - 8.5vw - 3px)' : '3px',
              transition: 'left 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '@media (min-width: 768px)': {
                left: modoActivo ? 'calc(100% - 39px)' : '3px'
              }
            }}
          >
            {/* ✅ NUEVO: Mini indicador de estado en el círculo */}
            {(isProcessingToggle || iniciarActivoMutation.isPending || finalizarActivoMutation.isPending) && (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#FFA726',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': {
                      transform: 'scale(0.95)',
                      boxShadow: '0 0 0 0 rgba(255, 167, 38, 0.7)',
                    },
                    '70%': {
                      transform: 'scale(1)',
                      boxShadow: '0 0 0 10px rgba(255, 167, 38, 0)',
                    },
                    '100%': {
                      transform: 'scale(0.95)',
                      boxShadow: '0 0 0 0 rgba(255, 167, 38, 0)',
                    },
                  },
                }}
              />
            )}
          </Box>
        </Box>
        
        <Typography
          sx={{
            fontFamily: 'Poppins',
            fontSize: { xs: '3.5vw', sm: '3vw', md: '14px' },
            color: '#201B1B'
          }}
        >
          Online
        </Typography>
      </Box>

      {/* ✅ NUEVO: Mensaje de estado de procesamiento */}
      {(isProcessingToggle || iniciarActivoMutation.isPending || finalizarActivoMutation.isPending) && (
        <Typography
          sx={{
            fontFamily: 'Poppins',
            fontSize: { xs: '3vw', sm: '2.5vw', md: '12px' },
            fontWeight: 500,
            color: '#FFA726',
            textAlign: 'center',
            mb: { xs: 1, sm: 1.5 },
            px: { xs: 2, sm: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <CircularProgress size={14} sx={{ color: '#FFA726' }} />
          {iniciarActivoMutation.isPending && 'Activando conductor...'}
          {finalizarActivoMutation.isPending && 'Desactivando conductor...'}
          {isProcessingToggle && !iniciarActivoMutation.isPending && !finalizarActivoMutation.isPending && 'Procesando...'}
        </Typography>
      )}

      {/* ✅ NUEVO: Botón de emergencia para resetear estado stuck */}
      {isProcessingToggle && !iniciarActivoMutation.isPending && !finalizarActivoMutation.isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                     <Button
             variant="outlined"
             size="small"
             onClick={async () => {
               console.log('🆘 Usuario resetea estado de procesamiento manualmente');
               clearProcessingState('manual-reset');
               // Refrescar perfil para sincronizar con backend
               console.log('🔄 Sincronizando estado con servidor...');
               await refetchPerfil();
             }}
            sx={{
              fontSize: { xs: '2.5vw', sm: '2vw', md: '10px' },
              color: '#E33096',
              borderColor: '#E33096',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#E33096',
                backgroundColor: 'rgba(227, 48, 150, 0.04)'
              }
            }}
          >
            🔄 Reintentar
          </Button>
        </Box>
      )}

      {/* Texto estado activo */}
      {modoActivo && !isProcessingToggle && (
        <Typography
          sx={{
            fontFamily: 'Poppins',
            fontSize: { xs: '3vw', sm: '2.5vw', md: '12px' },
            fontWeight: 500,
            color: '#E33096',
            textAlign: 'center',
            mb: { xs: 2, sm: 3 },
            px: { xs: 2, sm: 3 }
          }}
        >
          Estás activo y visible para recibir carreras
        </Typography>
      )}

      {/* Tarjetas de estadísticas */}
      <Box 
        sx={{ 
          px: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 2, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1.5, sm: 2 }
        }}
      >
        {/* Carreras completadas hoy */}
        <Card
          sx={{
            borderRadius: '8px',
            border: '1px solid #E8E5E5',
            boxShadow: 'none',
            width: '100%'
          }}
        >
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: { xs: 1.5, sm: 2 },
              px: { xs: 1, sm: 2 }
            }}
          >
            {loadingEstadisticas ? (
              <CircularProgress size={40} sx={{ color: '#E33096', mb: 1 }} />
            ) : (
              <Typography
                sx={{
                  fontFamily: 'Poppins',
                  fontSize: { xs: '10vw', sm: '8vw', md: '40px' },
                  fontWeight: 600,
                  color: '#201B1B',
                  lineHeight: 1.2
                }}
              >
                {estadisticasConductor?.completed_rides || 0}
              </Typography>
            )}
            <Typography
              sx={{
                fontFamily: 'Poppins',
                fontSize: { xs: '4vw', sm: '3.5vw', md: '16px' },
                fontWeight: 500,
                color: '#201B1B',
                textAlign: 'center'
              }}
            >
              Carreras completadas hoy
            </Typography>
          </CardContent>
        </Card>

        {/* Ganancias del día */}
        <Card
          sx={{
            borderRadius: '8px',
            border: '1px solid #E8E5E5',
            boxShadow: 'none',
            width: '100%'
          }}
        >
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: { xs: 1.5, sm: 2 },
              px: { xs: 1, sm: 2 }
            }}
          >
            {loadingEstadisticas ? (
              <CircularProgress size={40} sx={{ color: '#E33096', mb: 1 }} />
            ) : (
              <Typography
                sx={{
                  fontFamily: 'Poppins',
                  fontSize: { xs: '10vw', sm: '8vw', md: '40px' },
                  fontWeight: 600,
                  color: '#201B1B',
                  lineHeight: 1.2
                }}
              >
                {formatCurrency(estadisticasConductor?.total_earnings || 0)}
              </Typography>
            )}
            <Typography
              sx={{
                fontFamily: 'Poppins',
                fontSize: { xs: '4vw', sm: '3.5vw', md: '16px' },
                fontWeight: 500,
                color: '#201B1B',
                textAlign: 'center'
              }}
            >
              Ganancias del día
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Mapa */}
      <Box 
        sx={{ 
          px: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 2, sm: 3 }
        }}
      >
        <Box
          sx={{
            height: { xs: '45vh', sm: '40vh', md: 296 },
            width: '100%',
            border: '1px solid #E8E5E5',
            borderRadius: '20px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {ubicacionActual ? (
            <MapView 
              lat={ubicacionActual.lat} 
              lng={ubicacionActual.lng}
              popupContent={
                <>
                  <strong>{perfilConductor?.first_name} {perfilConductor?.last_name}</strong><br/>
                  {perfilConductor?.vehicle} {perfilConductor?.model}<br/>
                  {modoActivo ? 'En servicio' : 'Fuera de servicio'}
                </>
              }
            />
          ) : (
            <Box 
              sx={{
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%', 
                backgroundColor: '#f5f5f5'
              }}
            >
              <Typography 
                sx={{
                  fontFamily: 'Poppins',
                  fontSize: { xs: '3.5vw', sm: '3vw', md: '14px' },
                  color: '#666',
                  textAlign: 'center'
                }}
              >
                Obteniendo ubicación...
              </Typography>
              <CircularProgress sx={{ mt: 2, color: '#E33096' }} size={24} />
            </Box>
          )}
        </Box>
      </Box>

      {/* Modal de permisos de ubicación */}
      <LocationPermissionModal
        open={showLocationModal}
        onClose={handleLocationModalClose}
        onRetry={handleLocationRetry}
        permissionState={geolocation.permissionState}
      />

      {/* Notificación mejorada con información de geolocalización */}
      <Snackbar
        open={!!error}
        autoHideDuration={geolocation.isIOSOrSafari ? 8000 : 6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ 
            width: '100%',
            '& .MuiAlert-message': {
              fontSize: { xs: '14px', sm: '16px' }
            }
          }}
        >
          {error}
          {geolocation.isIOSOrSafari && error?.toLowerCase().includes('permisos') && (
            <Button
              size="small"
              onClick={() => setShowLocationModal(true)}
              sx={{ 
                ml: 1, 
                color: 'inherit',
                textDecoration: 'underline'
              }}
            >
              Ver guía
            </Button>
          )}
        </Alert>
      </Snackbar>

      {/* Notificación de éxito */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {notification}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VistaConductor; 