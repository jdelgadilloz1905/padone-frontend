import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Alert,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// Components
import { PhotoUploadZone } from './PhotoUploadZone';
import { PhotoGallery } from './PhotoPreview';
import { PhotoTypeSelector } from './PhotoTypeSelector';

// Hooks y tipos
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import type { PhotoType } from '../../services/photoUploadService';

// ====================================
// INTERFACES
// ====================================

export interface DocumentPhotoType {
  type: string;
  label: string;
  description?: string;
  required?: boolean;
}

export interface PhotoUploadManagerProps {
  driverId: number;
  onPhotosUploaded?: (uploadedPhotos: any[]) => void;
  onPhotoRemoved?: (type: string) => void;
  onError?: (error: string) => void;
  mode?: 'compact' | 'full';
  allowedTypes?: PhotoType[];
  requiredTypes?: PhotoType[];
  maxPhotosPerType?: Record<PhotoType, number>;
  showExistingPhotos?: boolean;
  autoUpload?: boolean;
  documentTypes?: DocumentPhotoType[];
}

interface UploadStats {
  total: number;
  pending: number;
  uploading: number;
  success: number;
  errors: number;
}

// ====================================
// COMPONENTE PRINCIPAL
// ====================================

export const PhotoUploadManager: React.FC<PhotoUploadManagerProps> = ({
  driverId,
  onPhotosUploaded,
  onPhotoRemoved,
  onError,
  mode = 'full',
  allowedTypes = ['profile', 'vehicle', 'document'],
  maxPhotosPerType,
  showExistingPhotos = true,
  autoUpload = false,
  documentTypes
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // ====================================
  // ESTADO LOCAL
  // ====================================
  const [selectedType, setSelectedType] = useState<PhotoType>(allowedTypes[0]);
  const [showTypeSelector, setShowTypeSelector] = useState(true);
  const [showExistingSection, setShowExistingSection] = useState(showExistingPhotos);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // ====================================
  // HOOKS
  // ====================================
  const {
    uploads,
    isUploading,
    hasErrors,
    driverPhotos,
    isLoadingPhotos,

    removePhoto,
    uploadSingle,
    uploadAll,
    clearAll,
    getPhotosByType,
    validateAndAdd
  } = usePhotoUpload(driverId);

  // ====================================
  // EFECTOS
  // ====================================

  // Auto upload cuando se agrega una foto
  useEffect(() => {
    if (autoUpload && uploads.length > 0) {
      const pendingUploads = uploads.filter(u => u.status === 'pending');
      if (pendingUploads.length > 0) {
        handleUploadAll();
      }
    }
  }, [uploads.length, autoUpload]);

  // Notificar uploads completados
  useEffect(() => {
    const successUploads = uploads.filter(u => u.status === 'success');
    if (successUploads.length > 0 && onPhotosUploaded) {
      onPhotosUploaded(successUploads);
    }
  }, [uploads, onPhotosUploaded]);

  // Notificar errores
  useEffect(() => {
    if (hasErrors && onError) {
      const errorUploads = uploads.filter(u => u.status === 'error');
      const errorMessages = errorUploads.map(u => u.error).filter(Boolean);
      if (errorMessages.length > 0) {
        onError(errorMessages[0]!);
      }
    }
  }, [hasErrors, uploads, onError]);

  // ====================================
  // HANDLERS
  // ====================================

  const handleFilesSelected = useCallback(async (files: File[], typeOverride?: PhotoType) => {
    setUploadError(null);
    setUploadSuccess(null);
    const typeToUse = mapToBasePhotoType(typeOverride || selectedType);
    try {
      for (const file of files) {
        const result = await validateAndAdd(file, typeToUse);
        if (!result.success) {
          setUploadError(`${file.name}: ${result.errors.join(', ')}`);
          return;
        }
      }
      if (!autoUpload && files.length > 0) {
        setUploadSuccess(`${files.length} archivo${files.length > 1 ? 's' : ''} agregado${files.length > 1 ? 's' : ''} correctamente`);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Error al procesar archivos');
    }
  }, [selectedType, validateAndAdd, autoUpload]);

  const handleFileRemoved = useCallback((index: number, typeOverride?: PhotoType) => {
    const typeToUse = mapToBasePhotoType(typeOverride || selectedType);
    const typePhotos = getPhotosByType(typeToUse);
    if (typePhotos[index]) {
      removePhoto(typePhotos[index].id);
      setTimeout(() => {
        const updatedPhotos = getPhotosByType(typeToUse);
        if (updatedPhotos.length === 0 && onPhotoRemoved && typeOverride) {
          onPhotoRemoved(typeOverride);
        }
      }, 300);
    }
  }, [selectedType, getPhotosByType, removePhoto, onPhotoRemoved]);

  const handleUploadAll = useCallback(async () => {
    try {
      setUploadError(null);
      await uploadAll(driverId);
      setUploadSuccess('Todas las fotos subidas correctamente');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Error al subir fotos');
    }
  }, [uploadAll, driverId]);

  const handleRetryUpload = useCallback(async (photoId: string) => {
    try {
      setUploadError(null);
      await uploadSingle(driverId, photoId);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Error al reintentar');
    }
  }, [uploadSingle, driverId]);

  const handleClearAll = useCallback(() => {
    clearAll();
    setUploadError(null);
    setUploadSuccess(null);
  }, [clearAll]);

  // ====================================
  // ESTADÍSTICAS
  // ====================================

  const getUploadStats = (): UploadStats => {
    return {
      total: uploads.length,
      pending: uploads.filter(u => u.status === 'pending').length,
      uploading: uploads.filter(u => u.status === 'uploading').length,
      success: uploads.filter(u => u.status === 'success').length,
      errors: uploads.filter(u => u.status === 'error').length
    };
  };

  const stats = getUploadStats();
  const currentTypePhotos = getPhotosByType(selectedType);
  const maxForCurrentType = maxPhotosPerType?.[selectedType];
  const canAddMore = !maxForCurrentType || currentTypePhotos.length < maxForCurrentType;

  // ====================================
  // RENDER HELPERS
  // ====================================

  const renderUploadProgress = () => {
    if (!isUploading || stats.total === 0) return null;

    const progressPercentage = ((stats.success + stats.errors) / stats.total) * 100;

    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2">
            Subiendo fotos... {stats.success + stats.errors}/{stats.total}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(progressPercentage)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>
    );
  };

  const renderStats = () => {
    if (stats.total === 0) return null;

    return (
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        {stats.pending > 0 && (
          <Chip 
            label={`${stats.pending} pendiente${stats.pending > 1 ? 's' : ''}`}
            size="small"
            color="default"
          />
        )}
        {stats.uploading > 0 && (
          <Chip 
            label={`${stats.uploading} subiendo`}
            size="small"
            color="primary"
          />
        )}
        {stats.success > 0 && (
          <Chip 
            label={`${stats.success} exitosa${stats.success > 1 ? 's' : ''}`}
            size="small"
            color="success"
          />
        )}
        {stats.errors > 0 && (
          <Chip 
            label={`${stats.errors} error${stats.errors > 1 ? 'es' : ''}`}
            size="small"
            color="error"
          />
        )}
      </Stack>
    );
  };

  // ====================================
  // RENDER PRINCIPAL
  // ====================================

  const isCompactMode = mode === 'compact' || isMobile;

  // Función para mapear tipos personalizados a tipos base
  const mapToBasePhotoType = (type: string): PhotoType => {
    if (type === 'vehicle_photo') return 'vehicle';
    // Todos los demás documentos se tratan como 'document'
    return 'document';
  };

  if (documentTypes && documentTypes.length > 0) {
    return (
      <Card elevation={1}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Documentos y Fotos Requeridos
          </Typography>
          <Stack spacing={3}>
            {documentTypes.map((docType) => {
              const currentTypePhotos = getPhotosByType(docType.type as PhotoType);
              const maxForCurrentType = maxPhotosPerType?.[mapToBasePhotoType(docType.type)] || 1;
              const isRequired = !!docType.required;
              const isUploaded = currentTypePhotos.length > 0;
              return (
                <Box key={docType.type}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {docType.label}
                    </Typography>
                    {isRequired && (
                      <Chip
                        label="Obligatorio"
                        color={isUploaded ? 'success' : 'warning'}
                        size="small"
                      />
                    )}
                    {isUploaded && (
                      <Chip label="Subido" color="success" size="small" />
                    )}
                    {!isUploaded && !isRequired && (
                      <Chip label="Opcional" color="default" size="small" />
                    )}
                  </Box>
                  {docType.description && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {docType.description}
                    </Typography>
                  )}
                  <PhotoUploadZone
                    photoType={mapToBasePhotoType(docType.type)}
                    onFilesSelected={(files) => handleFilesSelected(files, docType.type as PhotoType)}
                    onFileRemoved={(idx) => handleFileRemoved(idx, docType.type as PhotoType)}
                    selectedFiles={currentTypePhotos.map(p => p.file)}
                    maxFiles={maxForCurrentType}
                    disabled={isUploading}
                    isUploading={isUploading}
                    error={uploadError || undefined}
                    mode={mode}
                  />
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={isCompactMode ? 1 : 2}>
      <CardContent sx={{ p: isCompactMode ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant={isCompactMode ? "h6" : "h5"} 
            sx={{ fontWeight: 600 }}
          >
            Gestión de Fotos
          </Typography>
          
          {uploads.length > 0 && (
            <IconButton
              onClick={handleClearAll}
              disabled={isUploading}
              color="error"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>

        {/* Alerts */}
        <Collapse in={!!uploadError}>
          <Alert 
            severity="error" 
            onClose={() => setUploadError(null)}
            sx={{ mb: 2 }}
          >
            {uploadError}
          </Alert>
        </Collapse>

        <Collapse in={!!uploadSuccess}>
          <Alert 
            severity="success" 
            onClose={() => setUploadSuccess(null)}
            sx={{ mb: 2 }}
          >
            {uploadSuccess}
          </Alert>
        </Collapse>

        {/* Upload Progress */}
        {renderUploadProgress()}

        {/* Stats */}
        {renderStats()}

        {/* Type Selector */}
        {allowedTypes.length > 1 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Tipo de Foto
              </Typography>
              {!isCompactMode && (
                <IconButton
                  onClick={() => setShowTypeSelector(!showTypeSelector)}
                  size="small"
                >
                  {showTypeSelector ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              )}
            </Box>
            
            <Collapse in={showTypeSelector || isCompactMode}>
              <PhotoTypeSelector
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                disabled={isUploading}
                showDetails={!isCompactMode}
                variant={isCompactMode ? 'chips' : 'cards'}
              />
            </Collapse>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Upload Zone */}
        <PhotoUploadZone
          photoType={selectedType}
          onFilesSelected={(files) => handleFilesSelected(files)}
          onFileRemoved={(idx) => handleFileRemoved(idx)}
          selectedFiles={currentTypePhotos.map(p => p.file)}
          maxFiles={maxForCurrentType}
          disabled={!canAddMore || isUploading}
          isUploading={isUploading}
          error={uploadError || undefined}
          mode={isCompactMode ? 'compact' : 'full'}
        />

        {/* Upload Controls */}
        {!autoUpload && uploads.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={handleUploadAll}
                disabled={isUploading || stats.pending === 0}
                sx={{ minWidth: 150 }}
              >
                {isUploading 
                  ? 'Subiendo...' 
                  : `Subir ${stats.pending} foto${stats.pending !== 1 ? 's' : ''}`
                }
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleClearAll}
                disabled={isUploading}
              >
                Limpiar
              </Button>
            </Stack>
          </Box>
        )}

        {/* Current Uploads Gallery */}
        {uploads.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Fotos en Cola
            </Typography>
            
            <PhotoGallery
              photos={uploads}
              onDelete={removePhoto}
              onRetry={handleRetryUpload}
              groupByType={allowedTypes.length > 1}
              showControls={!autoUpload}
              maxHeight={300}
            />
          </Box>
        )}

        {/* Existing Photos */}
        {showExistingPhotos && driverPhotos && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Fotos Existentes
              </Typography>
              <IconButton
                onClick={() => setShowExistingSection(!showExistingSection)}
                size="small"
              >
                {showExistingSection ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={showExistingSection}>
              {isLoadingPhotos ? (
                <LinearProgress sx={{ my: 2 }} />
              ) : (
                <Box>
                  {driverPhotos.vehicle_photos.length > 0 && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Fotos de vehículo: {driverPhotos.vehicle_photos.length}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', my: 1 }}>
                        {driverPhotos.vehicle_photos.map((p, idx) => (
                          <img
                            key={`vehicle-${idx}`}
                            src={typeof p === 'string' ? p : p.url}
                            alt="Vehículo"
                            style={{ width: 64, height: 64, borderRadius: 4 }}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                  {driverPhotos.document_photos.length > 0 && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Documentos: {driverPhotos.document_photos.length}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', my: 1 }}>
                        {driverPhotos.document_photos.map((p, idx) => (
                          <img
                            key={`document-${idx}`}
                            src={typeof p === 'string' ? p : p.url}
                            alt="Documento"
                            style={{ width: 64, height: 64, borderRadius: 4 }}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              )}
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}; 