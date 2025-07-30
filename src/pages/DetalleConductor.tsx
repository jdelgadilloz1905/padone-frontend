import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,

  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import MapView from '../components/MapView';
import { useConductores } from '../hooks/useConductores';


interface NotificacionState {
  open: boolean;
  mensaje: string;
  tipo: 'success' | 'error' | 'warning' | 'info';
}

const DetalleConductor = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Estado removido: ya no necesitamos edición inline
  
  // Estado para notificaciones
  const [notificacion, setNotificacion] = useState<NotificacionState>({
    open: false,
    mensaje: '',
    tipo: 'success'
  });

  // Hooks
  const { getConductor } = useConductores();
  const { data: conductor, isLoading, isError } = getConductor(id || '');

  // Cerrar notificación
  const handleCloseNotificacion = () => {
    setNotificacion(prev => ({ ...prev, open: false }));
  };

  // Generar enlace de Google Maps
  const getGoogleMapsUrl = (lat: number, lng: number, label?: string) => {
    const encodedLabel = label ? encodeURIComponent(label) : '';
    return `https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=15${encodedLabel ? `&t=m&label=${encodedLabel}` : ''}`;
  };

  // Abrir Google Maps
  const openInGoogleMaps = () => {
    if (conductor?.current_location) {
      const lat = conductor.current_location.coordinates[1];
      const lng = conductor.current_location.coordinates[0];
      const label = `${conductor.first_name} ${conductor.last_name} - ${conductor.vehicle} ${conductor.model}`;
      const url = getGoogleMapsUrl(lat, lng, label);
      window.open(url, '_blank');
    }
  };

  // Componente de icono de Google Maps
  const GoogleMapsIcon = () => (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        mr: 0.5,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%234285f4\'%3E%3Cpath d=\'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z\'/%3E%3C/svg%3E")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }}
    />
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !conductor) {
    return (
      <Paper elevation={2} sx={{ p: 3, bgcolor: '#fff9f9' }}>
        <Typography color="error">
          {t('driverDetail.loadError')}
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/conductores')}
          sx={{ mt: 2 }}
        >
          {t('driverDetail.backToDrivers')}
        </Button>
      </Paper>
    );
  }

  const getEstadoChip = (estado: string) => {
    const config: Record<string, { color: 'success' | 'error' | 'warning', label: string }> = {
      active: { color: 'success', label: t('driverEdit.available') },
      available: { color: 'success', label: t('driverEdit.available') },
      busy: { color: 'warning', label: t('driverEdit.busy') },
      inactive: { color: 'error', label: t('driverEdit.offline') },
      pending: { color: 'warning', label: t('driverEdit.pending') },
      // Mantener compatibilidad con estados en español
      activo: { color: 'success', label: t('driverEdit.available') },
      inactivo: { color: 'error', label: t('driverEdit.offline') },
      pendiente: { color: 'warning', label: t('driverEdit.pending') }
    };

    const { color, label } = config[estado] || { color: 'warning', label: estado };
    return <Chip label={label} color={color} />;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/conductores')}
            sx={{ mr: 2 }}
          >
            {t('driverDetail.back')}
          </Button>
          <Typography variant="h4" component="h1">
            {t('driverDetail.title')}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/conductores/${id}/edit`)}
            sx={{
              bgcolor: '#e5308a',
              '&:hover': {
                bgcolor: '#c5206a',
              }
            }}
          >
            {t('driverDetail.editComplete')}
          </Button>
        </Box>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box sx={{ width: { xs: '100%', md: '33.333%' } }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
              <Avatar
                src={conductor.profile_picture_url || undefined}
                sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main' }}
              >
                <PersonIcon fontSize="large" />
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {conductor.first_name} {conductor.last_name}
              </Typography>
              {getEstadoChip(conductor.status)}
            </Box>
            <Divider sx={{ my: 2 }} />
            <List>
              <ListItem>
                <PhoneIcon sx={{ mr: 2 }} />
                <ListItemText primary={t('driverDetail.phone')} secondary={conductor.phone_number} />
              </ListItem>
              <ListItem>
                <EmailIcon sx={{ mr: 2 }} />
                <ListItemText primary={t('driverEdit.email')} secondary={conductor.email} />
              </ListItem>
            </List>
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '66.667%' } }}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <CarIcon sx={{ mr: 1 }} />
              <Typography variant="h6">{t('driverDetail.vehicleInfo')}</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' }, mb: 2 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('driverDetail.brand')}
                    </Typography>
                    <Typography variant="body1">
                      {conductor.vehicle}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' }, mb: 2 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('driverDetail.model')}
                    </Typography>
                    <Typography variant="body1">
                      {conductor.model}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' }, mb: 2 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('driverDetail.plate')}
                    </Typography>
                    <Typography variant="body1">
                      {conductor.license_plate}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' }, mb: 2 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('driverDetail.year')}
                    </Typography>
                    <Typography variant="body1">
                      {conductor.year}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Stack>
          </Paper>

          {conductor.current_location && (
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <LocationIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">{t('driverDetail.currentLocation')}</Typography>
                </Box>
                <Tooltip title="Abrir ubicación en Google Maps en una nueva pestaña">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={
                      <Box display="flex" alignItems="center">
                        <GoogleMapsIcon />
                        <OpenInNewIcon sx={{ ml: 0.5, fontSize: 14 }} />
                      </Box>
                    }
                    onClick={openInGoogleMaps}
                    sx={{ 
                      textTransform: 'none',
                      borderColor: '#4285f4',
                      color: '#4285f4',
                      '&:hover': {
                        borderColor: '#3367d6',
                        backgroundColor: 'rgba(66, 133, 244, 0.04)'
                      }
                    }}
                  >
                    Google Maps
                  </Button>
                </Tooltip>
              </Box>
              
              {/* Mostrar coordenadas */}
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" component="div">
                  {t('driverDetail.coordinates')}: 
                  <Typography 
                    component="span" 
                    variant="body2" 
                    sx={{ 
                      color: '#4285f4', 
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      ml: 0.5,
                      display: 'inline-flex',
                      alignItems: 'center',
                      '&:hover': {
                        color: '#3367d6'
                      }
                    }}
                    onClick={openInGoogleMaps}
                    title={t('driverDetail.openInGoogleMaps')}
                  >
                    <GoogleMapsIcon />
                    {conductor.current_location.coordinates[1].toFixed(6)}, {conductor.current_location.coordinates[0].toFixed(6)}
                  </Typography>
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300, width: '100%' }}>
                <MapView 
                  lat={conductor.current_location.coordinates[1]}
                  lng={conductor.current_location.coordinates[0]}
                  popupContent={
                    <>
                      {conductor.first_name} {conductor.last_name} <br />
                      {conductor.vehicle} {conductor.model} ({conductor.license_plate})
                    </>
                  }
                />
              </Box>
            </Paper>
          )}

          {/* Sección de Documentos del Conductor */}
          <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="h6">Fotos y Documentos del Conductor</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
              gap: 2, 
              mt: 2, 
              width: '100%' 
            }}>
              {/* Licencia de Conducir */}
              <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                  Licencia de Conducir
                </Typography>
                <Box 
                  component="img"
                  src={conductor.driver_license || '/placeholder-image.jpg'}
                  alt="Licencia de Conducir"
                  sx={{ 
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}
                />
              </Card>

              {/* Seguro del Vehículo */}
              <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                  Seguro del Vehículo
                </Typography>
                <Box 
                  component="img"
                  src={conductor.additional_photos?.vehicle_insurance?.[0] || '/placeholder-image.jpg'}
                  alt="Seguro del Vehículo"
                  sx={{ 
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}
                />
              </Card>

              {/* Registro del Vehículo */}
              <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                  Registro del Vehículo
                </Typography>
                <Box 
                  component="img"
                  src={conductor.additional_photos?.vehicle_registration?.[0] || '/placeholder-image.jpg'}
                  alt="Registro del Vehículo"
                  sx={{ 
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}
                />
              </Card>

              {/* Foto del Vehículo */}
              <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                  Foto del Vehículo
                </Typography>
                <Box 
                  component="img"
                  src={conductor.additional_photos?.vehicle_photos?.[0] || '/placeholder-image.jpg'}
                  alt="Foto del Vehículo"
                  sx={{ 
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}
                />
              </Card>
            </Box>
          </Paper>
        </Box>
      </Stack>

      {/* Notificaciones */}
      <Snackbar
        open={notificacion.open}
        autoHideDuration={6000}
        onClose={handleCloseNotificacion}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotificacion}
          severity={notificacion.tipo}
          sx={{ width: '100%' }}
        >
          {notificacion.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DetalleConductor; 