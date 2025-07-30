import React, { useCallback } from 'react';
import {
  Box,
  Chip,
  Paper,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import {
  DirectionsCar as DirectionsCarIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import type { PhotoType } from '../../services/photoUploadService';

// ====================================
// INTERFACES
// ====================================

export interface PhotoTypeSelectorProps {
  selectedType: PhotoType;
  onTypeChange: (type: PhotoType) => void;
  disabled?: boolean;
  showDetails?: boolean;
  variant?: 'chips' | 'cards' | 'buttons';
  orientation?: 'horizontal' | 'vertical';
}

// ====================================
// CONFIGURACIÓN DE TIPOS
// ====================================

interface TypeConfig {
  id: PhotoType;
  label: string;
  description: string;
  icon: React.ComponentType;
  color: 'primary' | 'secondary' | 'info';
  examples: string[];
  maxFiles: number;
  maxSize: string;
  minDimensions: string;
}

const PHOTO_TYPES: TypeConfig[] = [
  {
    id: 'vehicle',
    label: 'Vehículo',
    description: 'Fotos del vehículo y su estado',
    icon: DirectionsCarIcon,
    color: 'secondary',
    examples: ['Exterior completo', 'Interior', 'Placa visible', 'Daños si existen'],
    maxFiles: 5,
    maxSize: '3MB',
    minDimensions: '800x600px'
  },
  {
    id: 'document',
    label: 'Documentos',
    description: 'Documentos oficiales del conductor',
    icon: DescriptionIcon,
    color: 'info',
    examples: ['Licencia de conducir', 'Cédula de identidad', 'Seguro del vehículo', 'SOAT'],
    maxFiles: 10,
    maxSize: '5MB',
    minDimensions: '800x500px'
  }
];

// ====================================
// COMPONENTE CHIPS VARIANT
// ====================================

const ChipsVariant: React.FC<{
  types: TypeConfig[];
  selectedType: PhotoType;
  onTypeChange: (type: PhotoType) => void;
  disabled?: boolean;
  orientation: 'horizontal' | 'vertical';
}> = ({ types, selectedType, onTypeChange, disabled = false, orientation }) => {
  return (
    <Stack 
      direction={orientation === 'horizontal' ? 'row' : 'column'}
      spacing={1}
      flexWrap={orientation === 'horizontal' ? 'wrap' : 'nowrap'}
      useFlexGap
    >
      {types.map((type) => {
        const IconComponent = type.icon;
        return (
          <Chip
            key={type.id}
            icon={<IconComponent />}
            label={type.label}
            color={selectedType === type.id ? type.color : 'default'}
            variant={selectedType === type.id ? 'filled' : 'outlined'}
            onClick={() => !disabled && onTypeChange(type.id)}
            disabled={disabled}
            sx={{
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': !disabled ? {
                transform: 'scale(1.05)',
              } : {},
              '& .MuiChip-icon': {
                fontSize: '1.1rem'
              }
            }}
          />
        );
      })}
    </Stack>
  );
};

// ====================================
// COMPONENTE CARDS VARIANT
// ====================================

const CardsVariant: React.FC<{
  types: TypeConfig[];
  selectedType: PhotoType;
  onTypeChange: (type: PhotoType) => void;
  disabled?: boolean;
  showDetails: boolean;
  isMobile: boolean;
}> = ({ types, selectedType, onTypeChange, disabled = false, showDetails, isMobile }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: isMobile 
          ? '1fr' 
          : showDetails 
            ? 'repeat(auto-fit, minmax(280px, 1fr))'
            : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 2,
      }}
    >
      {types.map((type) => {
        const IconComponent = type.icon;
        const isSelected = selectedType === type.id;
        
        return (
          <Paper
            key={type.id}
            elevation={isSelected ? 4 : 1}
            sx={{
              p: showDetails ? 3 : 2,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              border: isSelected ? `2px solid` : `1px solid transparent`,
              borderColor: isSelected ? `${type.color}.main` : 'transparent',
              backgroundColor: isSelected ? `${type.color}.50` : 'background.paper',
              '&:hover': !disabled ? {
                elevation: 3,
                transform: 'translateY(-2px)',
                backgroundColor: isSelected 
                  ? `${type.color}.100` 
                  : 'action.hover',
              } : {},
            }}
            onClick={() => !disabled && onTypeChange(type.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: showDetails ? 2 : 1 }}>
              <Avatar
                sx={{
                  bgcolor: isSelected ? `${type.color}.main` : 'grey.200',
                  color: isSelected ? 'white' : 'grey.600',
                  mr: 2,
                  width: showDetails ? 40 : 32,
                  height: showDetails ? 40 : 32,
                }}
              >
                <IconComponent />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant={showDetails ? "h6" : "subtitle1"} 
                  sx={{ 
                    fontWeight: 600,
                    color: isSelected ? `${type.color}.main` : 'text.primary'
                  }}
                  noWrap
                >
                  {type.label}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  display="block"
                  sx={{ mt: 0.5 }}
                >
                  Máx {type.maxFiles} archivo{type.maxFiles > 1 ? 's' : ''} • {type.maxSize}
                </Typography>
              </Box>
            </Box>

            {showDetails && (
              <>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {type.description}
                </Typography>

                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                    display: 'block',
                    mb: 1
                  }}
                >
                  Ejemplos:
                </Typography>
                
                <Box component="ul" sx={{ 
                  m: 0, 
                  pl: 2, 
                  '& li': { 
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    mb: 0.5
                  }
                }}>
                  {type.examples.map((example, index) => (
                    <li key={index}>{example}</li>
                  ))}
                </Box>

                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip 
                      label={`Min ${type.minDimensions}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip 
                      label={`Max ${type.maxSize}`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Box>
              </>
            )}
          </Paper>
        );
      })}
    </Box>
  );
};

// ====================================
// COMPONENTE BUTTONS VARIANT
// ====================================

const ButtonsVariant: React.FC<{
  types: TypeConfig[];
  selectedType: PhotoType;
  onTypeChange: (type: PhotoType) => void;
  disabled?: boolean;
  orientation: 'horizontal' | 'vertical';
}> = ({ types, selectedType, onTypeChange, disabled = false, orientation }) => {
  return (
    <Stack 
      direction={orientation === 'horizontal' ? 'row' : 'column'}
      spacing={1}
    >
      {types.map((type) => {
        const IconComponent = type.icon;
        const isSelected = selectedType === type.id;
        
        return (
          <Paper
            key={type.id}
            elevation={isSelected ? 2 : 0}
            sx={{
              px: 2,
              py: 1.5,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              border: 1,
              borderColor: isSelected ? `${type.color}.main` : 'divider',
              backgroundColor: isSelected ? `${type.color}.50` : 'background.paper',
              '&:hover': !disabled ? {
                borderColor: `${type.color}.main`,
                backgroundColor: `${type.color}.25`,
              } : {},
            }}
            onClick={() => !disabled && onTypeChange(type.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                             <Box
                 component={IconComponent}
                 sx={{ 
                   mr: 1.5,
                   color: isSelected ? `${type.color}.main` : 'text.secondary'
                 }} 
               />
              <Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? `${type.color}.main` : 'text.primary'
                  }}
                >
                  {type.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Máx {type.maxFiles} • {type.maxSize}
                </Typography>
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
};

// ====================================
// COMPONENTE PRINCIPAL
// ====================================

export const PhotoTypeSelector: React.FC<PhotoTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled = false,
  showDetails = true,
  variant = 'cards',
  orientation = 'horizontal'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Ajustar configuración para móvil
  const actualVariant = isMobile && variant === 'cards' ? 'chips' : variant;
  const actualOrientation = isMobile ? 'vertical' : orientation;
  const actualShowDetails = showDetails && !isMobile;

  const handleTypeChange = useCallback((type: PhotoType) => {
    if (!disabled) {
      onTypeChange(type);
    }
  }, [disabled, onTypeChange]);

  // Renderizar variant apropiada
  const renderVariant = () => {
    switch (actualVariant) {
      case 'chips':
        return (
          <ChipsVariant
            types={PHOTO_TYPES}
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
            disabled={disabled}
            orientation={actualOrientation}
          />
        );

      case 'buttons':
        return (
          <ButtonsVariant
            types={PHOTO_TYPES}
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
            disabled={disabled}
            orientation={actualOrientation}
          />
        );

      case 'cards':
      default:
        return (
          <CardsVariant
            types={PHOTO_TYPES}
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
            disabled={disabled}
            showDetails={actualShowDetails}
            isMobile={isMobile}
          />
        );
    }
  };

  return (
    <Box>
      {actualShowDetails && variant === 'cards' && (
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            color: 'text.primary',
            mb: 3
          }}
        >
          Selecciona el tipo de foto
        </Typography>
      )}
      
      {renderVariant()}

      {/* Información adicional del tipo seleccionado para variants no-cards */}
      {actualVariant !== 'cards' && actualShowDetails && (
        <Box sx={{ mt: 3 }}>
          {PHOTO_TYPES
            .filter(type => type.id === selectedType)
            .map(type => (
              <Paper 
                key={type.id}
                elevation={1}
                sx={{ 
                  p: 2, 
                  backgroundColor: `${type.color}.50`,
                  border: 1,
                  borderColor: `${type.color}.200`
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    color: `${type.color}.main`,
                    mb: 1
                  }}
                >
                  {type.label}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {type.description}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip 
                    label={`Máximo ${type.maxFiles} archivo${type.maxFiles > 1 ? 's' : ''}`}
                    size="small"
                    color={type.color}
                    variant="outlined"
                  />
                  <Chip 
                    label={`Tamaño máximo ${type.maxSize}`}
                    size="small"
                    color={type.color}
                    variant="outlined"
                  />
                  <Chip 
                    label={`Dimensiones mínimas ${type.minDimensions}`}
                    size="small"
                    color={type.color}
                    variant="outlined"
                  />
                </Stack>
              </Paper>
            ))}
        </Box>
      )}
    </Box>
  );
}; 