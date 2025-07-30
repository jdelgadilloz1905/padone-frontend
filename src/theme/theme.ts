import { createTheme, type Theme } from '@mui/material/styles';
import { esES } from '@mui/material/locale';

// Colores base del sistema Taxi Rosa
const colors = {
  primary: {
    main: '#e5308a',
    light: '#f368a7',
    dark: '#c5206a',
    contrastText: '#ffffff'
  },
  secondary: {
    main: '#2196f3',
    light: '#4fc3f7',
    dark: '#1976d2',
    contrastText: '#ffffff'
  },
  error: {
    main: '#f44336',
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#ffffff'
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
    contrastText: '#000000'
  },
  info: {
    main: '#2196f3',
    light: '#64b5f6',
    dark: '#1976d2',
    contrastText: '#ffffff'
  },
  success: {
    main: '#4caf50',
    light: '#81c784',
    dark: '#388e3c',
    contrastText: '#ffffff'
  }
};

// Función para crear el tema base
const createBaseTheme = () => createTheme({
  // Paleta de colores optimizada para accesibilidad
  palette: {
    ...colors,
    background: {
      default: '#fafafa',
      paper: '#ffffff'
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)'
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121'
    }
  },

  // Breakpoints responsive estándar
  breakpoints: {
    values: {
      xs: 0,
      sm: 480,
      md: 768,
      lg: 1024,
      xl: 1200
    }
  },

  // Tipografía responsive y accesible
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    
    // Escalas de fuente responsive
    h1: {
      fontSize: 'clamp(2rem, 4vw, 3.5rem)',
      fontWeight: 300,
      lineHeight: 1.2,
      letterSpacing: '-0.01562em'
    },
    h2: {
      fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
      fontWeight: 300,
      lineHeight: 1.2,
      letterSpacing: '-0.00833em'
    },
    h3: {
      fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
      fontWeight: 400,
      lineHeight: 1.167,
      letterSpacing: '0em'
    },
    h4: {
      fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
      fontWeight: 400,
      lineHeight: 1.235,
      letterSpacing: '0.00735em'
    },
    h5: {
      fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
      fontWeight: 400,
      lineHeight: 1.334,
      letterSpacing: '0em'
    },
    h6: {
      fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
      fontWeight: 500,
      lineHeight: 1.6,
      letterSpacing: '0.0075em'
    },
    body1: {
      fontSize: 'clamp(0.875rem, 1.2vw, 1rem)',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.00938em'
    },
    body2: {
      fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: '0.01071em'
    },
    button: {
      fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'uppercase' as const
    },
    caption: {
      fontSize: 'clamp(0.625rem, 0.8vw, 0.75rem)',
      fontWeight: 400,
      lineHeight: 1.66,
      letterSpacing: '0.03333em'
    }
  },

  // Espaciado responsive
  spacing: (factor: number) => `${0.25 * factor}rem`,

  // Bordes redondeados adaptativos
  shape: {
    borderRadius: 8
  },

  // Elevaciones optimizadas
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
    '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
    '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
    '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
    '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
    '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
    '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
    '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
    '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
    '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
    '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
    '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
    '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
    '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
    '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)'
  ],

  // Transiciones adaptatívas (se sobrescribirán con accessibility preferences)
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195
    }
  }
}, esES);

// Función para crear tema con preferencias de accesibilidad
export const createAccessibleTheme = (): Theme => {
  const baseTheme = createBaseTheme();

  // Combinar tema base con componentes personalizados
  return createTheme({
    ...baseTheme,
    
    // Componentes personalizados con mejoras responsive y accesibles
    components: {
      ...baseTheme.components,
      
      // Botones optimizados
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: 44, // Touch-friendly por defecto
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            
            // Estados de focus mejorados para accesibilidad
            '&:focus': {
              outline: '2px solid #e5308a',
              outlineOffset: '2px'
            },
            
            '&:focus:not(:focus-visible)': {
              outline: 'none'
            },
            
            // Responsive adjustments
            [baseTheme.breakpoints.down('sm')]: {
              minHeight: 48,
              fontSize: '1rem',
              padding: '12px 24px'
            }
          },
          contained: {
            boxShadow: '0 2px 8px rgba(229, 48, 138, 0.3)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(229, 48, 138, 0.4)'
            }
          }
        }
      },

      // IconButtons mejorados
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: 44,
            minHeight: 44,
            borderRadius: 8,
            
            '&:focus': {
              outline: '2px solid #e5308a',
              outlineOffset: '2px'
            },
            
            '&:focus:not(:focus-visible)': {
              outline: 'none'
            },
            
            [baseTheme.breakpoints.down('sm')]: {
              minWidth: 48,
              minHeight: 48
            }
          }
        }
      },

      // Cards responsive
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            
            [baseTheme.breakpoints.down('sm')]: {
              borderRadius: 16
            }
          }
        }
      },

      // Diálogos responsive
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            
            [baseTheme.breakpoints.down('sm')]: {
              margin: 16,
              width: 'calc(100% - 32px)',
              maxHeight: 'calc(100% - 32px)'
            }
          }
        }
      },

      // Inputs mejorados
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-root': {
              minHeight: 44,
              
              [baseTheme.breakpoints.down('sm')]: {
                minHeight: 48
              }
            },
            
            '& .MuiInputLabel-root': {
              '&.Mui-focused': {
                color: '#e5308a'
              }
            },
            
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e5308a',
                borderWidth: 2
              }
            }
          }
        }
      },

      // FAB responsive
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: '0 4px 16px rgba(229, 48, 138, 0.3)',
            
            '&:hover': {
              boxShadow: '0 6px 20px rgba(229, 48, 138, 0.4)'
            },
            
            [baseTheme.breakpoints.down('sm')]: {
              width: 64,
              height: 64
            }
          }
        }
      },

      // Chips responsive
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            
            [baseTheme.breakpoints.down('sm')]: {
              height: 36,
              fontSize: '0.875rem'
            }
          }
        }
      },

      // Tablas responsive
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            
            [baseTheme.breakpoints.down('md')]: {
              borderRadius: 8
            }
          }
        }
      },

      // AppBar responsive
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            
            [baseTheme.breakpoints.down('sm')]: {
              '& .MuiToolbar-root': {
                minHeight: 64,
                paddingLeft: 16,
                paddingRight: 16
              }
            }
          }
        }
      }
    }
  });
};

// Exportar tema por defecto
export const theme = createAccessibleTheme(); 