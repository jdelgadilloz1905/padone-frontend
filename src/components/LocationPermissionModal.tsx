import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Divider
} from '@mui/material';
import {
  LocationOn,
  PhoneIphone,
  Android,
  Computer,
  CheckCircle
} from '@mui/icons-material';

interface LocationPermissionModalProps {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown';
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  open,
  onClose,
  onRetry,
  permissionState
}) => {
  const getDeviceIcon = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return <PhoneIphone sx={{ fontSize: 30, color: '#007AFF' }} />;
    } else if (/android/.test(userAgent)) {
      return <Android sx={{ fontSize: 30, color: '#3DDC84' }} />;
    }
    return <Computer sx={{ fontSize: 30, color: '#1976d2' }} />;
  };

  const getInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return {
        title: 'Activar ubicación en iPhone/iPad',
        icon: <PhoneIphone sx={{ color: '#007AFF' }} />,
        steps: [
          'Abre la app "Configuración" en tu dispositivo',
          'Busca y toca "Safari" en la lista',
          'Toca "Ubicación"',
          'Selecciona "Mientras uses la app"',
          'Regresa a esta página y toca "Reintentar"'
        ]
      };
    } else if (/android/.test(userAgent)) {
      return {
        title: 'Activar ubicación en Android',
        icon: <Android sx={{ color: '#3DDC84' }} />,
        steps: [
          'Abre "Configuración" en tu dispositivo',
          'Ve a "Aplicaciones" o "Administrador de aplicaciones"',
          'Busca y toca tu navegador (Chrome, Firefox, etc.)',
          'Toca "Permisos"',
          'Activa "Ubicación"',
          'Regresa a esta página y toca "Reintentar"'
        ]
      };
    } else if (/safari/.test(userAgent) && !/chrome|firefox|opera|edge/.test(userAgent)) {
      return {
        title: 'Activar ubicación en Safari (Mac)',
        icon: <Computer sx={{ color: '#1976d2' }} />,
        steps: [
          'En la barra de menú, ve a Safari > Preferencias',
          'Haz clic en la pestaña "Sitios web"',
          'Selecciona "Ubicación" en la barra lateral',
          'Para este sitio, elige "Permitir"',
          'Recarga la página y toca "Reintentar"'
        ]
      };
    } else {
      return {
        title: 'Activar ubicación en tu navegador',
        icon: <Computer sx={{ color: '#1976d2' }} />,
        steps: [
          'Busca el ícono de ubicación en la barra de direcciones',
          'Haz clic en él y selecciona "Permitir"',
          'Si no lo ves, ve a configuración del navegador',
          'Busca "Permisos" o "Privacidad y seguridad"',
          'Permite la ubicación para este sitio'
        ]
      };
    }
  };

  const instructions = getInstructions();

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          mx: 2
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
          <LocationOn sx={{ color: '#E33096', fontSize: 28 }} />
          {getDeviceIcon()}
        </Box>
        <Typography variant="h6" component="div" fontWeight="bold">
          {instructions.title}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Alert 
          severity={permissionState === 'denied' ? 'warning' : 'info'} 
          sx={{ mb: 2 }}
        >
          {permissionState === 'denied' 
            ? 'Los permisos de ubicación están desactivados. Necesitamos tu ubicación para ofrecerte el mejor servicio.'
            : 'Para continuar, necesitamos acceder a tu ubicación actual.'
          }
        </Alert>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Sigue estos pasos para activar la ubicación:
        </Typography>

        <List dense>
          {instructions.steps.map((step, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckCircle sx={{ color: '#4CAF50', fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText 
                primary={step}
                primaryTypographyProps={{
                  variant: 'body2',
                  color: 'text.primary'
                }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>💡 Tip:</strong> Si ya activaste los permisos, es posible que necesites recargar 
            la página para que los cambios surtan efecto.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={onRetry} 
          variant="contained" 
          sx={{ 
            bgcolor: '#E33096',
            '&:hover': { bgcolor: '#C7287F' },
            minWidth: 120
          }}
        >
          Reintentar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationPermissionModal; 