import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Avatar,
  Divider,
  styled,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import rideService from '../services/rideService';
import type { Driver } from '../services/rideService';

// ============================================================================
// INTERFACES
// ============================================================================
interface AsignarConductorModalProps {
  open: boolean;
  onClose: () => void;
  onAsignar: (conductorId: string) => void;
  conductores?: Driver[];
}

// ============================================================================
// STYLED COMPONENTS - Memoizados para evitar re-creación
// ============================================================================
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    width: '546px',
    height: '591px',
    maxWidth: '546px',
    maxHeight: '591px',
    background: '#FFFFFF',
    borderRadius: '8px',
    padding: 0,
    margin: 0,
    position: 'relative',
    [theme.breakpoints.down('md')]: {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      borderRadius: 0,
      margin: 0,
    },
    [theme.breakpoints.between('sm', 'md')]: {
      width: 'calc(100vw - 32px)',
      height: 'calc(100vh - 64px)',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100vh - 64px)',
      borderRadius: '12px',
      margin: '32px 16px',
    }
  }
}));

const ModalContent = styled(Box)({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative'
});

const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: '16px',
  top: '16px',
  width: '24px',
  height: '24px',
  padding: 0,
  zIndex: 10,
  transition: 'all 0.2s ease',
  '& .MuiSvgIcon-root': {
    fontSize: '18px',
    color: '#423C3D',
    stroke: '#423C3D',
    strokeWidth: '1.5px'
  },
  '&:hover': {
    backgroundColor: 'rgba(66, 60, 61, 0.08)',
    transform: 'scale(1.1)'
  },
  [theme.breakpoints.down('md')]: {
    width: '44px',
    height: '44px',
    right: '12px',
    top: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    borderRadius: '12px',
    '& .MuiSvgIcon-root': {
      fontSize: '24px'
    },
    '&:hover': {
      backgroundColor: 'rgba(66, 60, 61, 0.12)',
    }
  }
}));

const Title = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  left: '20px',
  top: '34px',
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '18px',
  lineHeight: '27px',
  color: '#201B1B',
  margin: 0,
  [theme.breakpoints.down('md')]: {
    left: '16px',
    top: '24px',
    fontSize: '20px',
    lineHeight: '30px',
    fontWeight: 700,
    maxWidth: 'calc(100% - 80px)', // Espacio para botón de cerrar
    wordWrap: 'break-word'
  }
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: '20px',
  top: '80px',
  width: '506px',
  height: '40px',
  [theme.breakpoints.down('md')]: {
    left: '16px',
    right: '16px',
    width: 'calc(100% - 32px)',
    top: '76px',
    height: '48px'
  }
}));

const SearchField = styled(TextField)(({ theme }) => ({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    height: '40px',
    background: '#FFFFFF',
    border: '1px solid #D3D3D3',
    borderRadius: '8px',
    padding: '10px 16px',
    fontFamily: 'Poppins',
    transition: 'all 0.2s ease',
    '& fieldset': {
      border: 'none'
    },
    '&:hover': {
      borderColor: '#E33096',
      boxShadow: '0 2px 8px rgba(227, 48, 150, 0.15)',
      '& fieldset': {
        border: 'none'
      }
    },
    '&.Mui-focused': {
      borderColor: '#E33096',
      boxShadow: '0 4px 12px rgba(227, 48, 150, 0.25)',
      '& fieldset': {
        border: 'none'
      }
    },
    [theme.breakpoints.down('md')]: {
      height: '48px',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '16px'
    }
  },
  '& .MuiInputBase-input': {
    fontFamily: 'Poppins',
    fontSize: '12px',
    fontWeight: 400,
    color: '#4F4E4E',
    padding: 0,
    '&::placeholder': {
      color: '#4F4E4E',
      opacity: 1
    },
    [theme.breakpoints.down('md')]: {
      fontSize: '16px'
    }
  },
  '& .MuiInputAdornment-root': {
    [theme.breakpoints.down('md')]: {
      '& .MuiSvgIcon-root': {
        fontSize: '24px'
      }
    }
  }
}));

const ConductoresList = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: '12px',
  top: '144px',
  width: '522px',
  height: '416px',
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  overflowY: 'auto',
  paddingBottom: '8px',
  '&::-webkit-scrollbar': {
    width: '4px'
  },
  '&::-webkit-scrollbar-track': {
    background: '#F5F5F5',
    borderRadius: '2px'
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#D3D3D3',
    borderRadius: '2px',
    '&:hover': {
      background: '#BFBFBF'
    }
  },
  [theme.breakpoints.down('md')]: {
    left: '8px',
    right: '8px',
    width: 'calc(100% - 16px)',
    height: 'calc(100% - 140px)',
    top: '140px',
    paddingBottom: '16px',
    '&::-webkit-scrollbar': {
      width: '6px'
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#E33096',
      borderRadius: '3px'
    }
  }
}));

const ConductorItem = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '56px',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  padding: '8px',
  background: '#FFFFFF',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#F8F9FA',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  },
  [theme.breakpoints.down('md')]: {
    height: '72px',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '8px',
    '&:hover': {
      backgroundColor: '#F8F9FA',
      transform: 'none', // Desactivar animación en móvil
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
    }
  }
}));

const ConductorAvatar = styled(Avatar)(({ theme }) => ({
  width: '40px',
  height: '40px',
  borderRadius: '8px',
  backgroundColor: '#E33096',
  color: '#FFFFFF',
  fontWeight: 600,
  fontSize: '16px',
  [theme.breakpoints.down('md')]: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    fontSize: '18px'
  }
}));

const ConductorInfo = styled(Box)(({ theme }) => ({
  marginLeft: '16px',
  display: 'flex',
  flexDirection: 'column',
  width: '332px',
  height: '39px',
  flex: 1,
  minWidth: 0,
  [theme.breakpoints.down('md')]: {
    marginLeft: '16px',
    height: 'auto',
    justifyContent: 'center'
  }
}));

const ConductorName = styled(Typography)(({ theme }) => ({
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '21px',
  color: '#423C3D',
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  [theme.breakpoints.down('md')]: {
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: 700
  }
}));
const AsignarButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  right: '8px',
  top: '13px',
  width: '86px',
  height: '30px',
  background: '#E33096',
  borderRadius: '8px',
  border: 'none',
  padding: '8px 20px',
  fontFamily: 'Poppins',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: '12px',
  lineHeight: '14px',
  color: '#FFFFFF',
  textTransform: 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: '#D12A87',
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(227, 48, 150, 0.3)'
  },
  '&:active': {
    transform: 'scale(0.98)'
  },
  [theme.breakpoints.down('md')]: {
    width: '100px',
    height: '44px',
    right: '12px',
    top: '14px',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: '16px',
    fontWeight: 600,
    '&:hover': {
      background: '#D12A87',
      transform: 'none', // Desactivar scale en móvil
      boxShadow: '0 6px 16px rgba(227, 48, 150, 0.4)'
    }
  }
}));

const ConductorDivider = styled(Divider)({
  width: '100%',
  border: '1px solid #F9EDEF',
  margin: 0
});

// ============================================================================
// UTILIDAD: DEBOUNCE HOOK
// ============================================================================
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// ============================================================================
// COMPONENTE OPTIMIZADO
// ============================================================================
const AsignarConductorModal = memo<AsignarConductorModalProps>(({
  open,
  onClose,
  onAsignar,
  conductores = []
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [conductoresData, setConductoresData] = useState<Driver[]>(conductores || []);
  
  // Debounce search term para evitar re-renders excesivos
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ============================================================================
  // CALLBACKS MEMOIZADOS
  // ============================================================================
  
  // Cargar conductores - memoizado
  const loadConductores = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await rideService.getAvailableDrivers();
      setConductoresData(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(t('requests.modal.errorLoadingDrivers'));
      console.error('Error loading drivers:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Helper para ubicación - memoizado
  const getConductorLocation = useCallback((conductor: Driver): string => {
    if (conductor.latitude && conductor.longitude) {
      return `Lat: ${conductor.latitude.toFixed(4)}, Lng: ${conductor.longitude.toFixed(4)}`;
    }
    return `${conductor.phone || 'N/A'} • ${conductor.vehicle_plate || 'N/A'}`;
  }, []);

  // Handler de asignación - memoizado
  const handleAsignar = useCallback((conductorId: string) => {
    onAsignar(conductorId);
    onClose();
  }, [onAsignar, onClose]);

  // Handler de búsqueda - memoizado
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // ============================================================================
  // EFECTOS OPTIMIZADOS
  // ============================================================================
  
  // Cargar conductores solo cuando se abre el modal y no hay datos
  useEffect(() => {
    if (open && conductores.length === 0) {
      loadConductores();
    }
  }, [open, conductores.length, loadConductores]);

  // Reset search cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setError('');
    }
  }, [open]);

  // ============================================================================
  // COMPUTACIONES MEMOIZADAS
  // ============================================================================
  
  // Filtrar conductores - solo re-calcular cuando cambian datos o search term
  const conductoresFiltrados = useMemo(() => {
    if (!Array.isArray(conductoresData)) return [];
    
    if (!debouncedSearchTerm.trim()) return conductoresData;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return conductoresData.filter(conductor =>
      conductor.name?.toLowerCase().includes(searchLower) ||
      conductor.phone?.toLowerCase().includes(searchLower) ||
      conductor.vehicle_plate?.toLowerCase().includes(searchLower)
    );
  }, [conductoresData, debouncedSearchTerm]);

  // Placeholder text memoizado
  const searchPlaceholder = useMemo(() => t('requests.modal.searchDrivers'), [t]);
  const modalTitle = useMemo(() => t('requests.modal.assignDriver'), [t]);
  const assignButtonText = useMemo(() => t('requests.modal.assign'), [t]);
  const errorText = useMemo(() => t('requests.modal.errorLoadingDrivers'), [t]);
  const noDriversText = useMemo(() => t('requests.modal.noDrivers'), [t]);

  // ============================================================================
  // RENDER OPTIMIZADO
  // ============================================================================
  
  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={isMobile}
      disableEscapeKeyDown={false}
      PaperProps={{
        sx: {
          ...(isMobile && {
            margin: 0,
            width: '100%',
            height: '100%',
            maxHeight: '100%',
            borderRadius: 0
          })
        }
      }}
    >
      <ModalContent>
        <CloseButton onClick={onClose}>
          <CloseIcon />
        </CloseButton>
        
        <Title>{modalTitle}</Title>
        
        <SearchContainer>
          <SearchField
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#4F4E4E', fontSize: '20px' }} />
                </InputAdornment>
              )
            }}
          />
        </SearchContainer>
        
        <ConductoresList>
          {error && (
            <Alert severity="error" sx={{ margin: '16px' }}>
              {errorText}
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {conductoresFiltrados.map((conductor, index) => (
                <ConductorItemMemo
                  key={conductor.id}
                  conductor={conductor}
                  onAsignar={handleAsignar}
                  getConductorLocation={getConductorLocation}
                  assignButtonText={assignButtonText}
                  showDivider={index < conductoresFiltrados.length - 1}
                />
              ))}
              
              {conductoresFiltrados.length === 0 && !loading && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%',
                  fontFamily: 'Poppins',
                  fontSize: '14px',
                  color: '#8C8888'
                }}>
                  {noDriversText}
                </Box>
              )}
            </>
          )}
        </ConductoresList>
      </ModalContent>
    </StyledDialog>
  );
});

// ============================================================================
// SUBCOMPONENTE MEMOIZADO PARA ITEM DE CONDUCTOR
// ============================================================================
interface ConductorItemProps {
  conductor: Driver;
  onAsignar: (conductorId: string) => void;
  getConductorLocation: (conductor: Driver) => string;
  assignButtonText: string;
  showDivider: boolean;
}

const ConductorItemMemo = memo<ConductorItemProps>(({ 
  conductor, 
  onAsignar, 
  assignButtonText,
  showDivider 
}) => {
  // Memoizar avatar inicial
  const avatarInitial = useMemo(() => conductor.name.charAt(0), [conductor.name]);
  
  // Memoizar ubicación
  const handleClick = useCallback(() => {
    onAsignar(conductor.id);
  }, [conductor.id, onAsignar]);

  return (
    <React.Fragment>
      <ConductorItem>
        <ConductorAvatar alt={conductor.name}>
          {avatarInitial}
        </ConductorAvatar>
        
        <ConductorInfo>
          <ConductorName>{conductor.name}</ConductorName>
        </ConductorInfo>
        
        <AsignarButton onClick={handleClick}>
          {assignButtonText}
        </AsignarButton>
      </ConductorItem>
      
      {showDivider && <ConductorDivider />}
    </React.Fragment>
  );
});

// Configurar display names para debugging
AsignarConductorModal.displayName = 'AsignarConductorModal';
ConductorItemMemo.displayName = 'ConductorItemMemo';

export default AsignarConductorModal; 