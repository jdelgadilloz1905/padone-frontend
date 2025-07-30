import React, { useCallback, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Stack
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { PHOTO_CONFIG } from '../../services/photoUploadService';
import type { PhotoType } from '../../services/photoUploadService';

// ====================================
// INTERFACES
// ====================================

export interface PhotoUploadZoneProps {
  photoType: PhotoType;
  onFilesSelected: (files: File[]) => void;
  onFileRemoved?: (index: number) => void;
  selectedFiles?: File[];
  maxFiles?: number;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
  mode?: 'compact' | 'full';
  existingImageUrl?: string;
}

// ====================================
// CONFIGURACIÓN POR TIPO
// ====================================

const getTypeConfig = (type: PhotoType) => {
  const configs = {
    profile: {
      title: 'Foto de Perfil',
      subtitle: 'Sube la foto de perfil del conductor',
      icon: PhotoCameraIcon,
      maxFiles: 1,
      acceptedFormats: 'JPEG, PNG, WebP',
      maxSize: '2MB',
      minDimensions: '200x200px'
    },
    vehicle: {
      title: 'Fotos del Vehículo',
      subtitle: 'Sube fotos del vehículo (exterior, interior, documentos)',
      icon: CloudUploadIcon,
      maxFiles: 5,
      acceptedFormats: 'JPEG, PNG, WebP',
      maxSize: '3MB',
      minDimensions: '800x600px'
    },
    document: {
      title: 'Documentos',
      subtitle: 'Sube licencia, cédula, seguro y otros documentos',
      icon: CloudUploadIcon,
      maxFiles: 10,
      acceptedFormats: 'JPEG, PNG, WebP',
      maxSize: '5MB',
      minDimensions: '800x500px'
    }
  };
  
  return configs[type];
};

// ====================================
// COMPONENTE PRINCIPAL
// ====================================

export const PhotoUploadZone: React.FC<PhotoUploadZoneProps> = ({
  photoType,
  onFilesSelected,
  onFileRemoved,
  selectedFiles = [],
  maxFiles,
  disabled = false,
  isUploading = false,
  error,
  existingImageUrl
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados locales
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  // Configuración del tipo
  const typeConfig = getTypeConfig(photoType);
  const actualMaxFiles = maxFiles || typeConfig.maxFiles;
  const canAddMore = selectedFiles.length < actualMaxFiles;

  // ====================================
  // HANDLERS DE DRAG & DROP
  // ====================================

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    setDragCounter(0);
    
    if (disabled || isUploading || !canAddMore) return;

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      PHOTO_CONFIG.ALLOWED_FORMATS.includes(file.type as any)
    );

    if (validFiles.length > 0) {
      const maxToAdd = actualMaxFiles - selectedFiles.length;
      const filesToAdd = validFiles.slice(0, maxToAdd);
      onFilesSelected(filesToAdd);
    }
  }, [disabled, isUploading, canAddMore, actualMaxFiles, selectedFiles.length, onFilesSelected]);

  // ====================================
  // HANDLERS DE FILE INPUT
  // ====================================

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const maxToAdd = actualMaxFiles - selectedFiles.length;
      const filesToAdd = files.slice(0, maxToAdd);
      onFilesSelected(filesToAdd);
    }
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [actualMaxFiles, selectedFiles.length, onFilesSelected]);

  const handleZoneClick = useCallback(() => {
    if (disabled || isUploading || !canAddMore) return;
    fileInputRef.current?.click();
  }, [disabled, isUploading, canAddMore]);

  const handleRemoveFile = useCallback((index: number) => {
    onFileRemoved?.(index);
  }, [onFileRemoved]);

  // ====================================
  // ESTILOS DINÁMICOS
  // ====================================

  // ====================================
  // RENDER
  // ====================================

  return (
    <Box>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={actualMaxFiles > 1}
        accept={PHOTO_CONFIG.ALLOWED_FORMATS.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled || isUploading || !canAddMore}
      />

      {/* Upload Zone */}
      <Box
        sx={{
          width: 120,
          height: 120,
          border: error ? '2px dashed #f44336' : '2px dashed #e5308a',
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: disabled || isUploading || !canAddMore ? 'not-allowed' : 'pointer',
          background: isDragOver ? '#fce4ec' : '#fff',
          mx: 'auto',
          mb: 1,
          overflow: 'hidden'
        }}
        onClick={handleZoneClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Miniatura de archivo seleccionado */}
        {selectedFiles && selectedFiles.length > 0 && !error && selectedFiles[0].type.startsWith('image/') ? (
          <img
            src={URL.createObjectURL(selectedFiles[0])}
            alt="preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, display: 'block' }}
          />
        ) : existingImageUrl && !error ? (
          <img
            src={existingImageUrl}
            alt="preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, display: 'block' }}
          />
        ) : (
          <PhotoCameraIcon sx={{ fontSize: 48, color: '#e5308a' }} />
        )}
        {/* Ícono de cámara superpuesto para cambiar */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: '#e5308a',
            borderRadius: 1,
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            zIndex: 2
          }}
        >
          <PhotoCameraIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        {/* Input oculto */}
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileInputChange}
          disabled={disabled}
        />
      </Box>
      {/* Error Required  */}
      {error && error?.length > 0 && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Archivos seleccionados ({selectedFiles.length}/{actualMaxFiles})
          </Typography>
          
          <Stack spacing={1}>
            {selectedFiles.map((file, index) => (
              <Paper
                key={`${file.name}-${index}`}
                elevation={1}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="body2" 
                    noWrap
                    sx={{ fontWeight: 500, maxWidth: '290px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
                
                {onFileRemoved && !isUploading && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(index)}
                    sx={{ ml: 1 }}
                    aria-label={`Eliminar ${file.name}`}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      {/* Add More Button (cuando hay archivos pero se pueden agregar más) */}
      {selectedFiles.length > 0 && canAddMore && !isUploading && (
        <Box sx={{ mt: 1 }}>
          <IconButton
            disabled={disabled}
            sx={{
              border: 1,
              borderColor: 'primary.main',
              borderStyle: 'dashed',
              borderRadius: 1,
              width: '100%',
              py: 1,
              color: 'primary.main',
            }}
          >
            <AddIcon sx={{ mr: 1 }} />
            <Typography variant="body2">
              Agregar más archivos
            </Typography>
          </IconButton>
        </Box>
      )}
    </Box>
  );
}; 