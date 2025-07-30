import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Typography, CircularProgress } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

interface SquareImageUploadProps {
  imageUrl?: string;
  onImageChange: (file: File | null) => void;
  loading?: boolean;
  error?: string | null;
  helpText?: string;
  disabled?: boolean;
}

const SquareImageUpload: React.FC<SquareImageUploadProps> = ({
  imageUrl,
  onImageChange,
  loading = false,
  error = null,
  helpText = 'Máx. 2MB. Formato JPG/JPEG/PNG',
  disabled = false,
}) => {
  const [preview, setPreview] = useState<string | undefined>(imageUrl);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(imageUrl);
  }, [imageUrl]);

  const handleSelectImage = () => {
    if (!disabled && fileInputRef.current) fileInputRef.current.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const files = event.target.files;
    if (!files || files.length === 0) {
      setPreview(imageUrl);
      onImageChange(null);
      return;
    }
    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      setLocalError('El archivo excede el tamaño máximo permitido (2MB)');
      return;
    }
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      setLocalError('Formato no válido. Solo JPG, JPEG, PNG, WEBP');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onImageChange(file);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleImageChange}
        disabled={disabled}
      />
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: 3,
          border: '2px dashed #e5308a',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onClick={handleSelectImage}
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
          />
        ) : (
          <PhotoCameraIcon sx={{ fontSize: 48, color: '#e5308a' }} />
        )}
        <IconButton
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: '#e5308a',
            color: '#fff',
            borderRadius: 1,
            p: 0.5,
            zIndex: 2,
            '&:hover': { bgcolor: '#c5206a' },
          }}
          size="small"
          disabled={disabled}
        >
          <PhotoCameraIcon fontSize="small" />
        </IconButton>
        {loading && <CircularProgress size={32} sx={{ position: 'absolute', top: 44, left: 44 }} />}
      </Box>
      {(localError || error) && (
        <Typography color="error" variant="caption" sx={{ mt: 1 }}>
          {localError || error}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        {helpText}
      </Typography>
    </Box>
  );
};

export default SquareImageUpload; 