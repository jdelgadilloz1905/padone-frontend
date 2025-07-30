import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardMedia,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CloudUpload as CloudUploadIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import type { PhotoUpload, PhotoType } from '../../services/photoUploadService';

// ====================================
// INTERFACES
// ====================================

export interface PhotoPreviewProps {
  photo: PhotoUpload;
  onDelete?: (photoId: string) => void;
  onRetry?: (photoId: string) => void;
  showTypeChip?: boolean;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
}

export interface PhotoGalleryProps {
  photos: PhotoUpload[];
  onDelete?: (photoId: string) => void;
  onRetry?: (photoId: string) => void;
  groupByType?: boolean;
  showControls?: boolean;
  maxHeight?: number;
}

// ====================================
// CONFIGURACIÓN DE TIPOS
// ====================================

const getTypeLabel = (type: PhotoType): string => {
  const labels = {
    profile: 'Perfil',
    vehicle: 'Vehículo',
    document: 'Documento'
  };
  return labels[type];
};

const getTypeColor = (type: PhotoType) => {
  const colors = {
    profile: 'primary',
    vehicle: 'secondary',
    document: 'info'
  } as const;
  return colors[type];
};

// ====================================
// COMPONENTE PHOTO PREVIEW
// ====================================

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photo,
  onDelete,
  onRetry,
  showTypeChip = true,
  showProgress = true,
  size = 'medium',
  interactive = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isZoomed, setIsZoomed] = useState(false);

  // Configuración de tamaños
  const sizeConfig = {
    small: { width: 80, height: 80 },
    medium: { width: 150, height: 150 },
    large: { width: 200, height: 200 }
  };

  const cardSize = sizeConfig[size];

  // ====================================
  // HANDLERS
  // ====================================

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(photo.id);
  }, [onDelete, photo.id]);

  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRetry?.(photo.id);
  }, [onRetry, photo.id]);

  const handleZoom = useCallback(() => {
    if (interactive && (photo.preview || photo.url)) {
      setIsZoomed(true);
    }
  }, [interactive, photo.preview, photo.url]);

  const handleCloseZoom = useCallback(() => {
    setIsZoomed(false);
  }, []);

  const handleDownload = useCallback(() => {
    if (photo.url) {
      const link = document.createElement('a');
      link.href = photo.url;
      link.download = photo.file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [photo.url, photo.file.name]);

  // ====================================
  // RENDER STATUS OVERLAY
  // ====================================

  const renderStatusOverlay = () => {
    const overlayStyle = {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 1,
    };

    switch (photo.status) {
      case 'uploading':
        return (
          <Box sx={overlayStyle}>
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <CircularProgress 
                size={size === 'small' ? 24 : 32} 
                sx={{ color: 'white' }} 
              />
              {size !== 'small' && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {Math.round(photo.progress)}%
                </Typography>
              )}
            </Box>
          </Box>
        );

      case 'success':
        return (
          <Box sx={overlayStyle}>
            <CheckCircleIcon 
              sx={{ 
                color: 'success.main', 
                fontSize: size === 'small' ? 24 : 32,
                backgroundColor: 'white',
                borderRadius: '50%'
              }} 
            />
          </Box>
        );

      case 'error':
        return (
          <Box sx={overlayStyle}>
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <ErrorIcon 
                sx={{ 
                  color: 'error.main',
                  fontSize: size === 'small' ? 24 : 32,
                  backgroundColor: 'white',
                  borderRadius: '50%'
                }} 
              />
              {size !== 'small' && photo.error && (
                <Typography 
                  variant="caption" 
                  display="block" 
                  sx={{ mt: 1, maxWidth: 120 }}
                  noWrap
                >
                  {photo.error}
                </Typography>
              )}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  // ====================================
  // RENDER PROGRESS BAR
  // ====================================

  const renderProgressBar = () => {
    if (!showProgress || photo.status !== 'uploading') return null;

    return (
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <LinearProgress 
          variant="determinate" 
          value={photo.progress}
          sx={{
            height: 4,
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.palette.primary.main,
            },
          }}
        />
      </Box>
    );
  };

  // ====================================
  // RENDER MAIN COMPONENT
  // ====================================

  return (
    <>
      <Card 
        sx={{ 
          position: 'relative',
          width: cardSize.width,
          height: cardSize.height,
          cursor: interactive ? 'pointer' : 'default',
          transition: 'transform 0.2s ease',
          '&:hover': interactive ? {
            transform: 'scale(1.05)',
          } : {}
        }}
        onClick={handleZoom}
      >
        {/* Image */}
        <CardMedia
          component="img"
          image={photo.preview || photo.url}
          alt={photo.file.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Type Chip */}
        {showTypeChip && (
          <Chip
            label={getTypeLabel(photo.type)}
            color={getTypeColor(photo.type)}
            size="small"
            sx={{
              position: 'absolute',
              top: 4,
              left: 4,
              fontSize: '0.7rem',
              height: 20,
            }}
          />
        )}

        {/* Controls */}
        {interactive && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              display: 'flex',
              gap: 0.5,
            }}
          >
            {photo.status === 'error' && onRetry && (
              <Tooltip title="Reintentar">
                <IconButton
                  size="small"
                  onClick={handleRetry}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                  }}
                >
                  <CloudUploadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {photo.status === 'success' && photo.url && (
              <Tooltip title="Descargar">
                <IconButton
                  size="small"
                  onClick={handleDownload}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {onDelete && photo.status !== 'uploading' && (
              <Tooltip title="Eliminar">
                <IconButton
                  size="small"
                  onClick={handleDelete}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {/* Status Overlay */}
        {renderStatusOverlay()}

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* File Info (bottom) */}
        {size !== 'small' && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.7))',
              p: 1,
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'white',
                display: 'block',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
              }}
              noWrap
            >
              {photo.file.name}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.6rem'
              }}
            >
              {(photo.file.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          </Box>
        )}
      </Card>

      {/* Zoom Dialog */}
      {interactive && (
        <Dialog
          open={isZoomed}
          onClose={handleCloseZoom}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            <img
              src={photo.preview || photo.url}
              alt={photo.file.name}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: isMobile ? 'calc(100vh - 100px)' : '80vh',
                objectFit: 'contain',
              }}
            />
            
            {/* Zoom Controls */}
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 1,
              }}
            >
              {photo.url && (
                <IconButton
                  onClick={handleDownload}
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    },
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              )}
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {photo.file.name} • {(photo.file.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
            <Button onClick={handleCloseZoom}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

// ====================================
// COMPONENTE PHOTO GALLERY
// ====================================

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onDelete,
  onRetry,
  groupByType = true,
  showControls = true,
  maxHeight = 400
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (photos.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 120,
          color: 'text.secondary',
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
        <Typography variant="body2">
          No hay fotos seleccionadas
        </Typography>
      </Box>
    );
  }

  // Agrupar por tipo si está habilitado
  const groupedPhotos = groupByType 
    ? photos.reduce((acc, photo) => {
        if (!acc[photo.type]) {
          acc[photo.type] = [];
        }
        acc[photo.type].push(photo);
        return acc;
      }, {} as Record<PhotoType, PhotoUpload[]>)
    : { all: photos };

  return (
    <Box sx={{ maxHeight, overflow: 'auto' }}>
      {Object.entries(groupedPhotos).map(([type, typePhotos]) => (
        <Box key={type} sx={{ mb: 3 }}>
          {groupByType && type !== 'all' && (
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                mb: 1
              }}
            >
              {getTypeLabel(type as PhotoType)} ({typePhotos.length})
            </Typography>
          )}
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: isMobile 
                ? 'repeat(2, 1fr)' 
                : 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 2,
            }}
          >
            {typePhotos.map((photo) => (
              <PhotoPreview
                key={photo.id}
                photo={photo}
                onDelete={showControls ? onDelete : undefined}
                onRetry={showControls ? onRetry : undefined}
                showTypeChip={!groupByType}
                size={isMobile ? 'small' : 'medium'}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}; 