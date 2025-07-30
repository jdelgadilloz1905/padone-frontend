// ============================================================================
// RESPONSIVE HELPERS - Taxi Rosa Frontend
// Utilities y helpers para facilitar el responsive design
// ============================================================================

import { MEDIA_QUERIES } from './breakpoints';

/**
 * Material-UI sx helpers para mostrar/ocultar elementos
 * Uso: sx={{ ...responsive.mobileOnly }}
 */
export const responsive = {
  // Visibility helpers
  mobileOnly: { xs: 'block', md: 'none' },
  tabletOnly: { xs: 'none', md: 'block', lg: 'none' }, 
  desktopOnly: { xs: 'none', lg: 'block' },
  
  // Responsive display
  mobileUp: { xs: 'block' },
  tabletUp: { xs: 'none', md: 'block' },
  desktopUp: { xs: 'none', lg: 'block' },
  
  // Flex direction responsive
  mobileStack: { xs: 'column', md: 'row' },
  alwaysStack: { xs: 'column' },
  alwaysRow: { xs: 'row' },
  
  // Text alignment responsive
  centerOnMobile: { xs: 'center', md: 'left' },
  centerOnAll: { xs: 'center' },
  
  // Width helpers
  fullOnMobile: { xs: '100%', md: 'auto' },
  autoOnDesktop: { xs: '100%', lg: 'auto' }
} as const;

/**
 * Hooks-compatible media query matchers
 * Para usar con useMediaQuery de Material-UI
 */
export const mediaQueries = {
  isMobile: MEDIA_QUERIES.mobile,
  isTablet: MEDIA_QUERIES.tablet,
  isDesktop: MEDIA_QUERIES.desktop,
  isMobilePortrait: MEDIA_QUERIES.mobilePortrait,
  isMobileLandscape: MEDIA_QUERIES.mobileLandscape,
  isSmall: MEDIA_QUERIES.small,
  isMedium: MEDIA_QUERIES.medium,
  isLarge: MEDIA_QUERIES.large,
} as const;

/**
 * Typography responsive scales
 * Escalas de tipografía que se adaptan al dispositivo
 */
export const responsiveTypography = {
  // Headings
  h1: {
    fontSize: '1.75rem',
    '@media (min-width: 768px)': { fontSize: '2.25rem' },
    '@media (min-width: 1024px)': { fontSize: '3rem' }
  },
  h2: {
    fontSize: '1.5rem',
    '@media (min-width: 768px)': { fontSize: '2rem' },
    '@media (min-width: 1024px)': { fontSize: '2.5rem' }
  },
  h3: {
    fontSize: '1.25rem',
    '@media (min-width: 768px)': { fontSize: '1.5rem' },
    '@media (min-width: 1024px)': { fontSize: '2rem' }
  },
  h4: {
    fontSize: '1.125rem',
    '@media (min-width: 768px)': { fontSize: '1.25rem' },
    '@media (min-width: 1024px)': { fontSize: '1.5rem' }
  },
  
  // Body text
  body: {
    fontSize: '0.875rem',
    '@media (min-width: 768px)': { fontSize: '1rem' },
    '@media (min-width: 1024px)': { fontSize: '1.125rem' }
  },
  caption: {
    fontSize: '0.75rem',
    '@media (min-width: 768px)': { fontSize: '0.875rem' }
  }
} as const;

/**
 * Spacing responsive helpers
 * Padding y margin que se escalan con el dispositivo
 */
export const responsiveSpacing = {
  // Padding
  containerPadding: {
    xs: 2,  // 16px en mobile
    md: 3,  // 24px en tablet
    lg: 4   // 32px en desktop
  },
  sectionPadding: {
    xs: 1.5, // 12px en mobile
    md: 2,   // 16px en tablet  
    lg: 3    // 24px en desktop
  },
  
  // Gaps
  gridGap: {
    xs: 1.5, // 12px en mobile
    md: 2,   // 16px en tablet
    lg: 2.5  // 20px en desktop
  },
  stackGap: {
    xs: 1,   // 8px en mobile
    md: 1.5, // 12px en tablet
    lg: 2    // 16px en desktop
  }
} as const;

/**
 * Touch-friendly dimensions
 * Tamaños mínimos para elementos interactivos en móvil
 */
export const touchTargets = {
  minHeight: '44px',
  minWidth: '44px',
  button: {
    minHeight: '44px',
    '@media (min-width: 768px)': {
      minHeight: '36px' // Más pequeño en desktop donde hay más precisión
    }
  },
  input: {
    minHeight: '48px',
    '@media (min-width: 768px)': {
      minHeight: '40px'
    }
  }
} as const;

/**
 * Grid system responsive
 * Templates de grid que se adaptan automáticamente
 */
export const responsiveGrids = {
  // Auto-fit grids
  autoCards: {
    display: 'grid',
    gap: 2,
    gridTemplateColumns: 'repeat(1, 1fr)',
    '@media (min-width: 480px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (min-width: 1024px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    },
    '@media (min-width: 1200px)': {
      gridTemplateColumns: 'repeat(4, 1fr)'
    }
  },
  
  // Dashboard style grid
  dashboardGrid: {
    display: 'grid',
    gap: { xs: 1.5, md: 2, lg: 3 },
    gridTemplateColumns: {
      xs: 'repeat(1, 1fr)',
      sm: 'repeat(2, 1fr)', 
      lg: 'repeat(4, 1fr)'
    }
  },
  
  // Two column responsive
  twoColumn: {
    display: 'grid',
    gap: { xs: 2, md: 3 },
    gridTemplateColumns: {
      xs: '1fr',
      md: '1fr 1fr'
    }
  },
  
  // Sidebar layout
  sidebarLayout: {
    display: 'grid',
    gap: { xs: 2, md: 3 },
    gridTemplateColumns: {
      xs: '1fr',
      lg: '300px 1fr'
    }
  }
} as const;

/**
 * Utility function para crear media queries custom
 */
export const createMediaQuery = (minWidth?: number, maxWidth?: number): string => {
  if (minWidth && maxWidth) {
    return `(min-width: ${minWidth}px) and (max-width: ${maxWidth}px)`;
  } else if (minWidth) {
    return `(min-width: ${minWidth}px)`;
  } else if (maxWidth) {
    return `(max-width: ${maxWidth}px)`;
  }
  return '';
};

/**
 * Función helper para generar sx responsive objects
 */
export const responsiveSx = {
  // Hide on mobile, show on desktop
  hideOnMobile: { display: { xs: 'none', md: 'block' } },
  // Show on mobile, hide on desktop  
  showOnMobile: { display: { xs: 'block', md: 'none' } },
  // Full width on mobile, auto on desktop
  responsiveWidth: { width: { xs: '100%', md: 'auto' } },
  // Stack on mobile, row on desktop
  responsiveFlex: { flexDirection: { xs: 'column', md: 'row' } },
} as const; 