import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Alert,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as DescriptionIcon,
  CreditCard as CreditCardIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  DirectionsCar as DirectionsCarIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { PhotoUploadZone } from './photo-upload/PhotoUploadZone';
import { photoValidation } from '../services/photoUploadService';

// ====================================
// INTERFACES
// ====================================

export interface DocumentUploadSectionProps {
  driverLicenseFiles: File[];
  vehicleInsuranceFiles: File[];
  vehicleRegistrationFiles: File[];
  vehiclePhotoFiles: File[];
  onDriverLicenseChange: (files: File[]) => void;
  onVehicleInsuranceChange: (files: File[]) => void;
  onVehicleRegistrationChange: (files: File[]) => void;
  onVehiclePhotoChange: (files: File[]) => void;
  uploadProgress?: { 
    driverLicense: number; 
    vehicleInsurance: number;
    vehicleRegistration: number;
    vehiclePhoto: number;
  };
  isUploading?: boolean;
  errors?: { 
    driverLicense?: string; 
    vehicleInsurance?: string;
    vehicleRegistration?: string;
    vehiclePhoto?: string;
  };
  disabled?: boolean;
}

// ====================================
// COMPONENTE PRINCIPAL
// ====================================

export const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  driverLicenseFiles,
  vehicleInsuranceFiles,
  vehicleRegistrationFiles,
  vehiclePhotoFiles,
  onDriverLicenseChange,
  onVehicleInsuranceChange,
  onVehicleRegistrationChange,
  onVehiclePhotoChange,
  uploadProgress = { 
    driverLicense: 0, 
    vehicleInsurance: 0,
    vehicleRegistration: 0,
    vehiclePhoto: 0
  },
  isUploading = false,
  errors = {},
  disabled = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Estados locales para validaciones
  const [validationErrors, setValidationErrors] = useState<{
    driverLicense: string[];
    vehicleInsurance: string[];
    vehicleRegistration: string[];
    vehiclePhoto: string[];
  }>({
    driverLicense: [],
    vehicleInsurance: [],
    vehicleRegistration: [],
    vehiclePhoto: []
  });

  // Calcular progreso total de documentos
  const documentProgress = useMemo(() => {
    const documents = [
      { files: driverLicenseFiles, required: true },
      { files: vehicleInsuranceFiles, required: true },
      { files: vehicleRegistrationFiles, required: true },
      { files: vehiclePhotoFiles, required: true }
    ];
    
    const completed = documents.filter(doc => doc.files.length > 0).length;
    const total = documents.filter(doc => doc.required).length;
    
    return { completed, total, percentage: (completed / total) * 100 };
  }, [driverLicenseFiles, vehicleInsuranceFiles, vehicleRegistrationFiles, vehiclePhotoFiles]);

  // ====================================
  // HANDLERS
  // ====================================

  const handleDriverLicenseChange = async (files: File[]) => {
    const errors: string[] = [];
    for (const file of files) {
      const validation = await photoValidation.validateFile(file, 'document');
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }
    
    setValidationErrors(prev => ({
      ...prev,
      driverLicense: errors
    }));
    
    if (errors.length === 0) {
      onDriverLicenseChange(files);
    }
  };

  const handleVehicleInsuranceChange = async (files: File[]) => {
    const errors: string[] = [];
    for (const file of files) {
      const validation = await photoValidation.validateFile(file, 'document');
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }
    
    setValidationErrors(prev => ({
      ...prev,
      vehicleInsurance: errors
    }));
    
    if (errors.length === 0) {
      onVehicleInsuranceChange(files);
    }
  };

  const handleVehicleRegistrationChange = async (files: File[]) => {
    const errors: string[] = [];
    for (const file of files) {
      const validation = await photoValidation.validateFile(file, 'document');
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }
    
    setValidationErrors(prev => ({
      ...prev,
      vehicleRegistration: errors
    }));
    
    if (errors.length === 0) {
      onVehicleRegistrationChange(files);
    }
  };

  const handleVehiclePhotoChange = async (files: File[]) => {
    const errors: string[] = [];
    for (const file of files) {
      const validation = await photoValidation.validateFile(file, 'document');
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }
    
    setValidationErrors(prev => ({
      ...prev,
      vehiclePhoto: errors
    }));
    
    if (errors.length === 0) {
      onVehiclePhotoChange(files);
    }
  };

  const handleRemoveDriverLicense = (index: number) => {
    const newFiles = driverLicenseFiles.filter((_, i) => i !== index);
    onDriverLicenseChange(newFiles);
  };

  const handleRemoveVehicleInsurance = (index: number) => {
    const newFiles = vehicleInsuranceFiles.filter((_, i) => i !== index);
    onVehicleInsuranceChange(newFiles);
  };

  const handleRemoveVehicleRegistration = (index: number) => {
    const newFiles = vehicleRegistrationFiles.filter((_, i) => i !== index);
    onVehicleRegistrationChange(newFiles);
  };

  const handleRemoveVehiclePhoto = (index: number) => {
    const newFiles = vehiclePhotoFiles.filter((_, i) => i !== index);
    onVehiclePhotoChange(newFiles);
  };

  // ====================================
  // RENDER
  // ====================================

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography 
          variant="subtitle1" 
          fontWeight="bold" 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <DescriptionIcon color="primary" />
          Documentos Requeridos
        </Typography>
        
        <Chip
          icon={<CheckCircleIcon />}
          label={`${documentProgress.completed}/${documentProgress.total} completados`}
          color={documentProgress.completed === documentProgress.total ? "success" : "warning"}
          variant="outlined"
        />
      </Box>

      {/* Barra de progreso */}
      <Box sx={{ mb: 3 }}>
        <LinearProgress 
          variant="determinate" 
          value={documentProgress.percentage}
          sx={{ 
            height: 8, 
            borderRadius: 4,
            backgroundColor: theme.palette.grey[200],
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: documentProgress.completed === documentProgress.total 
                ? theme.palette.success.main 
                : theme.palette.warning.main
            }
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {documentProgress.percentage.toFixed(0)}% completado
        </Typography>
      </Box>
      
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3 
        }}
      >
        {/* LICENCIA DE CONDUCIR */}
        <Box>
          <Typography 
            variant="subtitle2" 
            fontWeight="600"
            sx={{ 
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <CreditCardIcon fontSize="small" color="primary" />
            Licencia de Conducir *
            {driverLicenseFiles.length > 0 && (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
          </Typography>
          
          <PhotoUploadZone
            photoType="document"
            onFilesSelected={handleDriverLicenseChange}
            onFileRemoved={handleRemoveDriverLicense}
            selectedFiles={driverLicenseFiles}
            maxFiles={1}
            disabled={disabled || isUploading}
            isUploading={isUploading}
            uploadProgress={uploadProgress.driverLicense}
            error={errors.driverLicense}
            mode={isMobile ? 'compact' : 'full'}
          />
          
          {/* Errores de validación */}
          <Collapse in={validationErrors.driverLicense.length > 0}>
            <Alert 
              severity="error" 
              sx={{ mt: 1 }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setValidationErrors(prev => ({
                    ...prev,
                    driverLicense: []
                  }))}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              <Typography variant="body2">
                {validationErrors.driverLicense.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </Typography>
            </Alert>
          </Collapse>
          
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            Sube fotos claras del anverso y reverso de la licencia. 
            Máx 1 archivo, 2MB c/u.
          </Typography>
        </Box>

        {/* SEGURO DEL VEHÍCULO */}
        <Box>
          <Typography 
            variant="subtitle2" 
            fontWeight="600"
            sx={{ 
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <SecurityIcon fontSize="small" color="primary" />
            Seguro del Vehículo *
            {vehicleInsuranceFiles.length > 0 && (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
          </Typography>
          
          <PhotoUploadZone
            photoType="document"
            onFilesSelected={handleVehicleInsuranceChange}
            onFileRemoved={handleRemoveVehicleInsurance}
            selectedFiles={vehicleInsuranceFiles}
            maxFiles={1}
            disabled={disabled || isUploading}
            isUploading={isUploading}
            uploadProgress={uploadProgress.vehicleInsurance}
            error={errors.vehicleInsurance}
            mode={isMobile ? 'compact' : 'full'}
          />
          
          <Collapse in={validationErrors.vehicleInsurance.length > 0}>
            <Alert 
              severity="error" 
              sx={{ mt: 1 }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setValidationErrors(prev => ({
                    ...prev,
                    vehicleInsurance: []
                  }))}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              <Typography variant="body2">
                {validationErrors.vehicleInsurance.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </Typography>
            </Alert>
          </Collapse>
          
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            Póliza de seguro vigente del vehículo. 
            Máx 1 archivo, 2MB c/u.
          </Typography>
        </Box>

        {/* REGISTRO DEL VEHÍCULO */}
        <Box>
          <Typography 
            variant="subtitle2" 
            fontWeight="600"
            sx={{ 
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <AssignmentIcon fontSize="small" color="primary" />
            Registro del Vehículo *
            {vehicleRegistrationFiles.length > 0 && (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
          </Typography>
          
          <PhotoUploadZone
            photoType="document"
            onFilesSelected={handleVehicleRegistrationChange}
            onFileRemoved={handleRemoveVehicleRegistration}
            selectedFiles={vehicleRegistrationFiles}
            maxFiles={1}
            disabled={disabled || isUploading}
            isUploading={isUploading}
            uploadProgress={uploadProgress.vehicleRegistration}
            error={errors.vehicleRegistration}
            mode={isMobile ? 'compact' : 'full'}
          />
          
          <Collapse in={validationErrors.vehicleRegistration.length > 0}>
            <Alert 
              severity="error" 
              sx={{ mt: 1 }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setValidationErrors(prev => ({
                    ...prev,
                    vehicleRegistration: []
                  }))}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              <Typography variant="body2">
                {validationErrors.vehicleRegistration.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </Typography>
            </Alert>
          </Collapse>
          
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            Tarjeta de circulación o registro del vehículo. 
            Máx 1 archivo, 2MB c/u.
          </Typography>
        </Box>

        {/* FOTO DEL VEHÍCULO */}
        <Box>
          <Typography 
            variant="subtitle2" 
            fontWeight="600"
            sx={{ 
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <DirectionsCarIcon fontSize="small" color="primary" />
            Foto del Vehículo *
            {vehiclePhotoFiles.length > 0 && (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
          </Typography>
          
          <PhotoUploadZone
            photoType="document"
            onFilesSelected={handleVehiclePhotoChange}
            onFileRemoved={handleRemoveVehiclePhoto}
            selectedFiles={vehiclePhotoFiles}
            maxFiles={1}
            disabled={disabled || isUploading}
            isUploading={isUploading}
            uploadProgress={uploadProgress.vehiclePhoto}
            error={errors.vehiclePhoto}
            mode={isMobile ? 'compact' : 'full'}
          />
          
          <Collapse in={validationErrors.vehiclePhoto.length > 0}>
            <Alert 
              severity="error" 
              sx={{ mt: 1 }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setValidationErrors(prev => ({
                    ...prev,
                    vehiclePhoto: []
                  }))}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              <Typography variant="body2">
                {validationErrors.vehiclePhoto.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </Typography>
            </Alert>
          </Collapse>
          
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            Fotos del vehículo (exterior, interior, placa). 
            Máx 1 archivo, 2MB c/u.
          </Typography>
        </Box>
      </Box>
      
      {/* Información general */}
      <Box 
        sx={{ 
          mt: 3, 
          p: 2, 
          bgcolor: 'info.50', 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'info.200'
        }}
      >
        <Typography variant="body2" color="info.dark">
          <strong>Importante:</strong> Las fotos deben ser claras y legibles. 
          Formatos aceptados: JPEG, PNG, WebP. Tamaño mínimo: 800x500px.
        </Typography>
      </Box>
    </Box>
  );
};

export default DocumentUploadSection;