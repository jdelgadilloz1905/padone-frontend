import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Avatar,
  Paper,
  Skeleton,
  Stack,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Route as RouteIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import useGoogleMaps from '../../hooks/useGoogleMaps';
import type { RideRequest } from '../../services/requestService';
import requestService from '../../services/requestService';
import AsignarConductorModal from '../AsignarConductorModal';
import { useQueryClient } from '@tanstack/react-query';
import socketService from '../../services/socketService';

// Icono de WhatsApp como SVG
const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.687"/>
  </svg>
);

// =====================================================================
// INTERFACES Y TIPOS
// =====================================================================

interface RequestDetailsModalProps {
  open: boolean;
  onClose: () => void;
  request: RideRequest | null;
  onReassignDriver?: (requestId: string) => void;
}

interface RequestDetails extends RideRequest {
  estimatedDistance?: number;
  estimatedDuration?: number;
  totalCost?: number;
  createdBy?: string;
  lastUpdated?: string;
  timeline?: Array<{
    status: string;
    timestamp: string;
    description: string;
    actor?: string;
  }>;
  // Campos adicionales del backend
  origin_coordinates?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude] en formato GeoJSON
  };
  destination_coordinates?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude] en formato GeoJSON
  };
  // 🆕 NUEVO: Coordenadas directas del backend
  pickup_latitude?: number | string;
  pickup_longitude?: number | string;
  destination_latitude?: number | string;
  destination_longitude?: number | string;
}

// =====================================================================
// COMPONENTE DE MAPA CON RUTA
// =====================================================================

const RouteMap: React.FC<{ request: RequestDetails }> = ({ request }) => {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { isLoaded } = useGoogleMaps();

  const mapContainerStyle = {
    width: '100%',
    height: isMobile ? '250px' : '300px',
    borderRadius: isMobile ? '12px' : '8px'
  };

  // 🆕 MEJORADO: Validar múltiples formatos de coordenadas
  const hasValidCoordinates = () => {
    // Formato 1: origin_coordinates/destination_coordinates (GeoJSON)
    const hasGeoJSONCoords = (
      request?.origin_coordinates?.coordinates &&
      Array.isArray(request.origin_coordinates.coordinates) &&
      request.origin_coordinates.coordinates.length === 2 &&
      request?.destination_coordinates?.coordinates &&
      Array.isArray(request.destination_coordinates.coordinates) &&
      request.destination_coordinates.coordinates.length === 2 &&
      !isNaN(Number(request.origin_coordinates.coordinates[0])) &&
      !isNaN(Number(request.origin_coordinates.coordinates[1])) &&
      !isNaN(Number(request.destination_coordinates.coordinates[0])) &&
      !isNaN(Number(request.destination_coordinates.coordinates[1]))
    );

    // Formato 2: origin.location/destination.location (como viene de mapRideToRequest)
    const hasLocationCoords = (
      request?.origin?.location?.lat &&
      request?.origin?.location?.lng &&
      request?.destination?.location?.lat &&
      request?.destination?.location?.lng &&
      !isNaN(Number(request.origin.location.lat)) &&
      !isNaN(Number(request.origin.location.lng)) &&
      !isNaN(Number(request.destination.location.lat)) &&
      !isNaN(Number(request.destination.location.lng))
    );

    // Formato 3: pickup_latitude/pickup_longitude directamente
    const hasDirectCoords = (
      request?.pickup_latitude &&
      request?.pickup_longitude &&
      request?.destination_latitude &&
      request?.destination_longitude &&
      !isNaN(Number(request.pickup_latitude)) &&
      !isNaN(Number(request.pickup_longitude)) &&
      !isNaN(Number(request.destination_latitude)) &&
      !isNaN(Number(request.destination_longitude))
    );

    return hasGeoJSONCoords || hasLocationCoords || hasDirectCoords;
  };

  // Coordenadas por defecto (Kansas City, Missouri) si no hay datos válidos
  const defaultLocation = { lat: 39.0997, lng: -94.5786 };

  // 🆕 MEJORADO: Obtener coordenadas de origen con múltiples formatos
  const getOriginLocation = () => {
    // Formato 1: GeoJSON
    if (request?.origin_coordinates?.coordinates && Array.isArray(request.origin_coordinates.coordinates)) {
      const coords = request.origin_coordinates.coordinates;
      return {
        lat: Number(coords[1]), // latitude is second element
        lng: Number(coords[0])  // longitude is first element
      };
    }

    // Formato 2: origin.location
    if (request?.origin?.location?.lat && request?.origin?.location?.lng) {
      return {
        lat: Number(request.origin.location.lat),
        lng: Number(request.origin.location.lng)
      };
    }

    // Formato 3: Coordenadas directas
    if (request?.pickup_latitude && request?.pickup_longitude) {
      return {
        lat: Number(request.pickup_latitude),
        lng: Number(request.pickup_longitude)
      };
    }

    return defaultLocation;
  };
  
  // 🆕 MEJORADO: Obtener coordenadas de destino con múltiples formatos
  const getDestinationLocation = () => {
    // Formato 1: GeoJSON
    if (request?.destination_coordinates?.coordinates && Array.isArray(request.destination_coordinates.coordinates)) {
      const coords = request.destination_coordinates.coordinates;
      return {
        lat: Number(coords[1]), // latitude is second element
        lng: Number(coords[0])  // longitude is first element
      };
    }

    // Formato 2: destination.location
    if (request?.destination?.location?.lat && request?.destination?.location?.lng) {
      return {
        lat: Number(request.destination.location.lat),
        lng: Number(request.destination.location.lng)
      };
    }

    // Formato 3: Coordenadas directas
    if (request?.destination_latitude && request?.destination_longitude) {
      return {
        lat: Number(request.destination_latitude),
        lng: Number(request.destination_longitude)
      };
    }

    return { ...defaultLocation, lat: defaultLocation.lat + 0.01 }; // Ligeramente diferente
  };

  const originLocation = getOriginLocation();
  const destinationLocation = getDestinationLocation();

  const center = {
    lat: (originLocation.lat + destinationLocation.lat) / 2,
    lng: (originLocation.lng + destinationLocation.lng) / 2
  };

  useEffect(() => {
    if (!isLoaded || !window.google || !hasValidCoordinates()) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: originLocation,
        destination: destinationLocation,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirections(result);
        } else {
          console.error('Error calculando ruta:', status);
        }
      }
    );
  }, [isLoaded, request, originLocation.lat, originLocation.lng, destinationLocation.lat, destinationLocation.lng]);

  if (!isLoaded) {
    return <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 1 }} />;
  }

  // 🆕 MEJORADO: Mejor mensaje de depuración
  if (!hasValidCoordinates()) {
    console.log('🗺️ Debug coordenadas:', {
      request: request,
      origin_coordinates: request?.origin_coordinates,
      destination_coordinates: request?.destination_coordinates,
      origin_location: request?.origin?.location,
      destination_location: request?.destination?.location,
      pickup_latitude: request?.pickup_latitude,
      pickup_longitude: request?.pickup_longitude,
      destination_latitude: request?.destination_latitude,
      destination_longitude: request?.destination_longitude
    });

    return (
      <Box
        sx={{
          width: '100%',
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: 1,
          border: '1px solid #e0e0e0',
          gap: 1
        }}
      >
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          📍 Coordenadas no disponibles para mostrar la ruta
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          Origen: {typeof request?.origin === 'string' ? request.origin : request?.origin?.address || 'No disponible'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          Destino: {typeof request?.destination === 'string' ? request.destination : request?.destination?.address || 'No disponible'}
        </Typography>
      </Box>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={13}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false
      }}
    >
      <Marker
        position={originLocation}
        icon={{
          url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }}
        title="Origen"
      />
      
      <Marker
        position={destinationLocation}
        icon={{
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }}
        title="Destino"
      />

      {request.driver && (
        <Marker
          position={{
            lat: (request.driver as any).current_location?.coordinates && 
                 Array.isArray((request.driver as any).current_location.coordinates) &&
                 (request.driver as any).current_location.coordinates.length >= 2
              ? Number((request.driver as any).current_location.coordinates[1]) 
              : originLocation.lat,
            lng: (request.driver as any).current_location?.coordinates && 
                 Array.isArray((request.driver as any).current_location.coordinates) &&
                 (request.driver as any).current_location.coordinates.length >= 2
              ? Number((request.driver as any).current_location.coordinates[0]) 
              : originLocation.lng
          }}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/cabs.png',
            scaledSize: new google.maps.Size(32, 32)
          }}
          title={`Conductor: ${(request.driver as any).first_name || request.driver.name || 'Conductor'} ${(request.driver as any).last_name || ''}`}
        />
      )}

      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            polylineOptions: {
              strokeColor: '#e5308a',
              strokeWeight: 4,
              strokeOpacity: 0.8
            },
            suppressMarkers: true
          }}
        />
      )}
    </GoogleMap>
  );
};

// =====================================================================
// COMPONENTE TIMELINE DE ESTADOS
// =====================================================================

const RequestTimeline: React.FC<{ request: RequestDetails }> = ({ request }) => {
  const { t } = useTranslation();

  const getDefaultTimeline = () => {
    const timeline = [
      {
        status: 'pending',
        timestamp: request.createdAt,
        description: t('requests.timeline.created'),
        actor: request.createdBy || 'Cliente App'
      }
    ];

    if (request.status === 'assigned' || request.status === 'in_progress' || request.status === 'completed') {
      timeline.push({
        status: 'assigned',
        timestamp: request.lastUpdated || request.createdAt,
        description: t('requests.timeline.assigned'),
        actor: request.driver?.name || 'Sistema'
      });
    }

    if (request.status === 'in_progress' || request.status === 'completed') {
      timeline.push({
        status: 'in_progress',
        timestamp: request.lastUpdated || request.createdAt,
        description: t('requests.timeline.started'),
        actor: request.driver?.name || 'Conductor'
      });
    }

    if (request.status === 'completed') {
      timeline.push({
        status: 'completed',
        timestamp: request.lastUpdated || request.createdAt,
        description: t('requests.timeline.completed'),
        actor: request.driver?.name || 'Conductor'
      });
    }

    if (request.status === 'cancelled') {
      timeline.push({
        status: 'cancelled',
        timestamp: request.lastUpdated || request.createdAt,
        description: t('requests.timeline.cancelled'),
        actor: 'Administrador'
      });
    }

    return timeline;
  };

  const timeline = request.timeline || getDefaultTimeline();

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ScheduleIcon sx={{ color: '#E33096', fontSize: 20 }} />;
      case 'assigned':
        return <AssignmentIcon sx={{ color: '#E33096', fontSize: 20 }} />;
      case 'in_progress':
        return <CarIcon sx={{ color: '#E33096', fontSize: 20 }} />;
      case 'completed':
        return <CheckCircleIcon sx={{ color: '#E33096', fontSize: 20 }} />;
      case 'cancelled':
        return <CancelIcon sx={{ color: '#E33096', fontSize: 20 }} />;
      default:
        return <TimeIcon sx={{ color: '#E33096', fontSize: 20 }} />;
    }
  };

  const getTimelineColor = () => {
    // Todos los estados usan el color rosa del sistema
    return '#E33096';
  };

  // Función para formatear fecha y hora
  const formatDateTime = (timestamp: string) => {
    if (!timestamp) {
      return 'Fecha no disponible';
    }
    
    const date = new Date(timestamp);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    // Formato americano: MM/DD/YYYY
    const dateStr = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    // Formato 12 horas sin segundos
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateStr}, ${timeStr}`;
  };

  return (
    <Timeline>
      {timeline.map((item, index) => (
        <TimelineItem key={index}>
          <TimelineSeparator>
            <TimelineDot sx={{ 
              bgcolor: getTimelineColor(),
              border: '2px solid #E33096',
              '& .MuiTimelineDot-root': {
                bgcolor: getTimelineColor()
              }
            }}>
              {getTimelineIcon(item.status)}
            </TimelineDot>
            {index < timeline.length - 1 && (
              <TimelineConnector sx={{ bgcolor: '#E33096' }} />
            )}
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="body2" sx={{ fontWeight: 'medium', color: '#201B1B' }}>
              {item.description}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {formatDateTime(item.timestamp)} • {item.actor}
            </Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

// =====================================================================
// COMPONENTE PRINCIPAL DEL MODAL
// =====================================================================

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  open,
  onClose,
  request,
  onReassignDriver
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Estado para el modal de asignación de conductor
  const [assignDriverModalOpen, setAssignDriverModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Manejar cierre del mensaje de error
  const handleCloseError = () => {
    setErrorMessage(null);
  };

  if (!request) return null;

  // Funciones para obtener nombres y teléfonos desde diferentes estructuras
  const getClientName = () => {
    if (request.clientName) return request.clientName;
    
    const client = (request as any).client;
    if (client?.first_name) {
      return client.last_name 
        ? `${client.first_name} ${client.last_name}`.trim()
        : client.first_name.trim();
    }
    
    return 'Cliente';
  };

  const getClientPhone = () => {
    return request.clientPhone || (request as any).client?.phone_number || '';
  };

  const getDriverName = () => {
    if (request.driver?.name) return request.driver.name;
    
    const driver = (request as any).driver;
    if (driver?.first_name) {
      return driver.last_name 
        ? `${driver.first_name} ${driver.last_name}`.trim()
        : driver.first_name.trim();
    }
    
    return 'Conductor';
  };

  const getDriverPhone = () => {
    return request.driver?.phoneNumber || (request as any).driver?.phone_number || '';
  };

  // Debug: Logging de la información del request
  console.log('🔍 RequestDetailsModal - request data:', {
    id: request?.id,
    clientName: getClientName(),
    clientPhone: getClientPhone(),
    driverName: getDriverName(),
    driverPhone: getDriverPhone(),
    origin: request?.origin,
    destination: request?.destination,
    createdAt: request?.createdAt,
    coordinates: {
      pickup_latitude: request?.pickup_latitude,
      pickup_longitude: request?.pickup_longitude,
      destination_latitude: request?.destination_latitude,
      destination_longitude: request?.destination_longitude
    }
  });

  // Función auxiliar para formatear fechas en formato estadounidense
  const formatUSDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    
    // Formato americano: MM/DD/YYYY
    const dateStr = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    // Formato 12 horas sin segundos
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateStr}, ${timeStr}`;
  };

  const requestDetails: RequestDetails = {
    ...request,
    estimatedDistance: 8.5,
    estimatedDuration: 18,
    totalCost: request.price || 15.75,
    createdBy: 'Cliente App',
    lastUpdated: new Date().toISOString()
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'info';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusTranslation = (status: string) => {
    const translations: Record<string, string> = {
      'pending': t('requests.statuses.pending'),
      'assigned': t('requests.statuses.assigned'),
      'in_progress': t('requests.statuses.inProgress'),
      'completed': t('requests.statuses.completed'),
      'cancelled': t('requests.statuses.cancelled')
    };
    return translations[status] || status;
  };

  // Función para limpiar números de teléfono
  const cleanPhoneNumber = (phoneNumber: string): string => {
    // Remover espacios, guiones y mantener solo números y el signo +
    return phoneNumber.replace(/[^\d+]/g, '');
  };

  const handleContactClient = () => {
    console.log('🔥 handleContactClient ejecutado');
    
    const clientPhone = getClientPhone();
    console.log('📞 clientPhone final:', clientPhone);
    
    // Test básico: mostrar alert primero
    
    if (clientPhone) {
      // Limpiar el número y abrir aplicación de teléfono nativa
      const cleanNumber = cleanPhoneNumber(clientPhone);
      console.log('✅ Número limpio:', cleanNumber);
      console.log('📱 Intentando abrir tel:', `tel:${cleanNumber}`);
      
      try {
        window.location.href = `tel:${cleanNumber}`;
        console.log('✅ window.location.href ejecutado');
      } catch (error) {
        console.error('❌ Error al abrir tel:', error);
        // Fallback: intentar con window.open
        window.open(`tel:${cleanNumber}`, '_self');
      }
    } else {
      console.warn('⚠️ No hay número de cliente disponible');
    }
  };

  const handleContactDriver = () => {
    console.log('🔥 handleContactDriver ejecutado');
    
    const driverPhone = getDriverPhone();
    console.log('🚗 driverPhone final:', driverPhone);
    
    // Test básico: mostrar alert primero
    
    if (driverPhone) {
      // Limpiar el número y abrir aplicación de teléfono nativa
      const cleanNumber = cleanPhoneNumber(driverPhone);
      console.log('✅ Número limpio:', cleanNumber);
      console.log('📱 Intentando abrir tel:', `tel:${cleanNumber}`);
      
      try {
        window.location.href = `tel:${cleanNumber}`;
        console.log('✅ window.location.href ejecutado');
      } catch (error) {
        console.error('❌ Error al abrir tel:', error);
        // Fallback: intentar con window.open
        window.open(`tel:${cleanNumber}`, '_self');
      }
    } else {
      console.warn('⚠️ No hay número de conductor disponible');
    }
  };

  // Función para validar si se puede reasignar conductor
  const canReassignDriver = () => {
    if (!request) return false;
    // Estados válidos para reasignación: pending, assigned, in_progress
    const validStates = ['pending', 'assigned', 'in_progress'];
    return validStates.includes(request.status);
  };

  // Función para obtener el mensaje de por qué no se puede reasignar
  const getReassignDisabledReason = () => {
    if (!request) return '';
    if (request.status === 'completed') {
      return t('requests.reassign.disabledCompleted', 'No se puede reasignar conductor: solicitud completada');
    }
    if (request.status === 'cancelled') {
      return t('requests.reassign.disabledCancelled', 'No se puede reasignar conductor: solicitud cancelada');
    }
    return '';
  };

  const handleReassignDriver = () => {
    // Solo abrir el modal si el estado permite reasignación
    if (canReassignDriver()) {
      setAssignDriverModalOpen(true);
    }
  };

  // Manejar la asignación de conductor desde el modal
  const handleAssignDriver = async (conductorId: string) => {
    try {
      console.log('Asignando conductor:', conductorId, 'a solicitud:', request.id);
      
      // Llamar al servicio para asignar el conductor
      const success = await requestService.assignDriver(request.id, parseInt(conductorId));
      
      if (success) {
        console.log('✅ Conductor asignado exitosamente');
        
        // Invalidar cachés relevantes
        queryClient.invalidateQueries({ queryKey: ['requests', 'detail', request.id] });
        queryClient.invalidateQueries({ queryKey: ['requests', 'active'] });
        queryClient.invalidateQueries({ queryKey: ['requests', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['drivers', 'available'] });
        queryClient.invalidateQueries({ queryKey: ['drivers', 'active'] });
        
        // Notificar al WebSocket sobre el cambio
        socketService.emit('request_updated', {
          requestId: request.id,
          driverId: conductorId,
          type: 'driver_reassigned'
        });
        
        // Si hay un handler personalizado, usarlo
        if (onReassignDriver) {
          onReassignDriver(request.id);
        }
        
        // Cerrar el modal de asignación
        setAssignDriverModalOpen(false);
        
        // Opcional: cerrar el modal de detalles también
        onClose();
      } else {
        console.error('❌ Error al asignar conductor');
        // Mostrar mensaje de error
        setErrorMessage(t('requests.assignDriver.error'));
      }
    } catch (err) {
      console.error('❌ Error al asignar conductor:', err);
      setErrorMessage(t('requests.assignDriver.error'));
    }
  };

  // Cerrar el modal de asignación
  const handleCloseAssignModal = () => {
    setAssignDriverModalOpen(false);
  };

  const handleMessageClient = () => {
    console.log('💬 handleMessageClient ejecutado');
    
    const clientPhone = getClientPhone();
    console.log('📞 clientPhone final:', clientPhone);
    
    // Test básico: mostrar alert primero
    
    if (clientPhone) {
      // Limpiar el número y abrir WhatsApp con mensaje pre-llenado
      const cleanNumber = cleanPhoneNumber(clientPhone);
      const message = encodeURIComponent(`Hola, soy de Taxi Rosa. Respecto a su solicitud #${request.id}`);
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
      
      console.log('✅ Número limpio:', cleanNumber);
      console.log('💬 URL de WhatsApp:', whatsappUrl);
      
      try {
        window.location.href = whatsappUrl;
        console.log('✅ WhatsApp abierto exitosamente');
      } catch (error) {
        console.error('❌ Error al abrir WhatsApp:', error);
        // Fallback: intentar con window.open
        window.open(whatsappUrl, '_blank');
      }
    } else {
      console.warn('⚠️ No hay número de cliente disponible');
    }
  };

  const handleMessageDriver = () => {
    console.log('💬 handleMessageDriver ejecutado');
    
    const driverPhone = getDriverPhone();
    console.log('🚗 driverPhone final:', driverPhone);
    
    // Test básico: mostrar alert primero
    
    if (driverPhone) {
      // Limpiar el número y abrir WhatsApp con mensaje pre-llenado
      const cleanNumber = cleanPhoneNumber(driverPhone);
      const message = encodeURIComponent(`Hola, respecto a la solicitud #${request.id}`);
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
      
      console.log('✅ Número limpio:', cleanNumber);
      console.log('💬 URL de WhatsApp:', whatsappUrl);
      
      try {
        window.location.href = whatsappUrl;
        console.log('✅ WhatsApp abierto exitosamente');
      } catch (error) {
        console.error('❌ Error al abrir WhatsApp:', error);
        // Fallback: intentar con window.open
        window.open(whatsappUrl, '_blank');
      }
    } else {
      console.warn('⚠️ No hay número de conductor disponible');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            borderRadius: isMobile ? 0 : 2, 
            maxHeight: isMobile ? '100vh' : '90vh',
            margin: isMobile ? 0 : 2,
            ...(isMobile && {
              width: '100%',
              height: '100%'
            })
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          px: isMobile ? 2 : 3,
          pt: isMobile ? 2 : 3
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant={isMobile ? "h5" : "h6"} 
                sx={{ 
                  fontWeight: 'bold',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  pr: isMobile ? 6 : 0
                }}
              >
                {t('dashboard.requestDetails')} #{request.id}
              </Typography>
              <Chip
                label={getStatusTranslation(request.status)}
                color={getStatusColor(request.status) as any}
                size={isMobile ? "medium" : "small"}
                sx={{ 
                  mt: 0.5,
                  height: isMobile ? '32px' : 'auto',
                  fontSize: isMobile ? '0.875rem' : '0.75rem'
                }}
              />
            </Box>
            <IconButton 
              onClick={onClose} 
              size={isMobile ? "large" : "small"}
              sx={{
                position: isMobile ? 'absolute' : 'relative',
                top: isMobile ? 16 : 'auto',
                right: isMobile ? 16 : 'auto',
                ...(isMobile && {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)'
                  }
                })
              }}
            >
              <CloseIcon sx={{ fontSize: isMobile ? 28 : 20 }} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ 
          px: isMobile ? 2 : 3,
          py: isMobile ? 2 : 3
        }}>
          <Stack spacing={isMobile ? 2 : 3}>
            {/* Información de Cliente y Conductor */}
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              {/* Cliente */}
              <Card elevation={0} sx={{ 
                border: '1px solid #e0e0e0', 
                flex: 1,
                borderRadius: isMobile ? 3 : 1
              }}>
                <CardContent sx={{ p: isMobile ? 2.5 : 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: '#e5308a', 
                      mr: 2,
                      width: isMobile ? 48 : 40,
                      height: isMobile ? 48 : 40
                    }}>
                      <PersonIcon sx={{ fontSize: isMobile ? 28 : 24 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant={isMobile ? "h6" : "h6"}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: isMobile ? '1.125rem' : '1rem'
                        }}
                      >
                        {getClientName()}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: isMobile ? '0.875rem' : '0.75rem' }}
                      >
                        {getClientPhone()}
                      </Typography>
                    </Box>
                  </Box>
                  <Stack spacing={isMobile ? 1.5 : 1}>
                    <Button
                      variant="outlined"
                      startIcon={<PhoneIcon />}
                      onClick={handleContactClient}
                      size={isMobile ? "medium" : "small"}
                      fullWidth={isMobile}
                      sx={{
                        minHeight: isMobile ? '44px' : 'auto',
                        borderColor: '#e5308a',
                        color: '#e5308a',
                        '&:hover': {
                          borderColor: '#d12a87',
                          backgroundColor: 'rgba(229, 48, 138, 0.04)'
                        }
                      }}
                    >
                      {t('common.call')}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<WhatsAppIcon size={isMobile ? 24 : 20} />}
                      onClick={handleMessageClient}
                      size={isMobile ? "medium" : "small"}
                      fullWidth={isMobile}
                      sx={{
                        minHeight: isMobile ? '44px' : 'auto',
                        borderColor: '#757575',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      {t('common.message')}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Conductor */}
              <Card elevation={0} sx={{ 
                border: '1px solid #e0e0e0', 
                flex: 1,
                borderRadius: isMobile ? 3 : 1
              }}>
                <CardContent sx={{ p: isMobile ? 2.5 : 2 }}>
                  {request.driver ? (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: '#4caf50', 
                          mr: 2,
                          width: isMobile ? 48 : 40,
                          height: isMobile ? 48 : 40
                        }}>
                          <CarIcon sx={{ fontSize: isMobile ? 28 : 24 }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant={isMobile ? "h6" : "h6"}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: isMobile ? '1.125rem' : '1rem'
                            }}
                          >
                            {getDriverName()}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.875rem' : '0.75rem' }}
                          >
                            {getDriverPhone()}
                          </Typography>
                        </Box>
                      </Box>
                      <Stack spacing={isMobile ? 1.5 : 1}>
                        <Button
                          variant="outlined"
                          startIcon={<PhoneIcon />}
                          onClick={handleContactDriver}
                          size={isMobile ? "medium" : "small"}
                          fullWidth={isMobile}
                          sx={{
                            minHeight: isMobile ? '44px' : 'auto',
                            borderColor: '#4caf50',
                            color: '#4caf50',
                            '&:hover': {
                              borderColor: '#388e3c',
                              backgroundColor: 'rgba(76, 175, 80, 0.04)'
                            }
                          }}
                        >
                          {t('common.call')}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<WhatsAppIcon size={isMobile ? 24 : 20} />}
                          onClick={handleMessageDriver}
                          size={isMobile ? "medium" : "small"}
                          fullWidth={isMobile}
                          sx={{
                            minHeight: isMobile ? '44px' : 'auto',
                            borderColor: '#757575',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          {t('common.message')}
                        </Button>
                        <Tooltip
                          title={!canReassignDriver() ? getReassignDisabledReason() : ''}
                          arrow
                          placement="top"
                        >
                          <span>
                            <Button
                              variant="outlined"
                              startIcon={<AssignmentIcon />}
                              onClick={handleReassignDriver}
                              size={isMobile ? "medium" : "small"}
                              fullWidth={true}
                              disabled={!canReassignDriver()}
                              sx={{
                                minHeight: isMobile ? '44px' : 'auto',
                                borderColor: '#e5308a',
                                color: '#e5308a',
                                '&:hover': {
                                  borderColor: '#d12a87',
                                  backgroundColor: 'rgba(229, 48, 138, 0.04)'
                                },
                                '&:disabled': {
                                  borderColor: '#ccc',
                                  color: '#999',
                                  cursor: 'not-allowed'
                                }
                              }}
                            >
                              {t('dashboard.reassignDriver')}
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                    </>
                  ) : (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: isMobile ? 3 : 2 
                    }}>
                      <Typography 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          fontSize: isMobile ? '1rem' : '0.875rem'
                        }}
                      >
                        {t('dashboard.noDriverAssigned')}
                      </Typography>
                      <Tooltip
                        title={!canReassignDriver() ? getReassignDisabledReason() : ''}
                        arrow
                        placement="top"
                      >
                        <span>
                          <Button
                            variant="contained"
                            startIcon={<AssignmentIcon />}
                            onClick={handleReassignDriver}
                            size={isMobile ? "large" : "medium"}
                            fullWidth={isMobile}
                            disabled={!canReassignDriver()}
                            sx={{ 
                              bgcolor: '#e5308a',
                              minHeight: isMobile ? '48px' : 'auto',
                              '&:hover': {
                                bgcolor: '#d12a87'
                              },
                              '&:disabled': {
                                bgcolor: '#ccc',
                                color: '#999',
                                cursor: 'not-allowed'
                              }
                            }}
                          >
                            {t('dashboard.assignDriver')}
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Información de Ruta */}
            <Paper elevation={0} sx={{ 
              p: isMobile ? 2.5 : 2, 
              border: '1px solid #e0e0e0',
              borderRadius: isMobile ? 3 : 1
            }}>
              <Typography 
                variant={isMobile ? "h5" : "h6"} 
                sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: isMobile ? '1.25rem' : '1.125rem'
                }}
              >
                <LocationIcon sx={{ 
                  mr: 1, 
                  color: '#e5308a',
                  fontSize: isMobile ? 28 : 24
                }} />
                {t('dashboard.route')}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: isMobile ? 3 : 2, 
                flexDirection: { xs: 'column', md: 'row' } 
              }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    mb: isMobile ? 3 : 2 
                  }}>
                    <Box
                      sx={{
                        width: isMobile ? 16 : 12,
                        height: isMobile ? 16 : 12,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        mt: 0.5,
                        mr: 2,
                        flexShrink: 0
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: isMobile ? '0.875rem' : '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        {t('dashboard.origin')}
                      </Typography>
                      <Typography 
                        variant="body1"
                        sx={{ 
                          fontSize: isMobile ? '1rem' : '0.875rem',
                          wordWrap: 'break-word',
                          lineHeight: 1.5
                        }}
                      >
                        {typeof request.origin === 'string' ? request.origin : request.origin?.address || 'Origen no disponible'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: isMobile ? 16 : 12,
                        height: isMobile ? 16 : 12,
                        borderRadius: '50%',
                        bgcolor: 'error.main',
                        mt: 0.5,
                        mr: 2,
                        flexShrink: 0
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: isMobile ? '0.875rem' : '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        {t('dashboard.destination')}
                      </Typography>
                      <Typography 
                        variant="body1"
                        sx={{ 
                          fontSize: isMobile ? '1rem' : '0.875rem',
                          wordWrap: 'break-word',
                          lineHeight: 1.5
                        }}
                      >
                        {typeof request.destination === 'string' ? request.destination : request.destination?.address || 'Destino no disponible'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack spacing={isMobile ? 2 : 1}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: isMobile ? 1.5 : 0,
                      borderRadius: isMobile ? 2 : 0,
                      bgcolor: isMobile ? 'rgba(63, 81, 181, 0.04)' : 'transparent'
                    }}>
                      <RouteIcon sx={{ 
                        mr: isMobile ? 2 : 1, 
                        fontSize: isMobile ? 24 : 20, 
                        color: '#3f51b5'
                      }} />
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontSize: isMobile ? '1rem' : '0.875rem',
                          fontWeight: isMobile ? 500 : 400
                        }}
                      >
                        {requestDetails.estimatedDistance} km • {requestDetails.estimatedDuration} min
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: isMobile ? 1.5 : 0,
                      borderRadius: isMobile ? 2 : 0,
                      bgcolor: isMobile ? 'rgba(76, 175, 80, 0.04)' : 'transparent'
                    }}>
                      <MoneyIcon sx={{ 
                        mr: isMobile ? 2 : 1, 
                        fontSize: isMobile ? 24 : 20, 
                        color: '#4caf50'
                      }} />
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontSize: isMobile ? '1rem' : '0.875rem',
                          fontWeight: isMobile ? 600 : 400,
                          color: isMobile ? '#4caf50' : 'inherit'
                        }}
                      >
                        ${(Number(requestDetails.totalCost) || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: isMobile ? 1.5 : 0,
                      borderRadius: isMobile ? 2 : 0,
                      bgcolor: isMobile ? 'rgba(229, 48, 138, 0.04)' : 'transparent'
                    }}>
                      <TimeIcon sx={{ 
                        mr: isMobile ? 2 : 1, 
                        fontSize: isMobile ? 24 : 20, 
                        color: '#e5308a'
                      }} />
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontSize: isMobile ? '0.875rem' : '0.75rem',
                          fontWeight: isMobile ? 500 : 400
                        }}
                      >
                        {formatUSDateTime(request.createdAt || request.created_at)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Paper>

            {/* Mapa */}
            <Paper elevation={0} sx={{ 
              p: isMobile ? 2.5 : 2, 
              border: '1px solid #e0e0e0',
              borderRadius: isMobile ? 3 : 1
            }}>
              <Typography 
                variant={isMobile ? "h5" : "h6"} 
                sx={{ 
                  mb: 2,
                  fontSize: isMobile ? '1.25rem' : '1.125rem',
                  fontWeight: 600
                }}
              >
                {t('dashboard.routeMap')}
              </Typography>
              <RouteMap request={requestDetails} />
            </Paper>

            {/* Timeline */}
            <Paper elevation={0} sx={{ 
              p: isMobile ? 2.5 : 2, 
              border: '1px solid #e0e0e0',
              borderRadius: isMobile ? 3 : 1
            }}>
              <Typography 
                variant={isMobile ? "h5" : "h6"} 
                sx={{ 
                  mb: 2,
                  fontSize: isMobile ? '1.25rem' : '1.125rem',
                  fontWeight: 600
                }}
              >
                {t('dashboard.requestTimeline')}
              </Typography>
              <RequestTimeline request={requestDetails} />
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ 
          px: isMobile ? 2 : 3, 
          pb: isMobile ? 2 : 3,
          pt: isMobile ? 1 : 2,
          justifyContent: 'center'
        }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            size={isMobile ? "large" : "medium"}
            sx={{
              minHeight: isMobile ? '48px' : 'auto',
              minWidth: isMobile ? '200px' : '120px',
              borderColor: '#e5308a',
              color: '#e5308a',
              '&:hover': {
                borderColor: '#d12a87',
                backgroundColor: 'rgba(229, 48, 138, 0.04)'
              }
            }}
          >
            {t('common.close')}
          </Button>
        </DialogActions>

        {/* Snackbar para mostrar errores */}
        <Snackbar
          open={!!errorMessage}
          autoHideDuration={6000}
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>

        {/* Modal de Asignación de Conductor */}
        <AsignarConductorModal
          open={assignDriverModalOpen}
          onClose={handleCloseAssignModal}
          onAsignar={handleAssignDriver}
        />
      </Dialog>
    </>
  );
};

export default RequestDetailsModal;