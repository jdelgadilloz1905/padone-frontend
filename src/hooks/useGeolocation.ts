import { useState, useEffect, useRef, useCallback } from 'react';

export interface GeolocationState {
  coordinates: {
    lat: number;
    lng: number;
    timestamp: number;
  } | null;
  error: string | null;
  loading: boolean;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
  isSupported: boolean;
  accuracy: number | null;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  onLocationUpdate?: (coordinates: { lat: number; lng: number; timestamp: number }) => void;
  onError?: (error: string) => void;
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 15000, // 15 segundos timeout
    maximumAge = 60000, // 1 minuto cache
    watchPosition = false,
    onLocationUpdate,
    onError
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: false,
    permissionState: 'unknown',
    isSupported: 'geolocation' in navigator,
    accuracy: null
  });

  const watchId = useRef<number | null>(null);
  const timeoutId = useRef<number | null>(null);

  // Detectar si estamos en iOS/Safari
  const isIOSOrSafari = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod|safari/.test(userAgent) && !/chrome|firefox|opera|edge/.test(userAgent);
  }, []);

  // Detectar el estado de permisos
  const checkPermissions = useCallback(async () => {
    if (!('permissions' in navigator)) {
      return 'unknown';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return result.state;
    } catch (error) {
      console.warn('Error checking geolocation permissions:', error);
      return 'unknown';
    }
  }, []);

  // Función para solicitar permisos de forma amigable
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!state.isSupported) {
      const errorMsg = 'Tu dispositivo no soporta geolocalización';
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      onError?.(errorMsg);
      return false;
    }

    try {
      // Verificar permisos primero
      const permissionState = await checkPermissions();
      
      if (permissionState === 'denied') {
        const errorMsg = isIOSOrSafari() 
          ? 'Permisos de ubicación denegados. Ve a Configuración > Safari > Ubicación y activa "Mientras uses la app"'
          : 'Permisos de ubicación denegados. Permite el acceso a la ubicación en la configuración del navegador';
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorMsg, 
          permissionState: 'denied' 
        }));
        onError?.(errorMsg);
        return false;
      }

      // Intentar obtener ubicación (esto también solicita permisos en iOS)
      const position = await getCurrentPositionWithPromise();
      
      const coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now()
      };

      setState(prev => ({
        ...prev,
        coordinates,
        loading: false,
        error: null,
        permissionState: 'granted',
        accuracy: position.coords.accuracy
      }));

      onLocationUpdate?.(coordinates);
      return true;

    } catch (error) {
      const errorMsg = handleGeolocationError(error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMsg,
        permissionState: 'denied'
      }));
      onError?.(errorMsg);
      return false;
    }
  }, [state.isSupported, checkPermissions, isIOSOrSafari, onLocationUpdate, onError]);

  // Promisificar getCurrentPosition para mejor manejo de errores
  const getCurrentPositionWithPromise = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      const positionOptions: PositionOptions = {
        enableHighAccuracy,
        timeout,
        maximumAge
      };

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        positionOptions
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  // Manejar errores de geolocalización con mensajes específicos
  const handleGeolocationError = useCallback((error: any): string => {
    console.error('Geolocation error:', error);

    if (error?.code) {
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          return isIOSOrSafari()
            ? 'Acceso a ubicación denegado. Ve a Configuración > Safari > Ubicación y selecciona "Mientras uses la app"'
            : 'Acceso a ubicación denegado. Permite el acceso en la configuración del navegador';
        
        case 2: // POSITION_UNAVAILABLE
          return 'No se puede determinar tu ubicación. Verifica que el GPS esté activado y tengas buena señal';
        
        case 3: // TIMEOUT
          return 'Tiempo de espera agotado. Inténtalo de nuevo o verifica tu conexión GPS';
        
        default:
          return 'Error desconocido al obtener ubicación';
      }
    }

    return 'Error al obtener ubicación. Verifica los permisos y el GPS';
  }, [isIOSOrSafari]);

  // Iniciar seguimiento de ubicación
  const startWatching = useCallback(async () => {
    if (!state.isSupported) {
      const errorMsg = 'Geolocalización no soportada';
      setState(prev => ({ ...prev, error: errorMsg }));
      onError?.(errorMsg);
      return false;
    }

    // Primero solicitar permisos
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return false;
    }

    // Iniciar seguimiento continuo
    const positionOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge: 10000 // Cache más corto para watch
    };

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now()
        };

        setState(prev => ({
          ...prev,
          coordinates,
          error: null,
          accuracy: position.coords.accuracy
        }));

        onLocationUpdate?.(coordinates);
      },
      (error) => {
        const errorMsg = handleGeolocationError(error);
        setState(prev => ({ ...prev, error: errorMsg }));
        onError?.(errorMsg);
      },
      positionOptions
    );

    return true;
  }, [state.isSupported, requestPermissions, enableHighAccuracy, timeout, maximumAge, onLocationUpdate, onError, handleGeolocationError]);

  // Detener seguimiento
  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, []);

  // Obtener ubicación una sola vez
  const getCurrentLocation = useCallback(async () => {
    return await requestPermissions();
  }, [requestPermissions]);

  // Mostrar guía para iOS específicamente
  const showIOSLocationGuide = useCallback(() => {
    if (isIOSOrSafari()) {
      return {
        title: 'Activar ubicación en iOS/Safari',
        steps: [
          '1. Ve a Configuración en tu iPhone/iPad',
          '2. Busca y toca "Safari"',
          '3. Toca "Ubicación"',
          '4. Selecciona "Mientras uses la app"',
          '5. Regresa a esta página y actualiza'
        ]
      };
    }
    return null;
  }, [isIOSOrSafari]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  // Auto-iniciar si watchPosition está habilitado
  useEffect(() => {
    if (watchPosition && state.isSupported) {
      startWatching();
    }
    return () => {
      if (watchPosition) {
        stopWatching();
      }
    };
  }, [watchPosition, state.isSupported, startWatching, stopWatching]);

  return {
    ...state,
    requestPermissions,
    startWatching,
    stopWatching,
    getCurrentLocation,
    showIOSLocationGuide,
    isIOSOrSafari: isIOSOrSafari()
  };
}; 