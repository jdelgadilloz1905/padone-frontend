import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, 
  Typography,
  Button, 
  styled, 
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Pagination,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { 
  titleStyle, 
  FilterContainer, 
  searchBarStyle,
  PageContainer
} from '../theme/standardStyles';
import { 
  Visibility, 
  Close, 
  Search as SearchIcon
} from '@mui/icons-material';
import AsignarConductorModal from '../components/AsignarConductorModal';
import RequestDetailsModal from '../components/dashboard/RequestDetailsModal';
import ConfirmDeleteModal from '../components/dashboard/ConfirmDeleteModal';
import rideService from '../services/rideService';
import type { Ride, RideFilters } from '../services/rideService';
import type { RideRequest } from '../services/requestService';

// Styled components basados en las especificaciones de Figma


const CardsGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '16px',
  width: '100%',
  justifyItems: 'center',
  '@media (min-width: 640px)': {
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '18px',
  },
  '@media (min-width: 768px)': {
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '20px',
  },
  '@media (min-width: 1024px)': {
    gridTemplateColumns: 'repeat(auto-fit, minmax(344px, 1fr))',
    gap: '22px',
    justifyItems: 'stretch',
  },
  '@media (min-width: 1200px)': {
    gridTemplateColumns: 'repeat(auto-fit, minmax(344px, 1fr))',
    gap: '24px',
  },
  '@media (min-width: 1400px)': {
    gridTemplateColumns: 'repeat(auto-fit, minmax(344px, 1fr))',
    gap: '26px',
  },
  '@media (min-width: 1600px)': {
    gridTemplateColumns: 'repeat(auto-fit, minmax(344px, 1fr))',
    gap: '28px',
  },
  '@media (min-width: 1920px)': {
    gridTemplateColumns: 'repeat(auto-fit, minmax(344px, 1fr))',
    gap: '30px',
  }
});

const CardContainer = styled(Box)({
  width: '100%',
  minHeight: '400px',
  height: 'auto',
  background: '#FFFFFF',
  border: '1px solid #E8E5E5',
  borderRadius: '8px',
  position: 'relative',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  '@media (min-width: 480px)': {
    maxWidth: '400px',
    minHeight: '460px',
  },
  '@media (min-width: 768px)': {
    maxWidth: '344px',
    minHeight: '480px',
  },
  '@media (min-width: 1200px)': {
    maxWidth: '600px',
    minWidth: '344px',
    minHeight: '500px',
  }
});

const CardContent = styled(Box)({
  padding: '16px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  '@media (min-width: 480px)': {
    padding: '18px',
  },
  '@media (min-width: 768px)': {
    padding: '20px',
  }
});

const IdAndName = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: '16px',
  gap: '2px',
  '@media (min-width: 768px)': {
    marginBottom: '20px',
    gap: '4px',
  }
});

const ClientId = styled(Typography)({
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '11px',
  lineHeight: '16px',
  color: '#423C3D',
  '@media (min-width: 768px)': {
    fontSize: '12px',
    lineHeight: '18px',
  }
});

const ClientName = styled(Typography)({
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: '13px',
  lineHeight: '20px',
  color: '#201B1B',
  '@media (min-width: 768px)': {
    fontSize: '14px',
    lineHeight: '21px',
  }
});

const PriceSection = styled(Box)({
  display: 'flex',
  gap: '24px',
  marginBottom: '20px',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  '@media (min-width: 480px)': {
    gap: '32px',
    marginBottom: '24px',
    flexWrap: 'nowrap',
  }
});

const PriceItem = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  minWidth: '70px',
  gap: '4px',
});

const PriceLabel = styled(Typography)({
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: '10px',
  lineHeight: '15px',
  color: '#8C8888',
  '@media (min-width: 768px)': {
    fontSize: '11px',
    lineHeight: '16px',
  }
});

const PriceValue = styled(Typography)({
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '12px',
  lineHeight: '18px',
  color: '#201B1B',
  '@media (min-width: 768px)': {
    fontSize: '13px',
    lineHeight: '20px',
  }
});

const ActionIcons = styled(Box)({
  position: 'absolute',
  right: '16px',
  top: '16px',
  display: 'flex',
  gap: '8px',
  '@media (min-width: 768px)': {
    right: '20px',
    top: '20px',
    gap: '10px',
  }
});

const ActionButton = styled(Button)({
  width: '28px',
  height: '28px',
  minWidth: '28px',
  background: '#FFFFFF',
  border: '1px solid #F4DADF',
  borderRadius: '6px',
  padding: '4px',
  '@media (min-width: 768px)': {
    width: '32px',
    height: '32px',
    minWidth: '32px',
    borderRadius: '8px',
    padding: '6px',
  },
  '&:hover': {
    background: '#F9F9F9',
  }
});

const RouteSection = styled(Box)({
  marginTop: '8px',
  paddingTop: '20px',
  borderTop: '1px solid #E8E5E5',
  marginBottom: '20px',
  '@media (min-width: 768px)': {
    marginTop: '12px',
    paddingTop: '24px',
    marginBottom: '24px',
  }
});

const RouteLabel = styled(Typography)({
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: '10px',
  lineHeight: '15px',
  textAlign: 'left',
  color: '#8C8888',
  marginBottom: '8px',
  '@media (min-width: 768px)': {
    fontSize: '11px',
    lineHeight: '16px',
    marginBottom: '10px',
  }
});

const RouteItem = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  marginBottom: '12px',
  '@media (min-width: 768px)': {
    gap: '16px',
    marginBottom: '16px',
  }
});

const RoutePoint = styled(Box)<{ type: 'origin' | 'destination' }>(({ type }) => ({
  width: '14px',
  height: '14px',
  background: type === 'origin' ? '#81162F' : '#E33096',
  borderRadius: '50%',
  position: 'relative',
  marginTop: '2px',
  flexShrink: 0,
  '@media (min-width: 768px)': {
    width: '16px',
    height: '16px',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '8px',
    height: '8px',
    background: '#FFFFFF',
    borderRadius: '50%',
    top: '3px',
    left: '3px',
    '@media (min-width: 768px)': {
      width: '10px',
      height: '10px',
    }
  }
}));

const RouteText = styled(Box)({
  flex: 1,
  minWidth: 0,
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
});

const RouteTitle = styled(Typography)<{ type: 'origin' | 'destination' }>(({ type }) => ({
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '11px',
  lineHeight: '16px',
  color: type === 'origin' ? '#81162F' : '#E33096',
  marginBottom: '4px',
  textAlign: 'left',
  width: '100%',
  '@media (min-width: 768px)': {
    fontSize: '12px',
    lineHeight: '18px',
    marginBottom: '6px',
  }
}));

const RouteAddress = styled(Typography)({
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '11px',
  lineHeight: '16px',
  color: '#423C3D',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  '-webkit-line-clamp': 3,
  '-webkit-box-orient': 'vertical',
  textAlign: 'left',
  width: '100%',
  wordBreak: 'break-word',
  maxHeight: '48px',
  '@media (min-width: 480px)': {
    '-webkit-line-clamp': 4,
    maxHeight: '64px',
  },
  '@media (min-width: 768px)': {
    fontSize: '12px',
    lineHeight: '18px',
    maxHeight: '72px',
  }
});

const ConductorSection = styled(Box)({
  marginTop: '12px',
  paddingTop: '20px',
  borderTop: '1px solid #E8E5E5',
  '@media (min-width: 768px)': {
    marginTop: '16px',
    paddingTop: '24px',
  }
});

const StatusButton = styled(Button)<{ status: string }>(({ status }) => {
  const statusConfig = {
    'asignar-conductor': { bg: '#E33096', color: '#FFFFFF', text: 'Asignar conductor', border: 'none' },
    'pendiente': { bg: 'transparent', color: '#F39C13', text: 'Pendiente', border: '1px solid #F39C13' },
    'aprobado': { bg: 'transparent', color: '#3BA16F', text: 'Aprobado', border: '1px solid #3BA16F' },
    'sin-asignar': { bg: 'transparent', color: '#95888B', text: 'Sin asignar', border: '1px solid #95888B' },
    'en-camino': { bg: 'transparent', color: '#F39C13', text: 'En camino', border: '1px solid #F39C13' },
    'cancelado': { bg: 'transparent', color: '#E74C3C', text: 'Cancelado', border: '1px solid #E74C3C' },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['asignar-conductor'];
  
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '4px 8px',
    gap: '6px',
    height: '24px',
    background: config.bg,
    border: config.border,
    borderRadius: '6px',
    fontFamily: 'Poppins',
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '10px',
    lineHeight: '14px',
    color: config.color,
    textTransform: 'none',
    minWidth: 'auto',
    position: 'absolute',
    right: '12px',
    bottom: '12px',
    cursor: status === 'asignar-conductor' ? 'pointer' : 'default',
    pointerEvents: status === 'asignar-conductor' ? 'auto' : 'none',
    '@media (min-width: 768px)': {
      padding: '6px 12px',
      gap: '8px',
      height: '28px',
      borderRadius: '8px',
      fontSize: '12px',
      lineHeight: '16px',
      right: '16px',
      bottom: '16px',
    },
    '&::before': status !== 'asignar-conductor' ? {
      content: '""',
      width: '4px',
      height: '4px',
      background: config.color,
      borderRadius: '50%',
      marginRight: '4px',
      '@media (min-width: 768px)': {
        width: '6px',
        height: '6px',
        marginRight: '8px',
      }
    } : {},
    '&:hover': status === 'asignar-conductor' ? {
      background: '#D12A87',
      border: config.border,
    } : {
      background: config.bg,
      border: config.border,
    }
  };
});

// 🆕 MEJORADO: Utilidad para mapear Ride a RideRequest con coordenadas completas
function mapRideToRequest(ride: Ride): RideRequest {
  let mappedStatus: RideRequest['status'];
  if (ride.status === 'on_the_way') {
    mappedStatus = 'in_progress';
  } else {
    mappedStatus = ride.status as RideRequest['status'];
  }
  
  // 🆕 NUEVO: Extraer coordenadas del formato GeoJSON del backend
  let originLat = 0;
  let originLng = 0;
  let destLat = 0;
  let destLng = 0;

  // Extraer coordenadas del origen (formato GeoJSON: [longitude, latitude])
  if ((ride as any).origin_coordinates?.coordinates && Array.isArray((ride as any).origin_coordinates.coordinates)) {
    const coords = (ride as any).origin_coordinates.coordinates;
    if (coords.length >= 2) {
      originLng = Number(coords[0]); // longitude
      originLat = Number(coords[1]); // latitude
    }
  }

  // Extraer coordenadas del destino (formato GeoJSON: [longitude, latitude])
  if ((ride as any).destination_coordinates?.coordinates && Array.isArray((ride as any).destination_coordinates.coordinates)) {
    const coords = (ride as any).destination_coordinates.coordinates;
    if (coords.length >= 2) {
      destLng = Number(coords[0]); // longitude
      destLat = Number(coords[1]); // latitude
    }
  }

  // Fallback a campos directos si existen
  if (originLat === 0 && originLng === 0) {
    originLat = ride.pickup_latitude ? Number(ride.pickup_latitude) : 0;
    originLng = ride.pickup_longitude ? Number(ride.pickup_longitude) : 0;
  }
  if (destLat === 0 && destLng === 0) {
    destLat = ride.destination_latitude ? Number(ride.destination_latitude) : 0;
    destLng = ride.destination_longitude ? Number(ride.destination_longitude) : 0;
  }

  console.log('🗺️ Mapeando coordenadas:', {
    ride_id: ride.id,
    origin_coordinates: (ride as any).origin_coordinates,
    destination_coordinates: (ride as any).destination_coordinates,
    extracted: {
      originLat,
      originLng,
      destLat,
      destLng
    }
  });
  
  return {
    ...ride,
    clientName: (ride as any).client?.first_name || ride.user?.name || '',
    clientPhone: (ride as any).client?.phone_number || ride.user?.phone || '',
    origin: { 
      address: (ride as any).origin || ride.pickup_location, 
      location: { lat: originLat, lng: originLng } 
    },
    destination: { 
      address: (ride as any).destination || ride.destination, 
      location: { lat: destLat, lng: destLng } 
    },
    // 🆕 NUEVO: Incluir coordenadas directas para compatibilidad con el mapa
    pickup_latitude: originLat,
    pickup_longitude: originLng,
    destination_latitude: destLat,
    destination_longitude: destLng,
    // 🆕 NUEVO: Incluir coordenadas GeoJSON para compatibilidad total
    origin_coordinates: (ride as any).origin_coordinates,
    destination_coordinates: (ride as any).destination_coordinates,
    createdAt: ride.created_at,
    status: mappedStatus,
    driver: ride.driver ? {
      ...ride.driver,
      id: Number(ride.driver.id),
      phoneNumber: (ride.driver as any).phone_number || ride.driver.phone || '',
      status: 'online',
      location: { lat: 0, lng: 0 },
    } : undefined,
    id: ride.id,
  };
}

const Solicitudes = () => {
  const { t } = useTranslation();

  // Estado unificado de filtros
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const [filters, setFilters] = useState<RideFilters>({
    page: 1,
    limit: 10,
    start_date: todayStr,
    end_date: todayStr,
    search: '',
    status: ''
  });

  // Estado local para el input de búsqueda (para debounce)
  const [searchInput, setSearchInput] = useState('');

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchInput || undefined,
        page: 1
      }));
    }, 500); // 500ms de delay
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Estado para solicitudes y otros
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSolicitudId, setSelectedSolicitudId] = useState<string>('');
  const [solicitudes, setSolicitudes] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [usingMockData, setUsingMockData] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<RideRequest | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingSolicitudId, setDeletingSolicitudId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Función para abrir el modal de asignar conductor
  const handleOpenModal = (solicitudId: string) => {
    setSelectedSolicitudId(solicitudId);
    setModalOpen(true);
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSolicitudId('');
  };

  // Utilidad para convertir MM/DD/YYYY a YYYY-MM-DD
  const toISODate = (dateStr: string) => {
    if (!dateStr) return '';
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  // Función para cargar solicitudes
  const loadSolicitudes = async (newFilters?: Partial<RideFilters>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedFilters = { ...filters, ...newFilters };
      // Convertir fechas a formato ISO antes de enviar al endpoint
      if (updatedFilters.start_date) updatedFilters.start_date = toISODate(updatedFilters.start_date);
      if (updatedFilters.end_date) updatedFilters.end_date = toISODate(updatedFilters.end_date);
      if (updatedFilters.status === '') delete updatedFilters.status;
      if (updatedFilters.search === '') delete updatedFilters.search;
      console.log('Loading rides with filters:', updatedFilters);
      const data = await rideService.getRides(updatedFilters);
      console.log('API Response:', data);
      
      // Detectar si se están usando datos mock
      const isMockData = data.rides.length > 0 && (
        data.rides[0].id === '1' || 
        data.rides[0].user?.name === 'Carla Sánchez'
      );
      setUsingMockData(isMockData);
      
      if (isMockData) {
        console.warn('🔄 Se están mostrando datos de ejemplo. Para conectar con tu backend:');
        console.warn('1. Asegúrate de que tu API esté corriendo en http://localhost:8000');
        console.warn('2. Crea un archivo .env con: VITE_API_URL=http://localhost:8000/api');
        console.warn('3. Tu endpoint debe ser: GET /api/rides');
      }
      
      // Asegurarnos de que data.rides existe y es un array
      const rides = Array.isArray(data.rides) ? data.rides : [];
      
      setSolicitudes(rides);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.page || 1);
      setFilters(prev => ({ ...prev, ...newFilters }));
      
      console.log('Set solicitudes:', rides);
    } catch (err) {
      console.error('Error loading rides:', err);
      setError(t('requests.alerts.loadError'));
      setSolicitudes([]); // Asegurar que siempre sea un array
    } finally {
      setLoading(false);
    }
  };

  // Cargar solicitudes cuando cambian los filtros relevantes
  useEffect(() => {
    loadSolicitudes();
    // eslint-disable-next-line
  }, [filters.start_date, filters.end_date, filters.status, filters.search, filters.page, filters.limit]);

  // Función para obtener el nombre del cliente
  const getClientName = (ride: Ride): string => {
    if (!ride) return t('requests.clientNotAvailable');
    if (!ride.user) return t('requests.clientNotAvailable');
    if (!ride.user.name) return t('requests.clientNotAvailable');
    return String(ride.user.name);
  };

  // Función para obtener el nombre del conductor
  const getDriverName = (ride: Ride): string => {
    if (!ride) return t('requests.noDriver');
    if (!ride.driver) return t('requests.noDriver');
    if (!ride.driver.name) return t('requests.noDriver');
    return String(ride.driver.name);
  };

  // Función para formatear el precio
  const formatPrice = (ride: Ride): string => {
    if (!ride) return '-';
    
    // Intentar con actual_cost primero
    if (ride.actual_cost !== undefined && ride.actual_cost !== null) {
      const cost = typeof ride.actual_cost === 'string' ? parseFloat(ride.actual_cost) : ride.actual_cost;
      if (!isNaN(cost)) {
        return `$${cost.toFixed(2)}`;
      }
    }
    
    // Luego con estimated_cost
    if (ride.estimated_cost !== undefined && ride.estimated_cost !== null) {
      const cost = typeof ride.estimated_cost === 'string' ? parseFloat(ride.estimated_cost) : ride.estimated_cost;
      if (!isNaN(cost)) {
        return `$${cost.toFixed(2)} (est.)`;
      }
    }
    
    return '-';
  };

  // Función para formatear la comisión
  const formatCommission = (ride: Ride): string => {
    if (!ride) return '';
    if (ride.commission_percentage !== undefined && ride.commission_percentage !== null) {
      const commission = typeof ride.commission_percentage === 'string' ? parseFloat(ride.commission_percentage) : ride.commission_percentage;
      if (!isNaN(commission)) {
        return `${commission}%`;
      }
    }
    return '';
  };

  // Función para mapear estados del backend a estados de la UI
  const mapStatusToUIStatus = (status: Ride['status']): string => {
    const statusMap: Record<Ride['status'], string> = {
      'pending': 'asignar-conductor',
      'in_progress': 'pendiente',
      'on_the_way': 'en-camino',
      'completed': 'aprobado',
      'cancelled': 'cancelado'
    };
    
    return statusMap[status] || 'sin-asignar';
  };

  // Función para asignar conductor
  const handleAsignarConductor = async (conductorId: string) => {
    try {
      if (!selectedSolicitudId) return;
      
      setLoading(true);
      await rideService.assignDriver(selectedSolicitudId, conductorId);
      
      // Recargar las solicitudes para mostrar los cambios
      await loadSolicitudes();
      
      // Mostrar mensaje de éxito (opcional)
      console.log(`Conductor ${conductorId} asignado a solicitud ${selectedSolicitudId}`);
    } catch (err) {
      setError(t('requests.alerts.assignError'));
      console.error('Error assigning driver:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar por tab
  // const handleTabChange = (tabIndex: number) => {
  //   setActiveTab(tabIndex);
  //   let statusFilter: string | undefined;
    
  //   switch (tabIndex) {
  //     case 1: // Pendientes
  //       statusFilter = 'pending';
  //       break;
  //     case 2: // En proceso
  //       statusFilter = 'in_progress';
  //       break;
  //     case 3: // En camino
  //       statusFilter = 'on_the_way';
  //       break;
  //     case 4: // Completadas
  //       statusFilter = 'completed';
  //       break;
  //     case 5: // Canceladas
  //       statusFilter = 'cancelled';
  //       break;
  //     default: // Todas
  //       statusFilter = undefined;
  //   }
    
  //   loadSolicitudes({ ...filters, status: statusFilter, page: 1 });
  // };

  // Handler para cambio de filtros (fecha, estado, paginación)
  const handleFilterChange = (campo: keyof RideFilters, valor: any) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, [campo]: valor, page: 1 };
      return updatedFilters;
    });
  };

  // Handler para cambio de página
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setFilters(prev => ({ ...prev, page: value }));
  };

  // Opciones de estado para el selector (igual que en Dashboard)
  const statusOptions = [
    { value: '', label: t('requests.filters.all') },
    { value: 'pending', label: t('requests.filters.pending') },
    { value: 'in_progress', label: t('requests.filters.inProgress') },
    { value: 'on_the_way', label: t('requests.filters.onTheWay') },
    { value: 'completed', label: t('requests.filters.completed') },
    { value: 'cancelled', label: t('requests.filters.cancelled') },
  ];

  // Función para formatear la fecha de solicitud en formato MM/DD/YYYY
  const formatRequestDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <PageContainer>
        {/* Header unificado */}
        <Typography {...titleStyle}>
          {t('requests.title')}
        </Typography>
        
        {/* 🆕 NUEVO: Filtros mejorados con fechas y búsqueda */}
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
              onChange={e => setSearchInput(e.target.value)}
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

      {error && (
        <Alert severity="error" sx={{ marginBottom: '16px' }}>
          {t('requests.alerts.loadError')}
        </Alert>
      )}

      {usingMockData && (
        <Alert severity="info" sx={{ marginBottom: '16px' }}>
          {t('requests.alerts.mockData')}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '200px' 
        }}>
          <CircularProgress size={40} />
        </Box>
      ) : (
        <>
          {solicitudes.length === 0 ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              textAlign: 'center',
              color: 'text.secondary'
            }}>
              <Typography variant="h6" gutterBottom>
                {t('requests.noRequests.title')}
              </Typography>
              <Typography variant="body2">
                {t('requests.noRequests.all')}
              </Typography>
            </Box>
          ) : (
            <CardsGrid>
              {solicitudes.map((solicitud, index) => (
                <CardContainer key={index}>
                  <CardContent>
                    <IdAndName>
                      {/* Fecha de solicitud */}
                      <ClientId>
                        {solicitud.created_at ? formatRequestDate(solicitud.created_at) : '-'}
                      </ClientId>
                      <ClientId>{String(solicitud.id || '')}</ClientId>
                      <ClientName>{getClientName(solicitud)}</ClientName>
                    </IdAndName>

                    <ActionIcons>
                      <ActionButton
                        sx={{
                          bgcolor: 'rgba(158, 158, 158, 0.08)',
                          color: '#757575',
                          '&:hover': { bgcolor: 'rgba(158, 158, 158, 0.16)' }
                        }}
                        onClick={() => {
                          setSelectedSolicitud(mapRideToRequest(solicitud));
                          setDetailsModalOpen(true);
                        }}
                      >
                        <Visibility sx={{ fontSize: '16px' }} />
                      </ActionButton>
                      {!['completed', 'cancelled'].includes(solicitud.status) && (
                        <ActionButton
                          sx={{
                            bgcolor: 'rgba(158, 158, 158, 0.08)',
                            color: '#757575',
                            '&:hover': { bgcolor: 'rgba(158, 158, 158, 0.16)' }
                          }}
                          onClick={() => {
                            setDeletingSolicitudId(solicitud.id);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <Close sx={{ fontSize: '16px' }} />
                        </ActionButton>
                      )}
                    </ActionIcons>

                    <PriceSection>
                      <PriceItem>
                        <PriceLabel>{t('requests.price')}</PriceLabel>
                        <PriceValue>{formatPrice(solicitud)}</PriceValue>
                      </PriceItem>
                      {formatCommission(solicitud) && (
                        <PriceItem>
                          <PriceLabel>{t('requests.commission')}</PriceLabel>
                          <PriceValue>{formatCommission(solicitud)}</PriceValue>
                        </PriceItem>
                      )}
                    </PriceSection>

                    <RouteSection>
                      <RouteLabel>{t('requests.route')}</RouteLabel>
                      <RouteItem>
                        <RoutePoint type="origin" />
                        <RouteText>
                          <RouteTitle type="origin">{t('requests.origin')}</RouteTitle>
                          <RouteAddress>{String(solicitud.pickup_location || '')}</RouteAddress>
                        </RouteText>
                      </RouteItem>
                   
                      <RouteItem>
                        <RoutePoint type="destination" />
                        <RouteText>
                          <RouteTitle type="destination">{t('requests.destination')}</RouteTitle>
                          <RouteAddress>{String(solicitud.destination || '')}</RouteAddress>
                        </RouteText>
                      </RouteItem>
                    </RouteSection>

                    <ConductorSection>
                      <PriceItem>
                        <PriceLabel>{t('requests.conductor')}</PriceLabel>
                        <PriceValue>{getDriverName(solicitud)}</PriceValue>
                      </PriceItem>
                    </ConductorSection>

                    <StatusButton 
                      status={mapStatusToUIStatus(solicitud.status)}
                      onClick={() => {
                        if (mapStatusToUIStatus(solicitud.status) === 'asignar-conductor') {
                          handleOpenModal(solicitud.id);
                        }
                      }}
                    >
                      {mapStatusToUIStatus(solicitud.status) === 'asignar-conductor' && t('requests.statuses.assignDriver')}
                      {mapStatusToUIStatus(solicitud.status) === 'pendiente' && t('requests.statuses.pending')}
                      {mapStatusToUIStatus(solicitud.status) === 'aprobado' && t('requests.statuses.approved')}
                      {mapStatusToUIStatus(solicitud.status) === 'sin-asignar' && t('requests.statuses.unassigned')}
                      {mapStatusToUIStatus(solicitud.status) === 'en-camino' && t('requests.statuses.onWay')}
                      {mapStatusToUIStatus(solicitud.status) === 'cancelado' && t('requests.statuses.cancelled')}
                    </StatusButton>
                  </CardContent>
                </CardContainer>
              ))}
            </CardsGrid>
          )}

          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            sx={{ marginTop: '24px', justifyContent: 'center' }}
          />
        </>
      )}

      {/* Modales */}
      <RequestDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        request={selectedSolicitud}
      />
      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!deletingSolicitudId) return;
          setDeleting(true);
          try {
            await rideService.updateRideStatus(deletingSolicitudId, 'cancelled');
            setDeleteModalOpen(false);
            setDeletingSolicitudId(null);
            loadSolicitudes();
          } catch (e) {
            // Manejar error
          } finally {
            setDeleting(false);
          }
        }}
        title="Cancelar solicitud"
        message="¿Estás seguro de que deseas cancelar esta solicitud?"
        isLoading={deleting}
      />

      {/* Modal para asignar conductor */}
      <AsignarConductorModal
        open={modalOpen}
        onClose={handleCloseModal}
        onAsignar={handleAsignarConductor}
      />
    </PageContainer>
    </LocalizationProvider>
  );
};

export default Solicitudes; 