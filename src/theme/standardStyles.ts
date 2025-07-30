import { styled, Box } from '@mui/material';
import type { TypographyProps, TextFieldProps, ButtonProps } from '@mui/material';

// ✅ PALETA DE COLORES UNIFICADA
export const brandColors = {
  primary: '#e5308a',
  primaryHover: '#c5206a', 
  primaryLight: 'rgba(229, 48, 138, 0.1)',
  secondary: '#e91e63',
  secondaryHover: '#c2185b',
  // Colores de apoyo
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  google: '#4285f4',
  // Grises
  textPrimary: '#333',
  textSecondary: '#666',
  border: '#E8E5E5',
  background: '#f5f5f5'
} as const;

// ✅ ESTILO UNIFICADO PARA TÍTULOS PRINCIPALES
export const titleStyle: Partial<TypographyProps> = {
  variant: 'h4',
  component: 'h1',
  sx: { 
    fontFamily: 'Poppins',
    fontWeight: 600,
    color: brandColors.textPrimary,
    textAlign: 'left',
    mb: 3,
    fontSize: { xs: '1.5rem', md: '2rem' } // Responsive
  }
};

// ✅ CONTENEDOR PRINCIPAL DE PÁGINA
export const PageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2)
  }
}));

// ✅ CONTENEDOR DE FILTROS (SIN Paper)
export const FilterContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: 16,
  marginBottom: 24,
  flexWrap: 'wrap',
  alignItems: 'center',
  width: '100%',
  justifyContent: 'space-between',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 20,
    gap: 12
  }
}));

// ✅ SEARCH BAR ESTÁNDAR
export const searchBarStyle: Partial<TextFieldProps> = {
  variant: "outlined",
  size: "small",
  sx: {
    flex: 1,
    minWidth: { xs: 'auto', md: 250 },
    '& .MuiOutlinedInput-root': {
      minHeight: '44px', // Touch-friendly
      borderRadius: 1,
      '& fieldset': {
        borderColor: brandColors.border,
      },
      '&:hover fieldset': {
        borderColor: brandColors.primary,
      },
      '&.Mui-focused fieldset': {
        borderColor: brandColors.primary,
      },
    }
  }
};

// ✅ BOTÓN PRIMARIO ESTÁNDAR
export const primaryButtonStyle: Partial<ButtonProps> = {
  variant: "contained",
  sx: {
    bgcolor: brandColors.primary,
    color: 'white',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: 1,
    minHeight: '44px', // Touch-friendly
    '&:hover': {
      bgcolor: brandColors.primaryHover,
    },
    '&:disabled': {
      bgcolor: '#ccc'
    }
  }
};

// ✅ BOTÓN SECUNDARIO ESTÁNDAR
export const secondaryButtonStyle: Partial<ButtonProps> = {
  variant: "outlined",
  sx: {
    borderColor: brandColors.primary,
    color: brandColors.primary,
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: 1,
    minHeight: '44px',
    '&:hover': {
      borderColor: brandColors.primaryHover,
      backgroundColor: brandColors.primaryLight
    }
  }
};

// ✅ SELECT/FILTER ESTÁNDAR
export const filterSelectStyle = {
  size: "small" as const,
  sx: {
    minWidth: { xs: '100%', md: 140 },
    '& .MuiOutlinedInput-root': {
      minHeight: '44px',
      borderRadius: 1,
      '& fieldset': {
        borderColor: brandColors.border,
      },
      '&:hover fieldset': {
        borderColor: brandColors.primary,
      },
      '&.Mui-focused fieldset': {
        borderColor: brandColors.primary,
      },
    },
    '& .MuiSelect-select': {
      fontFamily: 'Poppins',
      fontWeight: 500,
      color: brandColors.textPrimary,
    }
  }
};

// ✅ ESTILO PARA HEADER DE PÁGINA
export const pageHeaderStyle = {
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  justifyContent: 'space-between',
  alignItems: { xs: 'flex-start', sm: 'center' },
  mb: 3,
  gap: { xs: 2, sm: 0 }
};

// ✅ ESTILO PARA CONTENEDOR DE ACCIONES
export const actionsContainerStyle = {
  width: { xs: '100%', sm: 'auto' }
};