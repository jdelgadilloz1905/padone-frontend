import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Navigation as NavigationIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import MapView from './MapView';
import type { Ride } from '../services/rideService';
import type { ConductorLocation } from '../services/conductorService';
import { conductorService } from '../services/conductorService';
import socketService from '../services/socketService';

interface ActiveRideViewProps {
  ride: Ride;
  driverLocation: ConductorLocation | null;
  onStartTrip: (rideId: string) => void;
  onCompleteTrip: (params: { rideId: string; actualCost?: number }) => void;
  isStartingTrip: boolean;
  isCompletingTrip: boolean;
  driverId?: number;
}

const ActiveRideView = ({
  ride,
  driverLocation,
  onStartTrip,
  onCompleteTrip,
  isStartingTrip,
  isCompletingTrip,
  driverId
}: ActiveRideViewProps) => {
  const { t } = useTranslation();
  const [notification, setNotification] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<ConductorLocation | null>(driverLocation);
  
  // Referencias para el rastreo de ubicación
  const watchPositionId = useRef<number | null>(null);
  const locationIntervalId = useRef<number | null>(null);

  // Inicializar rastreo de ubicación cuando se monta el componente
  useEffect(() => {
    if (driverId) {
      startLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [driverId]);

  // Función para enviar ubicación periódicamente
  const sendLocationPeriodically = async () => {
    if (!currentLocation || !driverId) return;

    try {
      await conductorService.actualizarUbicacion(driverId, currentLocation);
      
      // También enviar por WebSocket si está conectado
      if (socketService.isConnected()) {
        socketService.updateDriverLocation(currentLocation);
      }
    } catch (error) {
      console.error('Error enviando ubicación:', error);
    }
  };

  // Iniciar rastreo de ubicación
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setNotification('Tu navegador no soporta geolocalización');
      return;
    }

    console.log('🗺️ Iniciando rastreo de ubicación en carrera activa...');

    // Obtener ubicación inicial
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date().getTime()
        };
        
        console.log('📍 Ubicación obtenida en carrera:', location);
        setCurrentLocation(location);

        // Enviar ubicación inicial
        if (driverId) {
          conductorService.actualizarUbicacion(driverId, location);
          
          if (socketService.isConnected()) {
            socketService.updateDriverLocation(location);
          }
        }

        // Iniciar rastreo continuo
        watchPositionId.current = navigator.geolocation.watchPosition(
          (updatedPosition) => {
            const newLocation = {
              lat: updatedPosition.coords.latitude,
              lng: updatedPosition.coords.longitude,
              timestamp: new Date().getTime()
            };
            setCurrentLocation(newLocation);
          },
          (positionError) => {
            console.error('❌ Error al obtener la posición:', positionError);
            setNotification('Error al obtener tu ubicación');
          },
          { 
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 10000
          }
        );

        // Iniciar envío periódico cada 5 segundos
        locationIntervalId.current = setInterval(sendLocationPeriodically, 5000);
      },
      (positionError) => {
        console.error('❌ Error al obtener la posición inicial:', positionError);
        setNotification('Error al obtener tu ubicación inicial');
      }
    );
  };

  // Detener rastreo de ubicación
  const stopLocationTracking = () => {
    if (watchPositionId.current !== null) {
      navigator.geolocation.clearWatch(watchPositionId.current);
      watchPositionId.current = null;
    }
    
    if (locationIntervalId.current !== null) {
      clearInterval(locationIntervalId.current);
      locationIntervalId.current = null;
    }
  };

  // Efecto para envío periódico cuando cambia la ubicación
  useEffect(() => {
    if (currentLocation && driverId) {
      // Reiniciar el intervalo cuando cambia la ubicación
      if (locationIntervalId.current) {
        clearInterval(locationIntervalId.current);
      }
      locationIntervalId.current = setInterval(sendLocationPeriodically, 5000);
    }

    return () => {
      if (locationIntervalId.current) {
        clearInterval(locationIntervalId.current);
      }
    };
  }, [currentLocation, driverId]);

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Obtener texto del botón según el estado
  const getActionButtonText = () => {
    switch (ride.status) {
      case 'in_progress':
        return t('rides.actions.start');
      case 'on_the_way':
        return t('rides.actions.complete');
      default:
        return t('rides.actions.complete');
    }
  };

  // Obtener color del estado
  const getStatusColor = () => {
    switch (ride.status) {
      case 'in_progress':
        return '#FF9800';
      case 'on_the_way':
        return '#2196F3';
      default:
        return '#4CAF50';
    }
  };

  // Manejar acción del botón principal
  const handleMainAction = () => {
    if (ride.status === 'in_progress') {
      // Cambiar a "en vía" (on_the_way)
      onStartTrip(ride.id);
    } else {
      // Completar viaje
      onCompleteTrip({ rideId: ride.id, actualCost: ride.estimated_cost });
    }
  };

  // Abrir Google Maps para navegación
  const openNavigationApp = () => {
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    let url = '';
    
    // Si tenemos coordenadas, usarlas
    if (ride.pickup_latitude && ride.pickup_longitude) {
      if (isAndroid) {
        url = `geo:${ride.pickup_latitude},${ride.pickup_longitude}?q=${ride.pickup_latitude},${ride.pickup_longitude}(${encodeURIComponent(ride.pickup_location)})`;
      } else if (isIOS) {
        url = `maps://?q=${ride.pickup_latitude},${ride.pickup_longitude}&ll=${ride.pickup_latitude},${ride.pickup_longitude}`;
      } else {
        url = `https://www.google.com/maps?q=${ride.pickup_latitude},${ride.pickup_longitude}`;
      }
    } else {
      // Si no tenemos coordenadas, usar la dirección
      const destination = encodeURIComponent(ride.pickup_location);
      if (isAndroid) {
        url = `geo:0,0?q=${destination}`;
      } else if (isIOS) {
        url = `maps://?q=${destination}`;
      } else {
        url = `https://www.google.com/maps/search/?api=1&query=${destination}`;
      }
    }
    
    window.open(url, '_blank');
    setNotification(t('navigation.openingMapsApp'));
  };

  // Hacer llamada telefónica
  const makePhoneCall = () => {
    if (ride.user?.phone) {
      window.open(`tel:${ride.user.phone}`, '_self');
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* Notificaciones */}
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setNotification(null)} severity="info" sx={{ width: '100%' }}>
          {notification}
        </Alert>
      </Snackbar>

      {/* Header con estado de la carrera */}
      <Box
        sx={{
          backgroundColor: getStatusColor(),
          color: 'white',
          py: 2,
          px: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold' }}>
          {ride.status === 'in_progress' ? t('rides.statuses.inProgress') : 
           ride.status === 'on_the_way' ? t('rides.statuses.onWay') :
            t('rides.statuses.inProgress')}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'Poppins', opacity: 0.9 }}>
          {formatCurrency(ride.estimated_cost)}
        </Typography>
      </Box>

      {/* Información del cliente */}
      <Card sx={{ m: 2, border: '1px solid #E8E5E5', borderRadius: '12px', boxShadow: 'none' }}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                width: { xs: 50, sm: 60 },
                height: { xs: 50, sm: 60 },
                backgroundColor: '#E33096',
                mr: 2,
                fontSize: { xs: '18px', sm: '24px' }
              }}
            >
              {ride.user?.name?.charAt(0) || 'C'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Poppins',
                  fontWeight: 'bold',
                  fontSize: { xs: '16px', sm: '18px' }
                }}
              >
                {ride.user?.name || t('users.client')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'Poppins',
                  color: '#666',
                  fontSize: { xs: '12px', sm: '14px' }
                }}
              >
                {ride.user?.phone || 'Sin teléfono'}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<PhoneIcon />}
              onClick={makePhoneCall}
              disabled={!ride.user?.phone}
              sx={{
                borderColor: '#E33096',
                color: '#E33096',
                '&:hover': { backgroundColor: '#fce4ec' },
                fontSize: { xs: '12px', sm: '14px' },
                px: { xs: 1, sm: 2 }
              }}
            >
              Llamar
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Ubicaciones */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <LocationIcon sx={{ color: '#4CAF50', mr: 1, mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'Poppins', fontWeight: 'bold', color: '#4CAF50' }}
                >
                  Origen
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'Poppins',
                    color: '#333',
                    fontSize: { xs: '12px', sm: '14px' }
                  }}
                >
                  {ride.pickup_location}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <FlagIcon sx={{ color: '#F44336', mr: 1, mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'Poppins', fontWeight: 'bold', color: '#F44336' }}
                >
                  Destino
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'Poppins',
                    color: '#333',
                    fontSize: { xs: '12px', sm: '14px' }
                  }}
                >
                  {ride.destination}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Información del viaje */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 1,
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              p: 2
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{ fontFamily: 'Poppins', fontWeight: 'bold', color: '#333' }}
              >
                {ride.estimated_distance?.toFixed(1)} km
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontFamily: 'Poppins', color: '#666' }}
              >
                Distancia
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{ fontFamily: 'Poppins', fontWeight: 'bold', color: '#333' }}
              >
                {ride.estimated_duration} min
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontFamily: 'Poppins', color: '#666' }}
              >
                Tiempo
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{ fontFamily: 'Poppins', fontWeight: 'bold', color: '#333' }}
              >
                {ride.commission_percentage}%
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontFamily: 'Poppins', color: '#666' }}
              >
                Comisión
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Mapa */}
      <Box sx={{ mx: 2, mb: 2, flex: 1 }}>
        <Box
          sx={{
            height: { xs: '25vh', sm: '30vh' },
            border: '1px solid #E8E5E5',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          {ride.pickup_latitude && ride.pickup_longitude ? (
            <MapView
              lat={ride.pickup_latitude}
              lng={ride.pickup_longitude}
              popupContent={
                <>
                  <strong>Pasajero: {ride.user?.name}</strong><br />
                  {ride.pickup_location}
                </>
              }
              showDestination={ride.destination_latitude && ride.destination_longitude ? {
                lat: ride.destination_latitude,
                lng: ride.destination_longitude,
                title: ride.destination
              } : undefined}
              driverLocation={currentLocation ? {
                lat: currentLocation.lat,
                lng: currentLocation.lng
              } : undefined}
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
                  fontSize: { xs: '14px', sm: '16px' },
                  color: '#666',
                  textAlign: 'center',
                  mb: 1
                }}
              >
                Ubicaciones de la carrera
              </Typography>
              <Typography 
                sx={{
                  fontFamily: 'Poppins',
                  fontSize: { xs: '12px', sm: '14px' },
                  color: '#888',
                  textAlign: 'center'
                }}
              >
                📍 {ride.pickup_location}
              </Typography>
              <Typography 
                sx={{
                  fontFamily: 'Poppins',
                  fontSize: { xs: '12px', sm: '14px' },
                  color: '#888',
                  textAlign: 'center'
                }}
              >
                🎯 {ride.destination}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Botones de acción */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E8E5E5',
          p: 2,
          display: 'flex',
          gap: 2
        }}
      >
        <Button
          variant="outlined"
          startIcon={<NavigationIcon />}
          onClick={openNavigationApp}
          sx={{
            flex: 1,
            borderColor: '#E33096',
            color: '#E33096',
            fontFamily: 'Poppins',
            fontWeight: 'bold',
            py: 1.5,
            '&:hover': { backgroundColor: '#fce4ec' }
          }}
        >
          Navegación
        </Button>
        
        <Button
          variant="contained"
          onClick={handleMainAction}
          disabled={isStartingTrip || isCompletingTrip}
          sx={{
            flex: 2,
            backgroundColor: '#E33096',
            fontFamily: 'Poppins',
            fontWeight: 'bold',
            py: 1.5,
            '&:hover': { backgroundColor: '#c2185b' }
          }}
        >
          {isStartingTrip || isCompletingTrip ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            getActionButtonText()
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default ActiveRideView; 