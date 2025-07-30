import React, { useRef, useState } from 'react';
import { Avatar, Badge, Box, CircularProgress, IconButton, Typography } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PersonIcon from '@mui/icons-material/Person';
import { conductorService } from '../../services/conductorService';
import type { Conductor } from '../../services/conductorService';

interface AvatarEditableProps {
  conductor: Conductor;
  onAvatarUpdated?: (url: string) => void;
}

const AvatarEditable: React.FC<AvatarEditableProps> = ({ conductor, onAvatarUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(conductor.profile_picture_url || conductor.profile_picture || undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectAvatar = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validar tamaño y formato
    if (file.size > 2 * 1024 * 1024) {
      setError('El archivo excede el tamaño máximo permitido (2MB)');
      return;
    }
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validFormats.includes(file.type)) {
      setError('Formato no válido. Solo JPG, JPEG y PNG');
      return;
    }

    setLoading(true);
    try {
      console.log('Subiendo avatar para conductor:', conductor.id);
      
      // Subir avatar y obtener URL
      const res = await conductorService.uploadDriverAvatar(conductor.id, file);
      console.log('Respuesta de uploadDriverAvatar:', res);
      
      if (res && res.url) {
        console.log('URL del avatar recibida:', res.url);
        
        // Actualizar el avatar con la URL
        const updatedConductor = await conductorService.updateAvatarWithUrl(conductor.id, res.url);
        console.log('Conductor actualizado:', updatedConductor);
        
        // Actualizar la UI
        setAvatarUrl(res.url);
        if (onAvatarUpdated) {
          onAvatarUpdated(res.url);
        }
      } else {
        throw new Error('No se recibió URL del avatar');
      }
    } catch (e: any) {
      console.error('Error al actualizar avatar:', e);
      setError(e?.message || 'Error al subir el avatar');
      // Limpiar el input de archivo para permitir reintento
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
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
          <IconButton
            sx={{ bgcolor: 'primary.main', color: 'white', p: 0.5 }}
            onClick={handleSelectAvatar}
            size="small"
            disabled={loading}
          >
            <PhotoCameraIcon fontSize="small" />
          </IconButton>
        }
      >
        <Avatar
          src={avatarUrl}
          sx={{ width: 100, height: 100, mb: 1, bgcolor: 'primary.main' }}
        >
          {!avatarUrl && <PersonIcon sx={{ fontSize: 50 }} />}
        </Avatar>
        {loading && <CircularProgress size={32} sx={{ position: 'absolute', top: 35, left: 35 }} />}
      </Badge>
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        Máx. 2MB. Formato JPG/JPEG/PNG
      </Typography>
    </Box>
  );
};

export default AvatarEditable; 