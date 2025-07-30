import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traducciones desde archivos JSON
import esTranslations from './es.json';
import enTranslations from './en.json';

// Recursos de traducción
const resources = {
  es: {
    translation: esTranslations
  },
  en: {
    translation: enTranslations
  }
};

i18n
  // Detectar idioma del navegador
  .use(LanguageDetector)
  // Pasar instancia de i18next a react-i18next
  .use(initReactI18next)
  // Inicializar i18next
  .init({
    resources,
    fallbackLng: 'es',
    debug: false,
    
    interpolation: {
      escapeValue: false, // No es necesario para React
    },

    // Opciones comunes del detector de idioma
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    // Opciones para el manejo de errores
    saveMissing: false,
    
    // Configuración de respaldo para claves faltantes
    returnEmptyString: false,
    returnNull: false,
    
    // Configuración del parser de claves
    keySeparator: '.',
    nsSeparator: ':',
    
    // Configuración de react-i18next
    react: {
      useSuspense: false,
    }
  })
  .catch((error) => {
    console.error('Error inicializando i18n:', error);
  });

export default i18n; 