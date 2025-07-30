import { Navigate } from 'react-router-dom';
import authService from '../../services/authService';

interface RequireRoleProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallbackRedirect?: string;
}

export const RequireRole = ({ 
  allowedRoles, 
  children, 
  fallbackRedirect 
}: RequireRoleProps) => {
  const userRole = authService.getUserRole();
  const isAuthenticated = authService.isAuthenticated();
  
  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    console.warn('Usuario no autenticado, redirigiendo al login');
    return <Navigate to="/login" replace />;
  }
  
  // Si no tiene rol o el rol no está permitido
  if (!userRole || !allowedRoles.includes(userRole)) {
    console.warn(`Acceso denegado. Rol actual: ${userRole}, Roles permitidos: ${allowedRoles.join(', ')}`);
    
    // Usar fallback personalizado o la ruta predeterminada según el rol
    const redirectTo = fallbackRedirect || authService.getRedirectPath();
    return <Navigate to={redirectTo} replace />;
  }
  
  // Usuario autenticado con el rol correcto
  return <>{children}</>;
}; 