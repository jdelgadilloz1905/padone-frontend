import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Fab,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,


} from '@mui/icons-material';
import { useResponsive } from '../hooks/useResponsive';
import { PageContainer, FilterContainer, searchBarStyle, primaryButtonStyle, titleStyle } from '../theme/standardStyles';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import ScheduledRideModal from '../components/ScheduledRideModal';
import RequestDetailsModal from '../components/dashboard/RequestDetailsModal';
import { scheduledRideService } from '../services/scheduledRideService';
import { useScheduledRides } from '../hooks/useScheduledRides';
import { conductorService } from '../services/conductorService';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

// Componente temporal para mostrar carreras programadas
const ScheduledRideCard: React.FC<{ 
  ride: any; 
  onViewDetails: (ride: any) => void;
  onEdit: (ride: any) => void;
  onDelete: (ride: any) => void;
  onStatusChange: (event: React.MouseEvent<HTMLElement>, ride: any) => void;
}> = ({ ride, onViewDetails, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'assigned': return 'primary';
      case 'in_progress': return 'secondary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'normal': return 'info';
      case 'high': return 'warning';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ mb: 2, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="div">
            {ride.client_name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={ride.status} 
              color={getStatusColor(ride.status) as any}
              size="small"
            />
            <Chip 
              label={ride.priority} 
              color={getPriorityColor(ride.priority) as any}
              size="small"
            />
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          📞 {ride.client_phone}
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          📍 <strong>Recogida:</strong> {ride.pickup_location}
        </Typography>
        
        <Typography variant="body2" gutterBottom>
          🎯 <strong>Destino:</strong> {ride.destination}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              📅 {ride.scheduled_date}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🕐 {ride.scheduled_time}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            💰 ${ride.estimated_cost}
          </Typography>
        </Box>
        
        {ride.driver_id && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            👤 {t('scheduledRides.card.assignedDriver')}
          </Typography>
        )}
        
        {/* Acciones */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={() => onViewDetails(ride)} title={t('scheduledRides.actions.viewDetails')}>
              <ViewIcon />
            </IconButton>
            <IconButton size="small" onClick={() => onEdit(ride)} title={t('scheduledRides.actions.edit')}>
              <EditIcon />
            </IconButton>
            {/* <IconButton size="small" onClick={(e) => onStatusChange(e, ride)} title={t('scheduledRides.actions.changeStatus')}>
              <ScheduleIcon />
            </IconButton> */}
          </Box>
          <IconButton size="small" onClick={() => onDelete(ride)} title={t('scheduledRides.actions.delete')} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};





// Componente para el modal de confirmación de eliminación
const DeleteConfirmModal: React.FC<{ 
  open: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  rideName: string; 
}> = ({ open, onClose, onConfirm, rideName }) => {
  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm">
      <DialogTitle>{t('scheduledRides.deleteConfirm.title')}</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('scheduledRides.deleteConfirm.warning')}
        </Alert>
        <Typography>
          {t('scheduledRides.deleteConfirm.message', { clientName: rideName })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('scheduledRides.deleteConfirm.cancel')}</Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          {t('scheduledRides.deleteConfirm.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};



// Función helper para obtener datos del conductor
const useDriverData = (driverId: string | undefined) => {
  return useQuery({
    queryKey: ['conductor', driverId],
    queryFn: () => conductorService.getConductorById(driverId!),
    enabled: !!driverId,
  });
};

// Función para mapear datos de carrera programada al formato del RequestDetailsModal
const mapScheduledRideToModal = (ride: any, driverData?: any) => {
  // Extraer coordenadas del formato GeoJSON
  const pickupCoords = ride.pickup_coordinates?.coordinates;
  const destinationCoords = ride.destination_coordinates?.coordinates;
  
  // GeoJSON format: [longitude, latitude]
  const pickupLocation = pickupCoords && Array.isArray(pickupCoords) && pickupCoords.length >= 2 ? {
    lat: pickupCoords[1], // Latitud es el segundo elemento
    lng: pickupCoords[0]  // Longitud es el primer elemento
  } : null;
  
  const destinationLocation = destinationCoords && Array.isArray(destinationCoords) && destinationCoords.length >= 2 ? {
    lat: destinationCoords[1], // Latitud es el segundo elemento  
    lng: destinationCoords[0]  // Longitud es el primer elemento
  } : null;

  // Crear objeto del conductor con los datos obtenidos
  const driverInfo = driverData ? {
    name: `${driverData.first_name || ''} ${driverData.last_name || ''}`.trim(),
    phoneNumber: driverData.phone_number || '',
    email: driverData.email || '',
    vehicle: driverData.vehicle || '',
    model: driverData.model || '',
    color: driverData.color || '',
    license_plate: driverData.license_plate || '',
    status: driverData.status || 'offline'
  } : null;

  const mappedRide = {
    ...ride,
    // Campos requeridos por el modal
    id: ride.id,
    clientName: ride.client_name,
    clientPhone: ride.client_phone,
    origin: {
      address: ride.pickup_location || 'Origen no especificado',
      location: pickupLocation
    },
    destination: {
      address: ride.destination || 'Destino no especificado',
      location: destinationLocation
    },
    status: ride.status || 'pending',
    price: parseFloat(ride.estimated_cost) || 0,
    // Campos de fecha para el timeline
    createdAt: ride.created_at || ride.scheduled_at,
    lastUpdated: ride.updated_at || ride.scheduled_at,
    // Coordenadas directas para el mapa (formato legacy para compatibilidad)
    pickup_latitude: pickupLocation?.lat,
    pickup_longitude: pickupLocation?.lng,
    destination_latitude: destinationLocation?.lat,
    destination_longitude: destinationLocation?.lng,
    // Coordenadas en formato GeoJSON original
    pickup_coordinates: ride.pickup_coordinates,
    destination_coordinates: ride.destination_coordinates,
    // Driver info con datos completos
    driver: driverInfo
  };
  
  console.log('🗺️ Mapeo de coordenadas y conductor:', {
    rideId: ride.id,
    driverId: ride.driver_id,
    driverDataExists: !!driverData,
    driverInfo,
    original: {
      pickup_coordinates: ride.pickup_coordinates,
      destination_coordinates: ride.destination_coordinates
    },
    extracted: {
      pickupLocation,
      destinationLocation
    },
    mapped: {
      pickup_lat: mappedRide.pickup_latitude,
      pickup_lng: mappedRide.pickup_longitude,
      destination_lat: mappedRide.destination_latitude,
      destination_lng: mappedRide.destination_longitude
    },
    finalMappedObject: {
      origin: mappedRide.origin,
      destination: mappedRide.destination,
      driver: mappedRide.driver
    }
  });
  
  return mappedRide;
};

// Componente wrapper para manejar datos del conductor
const ScheduledRideDetailsWrapper: React.FC<{
  ride: any;
  open: boolean;
  onClose: () => void;
}> = ({ ride, open, onClose }) => {
  const { data: driverData } = useDriverData(ride?.driver_id);
  
  if (!ride) return null;
  
  const mappedRide = mapScheduledRideToModal(ride, driverData);
  
  return (
    <RequestDetailsModal
      open={open}
      onClose={onClose}
      request={mappedRide}
    />
  );
};

const ScheduledRides: React.FC = () => {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const [searchTerm, setSearchTerm] = useState(''); // Input inmediato (sin lag)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // Para filtrado optimizado
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Estado para notificaciones
  const [notificacion, setNotificacion] = useState<{
    open: boolean;
    mensaje: string;
    tipo: 'success' | 'error';
  }>({
    open: false,
    mensaje: '',
    tipo: 'success'
  });
  
  // Estados para las nuevas funcionalidades
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRide, setEditingRide] = useState<any>(null);


  // Debounce para optimizar el filtrado (input sin lag)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms para mejor rendimiento

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Efecto para resetear página cuando cambian los filtros
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchTerm, statusFilter, dateFrom, dateTo]);

  // Configurar filtros para la API (incluyendo search y paginación)
  const apiFilters = useMemo(() => ({
    page: page + 1, // Backend espera páginas desde 1, frontend usa desde 0
    limit: rowsPerPage,
    search: debouncedSearchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter as 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' : undefined,
    start_date: dateFrom ? dateFrom.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }) : undefined,
    end_date: dateTo ? dateTo.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }) : undefined,
  }), [page, rowsPerPage, debouncedSearchTerm, statusFilter, dateFrom, dateTo]);

  // Usar hook para obtener carreras programadas con paginación backend
  const { data: scheduledRidesData, isLoading, error, refetch } = useScheduledRides(apiFilters);
  
  // Extraer datos de la respuesta paginada
  const rides = scheduledRidesData?.data?.data || [];
  const totalRides = scheduledRidesData?.data?.total || 0;

  // DEBUG: Verificar paginación backend
  console.log('ScheduledRides paginación backend', { 
    rides: rides.length,
    totalRides, 
    page: page + 1,
    rowsPerPage,
    inputValue: searchTerm,
    filterValue: debouncedSearchTerm,
    currentStatus: statusFilter,
    isTyping: searchTerm !== debouncedSearchTerm,
    apiFilters
  });

  // Función para formatear los datos de la API
  const formatRideData = (ride: any) => {
    const scheduledDate = new Date(ride.scheduled_at);
    return {
      ...ride,
      scheduled_date: scheduledDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      }),
      scheduled_time: scheduledDate.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true // Formato 12 horas con AM/PM
      }),
      estimated_cost: parseFloat(ride.estimated_cost) || 0
    };
  };

  // Función para mostrar notificaciones
  const showNotification = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setNotificacion({
      open: true,
      mensaje,
      tipo
    });
  };

  // Función para cerrar notificaciones
  const handleCloseNotification = () => {
    setNotificacion({
      open: false,
      mensaje: '',
      tipo: 'success'
    });
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Mostrar loading mientras se cargan datos
  if (isLoading) {
    return (
      <PageContainer>
        <Typography {...titleStyle}>
          {t('scheduledRides.title')}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  // Mostrar error si falla la carga
  if (error) {
    return (
      <PageContainer>
        <Typography {...titleStyle}>
          {t('scheduledRides.title')}
        </Typography>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            {t('scheduledRides.notifications.loadError')}
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  // Handler para guardar nueva carrera
  const handleSaveRide = async () => {
    try {
      if (editingRide) {
        // El modal ya manejó la actualización, solo necesitamos limpiar el estado
        console.log('✅ Carrera editada exitosamente');
        setEditingRide(null);
        showNotification(t('scheduledRides.notifications.updated'), 'success');
      } else {
        // El modal ya manejó la creación, solo necesitamos mostrar notificación
        console.log('✅ Carrera creada exitosamente');
        showNotification(t('scheduledRides.notifications.created'), 'success');
      }
      refetch(); // Recargar datos después de crear/editar
    } catch (error: any) {
      console.error('Error en handleSaveRide:', error);
      const errorMessage = editingRide 
        ? t('scheduledRides.notifications.updateError')
        : t('scheduledRides.notifications.createError');
      showNotification(errorMessage, 'error');
    }
    setShowScheduleModal(false);
  };

  // Funciones para las acciones
  const handleViewDetails = (ride: any) => {
    setSelectedRide(ride);
    setShowDetailsModal(true);
  };

  const handleEditRide = (ride: any) => {
    setEditingRide(ride);
    setShowScheduleModal(true);
  };

  const handleDeleteRide = (ride: any) => {
    setSelectedRide(ride);
    setShowDeleteModal(true);
  };

  const confirmDeleteRide = async () => {
    if (selectedRide) {
      try {
        console.log('🗑️ Eliminando carrera:', selectedRide.id);
        
        // Llamar a la API para eliminar la carrera
        const response = await scheduledRideService.delete(selectedRide.id);
        
        console.log('✅ Respuesta del servidor:', response.data);
        
        // Cerrar el modal y limpiar el estado
        setShowDeleteModal(false);
        setSelectedRide(null);
        
        // Mostrar mensaje de éxito basado en la respuesta del servidor
        const message = response.data?.message || t('scheduledRides.notifications.deleted');
        showNotification(message, 'success');
        
        // Recargar datos
        refetch();
      } catch (error: any) {
        console.error('❌ Error al eliminar la carrera:', error);
        
        // Mostrar mensaje de error
        const errorMessage = error.response?.data?.message || error.message || t('scheduledRides.notifications.deleteError');
        showNotification(errorMessage, 'error');
      }
    }
  };

  // const handleStatusChange = (ride: any, newStatus: string) => {
  //   // Aquí implementarías el cambio de estado via API
  //   // await updateScheduledRide(ride.id, { status: newStatus });
  //   showNotification(t('scheduledRides.notifications.statusChanged'), 'success');
  //   refetch(); // Recargar datos
  // };





  const handleCloseModals = () => {
    setShowScheduleModal(false);
    setEditingRide(null);
  };

      return (
      <>
        {/* DEBUG: Div visible para confirmar renderizado */}
        <PageContainer>
          <Typography {...titleStyle}>
            {t('scheduledRides.title')}
          </Typography>

        {/* FAB para mobile */}
        {isMobile && (
          <Fab
            color="primary"
            onClick={() => setShowScheduleModal(true)}
            aria-label="Nueva carrera"
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
              },
              display: 'flex !important',
              visibility: 'visible !important'
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Filtros y acciones */}
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <FilterContainer>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
              <TextField
                {...searchBarStyle}
                placeholder={t('scheduledRides.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ScheduleIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm !== debouncedSearchTerm ? (
                      <InputAdornment position="end">
                        <CircularProgress size={16} sx={{ opacity: 0.7 }} />
                      </InputAdornment>
                    ) : null,
                  }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="all">{t('scheduledRides.filters.allStatuses')}</MenuItem>
                  <MenuItem value="pending">{t('scheduledRides.statuses.pending')}</MenuItem>
                  <MenuItem value="confirmed">{t('scheduledRides.statuses.confirmed')}</MenuItem>
                  <MenuItem value="assigned">{t('scheduledRides.statuses.assigned')}</MenuItem>
                  <MenuItem value="in_progress">{t('scheduledRides.statuses.inProgress')}</MenuItem>
                  <MenuItem value="completed">{t('scheduledRides.statuses.completed')}</MenuItem>
                  <MenuItem value="cancelled">{t('scheduledRides.statuses.cancelled')}</MenuItem>
                </Select>
              </FormControl>
              <DatePicker
                label={t('scheduledRides.filters.from')}
                value={dateFrom}
                onChange={setDateFrom}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 130 } } }}
                format="MM/dd/yyyy"
              />
              <DatePicker
                label={t('scheduledRides.filters.to')}
                value={dateTo}
                onChange={setDateTo}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 130 } } }}
                format="MM/dd/yyyy"
              />
            </Box>
            {!isMobile && (
              <Button {...primaryButtonStyle} startIcon={<AddIcon />} onClick={() => setShowScheduleModal(true)}>
                {t('scheduledRides.addRide')}
              </Button>
            )}
          </FilterContainer>
        </LocalizationProvider>

        {/* Vista Desktop - Tabla */}
        {!isMobile && (
          <Paper sx={{
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: '0',
            height: 'calc(100vh - 260px)' // Ajusta este valor según el alto de header/filtros
          }}>
            <TableContainer sx={{ flex: 1, minHeight: 0 }}>
              <Table stickyHeader>
                              <TableHead>
                <TableRow>
                  <TableCell>{t('scheduledRides.columns.client')}</TableCell>
                  <TableCell>{t('scheduledRides.columns.phone')}</TableCell>
                  <TableCell>{t('scheduledRides.columns.pickup')}</TableCell>
                  <TableCell>{t('scheduledRides.columns.destination')}</TableCell>
                  {/* <TableCell>{t('scheduledRides.columns.status')}</TableCell> */}
                  <TableCell>{t('scheduledRides.columns.priority')}</TableCell>
                  <TableCell>{t('scheduledRides.columns.date')}</TableCell>
                  <TableCell>{t('scheduledRides.columns.time')}</TableCell>
                  <TableCell align="center">{t('scheduledRides.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
                <TableBody>
                  {(rides || []).map((rideData: any) => {
                    const ride = formatRideData(rideData);
                    return (
                      <TableRow hover key={ride.id}>
                        <TableCell>{ride.client_name}</TableCell>
                        <TableCell>{ride.client_phone}</TableCell>
                        <TableCell>{ride.pickup_location}</TableCell>
                        <TableCell>{ride.destination}</TableCell>
                        {/* <TableCell>
                          <Chip label={ride.status} color={ride.status === 'pending' ? 'warning' : ride.status === 'completed' ? 'success' : 'info'} size="small" />
                        </TableCell> */}
                        <TableCell>
                          <Chip label={ride.priority} color={ride.priority === 'urgent' ? 'error' : ride.priority === 'high' ? 'warning' : 'info'} size="small" />
                        </TableCell>
                        <TableCell>{ride.scheduled_date}</TableCell>
                        <TableCell>{ride.scheduled_time}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewDetails(ride)}
                              title="Ver detalles"
                            >
                              <ViewIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditRide(ride)}
                              title="Editar"
                            >
                              <EditIcon />
                            </IconButton>
                            {/* <IconButton 
                              size="small" 
                              onClick={(e) => handleOpenStatusMenu(e, ride)}
                              title="Cambiar estado"
                            >
                              <ScheduleIcon />
                            </IconButton> */}
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteRide(ride)}
                              title="Eliminar"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalRides}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('common.rowsPerPage')}
              labelDisplayedRows={({ from, to, count }) => 
                t('common.paginationDisplayedRows', { from, to, count })
              }
            />
          </Paper>
        )}

        {/* Vista Mobile - Cards */}
        {isMobile && (
          <Box sx={{ pb: 10 }}>
            {(rides || []).map((rideData: any) => {
              const ride = formatRideData(rideData);
              return (
                <ScheduledRideCard 
                  key={ride.id} 
                  ride={ride}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEditRide}
                  onDelete={handleDeleteRide}
                  onStatusChange={() => {}}
                />
              );
            })}
          </Box>
        )}
      </PageContainer>
      
      {/* Modales */}
      <ScheduledRideModal 
        open={showScheduleModal} 
        onClose={handleCloseModals} 
        onSave={handleSaveRide}
        editingRide={editingRide}
      />
      
      <ScheduledRideDetailsWrapper
        ride={selectedRide}
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
      
      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteRide}
        rideName={selectedRide?.client_name || ''}
      />
      
      {/* <StatusChangeMenu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleCloseStatusMenu}
        currentStatus={statusMenuRide?.status || ''}
        onStatusChange={(newStatus) => {
          if (statusMenuRide) {
            handleStatusChange(statusMenuRide, newStatus);
          }
          handleCloseStatusMenu();
        }}
      /> */}
      
      {/* Notificación de éxito/error */}
      <Snackbar
        open={notificacion.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notificacion.tipo}
          sx={{ width: '100%' }}
        >
          {notificacion.mensaje}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ScheduledRides; 