// Utility para mensajes de error internacionalizados en servicios
// No puede usar useTranslation() directamente, así que usa i18n instance

import i18n from '../i18n';

/**
 * Obtener mensaje de error internacionalizado
 * Funciona tanto en componentes como en servicios
 */
export const getErrorMessage = (key: string, options?: any): string => {
  try {
    const translation = i18n.t(key, options);
    return typeof translation === 'string' ? translation : String(translation);
  } catch (error) {
    console.warn(`Translation key not found: ${key}`);
    // Fallback en inglés para desarrollo
    const fallbacks: Record<string, string> = {
      'errors.requestFailed': 'Request failed. Please try again.',
      'errors.updateFailed': 'Update failed. Please try again.',
      'errors.deleteFailed': 'Delete failed. Please try again.',
      'errors.fetchFailed': 'Failed to fetch data. Please try again.',
      'errors.processingFailed': 'Processing failed. Please try again.',
      'errors.exportFailed': 'Export failed. Please try again.',
      'errors.zoneNotFound': 'Zone not found',
      'errors.passwordUpdateFailed': 'Password update failed. Please try again.',
      'errors.trackingFailed': 'Failed to get tracking information',
      'users.unknown': 'Unknown User'
    };
    
    return fallbacks[key] || 'An error occurred. Please try again.';
  }
};

/**
 * Crear error con mensaje internacionalizado
 */
export const createI18nError = (key: string, options?: any): Error => {
  return new Error(getErrorMessage(key, options));
};

/**
 * Logger de errores con contexto
 */
export const logError = (context: string, error: any, key?: string): void => {
  console.error(`[${context}] Error:`, error);
  if (key) {
    console.error(`[${context}] Error key: ${key}`);
  }
}; 