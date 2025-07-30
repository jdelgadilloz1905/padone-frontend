import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

interface PhoneValidationResult {
  isValid: boolean;
  errorMessage?: string;
  formattedNumber?: string;
}

export const usePhoneValidation = () => {
  const validatePhone = (phoneNumber: string | undefined, isExisting = false, defaultCountry?: string): PhoneValidationResult => {
    if (!phoneNumber) {
      return { isValid: false, errorMessage: 'Número de teléfono requerido' };
    }

    try {
      // Para números existentes, ser más permisivo
      if (isExisting) {
        // Intentar normalizar primero
        const normalized = normalizeExistingPhone(phoneNumber);
        try {
          const isValid = isValidPhoneNumber(normalized, defaultCountry as any);
          if (isValid) {
            const parsed = parsePhoneNumber(normalized, defaultCountry as any);
            return {
              isValid: true,
              formattedNumber: parsed?.formatInternational()
            };
          }
        } catch {
          // Si la validación estricta falla pero el número parece válido, aceptarlo
          if (phoneNumber.length >= 10) {
            return { isValid: true };
          }
        }
      }

      // Validación estricta para números nuevos
      const isValid = isValidPhoneNumber(phoneNumber, defaultCountry as any);
      
      if (!isValid) {
        return { isValid: false, errorMessage: 'Número de teléfono inválido' };
      }

      const parsed = parsePhoneNumber(phoneNumber, defaultCountry as any);
      return {
        isValid: true,
        formattedNumber: parsed?.formatInternational()
      };
    } catch (error) {
      // Para números existentes, ser más tolerante
      if (isExisting && phoneNumber.length >= 10) {
        return { isValid: true };
      }
      return { isValid: false, errorMessage: 'Formato de número inválido' };
    }
  };

  const formatForDisplay = (phoneNumber: string | undefined, defaultCountry?: string): string => {
    if (!phoneNumber) return '';
    
    try {
      // Intentar normalizar primero
      const normalized = normalizeExistingPhone(phoneNumber);
      const parsed = parsePhoneNumber(normalized, defaultCountry as any);
      return parsed?.formatNational() || phoneNumber;
    } catch {
      return phoneNumber;
    }
  };

  const formatForAPI = (phoneNumber: string | undefined, defaultCountry?: string): string => {
    if (!phoneNumber) return '';
    
    try {
      // Intentar normalizar primero
      const normalized = normalizeExistingPhone(phoneNumber);
      const parsed = parsePhoneNumber(normalized, defaultCountry as any);
      return parsed?.format('E.164') || phoneNumber; // Formato internacional
    } catch {
      return phoneNumber;
    }
  };

  // Función general para normalizar números existentes
  const normalizeExistingPhone = (phone: string): string => {
    if (!phone) return '';
    
    // Remover caracteres no numéricos excepto +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Si ya tiene formato internacional (+), mantenerlo
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // Si el número original tenía +, mantener el formato
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Para números sin código de país, retornar tal como está
    // La validación posterior determinará si es válido
    return cleaned || phone;
  };

  return { 
    validatePhone, 
    formatForDisplay, 
    formatForAPI, 
    normalizeExistingPhone 
  };
}; 