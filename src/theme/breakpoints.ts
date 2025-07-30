// ============================================================================
// BREAKPOINTS SYSTEM - Taxi Rosa Frontend
// Sistema unificado de breakpoints para responsive design
// ============================================================================

/**
 * Breakpoints estandarizados para toda la aplicación
 * Estos valores reemplazan las inconsistencias anteriores y proporcionan
 * un sistema unificado para responsive design
 */
export const BREAKPOINTS = {
  xs: 0,      // 0px+    - Mobile portrait
  sm: 480,    // 480px+  - Mobile landscape
  md: 768,    // 768px+  - Tablet portrait  
  lg: 1024,   // 1024px+ - Tablet landscape / Small desktop
  xl: 1200,   // 1200px+ - Desktop
  xxl: 1440   // 1440px+ - Large desktop
} as const;

/**
 * Material-UI breakpoints configuration
 * Compatible con el theme system de Material-UI
 */
export const muiBreakpoints = {
  values: {
    xs: BREAKPOINTS.xs,
    sm: BREAKPOINTS.sm, 
    md: BREAKPOINTS.md,
    lg: BREAKPOINTS.lg,
    xl: BREAKPOINTS.xl,
  }
};

/**
 * Tailwind-compatible breakpoints
 * Para usar en tailwind.config.js
 */
export const tailwindBreakpoints = {
  'xs': `${BREAKPOINTS.xs}px`,
  'sm': `${BREAKPOINTS.sm}px`,
  'md': `${BREAKPOINTS.md}px`,
  'lg': `${BREAKPOINTS.lg}px`,
  'xl': `${BREAKPOINTS.xl}px`,
  '2xl': `${BREAKPOINTS.xxl}px`
};

/**
 * Valores de breakpoints como strings para media queries
 */
export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.lg}px)`,
  
  // Orientaciones específicas
  mobilePortrait: `(max-width: ${BREAKPOINTS.sm - 1}px)`,
  mobileLandscape: `(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`,
  
  // Tamaños específicos
  small: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  medium: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`,
  large: `(min-width: ${BREAKPOINTS.xl}px)`,
} as const;

/**
 * Device type detection
 * Útil para hooks y componentes que necesitan detectar el tipo de dispositivo
 */
export const DEVICE_TYPES = {
  mobile: MEDIA_QUERIES.mobile,
  tablet: MEDIA_QUERIES.tablet,
  desktop: MEDIA_QUERIES.desktop,
} as const;

/**
 * Container max-widths responsive
 * Para containers que necesitan límites máximos en cada breakpoint
 */
export const CONTAINER_MAX_WIDTHS = {
  xs: '100%',
  sm: '480px',
  md: '768px', 
  lg: '1024px',
  xl: '1200px',
  xxl: '1400px'
} as const; 