import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  Switch,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Avatar,
  Badge,
  Card,
  CardContent,
  CardActions,
  Divider,
  Fab,
  Select,
  MenuItem,
  FormControl

} from '@mui/material';
import { 
  titleStyle, 
  FilterContainer, 
  searchBarStyle, 
  filterSelectStyle, 
  PageContainer,
  primaryButtonStyle
} from '../theme/standardStyles';
import { 
  Add as AddIcon, 
  Visibility as VisibilityIcon, 
  Search as SearchIcon,
  Close as CloseIcon,
  Upload as UploadIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,

} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConductores } from '../hooks/useConductores';
import { conductorService } from '../services/conductorService';
import type { Conductor } from '../services/conductorService';
import { useMutation } from '@tanstack/react-query';
import PhoneNumberInput from '../components/PhoneNumberInput';
import { usePhoneValidation } from '../hooks/usePhoneValidation';
import { useResponsive } from '../hooks/useResponsive';
import DocumentUploadSection from '../components/DocumentUploadSection';

// Interfaz para el formulario de nuevo conductor
interface NuevoConductorForm {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  vehicle: string;
  model: string;
  color: string;
  year: number;
  license_plate: string;
  driver_license: string; // Mantener por compatibilidad con API
  id_document: string;    // Mantener por compatibilidad con API
  profile_picture?: string;
  // Nuevos campos para archivos de documentos
  driver_license_photos?: File[];
  id_document_photos?: File[];
  driver_license_urls?: string[];
  id_document_urls?: string[];
  // Campos adicionales requeridos por la API pero con valores por defecto
  status?: 'active' | 'inactive' | 'pending';
  active?: boolean;
  verified?: boolean;
  registration_date?: string;
}

// Interfaz para las notificaciones
interface NotificacionState {
  open: boolean;
  mensaje: string;
  tipo: 'success' | 'error';
}

// Ya no necesitamos FilterSelect local, usaremos filterSelectStyle de standardStyles

// Componente de tarjeta móvil para conductores
const ConductorMobileCard = ({ 
  conductor, 
  onView, 
  onToggleStatus, 
  onOpenMaps, 
  switchLoading,
  formatUltimaActividad,
  getEstadoChip,
  GoogleMapsIcon,
  t
}: {
  conductor: Conductor;
  onView: (id: number) => void;
  onToggleStatus: (id: number, active: boolean) => void;
  onOpenMaps: (conductor: Conductor) => void;
  switchLoading: Record<number, boolean>;
  formatUltimaActividad: (timestamp: string) => string;
  getEstadoChip: (estado: string) => React.ReactNode;
  GoogleMapsIcon: React.ComponentType<{ size?: number }>;
  t: (key: string) => string;
}) => (
  <Card 
    sx={{ 
      mb: 2, 
      borderRadius: 2,
      '&:hover': {
        boxShadow: 2,
        transform: 'translateY(-2px)',
        transition: 'all 0.2s ease-in-out'
      }
    }}
  >
    <CardContent sx={{ pb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar 
          src={conductor.profile_picture_url || (conductor.profile_picture && conductor.profile_picture.startsWith('http') ? conductor.profile_picture : '')}
          sx={{ mr: 2, bgcolor: '#e91e63' }}
        >
          <PersonIcon />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {conductor.first_name} {conductor.last_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {conductor.phone_number}
          </Typography>
        </Box>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <Switch
            checked={conductor.active}
            onChange={() => onToggleStatus(conductor.id, conductor.active)}
            color="primary"
            size="small"
            disabled={switchLoading[conductor.id] || false}
          />
          {switchLoading[conductor.id] && (
            <CircularProgress 
              size={20} 
              sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }} 
            />
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            {t('drivers.status')}:
          </Typography>
          {getEstadoChip(conductor.status)}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            {t('drivers.columns.location')}:
          </Typography>
          {conductor.current_location ? (
                          <Button
                variant="text"
                size="small"
                onClick={() => onOpenMaps(conductor)}
                sx={{ 
                  color: '#4285f4',
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  minWidth: 'auto',
                  p: 0.5
                }}
              >
                <GoogleMapsIcon size={14} />
                {t('drivers.viewOnMap')}
              </Button>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('drivers.notAvailable')}
              </Typography>
            )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Última actividad:
          </Typography>
          <Typography variant="body2">
            {formatUltimaActividad(conductor.last_update || '')}
          </Typography>
        </Box>
      </Box>
    </CardContent>

    <Divider />
    
    <CardActions sx={{ justifyContent: 'center', px: 2, py: 1 }}>
      <Button
        size="small"
        startIcon={<VisibilityIcon />}
        onClick={() => onView(conductor.id)}
        sx={{ 
          color: '#e91e63',
          textTransform: 'none',
          fontSize: '0.875rem'
        }}
      >
        Ver detalles
      </Button>
    </CardActions>
  </Card>
);

const Conductores = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Buscador con debounce
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [switchLoading, setSwitchLoading] = useState<Record<number, boolean>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const { validatePhone, formatForAPI } = usePhoneValidation();
  
  // Estado para el modal
  const [openModal, setOpenModal] = useState(false);
  const [nuevoConductor, setNuevoConductor] = useState<NuevoConductorForm>({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    vehicle: '',
    model: '',
    color: '',
    year: new Date().getFullYear(),
    license_plate: '',
    driver_license: '',
    id_document: '',
    profile_picture: '',
    status: 'pending',
    active: true,
    verified: false,
    registration_date: new Date().toISOString()
  });
  
  // Estado para notificaciones
  const [notificacion, setNotificacion] = useState<NotificacionState>({
    open: false,
    mensaje: '',
    tipo: 'success'
  });

  // Parámetros para la consulta con paginación
  const queryParams = useMemo(() => ({
    page: page + 1, // Backend espera páginas desde 1, frontend usa desde 0
    limit: rowsPerPage,
    search: searchTerm || undefined,
    active: activeFilter !== 'all' ? (activeFilter === 'active') : undefined,
    verified: statusFilter !== 'all' ? (statusFilter === 'available') : undefined
  }), [page, rowsPerPage, searchTerm, statusFilter, activeFilter]);

  // Debug: Log para verificar parámetros
  useEffect(() => {
    console.log('Parámetros de consulta actualizados:', queryParams);
  }, [queryParams]);

  // Usar el hook personalizado para obtener conductores con paginación
  const { data: conductoresResponse, isLoading, isError, refetch } = useConductores().getConductores(queryParams);
  
  // Forzar refetch cuando se invaliden las queries (por ejemplo, al regresar de editar)
  useEffect(() => {
    const handleFocus = () => {
      // Refetch cuando la ventana vuelve a tener foco (usuario regresa de otra página)
      refetch();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);
  
  // Refetch al montar el componente o cuando cambie la ruta
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  // Extraer datos de la respuesta paginada
  const conductores = conductoresResponse?.data || [];
  const totalConductores = conductoresResponse?.total || 0;
  
  // Hook para cambiar campo active del conductor
  const toggleActiveMutation = useConductores().toggleConductorActive();

  // Debug: Log para verificar qué datos estamos recibiendo
  useEffect(() => {
    console.log('Datos de conductores recibidos:', {
      conductoresResponse,
      conductores,
      isLoading,
      isError,
      type: typeof conductores,
      isArray: Array.isArray(conductores),
      length: conductores?.length,
      total: totalConductores
    });
  }, [conductoresResponse, conductores, isLoading, isError, totalConductores]);

  // Debounce para la búsqueda (como en Clientes.tsx)
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Debounce ejecutado - searchInput:', searchInput, 'searchTerm:', searchTerm);
      setSearchTerm(searchInput);
      setPage(0); // Reiniciar a la primera página al buscar
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Estado para gestionar la subida de avatares
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para gestionar documentos
  const [documentFiles, setDocumentFiles] = useState<{
    driverLicense: File[];
    vehicleInsurance: File[];
    vehicleRegistration: File[];
    vehiclePhoto: File[];
  }>({
    driverLicense: [],
    vehicleInsurance: [],
    vehicleRegistration: [],
    vehiclePhoto: []
  });
  
  const [documentUploadProgress, setDocumentUploadProgress] = useState<{
    driverLicense: number;
    vehicleInsurance: number;
    vehicleRegistration: number;
    vehiclePhoto: number;
  }>({
    driverLicense: 0,
    vehicleInsurance: 0,
    vehicleRegistration: 0,
    vehiclePhoto: 0
  });
  
  const [documentErrors, setDocumentErrors] = useState<{
    driverLicense?: string;
    vehicleInsurance?: string;
    vehicleRegistration?: string;
    vehiclePhoto?: string;
  }>({});
  
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);

  // Mutación para crear conductor
  const crearConductorMutation = useMutation({
    mutationFn: (datos: NuevoConductorForm) => {
      // Asegurar que tenemos todos los campos necesarios
      const conductorData = {
        ...datos,
        status: datos.status || 'pending',
        active: datos.active !== undefined ? datos.active : true,
        verified: datos.verified !== undefined ? datos.verified : false,
        registration_date: datos.registration_date || new Date().toISOString(),
      };
      return conductorService.crearConductor(conductorData);
    },
    onSuccess: () => {
      handleCloseModal();
      refetch();
      setNotificacion({
        open: true,
        mensaje: 'Conductor registrado exitosamente',
        tipo: 'success'
      });
    },
    onError: (error: Error) => {
      console.error('Error al registrar conductor:', error);
      setNotificacion({
        open: true,
        mensaje: error.message || 'Error al registrar conductor',
        tipo: 'error'
      });
    }
  });



  // El filtrado ahora se hace en el backend, no necesitamos useEffect

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };



  const handleViewConductor = (id: number) => {
    navigate(`/conductores/${id}`);
  };

  // Funciones para el modal
  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    // Reiniciar el formulario
    setNuevoConductor({
      first_name: '',
      last_name: '',
      phone_number: '',
      email: '',
      vehicle: '',
      model: '',
      color: '',
      year: new Date().getFullYear(),
      license_plate: '',
      driver_license: '',
      id_document: '',
      profile_picture: '',
      status: 'pending',
      active: true,
      verified: false,
      registration_date: new Date().toISOString()
    });
    
    // Limpiar estado del avatar
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Limpiar estados de documentos
    setDocumentFiles({
      driverLicense: [],
      vehicleInsurance: [],
      vehicleRegistration: [],
      vehiclePhoto: []
    });
    setDocumentUploadProgress({
      driverLicense: 0,
      vehicleInsurance: 0,
      vehicleRegistration: 0,
      vehiclePhoto: 0
    });
    setDocumentErrors({});
    setIsUploadingDocuments(false);
    setPhoneError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNuevoConductor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para manejar selección de archivo de avatar
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('El archivo excede el tamaño máximo permitido (2MB)');
      return;
    }
    
    // Validar formato
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validFormats.includes(file.type)) {
      setAvatarError('Formato no válido. Solo se permiten archivos JPG, JPEG y PNG');
      return;
    }
    
    setAvatarFile(file);
    
    // Crear URL para previsualización
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setAvatarPreview(fileReader.result as string);
    };
    fileReader.readAsDataURL(file);
  };
  
  // Abrir selector de archivos
  const handleSelectAvatar = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Eliminar avatar seleccionado
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handlers para documentos
  const handleDriverLicenseChange = (files: File[]) => {
    setDocumentFiles(prev => ({
      ...prev,
      driverLicense: files
    }));
    setDocumentErrors(prev => ({
      ...prev,
      driverLicense: undefined
    }));
  };

  const handleVehicleInsuranceChange = (files: File[]) => {
    setDocumentFiles(prev => ({
      ...prev,
      vehicleInsurance: files
    }));
    setDocumentErrors(prev => ({
      ...prev,
      vehicleInsurance: undefined
    }));
  };

  const handleVehicleRegistrationChange = (files: File[]) => {
    setDocumentFiles(prev => ({
      ...prev,
      vehicleRegistration: files
    }));
    setDocumentErrors(prev => ({
      ...prev,
      vehicleRegistration: undefined
    }));
  };

  const handleVehiclePhotoChange = (files: File[]) => {
    setDocumentFiles(prev => ({
      ...prev,
      vehiclePhoto: files
    }));
    setDocumentErrors(prev => ({
      ...prev,
      vehiclePhoto: undefined
    }));
  };

  // Validar documentos antes de submit
  const validateDocuments = (): boolean => {
    const errors: { 
      driverLicense?: string; 
      vehicleInsurance?: string;
      vehicleRegistration?: string;
      vehiclePhoto?: string;
    } = {};
    let isValid = true;
    
    if (documentFiles.driverLicense.length === 0) {
      errors.driverLicense = 'La foto de la licencia de conducir es requerida';
      isValid = false;
    }
    
    if (documentFiles.vehicleInsurance.length === 0) {
      errors.vehicleInsurance = 'La foto del seguro del vehículo es requerida';
      isValid = false;
    }

    if (documentFiles.vehicleRegistration.length === 0) {
      errors.vehicleRegistration = 'La foto del registro del vehículo es requerida';
      isValid = false;
    }

    if (documentFiles.vehiclePhoto.length === 0) {
      errors.vehiclePhoto = 'La foto del vehículo es requerida';
      isValid = false;
    }
    
    setDocumentErrors(errors);
    return isValid;
  };

  // Modificar handleSubmit para manejar la subida del avatar y documentos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    
    try {
      // Validar número de teléfono
      const phoneValidation = validatePhone(nuevoConductor.phone_number);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.errorMessage || 'Número de teléfono inválido');
        return;
      }
      
      // Validar documentos
      if (!validateDocuments()) {
        return;
      }
      
      setIsUploadingDocuments(true);
      
      // Formatear número para la API
      const formattedPhone = formatForAPI(nuevoConductor.phone_number);
      const conductorData = {
        ...nuevoConductor,
        phone_number: formattedPhone,
        id_document: '  ',
      };
      
      // 1. Crear conductor con datos básicos
      const nuevoConductorResponse = await crearConductorMutation.mutateAsync(conductorData);
      if (nuevoConductorResponse && nuevoConductorResponse.id) {
        const driverId = nuevoConductorResponse.id;
        
        
          await conductorService.actualizarDocumentosVehiculo(driverId, {
          documentos: {
            driver_license: documentFiles.driverLicense.length > 0 ? documentFiles.driverLicense[0] : undefined,
            vehicle_insurance: documentFiles.vehicleInsurance.length > 0 ? documentFiles.vehicleInsurance[0] : undefined,
            vehicle_registration: documentFiles.vehicleRegistration.length > 0 ? documentFiles.vehicleRegistration[0] : undefined,
            vehicle_photo: documentFiles.vehiclePhoto.length > 0 ? documentFiles.vehiclePhoto[0] : undefined
          }
         });

        
        if (avatarFile) {
          await conductorService.uploadDriverAvatar(driverId, avatarFile);
        }
        
        // Refrescar datos y cerrar modal
        await refetch();
        handleCloseModal();
        
        setNotificacion({
          open: true,
          mensaje: 'Conductor registrado exitosamente con documentos',
          tipo: 'success'
        });
      }
    } catch (error) {
      console.error('Error al registrar conductor:', error);
      setNotificacion({
        open: true,
        mensaje: error instanceof Error ? error.message : 'Error al registrar conductor',
        tipo: 'error'
      });
    } finally {
      setIsUploadingDocuments(false);
      setDocumentUploadProgress({ 
        driverLicense: 0, 
        vehicleInsurance: 0,
        vehicleRegistration: 0,
        vehiclePhoto: 0
      });
    }
  };

  const handleCloseNotificacion = () => {
    setNotificacion(prev => ({
      ...prev,
      open: false
    }));
  };

  const getEstadoChip = (estado: string) => {
    const config: Record<string, { color: 'success' | 'error' | 'warning' | 'default', label: string }> = {
      'active': { color: 'success', label: t('drivers.statuses.active') },
      'available': { color: 'success', label: 'Online' },
      'inactive': { color: 'error', label: t('drivers.statuses.inactive') },
      'offline': { color: 'error', label: t('drivers.statuses.offline') },
      'pending': { color: 'warning', label: t('drivers.statuses.pending') },
      'busy': { color: 'default', label: t('drivers.statuses.busy') },
      'on_the_way': { color: 'warning', label: t('drivers.statuses.onTheWay') }
    };

    const { color, label } = config[estado.toLowerCase()] || { color: 'default', label: estado };
    return <Chip label={label} color={color} size="small" />;
  };

  const formatUltimaActividad = (timestamp: string) => {
    if (!timestamp) return '-';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Menos de una hora
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return t('drivers.lastActivity.minutesAgo', { minutes });
    }
    
    // Menos de un día
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return t('drivers.lastActivity.hoursAgo', { hours });
    }
    
    // Más de un día
    const days = Math.floor(diff / 86400000);
    return t('drivers.lastActivity.daysAgo', { days });
  };
  
  // Toggle para cambiar estado del conductor (activo/inactivo)
  const handleToggleEstado = async (id: number, activeActual: boolean) => {
    const nuevoEstado = !activeActual;
    
    setSwitchLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      await toggleActiveMutation.mutateAsync({ id, active: nuevoEstado });
      
              setNotificacion({
          open: true,
          mensaje: t('drivers.statusChangedTo', { status: nuevoEstado ? t('drivers.statuses.active') : t('drivers.statuses.inactive') }),
          tipo: 'success'
        });
    } catch (error) {
      console.error('Error al cambiar estado del conductor:', error);
              setNotificacion({
          open: true,
          mensaje: t('drivers.statusChangeError'),
          tipo: 'error'
        });
    } finally {
      setSwitchLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Generar enlace de Google Maps
  const getGoogleMapsUrl = (lat: number, lng: number, label?: string) => {
    const encodedLabel = label ? encodeURIComponent(label) : '';
    return `https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=15${encodedLabel ? `&t=m&label=${encodedLabel}` : ''}`;
  };

  // Abrir Google Maps
  const openInGoogleMaps = (conductor: Conductor) => {
    if (conductor?.current_location) {
      const lat = conductor.current_location.coordinates[1];
      const lng = conductor.current_location.coordinates[0];
      const label = `${conductor.first_name} ${conductor.last_name} - Conductor`;
      const url = getGoogleMapsUrl(lat, lng, label);
      window.open(url, '_blank');
    }
  };

  // Componente de icono de Google Maps
  const GoogleMapsIcon = ({ size = 14 }: { size?: number }) => (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
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

  if (isError) {
    return (
      <Paper elevation={2} sx={{ p: 3, bgcolor: '#fff9f9' }}>
        <Typography color="error">
          {t('drivers.errors.loadError')}
        </Typography>
      </Paper>
    );
  }

  return (
    <PageContainer>
      {/* Notificación de éxito/error */}
      <Snackbar 
        open={notificacion.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotificacion}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotificacion} severity={notificacion.tipo} sx={{ width: '100%' }}>
          {notificacion.mensaje}
        </Alert>
      </Snackbar>

      {/* Header unificado */}
      <Typography {...titleStyle}>
        {t('drivers.title')}
      </Typography>

      {/* FAB para mobile - Siempre visible en móvil */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={handleOpenModal}
          aria-label="Añadir conductor"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: '#e5308a',
            color: 'white',
            '&:hover': {
              bgcolor: '#c5206a',
            },
            zIndex: 1300, // Mayor z-index para asegurar visibilidad
            boxShadow: '0 8px 16px rgba(229, 48, 138, 0.3)',
            '&:active': {
              boxShadow: '0 4px 8px rgba(229, 48, 138, 0.3)',
            },
            // Forzar visibilidad
            display: 'flex !important',
            visibility: 'visible !important'
          }}
        >
          <AddIcon />
        </Fab>
      )}
      


      {/* Filtros y acciones - UNIFICADO */}
      <FilterContainer>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          <TextField
            {...searchBarStyle}
            placeholder={t('drivers.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            type="text"
            autoComplete="off"
          />
          
          <FormControl {...filterSelectStyle} size="small">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="all">{t('drivers.filters.allStatuses')}</MenuItem>
              <MenuItem value="available">{t('drivers.statuses.online')}</MenuItem>
              <MenuItem value="offline">{t('drivers.statuses.offline')}</MenuItem>
              <MenuItem value="busy">{t('drivers.statuses.busy')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl {...filterSelectStyle} size="small">
            <Select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="all">{t('drivers.filters.all')}</MenuItem>
              <MenuItem value="active">{t('drivers.filters.active')}</MenuItem>
              <MenuItem value="inactive">{t('drivers.filters.inactive')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        {/* Botón desktop */}
        {!isMobile && (
          <Button 
            {...primaryButtonStyle}
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
          >
            {t('drivers.addDriver')}
          </Button>
        )}
      </FilterContainer>

      {/* Mensaje cuando no hay conductores */}
      {conductores.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('drivers.noDrivers')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || statusFilter !== 'all' || activeFilter !== 'all'
              ? t('drivers.adjustFilters')
              : t('drivers.noRegistered')
            }
          </Typography>
        </Paper>
      ) : (
        <>
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
                  <TableCell>{t('drivers.columns.name')}</TableCell>
                  <TableCell>{t('drivers.columns.phone')}</TableCell>
                  <TableCell>{t('drivers.columns.location')}</TableCell>
                  <TableCell>{t('drivers.columns.status')}</TableCell>
                  <TableCell>{t('drivers.columns.lastActivity')}</TableCell>
                  <TableCell align="center">{t('drivers.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conductores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {t('drivers.noResults')}
                    </TableCell>
                  </TableRow>
                ) : (
                  conductores.map((conductor: Conductor) => (
                    <TableRow hover key={conductor.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={conductor.profile_picture_url || (conductor.profile_picture && conductor.profile_picture.startsWith('http') ? conductor.profile_picture : '')}
                            sx={{ mr: 2, bgcolor: '#e91e63', width: 32, height: 32 }}
                          >
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {conductor.first_name} {conductor.last_name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{conductor.phone_number}</TableCell>
                      <TableCell>
                        {conductor.current_location ? (
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => openInGoogleMaps(conductor)}
                            sx={{ 
                              color: '#4285f4',
                              textTransform: 'none',
                              fontSize: '0.875rem',
                              minWidth: 'auto',
                              p: 0.5
                            }}
                          >
                            <GoogleMapsIcon size={14} />
                            {t('drivers.viewLocation')}
                          </Button>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t('drivers.notAvailable')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{getEstadoChip(conductor.status)}</TableCell>
                      <TableCell>{formatUltimaActividad(conductor.last_update || '')}</TableCell>
                                              <TableCell align="center">
                          <Box display="flex" justifyContent="center" alignItems="center" gap={0.5}>
                            <Tooltip title={t('drivers.viewDetails')}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewConductor(conductor.id)}
                                sx={{ minWidth: '44px', minHeight: '44px' }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Box position="relative" display="inline-flex">
                              <Switch
                                checked={conductor.active}
                                onChange={() => handleToggleEstado(conductor.id, conductor.active)}
                                color="primary"
                                size="small"
                                disabled={switchLoading[conductor.id] || false}
                              />
                              {switchLoading[conductor.id] && (
                                <CircularProgress 
                                  size={14} 
                                  sx={{ 
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)'
                                  }} 
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalConductores}
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
        <Box sx={{ pb: 10 }}> {/* Espacio para el FAB */}
          {(conductores || [])
            .map((conductor: Conductor) => (
              <ConductorMobileCard
                key={conductor.id}
                conductor={conductor}
                onView={handleViewConductor}
                onToggleStatus={handleToggleEstado}
                onOpenMaps={openInGoogleMaps}
                switchLoading={switchLoading}
                formatUltimaActividad={formatUltimaActividad}
                getEstadoChip={getEstadoChip}
                GoogleMapsIcon={GoogleMapsIcon}
                t={t}
              />
            ))}
          
          {/* Paginación mobile */}
          <Paper sx={{ mt: 2 }}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalConductores}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('common.rowsPerPage')}
              labelDisplayedRows={({ from, to, count }) => 
                t('common.paginationDisplayedRows', { from, to, count })
              }
              sx={{
                '& .MuiTablePagination-toolbar': {
                  minHeight: '52px' // Touch-friendly height
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '0.875rem'
                }
              }}
            />
          </Paper>
        </Box>
      )}
        </>
      )}

      {/* Modal para agregar conductor - Responsive */}
      <Dialog 
        open={openModal} 
        onClose={handleCloseModal}
        maxWidth={isMobile ? false : "md"}
        fullWidth={!isMobile}
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            ...(isMobile && {
              margin: 0,
              width: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: 0
            })
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: { xs: 2, sm: 3 },
            px: { xs: 2, sm: 3 }
          }}
        >
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600 }}>
            {t('drivers.modal.title')}
          </Typography>
          <IconButton 
            onClick={handleCloseModal}
            sx={{ 
              minWidth: '44px', 
              minHeight: '44px' 
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent 
            sx={{ 
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 3 }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
              {/* Selector de avatar */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: { xs: 2, sm: 3 } }}>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                />
                
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Box 
                      sx={{ 
                        bgcolor: 'primary.main', 
                        borderRadius: '50%', 
                        p: 0.5, 
                        cursor: 'pointer' 
                      }}
                      onClick={handleSelectAvatar}
                    >
                      <PhotoCameraIcon fontSize="small" sx={{ color: 'white' }}/>
                    </Box>
                  }
                >
                  <Avatar 
                    src={avatarPreview || ''} 
                    sx={{ width: 100, height: 100, mb: 1 }}
                  >
                    {!avatarPreview && <PersonIcon sx={{ fontSize: 50 }} />}
                  </Avatar>
                </Badge>
                
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UploadIcon />}
                    onClick={handleSelectAvatar}
                  >
                    {t('drivers.modal.avatar.upload')}
                  </Button>
                  
                  {avatarPreview && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleRemoveAvatar}
                    >
                      {t('drivers.modal.avatar.delete')}
                    </Button>
                  )}
                </Box>
                
                {avatarError && (
                  <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                    {avatarError}
                  </Typography>
                )}
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {t('drivers.modal.avatar.restrictions')}
                </Typography>
              </Box>

              {/* Información personal */}
              <Typography variant="subtitle1" fontWeight="bold">
                {t('drivers.modal.personalInfo')}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  required
                  fullWidth
                  label={t('drivers.fields.firstName')}
                  name="first_name"
                  value={nuevoConductor.first_name}
                  onChange={handleInputChange}
                  size="small"
                  inputProps={{ maxLength: 50 }}
                  helperText={`${(nuevoConductor.first_name || '').length}/50 caracteres`}
                />
                <TextField
                  required
                  fullWidth
                  label={t('drivers.fields.lastName')}
                  name="last_name"
                  value={nuevoConductor.last_name}
                  onChange={handleInputChange}
                  size="small"
                  inputProps={{ maxLength: 50 }}
                  helperText={`${(nuevoConductor.last_name || '').length}/50 caracteres`}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <PhoneNumberInput
                  value={nuevoConductor.phone_number}
                  onChange={(value) => {
                    setNuevoConductor(prev => ({
                      ...prev,
                      phone_number: value || ''
                    }));
                    setPhoneError(''); // Limpiar error al cambiar
                  }}
                  placeholder="(555) 123-4567"
                  error={!!phoneError}
                  helperText={phoneError}
                  defaultCountry="US"
                  required
                />
                <TextField
                  required
                  fullWidth
                  label={t('drivers.fields.email')}
                  name="email"
                  type="email"
                  value={nuevoConductor.email}
                  onChange={handleInputChange}
                  size="small"
                />
              </Box>

              {/* Información del vehículo */}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
                {t('drivers.modal.vehicleInfo')}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  required
                  fullWidth
                  label={t('drivers.fields.brand')}
                  name="vehicle"
                  value={nuevoConductor.vehicle}
                  onChange={handleInputChange}
                  size="small"
                  inputProps={{ maxLength: 30 }}
                  helperText={`${(nuevoConductor.vehicle || '').length}/30 caracteres`}
                />
                <TextField
                  required
                  fullWidth
                  label={t('drivers.fields.model')}
                  name="model"
                  value={nuevoConductor.model}
                  onChange={handleInputChange}
                  size="small"
                  inputProps={{ maxLength: 30 }}
                  helperText={`${(nuevoConductor.model || '').length}/30 caracteres`}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                  required
                  fullWidth
                  label={t('drivers.fields.color')}
                  name="color"
                  value={nuevoConductor.color}
                  onChange={handleInputChange}
                  size="small"
                  inputProps={{ maxLength: 20 }}
                  helperText={`${(nuevoConductor.color || '').length}/20 caracteres`}
                />
                <TextField
                  required
                  fullWidth
                  label={t('drivers.fields.year')}
                  name="year"
                  type="number"
                  value={nuevoConductor.year}
                  onChange={handleInputChange}
                  size="small"
                  InputProps={{ inputProps: { min: 1990, max: new Date().getFullYear() } }}
                />
                <TextField
                  required
                  fullWidth
                  label={t('drivers.fields.licensePlate')}
                  name="license_plate"
                  value={nuevoConductor.license_plate}
                  onChange={handleInputChange}
                  size="small"
                  inputProps={{ maxLength: 10 }}
                  helperText={`${(nuevoConductor.license_plate || '').length}/10 caracteres`}
                />
              </Box>

              {/* Documentos - Subida de fotos */}
              <DocumentUploadSection
                driverLicenseFiles={documentFiles.driverLicense}
                vehicleInsuranceFiles={documentFiles.vehicleInsurance}
                vehicleRegistrationFiles={documentFiles.vehicleRegistration}
                vehiclePhotoFiles={documentFiles.vehiclePhoto}
                onDriverLicenseChange={handleDriverLicenseChange}
                onVehicleInsuranceChange={handleVehicleInsuranceChange}
                onVehicleRegistrationChange={handleVehicleRegistrationChange}
                onVehiclePhotoChange={handleVehiclePhotoChange}
                uploadProgress={documentUploadProgress}
                isUploading={isUploadingDocuments}
                errors={documentErrors}
                disabled={crearConductorMutation.isPending || isUploadingDocuments}
              />
            </Box>
          </DialogContent>
          <DialogActions 
            sx={{ 
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 3 },
              gap: { xs: 1, sm: 2 },
              flexDirection: { xs: 'column', sm: 'row' }
            }}
          >
            <Button 
              onClick={handleCloseModal} 
              color="inherit"
              fullWidth={isMobile}
              sx={{ 
                minHeight: '44px',
                order: { xs: 2, sm: 1 }
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              fullWidth={isMobile}
              disabled={crearConductorMutation.isPending || isUploadingDocuments}
              sx={{
                bgcolor: '#e5308a',
                minHeight: '44px',
                order: { xs: 1, sm: 2 },
                '&:hover': {
                  bgcolor: '#c5206a',
                }
              }}
            >
              {crearConductorMutation.isPending
                ? t('drivers.modal.registering')
                : isUploadingDocuments
                ? 'Subiendo documentos...'
                : t('drivers.modal.register')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </PageContainer>
  );
};

export default Conductores; 