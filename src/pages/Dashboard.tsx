import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useMediaQuery, useTheme } from '@mui/material';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  IconButton,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Skeleton,
  Card,
  CardContent,
  Divider,
  Avatar,
  Fab,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { 
  PageContainer,
  FilterContainer,
  searchBarStyle
} from '../theme/standardStyles';
import { 
  Visibility as VisibilityIcon, 
  Close as CloseIcon, 
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { GoogleMap, Marker } from '@react-google-maps/api';
import mapService from '../services/mapService';
import socketService from '../services/socketService';
import authService, { type User } from '../services/authService';
import type { Driver } from '../services/mapService';
import type { RideRequest } from '../services/requestService';
import { useDashboardData } from '../hooks/useDashboardData';
import type { DashboardFilters } from '../services/dashboardService';
import RequestDetailsModal from '../components/dashboard/RequestDetailsModal';
import ConfirmDeleteModal from '../components/dashboard/ConfirmDeleteModal';
import rideService from '../services/rideService';
import useGoogleMaps from '../hooks/useGoogleMaps';

// Componente memoizado para Google Maps para evitar re-renderizados innecesarios
const Map = memo(({ drivers, isMobile }: { drivers: Driver[]; isMobile: boolean }) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const centerRef = useRef({
    lat: 39.0997,
    lng: -94.5786
  });
  
  const mapContainerStyle = {
    width: '100%',
    height: isMobile ? '250px' : '300px' // Altura responsiva
  };

  // Configuración del icono personalizado para los marcadores (usamos solo uno)
  const carIcon = {
    url: 'https://maps.google.com/mapfiles/ms/icons/cabs.png',
    scaledSize: new google.maps.Size(32, 32)
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);
  
  // Ya no necesitamos onCenterChanged ya que estamos usando refs

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={centerRef.current}
      zoom={isMobile ? 12 : 13} // Zoom responsivo
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        streetViewControl: false,
        mapTypeControl: !isMobile, // Ocultar en móvil
        fullscreenControl: !isMobile, // Ocultar en móvil
        gestureHandling: isMobile ? 'cooperative' : 'auto' // Mejor UX en móvil
      }}
    >
      {drivers
        .filter(driver => 
          driver.location && 
          typeof driver.location.lat === 'number' && 
          typeof driver.location.lng === 'number' &&
          !isNaN(driver.location.lat) && 
          !isNaN(driver.location.lng)
        )
        .map((driver) => (
          <Marker 
            key={driver.id}
            position={{
              lat: driver.location.lat,
              lng: driver.location.lng
            }}
            title={driver.name}
            icon={carIcon}
          />
        ))
      }
    </GoogleMap>
  );
});

// Componente de mapa con carga del script separada
const MapComponent = ({ isMobile }: { isMobile: boolean }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isLoaded, loadError } = useGoogleMaps();

  useEffect(() => {
    // Cargar conductores iniciales
    const loadDrivers = async () => {
      try {
        const activeDrivers = await mapService.getActiveDrivers();
        console.log("Conductores activos cargados:", activeDrivers);
        setDrivers(activeDrivers);
        setLoading(false);
      } catch (err) {
        console.error("Error loading drivers:", err);
        setError("No se pudieron cargar los conductores activos");
        setLoading(false);
      }
    };
    
    loadDrivers();
    
    // Iniciar actualizaciones en tiempo real
    const realTimeUpdates = mapService.startRealTimeUpdates((updatedDrivers) => {
      console.log("Actualización de conductores en tiempo real:", updatedDrivers);
      setDrivers(updatedDrivers);
      setLoading(false);
    });
    
    // Limpiar al desmontar
    return () => {
      realTimeUpdates.stop();
    };
  }, []);

  const errorHeight = isMobile ? '250px' : '300px';

  if (loadError) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: errorHeight,
          backgroundColor: '#fff0f0',
          borderRadius: 1,
          color: 'error.main'
        }}
      >
        <Typography variant={isMobile ? "body2" : "body1"}>Error cargando el mapa</Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: errorHeight,
          backgroundColor: '#f5f5f5',
          borderRadius: 1
        }}
      >
        <CircularProgress size={isMobile ? 24 : 32} />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: errorHeight,
          backgroundColor: '#f5f5f5',
          borderRadius: 1
        }}
      >
        <CircularProgress size={isMobile ? 24 : 32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: errorHeight,
          backgroundColor: '#fff0f0',
          borderRadius: 1,
          color: 'error.main'
        }}
      >
        <Typography variant={isMobile ? "body2" : "body1"}>{error}</Typography>
      </Box>
    );
  }

  return <Map drivers={drivers} isMobile={isMobile} />;
};

// Componente móvil para solicitudes de viaje
const RequestMobileCard = ({ request, onViewDetails, onCancelRequest, getStatusChipStyle, getStatusTranslation, formatTimeOnly }: {
  request: RideRequest;
  onViewDetails: (request: RideRequest) => void;
  onCancelRequest: (request: RideRequest) => void;
  getStatusChipStyle: (status: RideRequest['status']) => any;
  getStatusTranslation: (status: RideRequest['status']) => string;
  formatTimeOnly: (timestamp: string) => string;
}) => {
  return (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 2,
        borderRadius: 2,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header con ID y estado */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#e5308a', fontSize: '0.875rem' }}>
              #{request.id ? request.id.toString().slice(-2) : '??'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {(request as any).client && ((request as any).client.first_name || (request as any).client.last_name)
                  ? `${(request as any).client.first_name || ''} ${(request as any).client.last_name || ''}`.trim()
                  : request.clientName || 'Pasajero sin nombre'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Solicitud #{request.id || 'N/A'}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={getStatusTranslation(request.status)}
            sx={getStatusChipStyle(request.status)}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Información del viaje */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              🔹 Origen
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {typeof request.origin === 'string' ? request.origin : request.origin?.address || 'N/A'}
            </Typography>
          </Box>
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              🎯 Destino
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {typeof request.destination === 'string' ? request.destination : request.destination?.address || 'N/A'}
            </Typography>
          </Box>
          
          {/* Conductor asignado */}
          {request.driver && request.driver.name && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                👤 Conductor
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: '#4caf50', fontSize: '0.75rem' }}>
                  {request.driver.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="body2">
                  {request.driver.name}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Acciones */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {request.createdAt ? formatTimeOnly(request.createdAt) : 'Time N/A'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => onViewDetails(request)}
              size="small"
              sx={{
                bgcolor: 'rgba(229, 48, 138, 0.1)',
                color: '#e5308a',
                minWidth: 40,
                minHeight: 40,
                '&:hover': { bgcolor: 'rgba(229, 48, 138, 0.2)' }
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            {(request.status !== 'completed' && request.status !== 'cancelled') && (
              <IconButton
                onClick={() => onCancelRequest(request)}
                size="small"
                sx={{
                  bgcolor: 'rgba(158, 158, 158, 0.1)',
                  color: '#757575',
                  minWidth: 40,
                  minHeight: 40,
                  '&:hover': { bgcolor: 'rgba(158, 158, 158, 0.2)' }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 🆕 NUEVO: Estados para filtros del dashboard
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').join('-');
  const [filters, setFilters] = useState<DashboardFilters>({
    start_date: todayStr,
    end_date: todayStr
  });
  
  // Estado local para el input de búsqueda (para debounce)
  const [searchInput, setSearchInput] = useState('');

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchInput || undefined
      }));
    }, 500); // 500ms de delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // 🆕 NUEVO: Estados para modales de acciones
  const [selectedRequest, setSelectedRequest] = useState<RideRequest | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Obtener perfil del usuario desde el servidor
  const { data: userProfile } = useQuery<User>({
    queryKey: ['userProfile'],
    queryFn: () => authService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Procesar información del usuario
  const userInfo = {
    name: userProfile?.first_name || 'Usuario',
    role: userProfile?.role ? t(`header.${userProfile.role}`) || userProfile.role : t('header.admin'),
    firstName: userProfile?.first_name ? userProfile.first_name.split(' ')[0] : 'Usuario'
  };
  
  // 🆕 NUEVO: Usar el hook useDashboardData con filtros
  const {
    data,
    isLoading,
    hasError,
    isRefetching,
    connectionStatus,
    actions
  } = useDashboardData(filters);

  const { metrics, requests: rideRequests, driverStats } = data;

  // 🆕 NUEVO: Filtrado en memoria por estado (solo frontend)
  const filteredRideRequests = filters.status
    ? (rideRequests || []).filter(r => (r.status === filters.status))
    : (rideRequests || []);

  // Manejar cambios en filtros de fecha
  const handleFilterChange = (campo: keyof DashboardFilters, valor: any) => {
    setFilters(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Manejar cambios en la búsqueda
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  useEffect(() => {
    // Conectarse al WebSocket como administrador
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token, true);
    }

    // Limpiar al desmontar
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Datos para las tarjetas del dashboard desde APIs reales con colores específicos
  const dashboardCards = [
    { 
      title: t('dashboard.totalRides'), 
      value: metrics?.totalRides || 0, 
      color: '#e91e63', // Rosa/magenta como Total comisiones
      bgColor: 'rgba(233, 30, 99, 0.1)',
      icon: DashboardIcon,
      isConnected: connectionStatus.metricsConnected
    },
    { 
      title: t('dashboard.activeRequests'), 
      value: metrics?.activeRides || 0, 
      color: '#9c27b0', // Morado/violeta como Carreras realizadas
      bgColor: 'rgba(156, 39, 176, 0.1)',
      icon: TrendingUpIcon,
      isConnected: connectionStatus.requestsConnected
    },
    { 
      title: t('dashboard.onlineDrivers'), 
      value: driverStats?.activeDrivers || 0, 
      color: '#3f51b5', // Azul como Comisión promedio
      bgColor: 'rgba(63, 81, 181, 0.1)',
      icon: PeopleIcon,
      isConnected: connectionStatus.driverStatsConnected
    },
    { 
      title: t('dashboard.totalDrivers'), 
      value: driverStats?.totalDrivers || 0, 
      color: '#4caf50', // Verde como Conductores activos
      bgColor: 'rgba(76, 175, 80, 0.1)',
      icon: CarIcon,
      isConnected: connectionStatus.driverStatsConnected
    }
  ];

  const getStatusChipStyle = (status: RideRequest['status']) => {
    const styles = {
      pending: { bg: '#f5f5f5', color: '#757575' },
      assigned: { bg: '#e5f6ea', color: '#1e9d48' },
      in_progress: { bg: '#fff4e5', color: '#ff9800' },
      completed: { bg: '#e3f2fd', color: '#2196f3' },
      cancelled: { bg: '#ffebee', color: '#f44336' }
    };
    
    return styles[status] || styles.pending;
  };

  const getStatusTranslation = (status: RideRequest['status']) => {
    const translations = {
      pending: t('requests.statuses.pending'),
      assigned: t('requests.statuses.assigned'),
      in_progress: t('requests.statuses.inProgress'),
      completed: t('requests.statuses.completed'),
      cancelled: t('requests.statuses.cancelled')
    };
    
    return translations[status] || status;
  };

  // Solo tiempo para las tarjetas móviles
  const formatTimeOnly = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Función para formatear la fecha de solicitud en formato MM/DD/YYYY
  const formatRequestDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  // Funciones de manejo de modales
  const handleViewDetails = (request: RideRequest) => {
    setSelectedRequest(request);
    setDetailsModalOpen(true);
  };

  const handleCancelRequest = (request: RideRequest) => {
    setDeletingRequestId(request.id);
    setDeleteModalOpen(true);
  };

  const handleReassignDriver = (requestId: string) => {
    console.log('Reasignar conductor para solicitud:', requestId);
    // Aquí se implementaría la lógica de reasignación
  };

  const closeAllModals = () => {
    setDetailsModalOpen(false);
    setSelectedRequest(null);
    setDeleteModalOpen(false);
    setDeletingRequestId(null);
  };

  // Opciones de estado para el selector, igual que en Solicitudes.tsx
  const statusOptions = [
    { value: '', label: t('requests.filters.all') },
    { value: 'pending', label: t('requests.filters.pending') },
    { value: 'in_progress', label: t('requests.filters.inProgress') },
    { value: 'on_the_way', label: t('requests.filters.onTheWay') },
    { value: 'completed', label: t('requests.filters.completed') },
    { value: 'cancelled', label: t('requests.filters.cancelled') },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <PageContainer>
        {/* Header responsive */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          mb: 2,
          gap: isMobile ? 2 : 0
        }}>
          <Typography variant="body1" sx={{ color: '#e5308a' }}>
            {t('common.welcome')} {userInfo.firstName || 'Usuario'}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-end'
          }}>
            {/* Indicadores de conexión y botón de refrescar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {hasError && !isMobile && (
                <Alert severity="warning" sx={{ py: 0, fontSize: '0.75rem' }}>
                  Algunos datos pueden estar desactualizados
                </Alert>
              )}
              <IconButton 
                onClick={actions.refreshAllData}
                disabled={isRefetching}
                size="small"
                sx={{ color: '#e5308a' }}
                title="Refrescar datos"
              >
                <RefreshIcon sx={{ fontSize: 20 }} />
              </IconButton>
              <Box title={connectionStatus.metricsConnected ? "Conectado a APIs" : "Desconectado de APIs"}>
                {connectionStatus.metricsConnected ? (
                  <WifiIcon sx={{ color: 'success.main', fontSize: 20 }} />
                ) : (
                  <WifiOffIcon sx={{ color: 'error.main', fontSize: 20 }} />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* 🆕 NUEVO: Filtros del dashboard */}
        <FilterContainer>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
            <DatePicker
              label={t('commissions.startDate')}
              value={filters.start_date ? new Date(filters.start_date) : null}
              onChange={(date: Date | null) => handleFilterChange('start_date', date ? date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : undefined)}
              format="MM/dd/yyyy"
              slotProps={{
                textField: { 
                  size: 'small', 
                  sx: { 
                    minWidth: 150,
                    '& .MuiInputBase-root': {
                      minHeight: '44px'
                    }
                  } 
                }
              }}
            />
            <DatePicker
              label={t('commissions.endDate')}
              value={filters.end_date ? new Date(filters.end_date) : null}
              onChange={(date: Date | null) => handleFilterChange('end_date', date ? date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : undefined)}
              format="MM/dd/yyyy"
              slotProps={{
                textField: { 
                  size: 'small', 
                  sx: { 
                    minWidth: 150,
                    '& .MuiInputBase-root': {
                      minHeight: '44px'
                    }
                  } 
                }
              }}
            />
            <TextField
              {...searchBarStyle}
              placeholder={t('requests.search.placeholder')}
              value={searchInput}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              sx={{ 
                minWidth: 200,
                '& .MuiInputBase-root': {
                  minHeight: '44px'
                }
              }}
            />
            {/* Selector de estado */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={filters.status || ''}
                displayEmpty
                onChange={e => handleFilterChange('status', e.target.value || undefined)}
                renderValue={selected => statusOptions.find(opt => opt.value === selected)?.label || t('requests.filters.all')}
              >
                {statusOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </FilterContainer>
        
        <Typography variant={isMobile ? "h6" : "h5"} sx={{ mb: 3, fontWeight: 'medium', textAlign: 'start' }}>
          {t('dashboard.title')}
        </Typography>
        
        {/* Tarjetas de resumen */}
        <Box sx={{ mb: 3 }}>
          <Stack 
            direction={isMobile ? "column" : "row"} 
            spacing={isMobile ? 1.5 : 2} 
            flexWrap={!isMobile ? "wrap" : undefined}
            justifyContent={isMobile ? 'center' : 'space-between'}
          >
            {dashboardCards.map((card, index) => (
              <Box key={index} sx={{ 
                flexBasis: { xs: '100%', sm: '45%', md: '22%' }, 
                marginBottom: isMobile ? 0 : 2 
              }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: isMobile ? 1.5 : 2, 
                    height: isMobile ? '80px' : '106px', 
                    borderRadius: 2, 
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      width: isMobile ? 32 : 40, 
                      height: isMobile ? 32 : 40, 
                      borderRadius: '50%', 
                      bgcolor: card.bgColor, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mr: isMobile ? 1.5 : 2
                    }}
                  >
                    <card.icon 
                      sx={{ 
                        fontSize: isMobile ? 16 : 20, 
                        color: card.color
                      }} 
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant={isMobile ? "caption" : "body2"} 
                      color="text.secondary"
                      sx={{ 
                        fontWeight: 500,
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {card.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: isMobile ? '1.5rem' : '2rem',
                          lineHeight: 1
                        }}
                      >
                        {isLoading ? (
                          <Skeleton width={isMobile ? 40 : 60} height={isMobile ? 30 : 40} />
                        ) : (
                          card.value
                        )}
                      </Typography>
                      {/* 🆕 NUEVO: Indicador de estado de conexión por tarjeta */}
                      {!isLoading && !card.isConnected && (
                        <WifiOffIcon sx={{ color: 'error.main', fontSize: isMobile ? 14 : 16 }} />
                      )}
                      {isRefetching && (
                        <CircularProgress size={isMobile ? 14 : 16} sx={{ color: '#e5308a' }} />
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Box>
            ))}
          </Stack>
        </Box>
        
        {/* Listado de solicitudes recientes */}
        <Box sx={{ mb: 3 }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            fontSize: isMobile ? '1.125rem' : '1.25rem'
          }}>
            <Box component="span" 
              sx={{ 
                mr: 1, 
                width: isMobile ? 16 : 20, 
                height: isMobile ? 16 : 20, 
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Box component="span"
                sx={{
                  width: isMobile ? 10 : 12,
                  height: isMobile ? 10 : 12,
                  bgcolor: '#e5308a',
                  borderRadius: 0.5
                }}
              />
            </Box>
            {t('dashboard.recentRequests')}
          </Typography>
          
          {/* Renderizado condicional: Desktop = Tabla, Mobile = Cards */}
          {!isMobile && (
            <Paper 
              elevation={0} 
              sx={{ 
                borderRadius: 2, 
                border: '1px solid #e0e0e0',
                overflow: 'hidden'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('requests.client')}</TableCell>
                    <TableCell>{t('requests.requestDate')}</TableCell>
                    <TableCell>{t('requests.origin')}</TableCell>
                    <TableCell>{t('requests.destination')}</TableCell>
                    <TableCell>{t('requests.status')}</TableCell>
                    <TableCell>{t('requests.assignedDriver')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* 🆕 NUEVO: Skeleton loading para solicitudes */}
                  {isLoading ? (
                    // Mostrar 3 filas de skeleton mientras carga
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <Box>
                            <Skeleton width={60} height={20} />
                            <Skeleton width={120} height={16} />
                          </Box>
                        </TableCell>
                        <TableCell><Skeleton width={120} height={20} /></TableCell>
                        <TableCell><Skeleton width={200} height={20} /></TableCell>
                        <TableCell><Skeleton width={200} height={20} /></TableCell>
                        <TableCell><Skeleton width={80} height={20} /></TableCell>
                        <TableCell><Skeleton width={100} height={20} /></TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Skeleton variant="circular" width={32} height={32} />
                            <Skeleton variant="circular" width={32} height={32} />
                            <Skeleton variant="circular" width={32} height={32} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredRideRequests && filteredRideRequests.length > 0 ? (
                    // Mostrar solicitudes reales
                    filteredRideRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              #{request.id}
                            </Typography>
                            <Typography variant="body2">
                              {(request as any).client && ((request as any).client.first_name || (request as any).client.last_name)
                                ? `${(request as any).client.first_name || ''} ${(request as any).client.last_name || ''}`.trim()
                                : request.clientName || '-'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                             {(request as any)['request_date'] ? formatRequestDate((request as any)['request_date']) : (request.createdAt ? formatRequestDate(request.createdAt) : 'Fecha N/A')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {typeof request.origin === 'string' ? request.origin : request.origin?.address || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {typeof request.destination === 'string' ? request.destination : request.destination?.address || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getStatusTranslation(request.status)} 
                            size="small"
                            sx={{ 
                              bgcolor: getStatusChipStyle(request.status).bg,
                              color: getStatusChipStyle(request.status).color,
                              borderRadius: 1
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {(request as any).driver && ((request as any).driver.first_name || (request as any).driver.last_name)
                            ? `${(request as any).driver.first_name || ''} ${(request as any).driver.last_name || ''}`.trim()
                            : request.driver?.name || '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <IconButton 
                              size="small"
                              onClick={() => handleViewDetails(request)}
                              title={t('dashboard.requestDetails')}
                              sx={{ color: '#e91e63' }}
                            >
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton 
                              size="small"
                              onClick={() => handleCancelRequest(request)}
                              title={t('requests.statuses.cancelled')}
                              disabled={request.status === 'completed' || request.status === 'cancelled'}
                              sx={{ color: '#e91e63' }}
                            >
                              <CloseIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // Estado vacío
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {hasError ? 'Error cargando solicitudes' : 'No hay solicitudes recientes'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Vista móvil con cards */}
          {isMobile && (
            <Box>
              {isLoading ? (
                // Skeletons para móvil
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={`mobile-skeleton-${index}`} elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Skeleton variant="circular" width={32} height={32} />
                          <Box>
                            <Skeleton width={80} height={20} />
                            <Skeleton width={60} height={16} />
                          </Box>
                        </Box>
                        <Skeleton width={60} height={24} sx={{ borderRadius: 1 }} />
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Box sx={{ mb: 2 }}>
                        <Skeleton width={200} height={16} sx={{ mb: 1 }} />
                        <Skeleton width={180} height={16} sx={{ mb: 1 }} />
                        <Skeleton width={120} height={16} />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
                        <Skeleton width={40} height={14} />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Skeleton variant="circular" width={40} height={40} />
                          <Skeleton variant="circular" width={40} height={40} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              ) : filteredRideRequests && filteredRideRequests.length > 0 ? (
                // Mostrar cards de solicitudes reales
                filteredRideRequests.map((request) => (
                  <RequestMobileCard
                    key={request.id}
                    request={request}
                    onViewDetails={handleViewDetails}
                    onCancelRequest={handleCancelRequest}
                    getStatusChipStyle={getStatusChipStyle}
                    getStatusTranslation={getStatusTranslation}
                    formatTimeOnly={formatTimeOnly}
                  />
                ))
              ) : (
                // Estado vacío móvil
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <Typography color="text.secondary" variant="body2">
                    {hasError ? 'Error cargando solicitudes' : 'No hay solicitudes recientes'}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>
        
        {/* Mapa en tiempo real */}
        <Box>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            fontSize: isMobile ? '1.125rem' : '1.25rem'
          }}>
            <Box component="span" 
              sx={{ 
                mr: 1, 
                width: isMobile ? 16 : 20, 
                height: isMobile ? 16 : 20, 
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Box component="span"
                sx={{
                  width: isMobile ? 10 : 12,
                  height: isMobile ? 10 : 12,
                  bgcolor: '#e5308a',
                  borderRadius: 0.5
                }}
              />
            </Box>
            {t('dashboard.realtimeMap')}
          </Typography>
          
          <Box sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            '& .gm-style': {
              borderRadius: 2
            }
          }}>
            <MapComponent isMobile={isMobile} />
          </Box>
        </Box>

        {/* 🆕 NUEVO: Modal de Detalles de Solicitud */}
        <RequestDetailsModal
          open={detailsModalOpen}
          onClose={closeAllModals}
          request={selectedRequest}
          onReassignDriver={handleReassignDriver}
        />

        {/* 🆕 NUEVO: Modal de Confirmación de Cancelación */}
        <ConfirmDeleteModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={async () => {
            if (!deletingRequestId) return;
            setDeleting(true);
            try {
              await rideService.updateRideStatus(deletingRequestId, 'cancelled');
              setDeleteModalOpen(false);
              setDeletingRequestId(null);
              // Refrescar datos después de cancelar
              actions.refreshAllData();
            } catch (e) {
              console.error('Error cancelando solicitud:', e);
              // Aquí podrías mostrar un toast de error
            } finally {
              setDeleting(false);
            }
          }}
          title="Cancelar solicitud"
          message="¿Estás seguro de que deseas cancelar esta solicitud?"
          isLoading={deleting}
        />

        {/* FAB para móvil - Refrescar datos */}
        {isMobile && (
          <Fab
            color="primary"
            onClick={actions.refreshAllData}
            disabled={isRefetching}
            aria-label="Refrescar datos"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              bgcolor: '#e5308a',
              color: 'white',
              '&:hover': {
                bgcolor: '#c5206a',
              },
              zIndex: 1300,
              boxShadow: '0 8px 16px rgba(229, 48, 138, 0.3)',
              '&:active': {
                boxShadow: '0 4px 8px rgba(229, 48, 138, 0.3)',
              }
            }}
          >
            {isRefetching ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              <RefreshIcon />
            )}
          </Fab>
        )}
      </PageContainer>
    </LocalizationProvider>
  );
};

export default Dashboard;
