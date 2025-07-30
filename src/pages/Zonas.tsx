import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery, useTheme } from '@mui/material';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  InputAdornment,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Fab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Pagination,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  titleStyle, 
  FilterContainer, 
  searchBarStyle,
  PageContainer,
  primaryButtonStyle
} from '../theme/standardStyles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Map as MapIcon,
  Help as HelpIcon,
  Error as ErrorIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { GoogleMap, DrawingManager } from '@react-google-maps/api';
import zoneService from '../services/zoneService';
import type { Zone } from '../services/zoneService';
import useGoogleMaps from '../hooks/useGoogleMaps';





// Centro inicial del mapa (Kansas City, Missouri)
const center = {
  lat: 39.0997,
  lng: -94.5786
};

// Componente de fallback para cuando Google Maps no está disponible
const MapFallback = ({ error, retry }: { error?: string; retry?: () => void }) => (
  <Box
    sx={{
      height: '400px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'grey.100',
      border: '2px dashed',
      borderColor: 'grey.300',
      borderRadius: 1,
      p: 3
    }}
  >
    <MapIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
    <Typography variant="h6" color="text.secondary" gutterBottom>
      Mapa no disponible
    </Typography>
    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
      {error || 'Google Maps no se pudo cargar. Por favor, verifica tu conexión a internet o la configuración de la API key.'}
    </Typography>
    {retry && (
      <Button variant="outlined" onClick={retry} size="small">
        Reintentar
      </Button>
    )}
  </Box>
);

// Componente para vista móvil de zonas
const ZoneMobileCard = ({ zone, onEdit, onDelete, onToggleActive, onDuplicate }: {
  zone: Zone;
  onEdit: (zone: Zone) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, active: boolean) => void;
  onDuplicate: (zone: Zone) => void;
}) => {
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
            {zone.name}
          </Typography>
          {zone.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {zone.description}
            </Typography>
          )}
        </Box>
        <Chip
          label={zone.active ? 'Activa' : 'Inactiva'}
          color={zone.active ? 'success' : 'default'}
          size="small"
          sx={{ ml: 1, minWidth: 70 }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Tarifa mínima
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#e5308a' }}>
            ${zone.minimumFare?.toFixed(2) || '0.00'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" color="text.secondary">
            Precio por minuto
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            ${zone.pricePerMinute?.toFixed(2) || '0.00'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Switch
              checked={zone.active}
              onChange={(e) => onToggleActive(zone.id!, e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              {zone.active ? 'Activa' : 'Inactiva'}
            </Typography>
          }
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => onDuplicate(zone)}
            size="small"
            sx={{
              bgcolor: 'info.main',
              color: 'white',
              minWidth: 44,
              minHeight: 44,
              '&:hover': { bgcolor: 'info.dark' }
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => onEdit(zone)}
            size="small"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              minWidth: 44,
              minHeight: 44,
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => onDelete(zone.id!)}
            size="small"
            sx={{
              bgcolor: 'error.main',
              color: 'white',
              minWidth: 44,
              minHeight: 44,
              '&:hover': { bgcolor: 'error.dark' }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

// Componente para el Modal de Ayuda
const HelpModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <span style={{ fontWeight: 600, fontSize: '1.25rem', color: '#e5308a' }}>
          {t('zones.help.title')}
        </span>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* ¿Qué son las Zonas? */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {t('zones.help.whatAreZones.title')}
            </Typography>
            <Typography variant="body1">
              {t('zones.help.whatAreZones.description')}
            </Typography>
          </Box>

          {/* ¿Cómo Funciona? */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {t('zones.help.howItWorks.title')}
            </Typography>
            
            <Box sx={{ pl: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {t('zones.help.howItWorks.viewZones.title')}
              </Typography>
              <Typography variant="body2">
                {t('zones.help.howItWorks.viewZones.description')}
              </Typography>
            </Box>

            <Box sx={{ pl: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {t('zones.help.howItWorks.createZone.title')}
              </Typography>
              <List>
                {(t('zones.help.howItWorks.createZone.steps', { returnObjects: true }) as string[]).map((step, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Typography variant="body2" color="primary">{index + 1}.</Typography>
                    </ListItemIcon>
                    <ListItemText primary={step} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box sx={{ pl: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {t('zones.help.howItWorks.editZone.title')}
              </Typography>
              <Typography variant="body2">
                {t('zones.help.howItWorks.editZone.description')}
              </Typography>
            </Box>
          </Box>

          {/* Consejos de Uso */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {t('zones.help.tips.title')}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {t('zones.help.tips.naming.title')}
                  </Typography>
                  <Typography variant="body2">
                    {t('zones.help.tips.naming.description')}
                  </Typography>
                </Paper>
              </Box>
              <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {t('zones.help.tips.pricing.title')}
                  </Typography>
                  <Typography variant="body2">
                    {t('zones.help.tips.pricing.description')}
                  </Typography>
                </Paper>
              </Box>
              <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {t('zones.help.tips.areas.title')}
                  </Typography>
                  <Typography variant="body2">
                    {t('zones.help.tips.areas.description')}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </Box>

          {/* Solución de Problemas */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {t('zones.help.troubleshooting.title')}
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <ErrorIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary={t('zones.help.troubleshooting.drawingIssues')}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <ErrorIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary={t('zones.help.troubleshooting.savingErrors')}
                />
              </ListItem>
            </List>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="contained" color="primary">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente para el Modal de Duplicación
const DuplicateZoneModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  originalName,
  originalDescription,
  loading 
}: { 
  open: boolean; 
  onClose: () => void; 
  onConfirm: (name: string, description: string) => void;
  originalName: string;
  originalDescription: string;
  loading: boolean;
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(`${originalName} (copia)`);
  const [description, setDescription] = useState(originalDescription || '');

  const handleConfirm = () => {
    onConfirm(name, description);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <span style={{ fontWeight: 600, fontSize: '1.25rem', color: '#e5308a' }}>
          {t('zones.duplicate')}
        </span>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t('zones.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            autoFocus
            size="small"
          />
          <TextField
            label={t('zones.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            size="small"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={!name.trim() || loading}
          sx={{
            bgcolor: '#e5308a',
            '&:hover': { bgcolor: '#c5206a' }
          }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            t('zones.duplicate')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente principal de Zonas
const Zonas = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [placeSearchTerm, setPlaceSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [zoneToDuplicate, setZoneToDuplicate] = useState<Zone | null>(null);
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  // Estado para Snackbar de errores
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'success' | 'warning' | 'info'
  });

  // Refs para el mapa y el polígono
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const pathRef = useRef<google.maps.LatLng[]>([]);

  // Estado del formulario de zona
  const [formState, setFormState] = useState<Partial<Zone>>({
    name: '',
    description: '',
    pricePerMinute: 0,
    minimumFare: 0,
    nightRatePercentage: 0,
    weekendRatePercentage: 0,
    commission_percentage: 0,
    active: true,
    area: { type: 'Polygon', coordinates: [[]] }
  });

  // Variable para almacenar marcadores
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Estado para manejar la recarga del mapa
  const [retryCount, setRetryCount] = useState(0);

  // Usar el hook centralizado de Google Maps
  const { isLoaded, loadError, apiKey, defaultMapOptions, defaultDrawingManagerOptions } = useGoogleMaps();

  // Función para actualizar el estado cuando cambia el polígono
  const updatePolygonState = useCallback(() => {
    if (polygonRef.current) {
      const path = polygonRef.current.getPath().getArray();
      pathRef.current = path;
      
      // Convertir a GeoJSON y actualizar el estado del formulario
      const geoJson = zoneService.convertPolygonToGeoJSON(path);
      setFormState(prev => ({ ...prev, area: geoJson }));
    }
  }, []);

  // Función para mostrar mensajes en Snackbar
  const showSnackbar = (message: string, severity: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Función para cerrar Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Función para recargar zonas desde el backend
  const fetchZones = async (page: number = currentPage, limit: number = itemsPerPage) => {
    try {
      console.log('Solicitando página:', page, 'con límite:', limit); // LOG para depuración
      setLoading(true);
      const response = await zoneService.getZones({
        inactive: true,
        page,
        limit,
        name: searchTerm
      });
      console.log('Respuesta backend:', response); // LOG para depuración
      setZones(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
      setCurrentPage(Number(response.page)); // Asegura que el estado esté sincronizado
      setError(null);
    } catch (err) {
      const errorMessage = t('zones.errorLoadingZones');
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar zonas al cambiar página, elementos por página o término de búsqueda
  useEffect(() => {
    fetchZones(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, searchTerm]);
  // Si quieres mantener el debounce en la búsqueda, puedes agregarlo aquí si lo deseas.

  // Manejar cambio de página
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  // Manejar cambio de elementos por página
  const handleItemsPerPageChange = (event: any) => {
    const newItemsPerPage = parseInt(event.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Resetear a la primera página
  };

  const filteredZones = zones;

  // Manejar carga del mapa
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    // Ajustar la vista inicial según el país seleccionado
    let initialCenter = center; // Default: Venezuela
    let initialZoom = 6;
    
    if (selectedRegion === 'US') {
      initialCenter = { lat: 37.0902, lng: -95.7129 }; // USA
      initialZoom = 4;
    } else if (selectedRegion === 'MX') {
      initialCenter = { lat: 23.6345, lng: -102.5528 }; // México
      initialZoom = 5;
    }
    
    map.setZoom(initialZoom);
    map.setCenter(initialCenter);
    
    // Habilitar UI completa
    map.setOptions({
      disableDefaultUI: false,
      mapTypeControl: true,
      fullscreenControl: true,
      
    });
    
    // Ya no cargamos ciudades automáticamente
  }, [selectedRegion]);

  // Manejar carga del administrador de dibujo
  const onDrawingManagerLoad = useCallback((drawingManager: google.maps.drawing.DrawingManager) => {
    drawingManagerRef.current = drawingManager;
    // No intentar establecer valores aquí, ya que formState.area podría no estar definido
    // y el método setValues no es estándar para DrawingManager
  }, []);

  // Manejar creación de polígono
  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
    }
    
    polygonRef.current = polygon;
    const path = polygon.getPath().getArray();
    pathRef.current = path;
    
    // Convertir a GeoJSON y actualizar el estado del formulario
    const geoJson = zoneService.convertPolygonToGeoJSON(path);
    setFormState(prev => ({ ...prev, area: geoJson }));
    
    // Desactivar el modo de dibujo después de completar un polígono
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }

    // Añadir listeners para detectar cambios en el polígono
    google.maps.event.addListener(polygon, 'dragend', updatePolygonState);
    google.maps.event.addListener(polygon.getPath(), 'set_at', updatePolygonState);
    google.maps.event.addListener(polygon.getPath(), 'insert_at', updatePolygonState);
    google.maps.event.addListener(polygon.getPath(), 'remove_at', updatePolygonState);
  }, [updatePolygonState]);

  // Manejar apertura del diálogo para crear nueva zona
  const handleOpenCreateDialog = () => {
    setFormState({
      name: '',
      description: '',
      pricePerMinute: 0,
      minimumFare: 0,
      nightRatePercentage: 0,
      weekendRatePercentage: 0,
      commission_percentage: 0,
      active: true,
      area: { type: 'Polygon', coordinates: [[]] }
    });
    setEditMode(false);
    setOpenDialog(true);
    setPlaceSearchTerm(''); // Limpiar el campo de búsqueda de lugares
    
    // Limpiar polígono existente
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    
    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    pathRef.current = [];
  };

  // Manejar apertura del diálogo para editar zona
  const handleOpenEditDialog = (zone: Zone) => {
    console.log('Editando zona:', zone);
    setSelectedZone(zone);
    setFormState(zone);
    setEditMode(true);
    setOpenDialog(true);
    
    // Utilizamos setTimeout para asegurar que el mapa esté completamente cargado
    setTimeout(() => {
      // Mostrar el polígono de la zona en el mapa
      if (zone.area && mapRef.current) {
        const path = zoneService.convertGeoJSONToPath(zone.area);
        // Limpiar polígono existente
        if (polygonRef.current) {
          polygonRef.current.setMap(null);
        }
        
        // Crear nuevo polígono
        polygonRef.current = new google.maps.Polygon({
          paths: path,
          ...defaultDrawingManagerOptions.polygonOptions,
          map: mapRef.current
        });
        
        // Guardar referencia al path
        pathRef.current = path.map(coord => new google.maps.LatLng(coord.lat, coord.lng));
        
        // Añadir listeners para detectar cambios en el polígono
        google.maps.event.addListener(polygonRef.current, 'dragend', updatePolygonState);
        google.maps.event.addListener(polygonRef.current.getPath(), 'set_at', updatePolygonState);
        google.maps.event.addListener(polygonRef.current.getPath(), 'insert_at', updatePolygonState);
        google.maps.event.addListener(polygonRef.current.getPath(), 'remove_at', updatePolygonState);
        
        // Centrar mapa en el polígono y ajustar zoom para que sea visible
        if (path.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          path.forEach(coord => bounds.extend(coord));
          mapRef.current.fitBounds(bounds);
        }
      }
    }, 500); // Esperamos 500ms para asegurar que el diálogo y el mapa estén listos
  };

  // Manejar cierre del diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedZone(null);
    
    // Limpiar polígono si existe
    if (polygonRef.current) {
      // Eliminar listeners antes de eliminar el polígono
      google.maps.event.clearInstanceListeners(polygonRef.current);
      if (polygonRef.current.getPath()) {
        google.maps.event.clearInstanceListeners(polygonRef.current.getPath());
      }
      
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    
    // Limpiar marcadores
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    // Limpiar errores
    setError(null);
  };

  // Validar campos numéricos
  const validateNumericField = (value: number, fieldName: string): string | null => {
    if (isNaN(value)) {
      return t(`zones.errors.${fieldName}Invalid`);
    }
    if (value < 0) {
      return t(`zones.errors.${fieldName}Negative`);
    }
    if (fieldName.includes('Percentage') && value > 100) {
      return t('zones.errors.percentageExceeds');
    }
    return null;
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value;
    
    // Validar campos numéricos
    if (type === 'number') {
      const error = validateNumericField(newValue as number, name);
      if (error) {
        setError(error);
        return;
      }
      setError(null);
    }
    
    setFormState(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Manejar guardar zona
  const handleSaveZone = async () => {
    try {
      setLoading(true);
      // Verificar que el polígono existe
      if (!formState.area || !formState.area.coordinates || formState.area.coordinates[0].length < 4) {
        const errorMessage = t('zones.drawValidArea');
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
        return;
      }
      
      if (editMode && selectedZone) {
        // Actualizar zona existente
        const updatedZone = await zoneService.updateZone(selectedZone.id!, formState);
        setZones(zones.map(z => z.id === selectedZone.id ? updatedZone : z));
        showSnackbar(t('zones.zoneUpdatedSuccess'), 'success');
      await fetchZones(currentPage, itemsPerPage);

      } else {
        // Crear nueva zona
        const newZone = await zoneService.createZone(formState as Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>);
        setZones([...zones, newZone]);
        showSnackbar(t('zones.zoneCreatedSuccess'), 'success');
        await fetchZones(currentPage, itemsPerPage);
      }
      setOpenDialog(false);
      setSelectedZone(null);
      setError(null);
      // Limpiar polígono
      if (polygonRef.current) {
        google.maps.event.clearInstanceListeners(polygonRef.current);
        if (polygonRef.current.getPath()) {
          google.maps.event.clearInstanceListeners(polygonRef.current.getPath());
        }
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }
      // Limpiar marcadores
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    } catch (err: any) {
      console.log(err.response?.data);
      let errorMessage = t('zones.errorSavingZone');
     
        if (err.response?.status === 400) {
          if ( Array.isArray(err.response?.data.message)) {
            errorMessage = err.response?.data.message.join(', ').replaceAll('_', ' ').replaceAll('"', '');
          } else {
            errorMessage = err.response?.data.message;
          }
        }
      
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manejar desactivación de zona
  const handleDeleteZone = async (id: number) => {
    try {
      setLoading(true);
      await zoneService.deleteZone(id);
      await fetchZones(currentPage, itemsPerPage);
      setError(null);
      showSnackbar(t('zones.zoneDeletedSuccess'), 'success');
    } catch (err) {
      const errorMessage = t('zones.errorDeactivatingZone', { id });
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de estado activo/inactivo
  const handleToggleActive = async (id: number, active: boolean) => {
    try {
      const zoneToUpdate = zones.find(zone => zone.id === id);
      if (zoneToUpdate) {
        const updatedZone = { ...zoneToUpdate, active };
        await zoneService.updateZone(id, updatedZone);
        await fetchZones(currentPage, itemsPerPage);
        showSnackbar(
          active ? t('zones.zoneActivatedSuccess') : t('zones.zoneDeactivatedSuccess'), 
          'success'
        );
      }
    } catch (err) {
      const errorMessage = 'Error al actualizar el estado de la zona';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      console.error('Error al cambiar estado de zona:', err);
    }
  };

  // Función para obtener el polígono de un lugar mediante geocodificación
  const obtenerPoligonoDeLugar = useCallback(async (nombre: string, pais: string) => {
    if (!mapRef.current) return null;
    
    try {
      console.log(`Buscando lugar: "${nombre}" en país: ${pais}`);
      setLoading(true);
      setError(null); // Limpiar errores anteriores
      
      // Crear servicio de geocodificación
      const geocoder = new google.maps.Geocoder();
      
      // Buscar el lugar
      const resultado = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode(
          { 
            address: nombre,
            componentRestrictions: { country: pais }
          }, 
          (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
              resolve(results);
            } else {
              reject(new Error(`Geocodificación fallida: ${status}`));
            }
          }
        );
      });
      
      // Si encontramos resultados, mostrar en el mapa
      if (resultado && resultado.length > 0) {
        console.log("Resultado de geocodificación:", resultado[0].formatted_address);
        
        // Limpiar polígono existente
        if (polygonRef.current) {
          polygonRef.current.setMap(null);
          polygonRef.current = null;
        }
        
        // Obtener el viewport del resultado
        const viewport = resultado[0].geometry.viewport;
        const ne = viewport.getNorthEast();
        const sw = viewport.getSouthWest();
        
        // Calcular centro del viewport
        const center = {
          lat: (ne.lat() + sw.lat()) / 2,
          lng: (ne.lng() + sw.lng()) / 2
        };
        
        // Calcular dimensiones y expandirlas un 100% (factor 2)
        const expansionFactor = 2.0;
        const latSpan = (ne.lat() - sw.lat()) * expansionFactor;
        const lngSpan = (ne.lng() - sw.lng()) * expansionFactor;
        
        // Crear nuevos límites expandidos
        const neExpanded = { 
          lat: center.lat + latSpan/2, 
          lng: center.lng + lngSpan/2 
        };
        const swExpanded = { 
          lat: center.lat - latSpan/2, 
          lng: center.lng - lngSpan/2 
        };
        
        // Crear un polígono rectangular basado en el viewport expandido
        const coordinates: google.maps.LatLng[] = [
          new google.maps.LatLng(neExpanded.lat, neExpanded.lng),
          new google.maps.LatLng(neExpanded.lat, swExpanded.lng),
          new google.maps.LatLng(swExpanded.lat, swExpanded.lng),
          new google.maps.LatLng(swExpanded.lat, neExpanded.lng),
          new google.maps.LatLng(neExpanded.lat, neExpanded.lng) // Cerrar el polígono
        ];
        
        // Crear nuevo bounds para el polígono expandido y ajustar el mapa
        const expandedBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(swExpanded.lat, swExpanded.lng),
          new google.maps.LatLng(neExpanded.lat, neExpanded.lng)
        );
        
        // Ajustar el mapa para mostrar el polígono expandido
        mapRef.current.fitBounds(expandedBounds);
        
        // Crear el polígono
        const newPolygon = new google.maps.Polygon({
          paths: coordinates,
          ...defaultDrawingManagerOptions.polygonOptions,
          map: mapRef.current
        });
        
        // Actualizar referencias
        polygonRef.current = newPolygon;
        pathRef.current = coordinates;
        
        // Actualizar formulario con el nombre del lugar encontrado
        const nombreLugar = resultado[0].formatted_address.split(',')[0] || nombre;
        console.log(`Nombre de lugar formateado: ${nombreLugar}`);
        
        setFormState(prev => ({
          ...prev,
          name: nombreLugar,
          area: zoneService.convertPolygonToGeoJSON(coordinates)
        }));
        
        // Añadir listeners para detectar cambios en el polígono
        google.maps.event.addListener(newPolygon, 'dragend', updatePolygonState);
        google.maps.event.addListener(newPolygon.getPath(), 'set_at', updatePolygonState);
        google.maps.event.addListener(newPolygon.getPath(), 'insert_at', updatePolygonState);
        google.maps.event.addListener(newPolygon.getPath(), 'remove_at', updatePolygonState);
        
        console.log(`Polígono creado para: ${nombreLugar}`);
        return newPolygon;
      } else {
        throw new Error(`No se encontraron resultados para: ${nombre}`);
      }
    } catch (error: any) {
      console.error('Error en geocodificación:', error);
      const errorMessage = `Error al buscar lugar: ${error.message}`;
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [updatePolygonState]);

  // Función para abrir el modal de duplicación
  const handleOpenDuplicateModal = (zone: Zone) => {
    setZoneToDuplicate(zone);
    setDuplicateModalOpen(true);
  };

  // Función para cerrar el modal de duplicación
  const handleCloseDuplicateModal = () => {
    setDuplicateModalOpen(false);
    setZoneToDuplicate(null);
  };

  // Función para duplicar una zona
  const handleDuplicateZone = async (name: string, description: string) => {
    if (!zoneToDuplicate) return;

    try {
      setDuplicating(true);
      setError(null);

      // Crear una copia de la zona con el nuevo nombre y descripción
      const duplicatedZone = {
        ...zoneToDuplicate,
        name,
        description,
        active: true
      };

      // Eliminar el id para que se cree como nueva zona
      delete duplicatedZone.id;

      // Crear la nueva zona en el backend
      await zoneService.createZone(duplicatedZone as Omit<Zone, 'id' | 'createdAt' | 'updatedAt'>);
      
      // Actualizar la lista de zonas
      await fetchZones(currentPage, itemsPerPage);
      
      // Cerrar el modal y limpiar el estado
      handleCloseDuplicateModal();
      
      // Mostrar mensaje de éxito
      setError(null);
    } catch (err) {
      const errorMessage = t('zones.duplicateError');
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      console.error('Error al duplicar zona:', err);
    } finally {
      setDuplicating(false);
    }
  };

  if (!apiKey) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No se encontró la clave de Google Maps. Contacta al administrador o revisa la configuración del entorno.
        </Alert>
      </Box>
    );
  }
  if (loadError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error al cargar Google Maps API: {loadError.message}</Alert>
      </Box>
    );
  }
  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }



  return (
    <PageContainer>
      {/* Header unificado con botón de ayuda */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography {...titleStyle}>
          {t('zones.title')}
        </Typography>
        <IconButton
          onClick={() => setHelpOpen(true)}
          sx={{
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.light',
              color: 'primary.dark'
            }
          }}
        >
          <HelpIcon />
        </IconButton>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filtros y acciones - UNIFICADO */}
      <FilterContainer>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
          <TextField
            {...searchBarStyle}
            placeholder={t('zones.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>
        
        {/* Botón desktop */}
        {!isMobile && (
          <Button
            {...primaryButtonStyle}
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            {t('zones.add')}
          </Button>
        )}
      </FilterContainer>

      {/* Renderizado condicional responsive */}
      {!isMobile ? (
        // Vista Desktop - Tabla completa
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('zones.name')}</TableCell>
                <TableCell>{t('zones.description')}</TableCell>
                <TableCell>{t('zones.minimumFare')}</TableCell>
                <TableCell>{t('zones.commissionPercentage')}</TableCell>
                <TableCell>{t('zones.status')}</TableCell>
                <TableCell>{t('zones.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : zones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {t('zones.noZonesInPage')}
                  </TableCell>
                </TableRow>
              ) : (
                zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{zone.name}</TableCell>
                    <TableCell>{zone.description}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#e5308a' }}>
                      ${zone.minimumFare?.toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#e5308a' }}>
                      {zone.commission_percentage ? `${zone.commission_percentage}%` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={zone.active ? t('zones.active') : t('zones.inactive')}
                        color={zone.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          color="info"
                          onClick={() => handleOpenDuplicateModal(zone)}
                          size="small"
                          disabled={duplicating}
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenEditDialog(zone)}
                          size="small"
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteZone(zone.id!)}
                          size="small"
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // Vista Mobile - Cards
        <Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : filteredZones.length === 0 ? (
            <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {t('zones.noZones')}
              </Typography>
            </Paper>
          ) : (
            filteredZones.map((zone) => (
              <ZoneMobileCard
                key={zone.id}
                zone={zone}
                onEdit={handleOpenEditDialog}
                onDelete={handleDeleteZone}
                onToggleActive={handleToggleActive}
                onDuplicate={() => handleOpenDuplicateModal(zone)}
              />
            ))
          )}
        </Box>
      )}

      {/* Controles de paginación */}
      {!loading && totalPages > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
          mt: 3,
          px: { xs: 0, sm: 2 }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            order: { xs: 2, sm: 1 }
          }}>
            <Typography variant="body2" color="text.secondary">
              {zones.length > 0
                ? `${t('zones.showing')} ${((currentPage - 1) * itemsPerPage) + 1} - ${((currentPage - 1) * itemsPerPage) + zones.length} ${t('zones.of')} ${totalItems}`
                : t('zones.noZonesInPage')}
            </Typography>
            <Select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              size="small"
              sx={{ minWidth: 80 }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </Box>
          
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size={isMobile ? "small" : "medium"}
              showFirstButton
              showLastButton
              sx={{ 
                order: { xs: 1, sm: 2 },
                '& .MuiPaginationItem-root': {
                  color: '#e5308a',
                  '&.Mui-selected': {
                    backgroundColor: '#e5308a',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#c5206a',
                    }
                  }
                }
              }}
            />
          )}
        </Box>
      )}

      {/* Diálogo para crear/editar zona - Responsive */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth={isMobile ? false : "md"} 
        fullWidth={!isMobile}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            margin: { xs: 0, sm: 2 },
            maxHeight: { xs: '100vh', sm: '90vh' },
            minHeight: { xs: '100vh', sm: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 }
        }}>
          <span style={{ fontWeight: 600, fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            {editMode ? t('zones.edit') : t('zones.add')}
          </span>
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ 
              minWidth: 44, 
              minHeight: 44 
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent 
          dividers 
          sx={{ 
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
            maxHeight: { xs: 'calc(100vh - 140px)', sm: '70vh' },
            overflowY: 'auto'
          }}
        >
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Información básica */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('zones.name')}
                name="name"
                value={formState.name || ''}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
                required
                size={isMobile ? "medium" : "small"}
                sx={{ 
                  '& .MuiInputBase-root': {
                    minHeight: isMobile ? '56px' : '40px'
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('zones.description')}
                name="description"
                value={formState.description || ''}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
                size={isMobile ? "medium" : "small"}
                sx={{ 
                  '& .MuiInputBase-root': {
                    minHeight: isMobile ? '56px' : '40px'
                  }
                }}
              />
            </Grid>

            {/* Tarifas */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('zones.minimumFare')}
                name="minimumFare"
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                value={formState.minimumFare as number}
                onChange={handleFormChange}
                onFocus={(e) => {
                  if (parseFloat(e.target.value) === 0) {
                    e.target.value = '';
                    handleFormChange({ target: { name: 'minimumFare', value: '' } } as unknown as any );
                  }
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value) as number;
                  setFormState(prev => ({ ...prev, minimumFare: parseFloat(value.toFixed(2)) }));
                }}
                fullWidth
                margin="normal"
                required
                size={isMobile ? "medium" : "small"}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ 
                  '& .MuiInputBase-root': {
                    minHeight: isMobile ? '56px' : '40px'
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('zones.commissionPercentage')}
                name="commission_percentage"
                type="number"
                inputProps={{ step: "0.01", min: "0", max: "100" }}
                value={formState.commission_percentage as number}
                onChange={handleFormChange}
                onFocus={(e) => {
                  if (parseFloat(e.target.value) === 0) {
                    e.target.value = '';
                    handleFormChange({ target: { name: 'commission_percentage', value: '' } }as  unknown as any );
                  }
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value) as number;
                  setFormState(prev => ({ ...prev, commission_percentage: parseFloat(value.toFixed(2)) }));
                }}
                fullWidth
                margin="normal"
                required
                size={isMobile ? "medium" : "small"}
                InputProps={{
                  startAdornment: <InputAdornment position="start">%</InputAdornment>,
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    minHeight: isMobile ? '56px' : '40px'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('zones.nightRatePercentage')}
                name="nightRatePercentage"
                type="number"
                inputProps={{ step: "0.01", min: "0", max: "100" }}
                value={formState.nightRatePercentage as number}
                onChange={handleFormChange}
                onFocus={(e) => {
                  if (parseFloat(e.target.value) === 0) {
                    e.target.value = '';
                    handleFormChange({ target: { name: 'nightRatePercentage', value: '' } }as  unknown as any );
                  }
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value) as number;
                  setFormState(prev => ({ ...prev, nightRatePercentage: parseFloat(value.toFixed(2)) }));
                }}
                fullWidth
                margin="normal"
                required
                size={isMobile ? "medium" : "small"}
                InputProps={{
                  startAdornment: <InputAdornment position="start">%</InputAdornment>,
                }}
                sx={{ 
                  '& .MuiInputBase-root': {
                    minHeight: isMobile ? '56px' : '40px'
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('zones.weekendRatePercentage')}
                name="weekendRatePercentage"
                type="number"
                inputProps={{ step: "0.01", min: "0", max: "100" }}
                value={formState.weekendRatePercentage as number}
                onChange={handleFormChange}
                onFocus={(e) => {
                  if (parseFloat(e.target.value) === 0) {
                    e.target.value = '';
                    handleFormChange({ target: { name: 'weekendRatePercentage', value: '' } }as  unknown as any );
                  }
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value) as number;
                  setFormState(prev => ({ ...prev, weekendRatePercentage: parseFloat(value.toFixed(2)) }));
                }}
                fullWidth
                margin="normal"
                required
                size={isMobile ? "medium" : "small"}
                InputProps={{
                  startAdornment: <InputAdornment position="start">%</InputAdornment>,
                }}
                sx={{ 
                  '& .MuiInputBase-root': {
                    minHeight: isMobile ? '56px' : '40px'
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.active || false}
                    onChange={handleFormChange}
                    name="active"
                    size={isMobile ? "medium" : "small"}
                  />
                }
                label={t('zones.zoneActivationToggle')}
                sx={{ 
                  mt: { xs: 3, sm: 2 },
                  '& .MuiFormControlLabel-label': {
                    fontSize: { xs: '1rem', sm: '0.875rem' }
                  }
                }}
              />
            </Grid>
            
            {/* Precio por minuto */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={t('zones.pricePerMinute')}
                name="pricePerMinute"
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                value={formState.pricePerMinute as number}
                onChange={handleFormChange}
                onFocus={(e) => {
                  if (parseFloat(e.target.value) === 0) {
                    e.target.value = '';
                    handleFormChange({ target: { name: 'pricePerMinute', value: '' } } as unknown as any);
                  }
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value) as number;
                  setFormState(prev => ({ ...prev, pricePerMinute: parseFloat(value.toFixed(2)) }));
                }}
                fullWidth
                margin="normal"
                required
                size={isMobile ? "medium" : "small"}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ 
                  '& .MuiInputBase-root': {
                    minHeight: isMobile ? '56px' : '40px'
                  }
                }}
              />
            </Grid>
            
            {/* Área del mapa */}
            <Grid size={12}>
              <Typography 
                variant={isMobile ? "h6" : "subtitle1"} 
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                {t('zones.areaTitle')}
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                gutterBottom
                sx={{ mb: { xs: 3, sm: 2 } }}
              >
                {t('zones.drawArea')}
              </Typography>
              
              {/* Controles de país y búsqueda - Responsive */}
              <Box sx={{ 
                mb: { xs: 3, sm: 2 }, 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 2 }
              }}>
                <FormControl 
                  size={isMobile ? "medium" : "small"}
                  sx={{ 
                    minWidth: { xs: '100%', sm: '200px' },
                    '& .MuiInputBase-root': {
                      minHeight: isMobile ? '56px' : '40px'
                    }
                  }}
                >
                  <InputLabel id="pais-select-label">{t('zones.countrySelect')}</InputLabel>
                  <Select
                    labelId="pais-select-label"
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value);
                      // Centrar mapa en coordenadas del país seleccionado
                      if (mapRef.current) {
                        let center = { lat: 39.0997, lng: -94.5786 }; // Default: Kansas City
                        let zoom = 6;
                        
                        if (e.target.value === 'US') {
                          center = { lat: 37.0902, lng: -95.7129 }; // USA
                          zoom = 4;
                        } else if (e.target.value === 'MX') {
                          center = { lat: 23.6345, lng: -102.5528 }; // México
                          zoom = 5;
                        }
                        
                        mapRef.current.setCenter(center);
                        mapRef.current.setZoom(zoom);
                      }
                    }}
                    label={t('zones.countrySelect')}
                  >
                    <MenuItem value="VE">Venezuela</MenuItem>
                    <MenuItem value="US">Estados Unidos</MenuItem>
                    <MenuItem value="MX">México</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  size={isMobile ? "medium" : "small"}
                  fullWidth
                  placeholder={t('zones.searchPlace')}
                  value={placeSearchTerm}
                  onChange={(e) => setPlaceSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && placeSearchTerm.trim()) {
                      // Buscar el lugar
                      obtenerPoligonoDeLugar(placeSearchTerm, selectedRegion || 'VE');
                    }
                  }}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      minHeight: isMobile ? '56px' : '40px'
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={() => {
                            if (placeSearchTerm.trim()) {
                              obtenerPoligonoDeLugar(placeSearchTerm, selectedRegion || 'VE');
                            }
                          }}
                          size="small"
                          disabled={loading}
                          sx={{ minWidth: 44, minHeight: 44 }}
                        >
                          {loading ? <CircularProgress size={20} /> : <SearchIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              {/* Mapa responsive */}
              <Box sx={{ 
                height: { xs: 300, sm: 400 }, 
                width: '100%', 
                mt: { xs: 2, sm: 2 },
                borderRadius: 1,
                overflow: 'hidden'
              }}>
                {loadError ? (
                  <MapFallback 
                    error={`Error al cargar Google Maps: ${String(loadError)}`}
                    retry={() => setRetryCount(prev => prev + 1)}
                  />
                ) : !isLoaded ? (
                  <Box sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5'
                  }}>
                    <CircularProgress size={isMobile ? 24 : 32} />
                    <Typography sx={{ ml: 2 }} variant={isMobile ? "body2" : "body1"}>
                      Cargando mapa...
                    </Typography>
                  </Box>
                ) : (
                  <GoogleMap
                    mapContainerStyle={{
                      width: '100%',
                      height: '100%'
                    }}
                    center={center}
                    zoom={isMobile ? 11 : 12} // Zoom adaptativo
                    onLoad={onMapLoad}
                    options={{
                      ...defaultMapOptions,
                      streetViewControl: !isMobile, // Ocultar en móvil
                      mapTypeControl: !isMobile, // Ocultar en móvil
                      fullscreenControl: !isMobile, // Ocultar en móvil
                      gestureHandling: isMobile ? 'cooperative' : 'greedy', // Mejor UX móvil
                      controlSize: isMobile ? 32 : 40 // Controles más grandes en móvil
                    }}
                    key={`map-${openDialog}-${editMode}-${retryCount}`}
                  >
                    <DrawingManager
                      onLoad={onDrawingManagerLoad}
                      onPolygonComplete={onPolygonComplete}
                      options={{
                        ...defaultDrawingManagerOptions,
                        drawingControl: true,
                        drawingControlOptions: {
                          position: isMobile ? 
                            google.maps.ControlPosition.TOP_CENTER : 
                            google.maps.ControlPosition.TOP_LEFT,
                          drawingModes: ['polygon'] as google.maps.drawing.OverlayType[]
                        }
                      }}
                    />
                  </GoogleMap>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
          gap: { xs: 1, sm: 2 },
          flexDirection: { xs: 'column-reverse', sm: 'row' }
        }}>
          <Button 
            onClick={handleCloseDialog}
            fullWidth={isMobile}
            sx={{ 
              minHeight: isMobile ? '48px' : '36px',
              order: { xs: 2, sm: 1 }
            }}
          >
            {t('zones.cancelButton')}
          </Button>
          <Button
            onClick={handleSaveZone}
            variant="contained"
            color="primary"
            fullWidth={isMobile}
            disabled={loading || !formState.name}
            sx={{
              minHeight: isMobile ? '48px' : '36px',
              bgcolor: '#e5308a',
              order: { xs: 1, sm: 2 },
              '&:hover': { bgcolor: '#c5206a' }
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : t('zones.saveButton')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para móviles */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add zone"
          onClick={handleOpenCreateDialog}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: '#e5308a',
            color: 'white',
            '&:hover': { bgcolor: '#c5206a' },
            zIndex: 1300,
            boxShadow: '0 8px 16px rgba(229, 48, 138, 0.3)',
            '&:active': {
              boxShadow: '0 4px 8px rgba(229, 48, 138, 0.3)',
            }
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Modal de Ayuda */}
      <HelpModal 
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      {/* Modal de Duplicación */}
      {zoneToDuplicate && (
        <DuplicateZoneModal
          open={duplicateModalOpen}
          onClose={handleCloseDuplicateModal}
          onConfirm={handleDuplicateZone}
          originalName={zoneToDuplicate.name}
          originalDescription={zoneToDuplicate.description || ''}
          loading={duplicating}
        />
      )}

      {/* Snackbar para mostrar errores y mensajes de éxito */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 9999 }} // Asegurar que esté por encima de los modales
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default Zonas;