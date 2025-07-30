import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress,
  Alert,
  Chip,
  Avatar
} from '@mui/material';
import { Phone as PhoneIcon, LocationOn as LocationIcon, Flag as FlagIcon } from '@mui/icons-material';
import MapView from '../components/MapView';
import { useTracking } from '../hooks/useTracking';

const TrackingPublico = () => {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const { data: trackingData, isLoading, error, isError } = useTracking(trackingCode || '');

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': '#F39C13',
      'in_progress': '#FF9800',
      'on_the_way': '#2196F3',
      'completed': '#4CAF50',
      'cancelled': '#F44336'
    };
    return colorMap[status] || '#95888B';
  };

  // Función para obtener el texto del estado
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Buscando conductor',
      'in_progress': 'Conductor asignado',
      'on_the_way': 'En camino',
      'completed': 'Completado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  // Formatear moneda
  const formatCurrency = (amount: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numAmount);
  };

  // Formatear distancia
  const formatDistance = (distance: string) => {
    const numDistance = parseFloat(distance);
    return numDistance > 1 ? `${numDistance.toFixed(1)} km` : `${(numDistance * 1000).toFixed(0)} m`;
  };

  // Formatear tiempo
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

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
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#E33096', mb: 2 }} />
          <Typography sx={{ fontFamily: 'Poppins' }}>
            Cargando información de seguimiento...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (isError || !trackingData) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          backgroundColor: '#FFFFFF',
          p: { xs: 2, sm: 3 }
        }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            maxWidth: 600, 
            mx: 'auto', 
            mt: 4,
            fontSize: { xs: '14px', sm: '16px' }
          }}
        >
          {error?.message || 'Error al cargar la información de seguimiento'}
        </Alert>
      </Box>
    );
  }

  const { ride } = trackingData;
  const originCoords = ride.origin_coordinates?.coordinates || [0, 0];
  const destinationCoords = ride.destination_coordinates?.coordinates || [0, 0];

  // Adaptar la ubicación del conductor al formato esperado por MapView
  const driverLocation = ride.driver?.current_location && ride.driver.current_location.coordinates
    ? {
        lat: ride.driver.current_location.coordinates[1], // lat es el segundo elemento
        lng: ride.driver.current_location.coordinates[0], // lng es el primer elemento
        profileImage: ride.driver.profile_image,
      }
    : undefined;

  return (
    <Box 
      sx={{ 
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden'
      }}
    >
      {/* Header con logo y estado */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #E33096 0%, #FF6B9D 100%)',
          color: 'white',
          py: { xs: 2, sm: 2.5 },
          px: { xs: 2, sm: 3 }
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography
            sx={{
              fontSize: { xs: '20px', sm: '24px' },
              fontWeight: 'bold',
              fontFamily: 'Poppins',
              mb: 0.5
            }}
          >
            TAXI ROSA
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '12px', sm: '14px' },
              fontFamily: 'Poppins',
              opacity: 0.9
            }}
          >
            Seguimiento de viaje
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <Chip
            label={getStatusText(ride.status)}
            sx={{
              backgroundColor: getStatusColor(ride.status),
              color: 'white',
              fontWeight: 'bold',
              fontSize: { xs: '11px', sm: '12px' },
              px: 1.5,
              py: 0.5
            }}
          />
        </Box>

        <Typography
          sx={{
            fontSize: { xs: '16px', sm: '20px' },
            fontWeight: 'bold',
            fontFamily: 'Poppins',
            textAlign: 'center'
          }}
        >
          {formatCurrency(ride.price)}
        </Typography>
      </Box>

      {/* Información del cliente */}
      <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        <Card sx={{ borderRadius: '12px', boxShadow: 2, mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar 
                sx={{ 
                  bgcolor: '#E33096', 
                  mr: 2,
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 }
                }}
              >
                {ride.client.first_name.charAt(0)}
              </Avatar>
              <Box>
                <Typography
                  sx={{
                    fontFamily: 'Poppins',
                    fontSize: { xs: '16px', sm: '18px' },
                    fontWeight: 600,
                    color: '#201B1B'
                  }}
                >
                  {ride.client.first_name} {ride.client.last_name || ''}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: '#666', mr: 0.5 }} />
                  <Typography
                    sx={{
                      fontFamily: 'Poppins',
                      fontSize: { xs: '13px', sm: '14px' },
                      color: '#666'
                    }}
                  >
                    {ride.client.phone_number}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Información del viaje */}
        <Card sx={{ borderRadius: '12px', boxShadow: 2, mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Origen */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <LocationIcon sx={{ color: '#4CAF50', fontSize: 20, mr: 1, mt: 0.5 }} />
              <Box>
                <Typography
                  sx={{
                    fontFamily: 'Poppins',
                    fontSize: { xs: '12px', sm: '13px' },
                    fontWeight: 600,
                    color: '#4CAF50',
                    textAlign: 'left',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  Origen
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Poppins',
                    fontSize: { xs: '14px', sm: '15px' },
                    color: '#201B1B',
                    lineHeight: 1.4
                  }}
                >
                  {ride.origin}
                </Typography>
              </Box>
            </Box>

            {/* Destino */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
              <FlagIcon sx={{ color: '#F44336', fontSize: 20, mr: 1, mt: 0.5 }} />
              <Box>
                <Typography
                  sx={{
                    fontFamily: 'Poppins',
                    fontSize: { xs: '12px', sm: '13px' },
                    fontWeight: 600,
                    color: '#F44336',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  Destino
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Poppins',
                    fontSize: { xs: '14px', sm: '15px' },
                    color: '#201B1B',
                    lineHeight: 1.4
                  }}
                >
                  {ride.destination}
                </Typography>
              </Box>
            </Box>

            {/* Estadísticas del viaje */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-around',
                pt: 2,
                borderTop: '1px solid #E0E0E0'
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  sx={{
                    fontFamily: 'Poppins',
                    fontSize: { xs: '16px', sm: '18px' },
                    fontWeight: 600,
                    color: '#201B1B'
                  }}
                >
                  {formatDistance(ride.distance)}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Poppins',
                    fontSize: { xs: '11px', sm: '12px' },
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  Distancia
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  sx={{
                    fontFamily: 'Poppins',
                    fontSize: { xs: '16px', sm: '18px' },
                    fontWeight: 600,
                    color: '#201B1B'
                  }}
                >
                  {formatDuration(ride.duration)}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Poppins',
                    fontSize: { xs: '11px', sm: '12px' },
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  Tiempo
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  sx={{
                    fontFamily: 'Poppins',
                    fontSize: { xs: '16px', sm: '18px' },
                    fontWeight: 600,
                    color: '#201B1B'
                  }}
                >
                  {formatCurrency(ride.price)}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Poppins',
                    fontSize: { xs: '11px', sm: '12px' },
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}
                >
                  Precio
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Información del conductor (si está asignado) */}
        {ride.driver && (
          <Card sx={{ borderRadius: '12px', boxShadow: 2, mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography
                sx={{
                  fontFamily: 'Poppins',
                  fontSize: { xs: '14px', sm: '16px' },
                  fontWeight: 600,
                  color: '#201B1B',
                  mb: 2
                }}
              >
                Tu conductor
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    bgcolor: '#2196F3', 
                    mr: 2,
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 }
                  }}
                >
                  {ride.driver.first_name.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: 'Poppins',
                      fontSize: { xs: '15px', sm: '16px' },
                      fontWeight: 600,
                      color: '#201B1B'
                    }}
                  >
                    {ride.driver.first_name} {ride.driver.last_name}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Poppins',
                      fontSize: { xs: '13px', sm: '14px' },
                      color: '#666'
                    }}
                  >
                    {ride.driver.license_plate}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Mapa */}
        <Card sx={{ borderRadius: '12px', boxShadow: 2, overflow: 'hidden' }}>
          <Box
            sx={{
              height: { xs: '300px', sm: '400px' },
              width: '100%'
            }}
          >
            <MapView 
              lat={originCoords[1]} // GeoJSON format: [lng, lat]
              lng={originCoords[0]}
              showDestination={{
                lat: destinationCoords[1],
                lng: destinationCoords[0],
                title: ride.destination
              }}
              driverLocation={driverLocation}
            />
          </Box>
        </Card>

        {/* Información adicional */}
        <Box sx={{ textAlign: 'center', mt: 3, mb: 2 }}>
          <Typography
            sx={{
              fontFamily: 'Poppins',
              fontSize: { xs: '11px', sm: '12px' },
              color: '#666'
            }}
          >
            Código de seguimiento: {ride.tracking_code}
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Poppins',
              fontSize: { xs: '10px', sm: '11px' },
              color: '#999',
              mt: 1
            }}
          >
            Actualización automática cada 5 segundos
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default TrackingPublico; 