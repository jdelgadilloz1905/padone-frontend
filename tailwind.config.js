/** @type {import('tailwindcss').Config} */
import { tailwindBreakpoints, CONTAINER_MAX_WIDTHS } from './src/theme/breakpoints.js';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // ============================================================================
    // RESPONSIVE BREAKPOINTS - Sistema unificado con Material-UI
    // ============================================================================
    screens: tailwindBreakpoints,
    
    extend: {
      // ============================================================================
      // RESPONSIVE CONTAINERS
      // ============================================================================
      maxWidth: {
        'mobile': CONTAINER_MAX_WIDTHS.xs,
        'tablet': CONTAINER_MAX_WIDTHS.md,
        'desktop': CONTAINER_MAX_WIDTHS.xl,
        'wide': CONTAINER_MAX_WIDTHS.xxl,
      },
      
      // ============================================================================
      // CUSTOM SPACING SCALE
      // ============================================================================
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px  
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
      },
      
      // ============================================================================
      // TYPOGRAPHY RESPONSIVE
      // ============================================================================
      fontSize: {
        // Mobile-first responsive text sizes
        'xs-responsive': ['0.75rem', { lineHeight: '1rem' }],
        'sm-responsive': ['0.875rem', { lineHeight: '1.25rem' }],
        'base-responsive': ['1rem', { lineHeight: '1.5rem' }],
        'lg-responsive': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl-responsive': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl-responsive': ['1.5rem', { lineHeight: '2rem' }],
        '3xl-responsive': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl-responsive': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      
      // ============================================================================
      // TAXI ROSA BRAND COLORS
      // ============================================================================
      colors: {
        'taxi-pink': {
          50: '#fdf2f8',
          100: '#fce7f3', 
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#e5308a',  // Main brand color
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        'taxi-purple': {
          400: '#a855f7',
          500: '#7c4dff',  // Secondary color
          600: '#9333ea',
        },
        'taxi-gray': {
          50: '#fafafa',   // Background default
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#423C3D',  // Text secondary
          800: '#27272a',
          900: '#201B1B',  // Text primary
        }
      },
      
      // ============================================================================
      // TOUCH-FRIENDLY SIZING
      // ============================================================================
      minHeight: {
        'touch': '44px',        // Minimum touch target
        'touch-large': '48px',  // Large touch target for inputs
      },
      minWidth: {
        'touch': '44px',
        'touch-large': '48px',
      },
      
      // ============================================================================
      // SHADOWS FOR ELEVATION
      // ============================================================================
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'modal': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      
      // ============================================================================
      // ANIMATION TIMING
      // ============================================================================
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      // ============================================================================
      // GRID TEMPLATES
      // ============================================================================
      gridTemplateColumns: {
        // Dashboard responsive grids
        'dashboard-mobile': '1fr',
        'dashboard-tablet': 'repeat(2, 1fr)',
        'dashboard-desktop': 'repeat(4, 1fr)',
        
        // Auto-fit responsive grids
        'auto-fill-200': 'repeat(auto-fill, minmax(200px, 1fr))',
        'auto-fill-250': 'repeat(auto-fill, minmax(250px, 1fr))',
        'auto-fill-300': 'repeat(auto-fill, minmax(300px, 1fr))',
        'auto-fit-200': 'repeat(auto-fit, minmax(200px, 1fr))',
        'auto-fit-250': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fit-300': 'repeat(auto-fit, minmax(300px, 1fr))',
      },
    },
  },
  plugins: [],
} 