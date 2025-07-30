import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Card,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Tooltip,
  Stack,
  Fab,
  Button,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table as MuiTable,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  TableCell as MuiTableCell,
  TableBody as MuiTableBody,
  Switch,
  Avatar
} from '@mui/material';
import { 
  titleStyle, 
  FilterContainer, 
  searchBarStyle, 
  filterSelectStyle, 
  PageContainer 
} from '../theme/standardStyles';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Route as RouteIcon
} from '@mui/icons-material';
import { useClients, useExportClients, useInvalidateClients, useDeleteClient, useToggleClientStatus, useClientRides } from '../hooks/useClientService';
import { ClientFormModal } from '../components/clients';
import type { ClientFilters, Client, ClientRide } from '../services/clientService';
import { useResponsive } from '../hooks/useResponsive';
import MapView from '../components/MapView';

const Clientes: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isMobile: isResponsiveMobile } = useResponsive();

  // Estados para filtros y paginación
  const [filters, setFilters] = useState<ClientFilters>({
    search: '',
    status: 'all',
    page: 1,
    limit: 10
  });

  // Estado local para el input de búsqueda (para debounce)
  const [searchInput, setSearchInput] = useState('');

  // Estados para el modal de formulario
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Estados para notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Estados para eliminar
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Estados para historial
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);

  // Estados para modal de ruta
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeData, setRouteData] = useState<{
    origin: string;
    destination: string;
    originCoords: { lat: number; lng: number };
    destCoords: { lat: number; lng: number };
  } | null>(null);

  // Hook para obtener historial de rides
  const { data: ridesData, isLoading: isLoadingRides } = useClientRides(
    historyClient?.id || 0,
    isHistoryModalOpen && !!historyClient?.id
  );

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        search: searchInput,
        page: 1
      }));
    }, 500); // 500ms de delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Hooks para datos
  const { data: clientsData, isLoading, error, refetch, isFetching } = useClients(filters);
  const { exportClients } = useExportClients();
  const { invalidateAll: invalidateClients } = useInvalidateClients();
  const deleteClientMutation = useDeleteClient();
  const toggleClientStatusMutation = useToggleClientStatus();

  // Estados locales
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Memoizar datos para optimización
  const clients = useMemo(() => clientsData?.clients || [], [clientsData]);
  const totalClients = useMemo(() => clientsData?.total || 0, [clientsData]);

  // Handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const handleStatusChange = (event: any) => {
    setFilters(prev => ({
      ...prev,
      status: event.target.value,
      page: 1
    }));
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage + 1
    }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1
    }));
  };

  const handleRefresh = async () => {
    await refetch();
    invalidateClients();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      await exportClients(filters);
    } catch (error) {
      console.error('Error al exportar clientes:', error);
      setExportError(error instanceof Error ? error.message : 'Error desconocido al exportar');
    } finally {
      setIsExporting(false);
    }
  };

  // Handlers para el formulario modal
  const handleOpenFormModal = (client?: Client) => {
    setSelectedClient(client || null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedClient(null);
  };

  const handleFormSuccess = (client: Client) => {
    const isNewClient = !selectedClient?.id;
    setNotification({
      open: true,
      message: isNewClient 
        ? t('clients.form.createClient') + ` "${client.first_name} ${client.last_name || ''}" exitoso`
        : t('clients.form.editClient') + ` "${client.first_name} ${client.last_name || ''}" exitoso`,
      severity: 'success'
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Formato americano: MM/DD/YYYY
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (active: boolean) => {
    return active ? 'success' : 'default';
  };

  const getStatusLabel = (active: boolean) => {
    return active ? t('clients.active') : t('clients.inactive');
  };

  const getFullName = (firstName: string, lastName: string | null) => {
    return lastName ? `${firstName} ${lastName}` : firstName;
  };

  // Función para obtener iniciales del cliente
  const getInitials = (firstName: string, lastName: string | null) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  // Funciones para formatear datos de rides
  const formatRideDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(2)} mi`;
  };

  const formatDuration = (duration: number) => {
    return `${duration} min`;
  };

  const parseCoordinates = (coordString: string) => {
    // Formato: "POINT(-94.5815521 39.0831593)"
    const match = coordString.match(/POINT\(([^)]+)\)/);
    if (match) {
      const [lng, lat] = match[1].split(' ').map(Number);
      return { lat, lng };
    }
    return { lat: 0, lng: 0 };
  };

  const getRideStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'in_progress': 'En progreso',
      'pending': 'Pendiente'
    };
    return statusMap[status] || status;
  };

  const getRideStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'completed': '#4caf50',
      'cancelled': '#f44336',
      'in_progress': '#ff9800',
      'pending': '#2196f3'
    };
    return colorMap[status] || '#9e9e9e';
  };

  // Handler para eliminar
  const handleOpenDeleteModal = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setClientToDelete(null);
  };
  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClientMutation.mutateAsync(clientToDelete.id);
      setNotification({
        open: true,
        message: t('clients.deleteSuccess'),
        severity: 'success'
      });
    } catch (error: any) {
      setNotification({
        open: true,
        message: error?.message || t('clients.deleteError'),
        severity: 'error'
      });
    } finally {
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  // Handler para historial
  const handleOpenHistoryModal = (client: Client) => {
    setHistoryClient(client);
    setIsHistoryModalOpen(true);
  };
  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setHistoryClient(null);
  };

  // Handler para modal de ruta
  const handleOpenRouteModal = (origin: string, destination: string, originCoords: any, destCoords: any) => {
    setRouteData({
      origin,
      destination,
      originCoords: { lat: originCoords.lat, lng: originCoords.lng },
      destCoords: { lat: destCoords.lat, lng: destCoords.lng }
    });
    setIsRouteModalOpen(true);
  };
  const handleCloseRouteModal = () => {
    setIsRouteModalOpen(false);
    setRouteData(null);
  };

  const handleToggleClientStatus = async (client: Client) => {
    try {
      const response = await toggleClientStatusMutation.mutateAsync(client.id);
      setNotification({
        open: true,
        message: (response as any)?.message || t('clients.statusUpdateSuccess'),
        severity: 'success'
      });
    } catch (error: any) {
      setNotification({
        open: true,
        message: error?.message || t('clients.statusUpdateError'),
        severity: 'error'
      });
    }
  };

  // Renderizado de loading solo para carga inicial
  if (isLoading && !clientsData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Renderizado de error
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {t('clients.loadError')}
        </Alert>
      </Box>
    );
  }

  return (
    <PageContainer>
      {/* Header unificado */}
      <Typography {...titleStyle}>
        {t('clients.title')}
      </Typography>

      {/* Error de exportación */}
      {exportError && (
        <Alert 
          severity="error" 
          onClose={() => setExportError(null)}
          sx={{ mb: 2 }}
        >
          {t('clients.exportError')}: {exportError}
        </Alert>
      )}

      {/* Filtros y acciones - UNIFICADO (SIN Paper) */}
      <FilterContainer>
        {/* Filtros */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          <TextField
            {...searchBarStyle}
            placeholder={t('clients.searchPlaceholder')}
            value={searchInput}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: isFetching && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl {...filterSelectStyle}>
            <InputLabel>{t('clients.status')}</InputLabel>
            <Select
              value={filters.status}
              label={t('clients.status')}
              onChange={handleStatusChange}
            >
              <MenuItem value="all">{t('clients.all')}</MenuItem>
              <MenuItem value="active">{t('clients.active')}</MenuItem>
              <MenuItem value="inactive">{t('clients.inactive')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Acciones */}
        <Stack direction="row" spacing={1}>
          <Tooltip title={t('clients.refresh')}>
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={t('clients.export')}>
            <IconButton 
              onClick={handleExport} 
              size="small"
              disabled={isExporting}
            >
              {isExporting ? <CircularProgress size={20} /> : <FileDownloadIcon />}
            </IconButton>
          </Tooltip>

          {/* Botón Nuevo Cliente - Solo desktop */}
          {!isResponsiveMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenFormModal()}
              sx={{
                bgcolor: '#e5308a',
                '&:hover': {
                  bgcolor: '#c5206a'
                }
              }}
            >
              {t('clients.form.newClient')}
            </Button>
          )}
        </Stack>
      </FilterContainer>

      {/* Contenido principal */}
      {clients.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('clients.noClients')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filters.search || filters.status !== 'all' 
              ? t('clients.adjustFilters')
              : t('clients.noRegistered')
            }
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Vista Desktop - Tabla */}
          {!isMobile && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('clients.fullName')}</TableCell>
                    <TableCell>{t('clients.phone')}</TableCell>
                    <TableCell>{t('clients.email')}</TableCell>
                    <TableCell>{t('clients.registrationDate')}</TableCell>
                    <TableCell>{t('clients.status')}</TableCell>
                    <TableCell>{t('clients.vip')}</TableCell>
                    <TableCell>{t('clients.rate')}</TableCell>
                    <TableCell align="center">{t('clients.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#e5308a', fontSize: 16 }}>
                            {getInitials(client.first_name, client.last_name)}
                          </Avatar>
                          {getFullName(client.first_name, client.last_name)}
                        </Box>
                      </TableCell>
                      <TableCell>{client.phone_number}</TableCell>
                      <TableCell>{client.email || '-'}</TableCell>
                      <TableCell>{formatDate(client.registration_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(client.active)}
                          color={getStatusColor(client.active) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {client.is_vip ? (
                          <Chip label="VIP" color="warning" size="small" />
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.is_vip ? (
                          client.vip_rate_type === 'flat_rate' && client.flat_rate ?
                            `$${client.flat_rate} (Fijo)` :
                          client.vip_rate_type === 'minute_rate' && client.minute_rate ?
                            `$${client.minute_rate}/min` :
                            '-'
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                          <Tooltip title={t('clients.viewHistory')}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenHistoryModal(client)}
                              sx={{ color: '#1976d2' }}
                            >
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('clients.editPassenger')}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenFormModal(client)}
                              sx={{ color: '#e5308a' }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('clients.deletePassenger')}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteModal(client)}
                              sx={{ color: '#d32f2f' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={client.active ? t('clients.deactivatePassenger') : t('clients.activatePassenger')}>
                            <Switch
                              checked={client.active}
                              onChange={() => handleToggleClientStatus(client)}
                              color="primary"
                              size="small"
                              inputProps={{ 'aria-label': 'activar/inactivar pasajero' }}
                            />
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Vista Mobile - Cards */}
          {isMobile && (
            <Stack spacing={2}>
              {clients.map((client) => (
                <Card key={client.id}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="div">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#e5308a', fontSize: 16 }}>
                            {getInitials(client.first_name, client.last_name)}
                          </Avatar>
                          {getFullName(client.first_name, client.last_name)}
                        </Box>
                      </Typography>
                      <Chip
                        label={getStatusLabel(client.active)}
                        color={getStatusColor(client.active) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Stack spacing={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {client.phone_number}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary">
                          Email: {client.email || '-'}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary">
                          {t('clients.registered')}: {formatDate(client.registration_date)}
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary">
                          VIP: {client.is_vip ? <Chip label="VIP" color="warning" size="small" /> : <span>-</span>}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary">
                          {t('clients.rate')}: {client.is_vip ? (
                            client.vip_rate_type === 'flat_rate' && client.flat_rate ?
                              `$${client.flat_rate} (Fijo)` :
                            client.vip_rate_type === 'minute_rate' && client.minute_rate ?
                              `$${client.minute_rate}/min` :
                              '-'
                          ) : (
                            '-'
                          )}
                        </Typography>
                      </Box>

                      {/* Acciones móvil */}
                      <Box display="flex" justifyContent="flex-end" mt={1}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenFormModal(client)}
                          sx={{ 
                            color: '#e5308a',
                            '&:hover': {
                              bgcolor: 'rgba(229, 48, 138, 0.04)'
                            }
                          }}
                        >
                          {t('common.edit')}
                        </Button>
                      </Box>
                    </Stack>

                    <Stack direction="row" alignItems="center" gap={1} mt={2}>
                      <Tooltip title={client.active ? t('clients.deactivatePassenger') : t('clients.activatePassenger')}>
                        <Switch
                          checked={client.active}
                          onChange={() => handleToggleClientStatus(client)}
                          color="primary"
                          size="small"
                          inputProps={{ 'aria-label': 'activar/inactivar pasajero' }}
                        />
                      </Tooltip>
                      <Typography variant="body2" color={client.active ? 'success.main' : 'text.secondary'}>
                        {getStatusLabel(client.active)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {/* Paginación */}
          <Box mt={3}>
            <TablePagination
              component="div"
              count={totalClients}
              page={(filters.page || 1) - 1}
              onPageChange={handlePageChange}
              rowsPerPage={filters.limit || 10}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage={t('common.rowsPerPage')}
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </Box>
        </>
      )}

      {/* FAB para móvil - Nuevo Cliente */}
      {isResponsiveMobile && (
        <Fab
          color="primary"
          onClick={() => handleOpenFormModal()}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: '#e5308a',
            '&:hover': {
              bgcolor: '#c5206a'
            },
            boxShadow: '0 8px 24px rgba(229, 48, 138, 0.4)',
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Modal de Formulario */}
      <ClientFormModal
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        client={selectedClient}
        onSuccess={handleFormSuccess}
      />

      {/* Notificaciones */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={isDeleteModalOpen} onClose={handleCloseDeleteModal}>
        <DialogTitle>{t('clients.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('clients.deleteConfirmMessage', {
              name: `${clientToDelete?.first_name} ${clientToDelete?.last_name || ''}`.trim()
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteModal}>{t('common.cancel')}</Button>
          <Button onClick={handleDeleteClient} color="error" variant="contained">{t('common.delete')}</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de historial de rides (usando datos reales del endpoint) */}
      <Dialog open={isHistoryModalOpen} onClose={handleCloseHistoryModal} maxWidth="xl" fullWidth>
        <DialogTitle>
          {t('clients.history.title').replace('{name}', `${historyClient?.first_name} ${historyClient?.last_name || ''}`.trim())}
          {ridesData && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('clients.history.totalRides').replace('{count}', ridesData.total_rides.toString())} | {t('clients.history.totalSpent').replace('{amount}', formatPrice(ridesData.total_spent))}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: 0, minHeight: '350px', maxHeight: '70vh', overflowX: 'auto' }}>
          {isLoadingRides ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                {t('clients.history.loading')}
              </Typography>
            </Box>
          ) : ridesData?.rides && ridesData.rides.length > 0 ? (
            <MuiTable size="small">
              <MuiTableHead>
                <MuiTableRow>
                  <MuiTableCell>{t('clients.history.origin')}</MuiTableCell>
                  <MuiTableCell>{t('clients.history.destination')}</MuiTableCell>
                  <MuiTableCell>{t('clients.history.date')}</MuiTableCell>
                  <MuiTableCell>{t('clients.history.status')}</MuiTableCell>
                  <MuiTableCell>{t('clients.history.price')}</MuiTableCell>
                  <MuiTableCell>{t('clients.history.paymentMethod')}</MuiTableCell>
                  <MuiTableCell>{t('clients.history.distance')}</MuiTableCell>
                  <MuiTableCell>{t('clients.history.duration')}</MuiTableCell>
                  <MuiTableCell>{t('clients.history.driver')}</MuiTableCell>
                  <MuiTableCell>{t('clients.history.route')}</MuiTableCell>
                </MuiTableRow>
              </MuiTableHead>
              <MuiTableBody>
                {ridesData.rides.map((ride: ClientRide) => (
                  <MuiTableRow key={ride.id}>
                    <MuiTableCell>{ride.origin}</MuiTableCell>
                    <MuiTableCell>{ride.destination}</MuiTableCell>
                    <MuiTableCell>{formatRideDate(ride.request_date)}</MuiTableCell>
                    <MuiTableCell>
                      <Chip
                        label={t(`clients.history.statuses.${ride.status}`) || getRideStatusLabel(ride.status)}
                        size="small"
                        sx={{
                          bgcolor: getRideStatusColor(ride.status),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </MuiTableCell>
                    <MuiTableCell>{formatPrice(ride.price)}</MuiTableCell>
                    <MuiTableCell>{t(`clients.history.paymentMethods.${ride.payment_method}`) || ride.payment_method}</MuiTableCell>
                    <MuiTableCell>{formatDistance(ride.distance)}</MuiTableCell>
                    <MuiTableCell>{formatDuration(ride.duration)}</MuiTableCell>
                    <MuiTableCell>
                      {ride.driver.first_name} {ride.driver.last_name}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {ride.driver.license_plate}
                      </Typography>
                    </MuiTableCell>
                    <MuiTableCell>
                      <Tooltip title={t('clients.history.viewRoute')}>
                        <IconButton 
                          size="small" 
                          sx={{ color: '#1976d2' }}
                          onClick={() => {
                            const originCoords = parseCoordinates(ride.origin_coordinates);
                            const destCoords = parseCoordinates(ride.destination_coordinates);
                            handleOpenRouteModal(
                              ride.origin,
                              ride.destination,
                              originCoords,
                              destCoords
                            );
                          }}
                        >
                          <RouteIcon />
                        </IconButton>
                      </Tooltip>
                    </MuiTableCell>
                  </MuiTableRow>
                ))}
              </MuiTableBody>
            </MuiTable>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography variant="body2" color="text.secondary">
                {t('clients.history.noRides')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistoryModal}>{t('clients.history.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de ruta en mapa */}
      <Dialog open={isRouteModalOpen} onClose={handleCloseRouteModal} maxWidth="lg" fullWidth>
        <DialogTitle>
          Ruta: {routeData?.origin} → {routeData?.destination}
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '500px' }}>
          {routeData && (
            <MapView 
              lat={routeData.originCoords.lat}
              lng={routeData.originCoords.lng}
              showDestination={{
                lat: routeData.destCoords.lat,
                lng: routeData.destCoords.lng,
                title: routeData.destination
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRouteModal}>{t('clients.history.close')}</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default Clientes; 