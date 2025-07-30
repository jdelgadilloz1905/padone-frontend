// =====================================================================
// SISTEMA DE ACCESIBILIDAD - TAXI ROSA
// Herramientas para mejorar la experiencia de usuarios con discapacidades
// =====================================================================

// Detección de preferencias del sistema
export const getSystemPreferences = () => {
  if (typeof window === 'undefined') return {};

  return {
    // Preferencia de movimiento reducido
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    
    // Preferencia de contraste alto
    prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
    
    // Preferencia de modo oscuro
    prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    
    // Escala de fuente del sistema
    fontScale: window.devicePixelRatio || 1,
    
    // Detectar si es un dispositivo táctil
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  };
};

// Generador de IDs únicos para asociaciones ARIA
let idCounter = 0;
export const generateId = (prefix = 'taxi-rosa') => {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
};

// Utilidades ARIA para screen readers
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;

  document.body.appendChild(announcement);
  announcement.textContent = message;

  // Limpiar el anuncio después de 1 segundo
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

// Hook para manejar navegación por teclado
export const handleKeyboardNavigation = (event: React.KeyboardEvent, actions: {
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
}) => {
  const { key } = event;

  switch (key) {
    case 'Enter':
      actions.onEnter?.();
      break;
    case ' ':
      event.preventDefault(); // Prevenir scroll
      actions.onSpace?.();
      break;
    case 'Escape':
      actions.onEscape?.();
      break;
    case 'ArrowUp':
      event.preventDefault();
      actions.onArrowUp?.();
      break;
    case 'ArrowDown':
      event.preventDefault();
      actions.onArrowDown?.();
      break;
    case 'ArrowLeft':
      actions.onArrowLeft?.();
      break;
    case 'ArrowRight':
      actions.onArrowRight?.();
      break;
    case 'Tab':
      actions.onTab?.();
      break;
  }
};

// Utilidades para focus management
export const focusManagement = {
  // Elementos focuseables
  getFocusableElements: (container: HTMLElement) => {
    const selector = `
      button:not([disabled]),
      [href],
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"]),
      [contenteditable]:not([contenteditable="false"])
    `;
    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  },

  // Trap focus dentro de un elemento
  trapFocus: (container: HTMLElement) => {
    const focusableElements = focusManagement.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab (navegación hacia atrás)
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab (navegación hacia adelante)
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    // Función de limpieza
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  // Restaurar focus previo
  restoreFocus: (previousElement: HTMLElement | null) => {
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
    }
  }
};

// Generadores de atributos ARIA comunes
export const ariaProps = {
  // Para botones que abren diálogos
  button: (controls?: string, expanded?: boolean, hasPopup?: boolean | string) => ({
    'aria-controls': controls,
    'aria-expanded': expanded,
    'aria-haspopup': hasPopup,
  }),

  // Para inputs con labels y descriptions
  input: (labelId?: string, descriptionId?: string, required?: boolean, invalid?: boolean) => ({
    'aria-labelledby': labelId,
    'aria-describedby': descriptionId,
    'aria-required': required,
    'aria-invalid': invalid,
  }),

  // Para diálogos y modales
  dialog: (labelId?: string, descriptionId?: string) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': labelId,
    'aria-describedby': descriptionId,
  }),

  // Para listas y elementos de lista
  list: (size?: number, activeItem?: number) => ({
    role: 'list',
    'aria-setsize': size,
    'aria-posinset': activeItem,
  }),

  // Para elementos de estado/progreso
  status: (value?: number, max?: number, label?: string) => ({
    role: 'status',
    'aria-valuenow': value,
    'aria-valuemax': max,
    'aria-label': label,
  }),
};

// Validación de contraste de color
export const colorContrast = {
  // Calcular el ratio de contraste entre dos colores
  getContrastRatio: (color1: string, color2: string): number => {
    const getLuminance = (color: string): number => {
      // Convertir hex a RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      // Calcular luminancia relativa
      const getLuminanceComponent = (c: number) => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

      const L = 0.2126 * getLuminanceComponent(r) + 
                0.7152 * getLuminanceComponent(g) + 
                0.0722 * getLuminanceComponent(b);

      return L;
    };

    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  },

  // Verificar si el contraste cumple con WCAG
  meetsWCAG: (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal') => {
    const ratio = colorContrast.getContrastRatio(color1, color2);
    
    if (level === 'AAA') {
      return size === 'large' ? ratio >= 4.5 : ratio >= 7;
    } else {
      return size === 'large' ? ratio >= 3 : ratio >= 4.5;
    }
  }
};

// Detector de motion preferences
export const motionPreferences = {
  shouldReduceMotion: () => getSystemPreferences().prefersReducedMotion,
  
  // Configuraciones de animación adaptativas
  getAnimationConfig: (defaultDuration: number = 300) => {
    const shouldReduce = motionPreferences.shouldReduceMotion();
    
    return {
      duration: shouldReduce ? 0 : defaultDuration,
      easing: shouldReduce ? 'linear' : 'ease-in-out',
      scale: shouldReduce ? false : true,
      fade: shouldReduce ? false : true,
    };
  }
};

// Utilidades para texto y contenido
export const textUtilities = {
  // Generar texto descriptivo para screen readers
  getAriaLabel: (mainText: string, context?: string, state?: string): string => {
    let label = mainText;
    if (context) label += `, ${context}`;
    if (state) label += `, ${state}`;
    return label;
  },

  // Truncar texto preservando contexto para screen readers
  smartTruncate: (text: string, maxLength: number, fullTextForScreenReader: boolean = true): {
    display: string;
    ariaLabel?: string;
  } => {
    if (text.length <= maxLength) {
      return { display: text };
    }

    const truncated = text.substring(0, maxLength - 3) + '...';
    
    return {
      display: truncated,
      ariaLabel: fullTextForScreenReader ? text : undefined
    };
  }
};

// Hook React para preferencias de accesibilidad
export const useAccessibilityPreferences = () => {
  const preferences = getSystemPreferences();
  
  return {
    ...preferences,
    
    // Configuraciones de Material-UI adaptativas
    getMuiThemeOverrides: () => ({
      transitions: {
        duration: {
          shortest: preferences.prefersReducedMotion ? 0 : 150,
          shorter: preferences.prefersReducedMotion ? 0 : 200,
          short: preferences.prefersReducedMotion ? 0 : 250,
          standard: preferences.prefersReducedMotion ? 0 : 300,
          complex: preferences.prefersReducedMotion ? 0 : 375,
          enteringScreen: preferences.prefersReducedMotion ? 0 : 225,
          leavingScreen: preferences.prefersReducedMotion ? 0 : 195,
        }
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              minHeight: preferences.isTouchDevice ? 44 : 36, // Touch targets
              transition: preferences.prefersReducedMotion ? 'none' : undefined,
            }
          }
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              minWidth: preferences.isTouchDevice ? 44 : 40,
              minHeight: preferences.isTouchDevice ? 44 : 40,
            }
          }
        }
      }
    })
  };
}; 