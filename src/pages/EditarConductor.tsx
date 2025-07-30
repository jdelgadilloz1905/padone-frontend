import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Divider,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Stack
} from '@mui/material';

import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useConductores } from '../hooks/useConductores';
import type { Conductor } from '../services/conductorService';
import PhoneNumberInput from '../components/PhoneNumberInput';
import { usePhoneValidation } from '../hooks/usePhoneValidation';

import AvatarEditable from '../components/Conductores/AvatarEditable';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SquareImageUpload from '../components/photo-upload/SquareImageUpload';
import { useQueryClient } from '@tanstack/react-query';

interface NotificacionState {
  open: boolean;
  mensaje: string;
  tipo: 'success' | 'error' | 'warning' | 'info';
}

const EditarConductor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estados del formulario
  const [formData, setFormData] = useState<Partial<Conductor>>({});
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const { validatePhone, formatForAPI, normalizeExistingPhone } = usePhoneValidation();
  
  // Estado para notificaciones
  const [notificacion, setNotificacion] = useState<NotificacionState>({
    open: false,
    mensaje: '',
    tipo: 'success'
  });



  // Estados para cada documento
  const [seguroUrl, setSeguroUrl] = useState<string | undefined>(undefined);
  const [registroUrl, setRegistroUrl] = useState<string | undefined>(undefined);
  const [fotoVehiculoUrl, setFotoVehiculoUrl] = useState<string | undefined>(undefined);
  const [licenciaUrl, setLicenciaUrl] = useState<string | undefined>(undefined);
  
  // Estados para archivos de documento a subir
  const [pendingDocuments, setPendingDocuments] = useState<{
    vehicleInsurance?: File;
    vehicleRegistration?: File;
    vehiclePhoto?: File;
    driverLicense?: File;
  }>({});

  // Hooks
  const { getConductor, actualizarConductor, actualizarDocumentosVehiculo } = useConductores();
  const { data: conductor, isLoading, isError } = getConductor(id || '');
  const actualizarMutation = actualizarConductor();
  const actualizarDocumentosMutation = actualizarDocumentosVehiculo();

  // Cargar datos del conductor cuando se obtienen - OPTIMIZADO para evitar loops
  useEffect(() => {
    if (conductor && conductor.id) {
      // Solo actualizar cuando es un conductor diferente (carga inicial o cambio de conductor)
      // NO actualizar si solo cambió el phone_number (evita sobrescribir mientras el usuario edita)
      const shouldUpdate = !formData.id || formData.id !== conductor.id;
      
      if (shouldUpdate) {
        // Normalizar el número de teléfono existente
        const normalizedData = {
          ...conductor,
          phone_number: conductor.phone_number ? normalizeExistingPhone(conductor.phone_number) : ''
        };
        setFormData(normalizedData);
        
        // Cargar URLs de documentos existentes desde additional_photos
        if (conductor.additional_photos) {
          const { vehicle_insurance, vehicle_registration, vehicle_photos } = conductor.additional_photos;
          setSeguroUrl(vehicle_insurance?.[0] || undefined);
          setRegistroUrl(vehicle_registration?.[0] || undefined);
          setFotoVehiculoUrl(vehicle_photos?.[0] || undefined);
        }
        // Cargar URL de la licencia de conducir
        setLicenciaUrl(conductor.driver_license || undefined);
      }
    }
  }, [conductor?.id, normalizeExistingPhone]);

  // Manejar cambios en los campos del formulario - MEMOIZADO
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) || 0 : value
    }));
  }, []);

  // Manejar cambios en el select de estado - MEMOIZADO
  const handleStatusChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value as Conductor['status']
    }));
  }, []);

  // Manejar cambio en teléfono - MEMOIZADO
  const handlePhoneChange = useCallback((value: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      phone_number: value || ''
    }));
    setPhoneError(''); // Limpiar error cuando cambia
  }, []);

  // Memoizar la validación del teléfono para evitar cálculos repetitivos
  const phoneValidationResult = useMemo(() => {
    if (!formData.phone_number) {
      return { isValid: false, errorMessage: 'Número de teléfono requerido' };
    }
    return validatePhone(formData.phone_number, true);
  }, [formData.phone_number, validatePhone]);

  // Manejar envío del formulario - OPTIMIZADO
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setPhoneError('');

    // Usar la validación memoizada
    if (!phoneValidationResult.isValid) {
      setPhoneError(phoneValidationResult.errorMessage || 'Número de teléfono inválido');
      return;
    }

    setLoading(true);
    try {
      // Formatear número para la API
      const formattedData = {
        ...formData,
        phone_number: formatForAPI(formData.phone_number),
        is_demo_account: undefined
      };

      // Actualizar los datos del conductor
      await actualizarMutation.mutateAsync({
        id,
        datos: formattedData
      });

      // Actualizar documentos si hay cambios pendientes
      const hasPendingDocuments = Object.keys(pendingDocuments).length > 0;
      if (hasPendingDocuments) {
        // Mapear los nombres de camelCase a snake_case
        const mappedDocuments = {
          vehicle_insurance: pendingDocuments.vehicleInsurance,
          vehicle_registration: pendingDocuments.vehicleRegistration,
          vehicle_photo: pendingDocuments.vehiclePhoto,
          driver_license: pendingDocuments.driverLicense,
        };
        await actualizarDocumentosMutation.mutateAsync({
          id,
          documentos: { documentos: mappedDocuments }
        });
        
        // Limpiar documentos pendientes después de subir
        setPendingDocuments({});
      }
      // Invalidar todas las queries relacionadas con conductores
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'conductores'
      });

      setNotificacion({
        open: true,
        mensaje: hasPendingDocuments 
          ? 'Conductor y documentos actualizados correctamente'
          : 'Conductor actualizado correctamente',
        tipo: 'success'
      });

      // NO navegar automáticamente - dejar que el usuario vea la confirmación
      // y navegue manualmente con el botón "Volver"

    } catch (error: any) {
      console.error('Error al actualizar conductor:', error);
      setNotificacion({
        open: true,
        mensaje: error?.message || 'Error al actualizar el conductor',
        tipo: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [id, phoneValidationResult, formData, formatForAPI, actualizarMutation, navigate]);

  // Manejar navegación hacia atrás - MEMOIZADO
  const handleNavigateBack = useCallback(() => {
    // Invalidar todas las queries relacionadas con conductores
    queryClient.invalidateQueries({ 
      predicate: (query) => 
        query.queryKey[0] === 'conductores'
    });
    navigate('/conductores');
  }, [navigate, queryClient]);

  // Manejar cierre de notificación - MEMOIZADO
  const handleCloseNotificacion = useCallback(() => {
    setNotificacion(prev => ({ ...prev, open: false }));
  }, []);

  // Handlers para documentos - MEMOIZADOS
  const handleSeguroChange = useCallback((file: File | null) => {
    if (file) {
      setPendingDocuments(prev => ({ ...prev, vehicleInsurance: file }));
      // Mostrar preview local
      const localUrl = URL.createObjectURL(file);
      setSeguroUrl(localUrl);
    }
  }, []);

  const handleRegistroChange = useCallback((file: File | null) => {
    if (file) {
      setPendingDocuments(prev => ({ ...prev, vehicleRegistration: file }));
      // Mostrar preview local
      const localUrl = URL.createObjectURL(file);
      setRegistroUrl(localUrl);
    }
  }, []);

  const handleFotoVehiculoChange = useCallback((file: File | null) => {
    if (file) {
      setPendingDocuments(prev => ({ ...prev, vehiclePhoto: file }));
      // Mostrar preview local
      const localUrl = URL.createObjectURL(file);
      setFotoVehiculoUrl(localUrl);
    }
  }, []);

  const handleLicenciaChange = useCallback((file: File | null) => {
    if (file) {
      setPendingDocuments(prev => ({ ...prev, driverLicense: file }));
      // Mostrar preview local
      const localUrl = URL.createObjectURL(file);
      setLicenciaUrl(localUrl);
    }
  }, []);

  // Manejar actualización de avatar
  const handleAvatarUpdated = useCallback((url: string) => {
    // Actualizar el estado local
    setFormData(prev => ({
      ...prev,
      profile_picture_url: url,
      profile_picture: url,
      profile_picture_s3_key: url.split('cloudfront.net/')[1]
    }));

    // Invalidar cachés relevantes
    if (id) {
      // Invalidar todas las queries relacionadas con conductores
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey[0] === 'conductores'
      });
    }

    // Mostrar notificación de éxito
    setNotificacion({
      open: true,
      mensaje: 'Foto de perfil actualizada correctamente',
      tipo: 'success'
    });
  }, [id, queryClient]);


  // Estados de carga y error
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (isError || !conductor) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} p={3}>
        <Typography variant="h6" color="error">
          Error al cargar los datos del conductor
        </Typography>
        <Button variant="outlined" onClick={handleNavigateBack}>
          Volver a la lista
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleNavigateBack}
          variant="outlined"
          size="small"
        >
          Volver
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#e5308a' }}>
          Editar Conductor
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
          {/* Panel izquierdo - Solo avatar, estado y resumen */}
          <Box sx={{ width: { xs: '100%', md: '33.333%' }, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Avatar editable */}
                {conductor && (
                  <AvatarEditable 
                    conductor={conductor} 
                    onAvatarUpdated={handleAvatarUpdated}
                  />
                )}
                <Divider sx={{ my: 2, width: '100%' }} />
                {/* Estado */}
                <FormControl fullWidth margin="normal">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.status || ''}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    label="Estado"
                  >
                    <MenuItem value="available">Disponible</MenuItem>
                    <MenuItem value="busy">Ocupado</MenuItem>
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="offline">Offline</MenuItem>
                  </Select>
                </FormControl>
                {/* Verificado */}
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Estado de Verificación
                  </Typography>
                  <Chip
                    label={formData.verified ? 'Verificado' : 'No Verificado'}
                    color={formData.verified ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                {/* Resumen de Documentos */}
                <Divider sx={{ my: 2, width: '100%' }} />
                <Box mt={2} width="100%">
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Resumen de Documentos
                  </Typography>
                  {(() => {
                    const documentos = [
                      { label: 'Licencia de Conducir', hasFile: !!licenciaUrl || !!pendingDocuments.driverLicense },
                      { label: 'Seguro del Vehículo', hasFile: !!seguroUrl || !!pendingDocuments.vehicleInsurance },
                      { label: 'Registro del Vehículo', hasFile: !!registroUrl || !!pendingDocuments.vehicleRegistration },
                      { label: 'Foto del Vehículo', hasFile: !!fotoVehiculoUrl || !!pendingDocuments.vehiclePhoto },
                    ];
                    
                    const total = documentos.length;
                    const subidos = documentos.filter(doc => doc.hasFile).length;
                    
                    return (
                      <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {subidos}/{total} documentos subidos
                        </Typography>
                        {documentos.map((doc, index) => (
                          <Box key={index} display="flex" alignItems="center" gap={1} mb={0.5}>
                            {doc.hasFile ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <WarningAmberIcon color="warning" fontSize="small" />
                            )}
                            <Typography variant="body2">
                              {doc.label}
                            </Typography>
                          </Box>
                        ))}
                        {subidos < total && (
                          <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                            Recuerda subir todos los documentos para mantener tu cuenta activa.
                          </Typography>
                        )}
                      </>
                    );
                  })()}
                </Box>
              </CardContent>
            </Card>
          </Box>
          {/* Panel derecho - Datos, vehículo */}
          <Box sx={{ width: { xs: '100%', md: '66.667%' }, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Datos del Conductor
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                    <TextField
                      required
                      fullWidth
                      label="Nombre"
                      name="first_name"
                      value={formData.first_name || ''}
                      onChange={handleInputChange}
                      size="small"
                      inputProps={{ maxLength: 50 }}
                      helperText={`${(formData.first_name || '').length}/50 caracteres`}
                    />
                    <TextField
                      required
                      fullWidth
                      label="Apellido"
                      name="last_name"
                      value={formData.last_name || ''}
                      onChange={handleInputChange}
                      size="small"
                      inputProps={{ maxLength: 50 }}
                      helperText={`${(formData.last_name || '').length}/50 caracteres`}
                    />
                  </Box>
                  <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <PhoneNumberInput
                        value={formData.phone_number || ''}
                        onChange={handlePhoneChange}
                        placeholder="(555) 123-4567"
                        error={!!phoneError}
                        helperText={phoneError}
                        defaultCountry="US"
                        required
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        required
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            {/* Información del Vehículo */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información del Vehículo
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                    <TextField
                      required
                      fullWidth
                      label="Marca"
                      name="vehicle"
                      value={formData.vehicle || ''}
                      onChange={handleInputChange}
                      size="small"
                      inputProps={{ maxLength: 30 }}
                      helperText={`${(formData.vehicle || '').length}/30 caracteres`}
                    />
                    <TextField
                      required
                      fullWidth
                      label="Modelo"
                      name="model"
                      value={formData.model || ''}
                      onChange={handleInputChange}
                      size="small"
                      inputProps={{ maxLength: 30 }}
                      helperText={`${(formData.model || '').length}/30 caracteres`}
                    />
                  </Box>
                  <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                    <TextField
                      required
                      fullWidth
                      label="Color"
                      name="color"
                      value={formData.color || ''}
                      onChange={handleInputChange}
                      size="small"
                      inputProps={{ maxLength: 20 }}
                      helperText={`${(formData.color || '').length}/20 caracteres`}
                    />
                    <TextField
                      required
                      fullWidth
                      label="Año"
                      name="year"
                      type="number"
                      value={formData.year || ''}
                      onChange={handleInputChange}
                      size="small"
                      InputProps={{ inputProps: { min: 1990, max: new Date().getFullYear() } }}
                    />
                    <TextField
                      required
                      fullWidth
                      label="Placa"
                      name="license_plate"
                      value={formData.license_plate || ''}
                      onChange={handleInputChange}
                      size="small"
                      inputProps={{ maxLength: 10 }}
                      helperText={`${(formData.license_plate || '').length}/10 caracteres`}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Stack>
        {/* Sección única de Fotos y Documentos del Conductor, cubriendo todo el ancho */}
        <Box sx={{ mt: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 600 }}>
                Fotos y Documentos del Conductor
              </Typography>
              {/* Grid de documentos responsive */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
                gap: 2, 
                mt: 2, 
                width: '100%' 
              }}>
                <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                    Licencia de Conducir
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    Foto de la licencia de conducir vigente.
                  </Typography>
                  <SquareImageUpload
                    imageUrl={licenciaUrl}
                    onImageChange={handleLicenciaChange}
                    helpText="Máx. 2MB. Formato JPG/JPEG/PNG"
                  />
                </Card>
                
                <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                    Seguro del Vehículo
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    Documento vigente del seguro del vehículo.
                  </Typography>
                  <SquareImageUpload
                    imageUrl={seguroUrl}
                    onImageChange={handleSeguroChange}
                    helpText="Máx. 2MB. Formato JPG/JPEG/PNG"
                  />
                </Card>
                
                <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                    Registro del Vehículo
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    Registro actual del vehículo.
                  </Typography>
                  <SquareImageUpload
                    imageUrl={registroUrl}
                    onImageChange={handleRegistroChange}
                    helpText="Máx. 2MB. Formato JPG/JPEG/PNG"
                  />
                </Card>
                
                <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, textAlign: 'center' }}>
                    Foto del Vehículo
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                    Foto exterior del vehículo (frontal o lateral).
                  </Typography>
                  <SquareImageUpload
                    imageUrl={fotoVehiculoUrl}
                    onImageChange={handleFotoVehiculoChange}
                    helpText="Máx. 2MB. Formato JPG/JPEG/PNG"
                  />
                </Card>
              </Box>
            </CardContent>
          </Card>
        </Box>
        {/* Botones de acción centrados y fuera de las tarjetas */}
        <Box display="flex" justifyContent="center" gap={2} mt={4}>
          <Button
            variant="outlined"
            onClick={handleNavigateBack}
            disabled={loading}
            sx={{ minWidth: 160 }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading || actualizarDocumentosMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading || actualizarDocumentosMutation.isPending}
            sx={{
              bgcolor: '#e5308a',
              '&:hover': { bgcolor: '#c5206a' },
              minWidth: 180
            }}
          >
            {loading || actualizarDocumentosMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Box>
      </form>

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

export default EditarConductor;