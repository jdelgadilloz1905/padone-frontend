import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Alert,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

// =====================================================================
// INTERFACES Y TIPOS
// =====================================================================

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  itemPreview?: string;
  isLoading?: boolean;
  variant?: 'warning' | 'error';
}

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar Eliminación',
  message = '¿Estás seguro de que deseas eliminar este elemento?',
  itemName,
  itemPreview,
  isLoading = false,
  variant = 'warning'
}) => {

  const handleConfirm = () => {
    onConfirm();
  };

  const getVariantStyles = () => {
    return variant === 'error' 
      ? {
          iconColor: '#f44336',
          alertSeverity: 'error' as const,
          confirmColor: '#f44336'
        }
      : {
          iconColor: '#ff9800',
          alertSeverity: 'warning' as const,
          confirmColor: '#f44336'
        };
  };

  const styles = getVariantStyles();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3,
          overflow: 'visible'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: `${styles.iconColor}15`,
                border: `2px solid ${styles.iconColor}30`
              }}
            >
              <WarningIcon sx={{ color: styles.iconColor, fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {title}
              </Typography>
              {itemName && (
                <Typography variant="caption" color="text.secondary">
                  {itemName}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        {/* Mensaje principal */}
        <Alert 
          severity={styles.alertSeverity} 
          sx={{ 
            mb: 2,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {message}
          </Typography>
        </Alert>

        {/* Preview del contenido a eliminar */}
        {itemPreview && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ 
              bgcolor: 'grey.50', 
              border: '1px solid',
              borderColor: 'grey.200',
              borderRadius: 2, 
              p: 2 
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                Contenido a eliminar:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontStyle: 'italic',
                  color: 'text.primary',
                  lineHeight: 1.6,
                  maxHeight: 80,
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                "{itemPreview}"
                {itemPreview.length > 100 && (
                  <Box 
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'grey.50',
                      pl: 2
                    }}
                  >
                    ...
                  </Box>
                )}
              </Typography>
            </Box>
          </>
        )}

        {/* Advertencia adicional */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 2, border: '1px solid', borderColor: 'error.main' }}>
          <Typography variant="body2" sx={{ color: 'error.contrastText', fontWeight: 500 }}>
            ⚠️ Esta acción no se puede deshacer
          </Typography>
          <Typography variant="caption" sx={{ color: 'error.contrastText', opacity: 0.9 }}>
            El elemento será eliminado permanentemente del sistema
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CancelIcon />}
          disabled={isLoading}
          sx={{ 
            minWidth: 120,
            textTransform: 'none',
            borderColor: 'grey.300',
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'grey.400',
              bgcolor: 'grey.50'
            }
          }}
        >
          Cancelar
        </Button>

        <Button
          onClick={handleConfirm}
          variant="contained"
          startIcon={isLoading ? undefined : <DeleteIcon />}
          disabled={isLoading}
          sx={{ 
            minWidth: 120,
            textTransform: 'none',
            bgcolor: styles.confirmColor,
            '&:hover': {
              bgcolor: styles.confirmColor,
              filter: 'brightness(0.9)'
            },
            '&:disabled': {
              bgcolor: 'grey.300'
            }
          }}
        >
          {isLoading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteModal; 