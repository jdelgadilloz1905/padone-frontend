import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export const useTokenValidation = () => {
  const navigate = useNavigate();
  
  const validateToken = useCallback(async () => {
    try {
      const isValid = await authService.validateToken();
      if (!isValid) {
        console.warn('❌ Token inválido o expirado, redirigiendo al login');
        
        // Determinar qué login usar según el rol anterior
        const userRole = authService.getUserRole();
        const loginPath = userRole === 'conductor' ? '/login-conductor' : '/login';
        
        authService.logout();
        navigate(loginPath, { replace: true });
        return false;
      }
      return true;
    } catch (error: any) {
      console.error('❌ Error validando token:', {
        message: error.message,
        status: error.response?.status
      });
      
      // Determinar qué login usar según el rol anterior
      const userRole = authService.getUserRole();
      const loginPath = userRole === 'conductor' ? '/login-conductor' : '/login';
      
      authService.logout();
      navigate(loginPath, { replace: true });
      return false;
    }
  }, [navigate]);
  
  useEffect(() => {
    // Solo validar si hay un token
    const token = authService.getToken();
    if (!token) {
      console.log('🔍 No hay token para validar');
      return;
    }
    
    // Validar inmediatamente al montar el componente
    validateToken();
    
    // Validar cada 5 minutos para detectar tokens expirados
    const interval = setInterval(validateToken, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [validateToken]);
  
  return { validateToken };
}; 