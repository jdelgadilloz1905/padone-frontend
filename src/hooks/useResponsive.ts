// ============================================================================
// useResponsive Hook - Taxi Rosa Frontend
// Hook personalizado para detección de dispositivos y responsive design
// ============================================================================

import { useMediaQuery, useTheme } from '@mui/material';
import { mediaQueries } from '../theme/responsive';

/**
 * Hook personalizado para manejo responsive
 * Proporciona información sobre el tipo de dispositivo actual
 * y utilities para conditional rendering
 */
export const useResponsive = () => {
  const theme = useTheme();
  
  // Detectores de dispositivo usando Material-UI useMediaQuery
  const isMobile = useMediaQuery(mediaQueries.isMobile);
  const isTablet = useMediaQuery(mediaQueries.isTablet);
  const isDesktop = useMediaQuery(mediaQueries.isDesktop);
  
  // Detectores específicos de orientación
  const isMobilePortrait = useMediaQuery(mediaQueries.isMobilePortrait);
  const isMobileLandscape = useMediaQuery(mediaQueries.isMobileLandscape);
  
  // Detectores de tamaño
  const isSmall = useMediaQuery(mediaQueries.isSmall);   // mobile + tablet portrait
  const isMedium = useMediaQuery(mediaQueries.isMedium); // tablet + small desktop  
  const isLarge = useMediaQuery(mediaQueries.isLarge);   // desktop+
  
  // Detectores usando breakpoints de Material-UI theme
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isLg = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
  const isXl = useMediaQuery(theme.breakpoints.up('xl'));
  
  /**
   * Determina el tipo de dispositivo principal
   */
  const deviceType = (() => {
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  })();
  
  /**
   * Determina el breakpoint actual específico
   */
  const currentBreakpoint = (() => {
    if (isXs) return 'xs';
    if (isSm) return 'sm'; 
    if (isMd) return 'md';
    if (isLg) return 'lg';
    return 'xl';
  })();
  
  /**
   * Utilities para mostrar/ocultar elementos según dispositivo
   */
  const showOn = {
    mobileOnly: isMobile,
    tabletOnly: isTablet,
    desktopOnly: isDesktop,
    mobileAndTablet: isMobile || isTablet,
    tabletAndDesktop: isTablet || isDesktop,
  };
  
  /**
   * Utilities para obtener valores responsive
   */
  const getValue = <T>(values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    default: T;
  }): T => {
    if (isMobile && values.mobile !== undefined) return values.mobile;
    if (isTablet && values.tablet !== undefined) return values.tablet;
    if (isDesktop && values.desktop !== undefined) return values.desktop;
    return values.default;
  };
  
  /**
   * Utilities para spacing responsive
   */
  const getSpacing = (values: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    default: number;
  }): number => {
    return getValue(values);
  };
  
  /**
   * Utilities para grid columns responsive
   */
  const getGridColumns = (values: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    default: number;
  }): number => {
    return getValue(values);
  };
  
  /**
   * Determina si necesita touch-friendly interface
   */
  const needsTouchInterface = isMobile || isTablet;
  
  /**
   * Determina el tamaño óptimo para botones
   */
  const getButtonSize = () => {
    return needsTouchInterface ? 'large' : 'medium';
  };
  
  /**
   * Determina el variant óptimo para typography
   */
  const getTypographyVariant = (desktopVariant: string, mobileVariant?: string) => {
    if (isMobile && mobileVariant) return mobileVariant;
    return desktopVariant;
  };
  
  return {
    // Device detection
    isMobile,
    isTablet, 
    isDesktop,
    isMobilePortrait,
    isMobileLandscape,
    
    // Size detection
    isSmall,
    isMedium,
    isLarge,
    
    // Breakpoint detection
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    
    // Current state
    deviceType,
    currentBreakpoint,
    needsTouchInterface,
    
    // Utilities
    showOn,
    getValue,
    getSpacing,
    getGridColumns,
    getButtonSize,
    getTypographyVariant,
    
    // Theme access
    theme,
  };
};

/**
 * Hook simplificado para casos básicos
 * Solo retorna los detectores principales
 */
export const useDevice = () => {
  const { isMobile, isTablet, isDesktop, deviceType, needsTouchInterface } = useResponsive();
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    needsTouchInterface,
  };
};

/**
 * Hook para obtener valores responsive de forma simple
 * Ejemplo: const columns = useResponsiveValue({ mobile: 1, tablet: 2, desktop: 4 })
 */
export const useResponsiveValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}) => {
  const { getValue, isXs, isSm, isMd, isLg, isXl } = useResponsive();
  
  // Prioridad: breakpoint específico > device type > default
  if (isXs && values.xs !== undefined) return values.xs;
  if (isSm && values.sm !== undefined) return values.sm;
  if (isMd && values.md !== undefined) return values.md;
  if (isLg && values.lg !== undefined) return values.lg;
  if (isXl && values.xl !== undefined) return values.xl;
  
  // Fallback a device types
  return getValue({
    mobile: values.mobile,
    tablet: values.tablet,
    desktop: values.desktop,
    default: values.default,
  });
}; 