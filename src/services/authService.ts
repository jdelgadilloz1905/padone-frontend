import API from './api';

// Interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface User {
  id: number;
  email: string;
  phone: string;
  profile_picture: string;
  status: string; 
  created_at: string;
  updated_at: string;
  last_login: string;
  last_login_ip: string;
  first_name: string;
  last_name: string;
  role: string;
  session_token: string;
  verified: boolean;
}

// Servicio de autenticación
class AuthService {
  /**
   * Iniciar sesión con credenciales
   * Esta función la usará React Query
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await API.post('/auth/login', credentials);
      
      // Acceder a los datos de la respuesta correctamente
      const authData = response.data;
      
      // Guardar token en localStorage
      if (authData.access_token) {
        this.saveAuthData(authData);
      }
      
      return authData;
    } catch (error) {
      console.error('Error de autenticación:', error);
      throw error;
    }
  }

  /**
   * Guardar información de autenticación
   */
  saveAuthData(authData: LoginResponse): void {
    localStorage.setItem('token', authData.access_token);
    localStorage.setItem('user', JSON.stringify(authData.user));
  }

  /**
   * Cerrar sesión del usuario actual
   */
  logout(): void {
    console.log('Cerrando sesión del usuario');
    
    // Limpiar todo el localStorage relacionado con auth
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    
    // Limpiar cualquier cache de React Query si existe
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      try {
        (window as any).queryClient.clear();
      } catch (error) {
        console.warn('Error limpiando cache de React Query:', error);
      }
    }
    
    // Opcional: notificar al backend sobre el cierre de sesión
    try {
      API.post('/auth/logout');
    } catch (error) {
      console.error('Error al notificar logout al backend:', error);
      // No es crítico, el frontend ya limpió la sesión
    }
  }

  /**
   * Obtener el token actual
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Obtener datos del usuario actual
   */
  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Obtener el rol del usuario actual
   */
  getUserRole(): string | null {
    // Primero intentamos obtener el rol desde localStorage
    const role = localStorage.getItem('userRole');
    if (role) {
      return role;
    }
    
    // Si no está en localStorage, intentamos obtenerlo del objeto user
    const user = this.getCurrentUser();
    if (user && user.role) {
      return user.role;
    }
    
    return null;
  }

  /**
   * Obtener la ruta de redirección según el rol del usuario
   */
  getRedirectPath(): string {
    const role = this.getUserRole();
    
    if (role === 'conductor') {
      return '/conductor';
    }
    
    // Por defecto, redirigir al dashboard admin
    return '/';
  }

  /**
   * Verificar si el token actual es válido
   */
  async validateToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) {
        console.warn('No hay token para validar');
        return false;
      }
      
      // Determinar el endpoint correcto según el rol del usuario
      const userRole = this.getUserRole();
      const endpoint = userRole === 'conductor' ? '/drivers/validate-token' : '/auth/validate-token';
      
      console.log(`🔍 Validando token para rol '${userRole}' usando endpoint ${endpoint}`);
      
      // Usar el endpoint apropiado según el rol
      await API.post(endpoint, { token });
      
      console.log('✅ Token válido');
      return true;
    } catch (error: any) {
      // Si hay error, el token no es válido
      console.warn('❌ Token inválido, limpiando sesión:', {
        status: error.response?.status,
        message: error.message
      });
      this.logout();
      return false;
    }
  }

  /**
   * Validar token y rol específico
   */
  async validateTokenAndRole(requiredRole?: string): Promise<boolean> {
    try {
      const isValid = await this.validateToken();
      if (!isValid) return false;
      
      if (requiredRole) {
        const userRole = this.getUserRole();
        const hasCorrectRole = userRole === requiredRole;
        if (!hasCorrectRole) {
          console.warn(`Rol incorrecto. Requerido: ${requiredRole}, Actual: ${userRole}`);
        }
        return hasCorrectRole;
      }
      
      return true;
    } catch (error) {
      console.error('Error validando token y rol:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Obtener perfil del usuario actual desde el servidor
   */
  async getProfile(): Promise<User> {
    try {
      const {data: response } = await API.get('/auth/profile');
      console.log('Respuesta del perfil del usuario:', response);
      return response;
    } catch (error) {
      console.error('Error obteniendo perfil del usuario:', error);
      throw error;
    }
  }

  /**
   * Simular login para desarrollo
   */
  simulateLogin(email: string, _password: string): LoginResponse {
    // Verificar si es un correo de conductor
    const isConductor = email.includes('conductor');
    
    const simulatedResponse = {
      access_token: 'jwt-token-simulado-1234567890',
      user: {
        id: 1,
        name: 'Rosio Guzman',
        email: email,
        role: isConductor ? 'conductor' : 'admin'
      }
    };
    
    // Guardar en localStorage
    this.saveAuthData(simulatedResponse);
    
    return simulatedResponse;
  }

  // =====================================================================
  // MÉTODOS DE RECUPERACIÓN DE CONTRASEÑA
  // =====================================================================

  /**
   * Solicitar recuperación de contraseña
   * Envía un email con link de recuperación al usuario
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      console.log('Solicitando recuperación de contraseña para:', email);
      
      // Llamada al endpoint de backend
      await API.post('/auth/forgot-password', { email });
      
      console.log('Solicitud de recuperación enviada exitosamente');
    } catch (error: any) {
      console.error('Error al solicitar recuperación de contraseña:', error);
      
      // Manejar diferentes tipos de error
      if (error.response?.status === 404) {
        throw new Error('El email proporcionado no está registrado en el sistema');
      } else if (error.response?.status === 429) {
        throw new Error('Demasiadas solicitudes. Intenta nuevamente en unos minutos');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to process request. Please try again.');
      }
    }
  }

  /**
   * Validar token de recuperación de contraseña
   * Verifica si el token es válido y no ha expirado
   */
  async validateResetToken(token: string): Promise<boolean> {
    try {
      console.log('Validando token de recuperación...');
      
      // Llamada al endpoint de validación
      await API.get(`/auth/validate-reset-token/${token}`);
      
      console.log('Token de recuperación válido');
      return true;
    } catch (error: any) {
      console.error('Error validando token de recuperación:', error);
      
      // Token inválido o expirado
      if (error.response?.status === 404 || error.response?.status === 410) {
        console.warn('Token de recuperación inválido o expirado');
        return false;
      }
      
      // Otros errores también consideramos como token inválido
      return false;
    }
  }

  /**
   * Restablecer contraseña con token de recuperación
   * Actualiza la contraseña del usuario usando el token de recuperación
   */
  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<void> {
    try {
      console.log('Restableciendo contraseña...');
      
      // Validar que las contraseñas coincidan
      if (newPassword !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      
      // Validar fortaleza de contraseña
      if (newPassword.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }
      
      // Llamada al endpoint de reset
      await API.post('/auth/reset-password', {
        token,
        password: newPassword,
        password_confirmation: confirmPassword
      });
      
      console.log('Contraseña restablecida exitosamente');
    } catch (error: any) {
      console.error('Error al restablecer contraseña:', error);
      
      // Manejar diferentes tipos de error
      if (error.response?.status === 404 || error.response?.status === 410) {
        throw new Error('El enlace de recuperación ha expirado o no es válido');
      } else if (error.response?.status === 422) {
        throw new Error('Los datos proporcionados no son válidos');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw error; // Re-throw validation errors
      } else {
        throw new Error('Failed to update password. Please try again.');
      }
    }
  }

  /**
   * Verificar fortaleza de contraseña
   * Valida que la contraseña cumpla con los criterios de seguridad
   */
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Debe tener al menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una letra mayúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una letra minúscula');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Debe contener al menos un número');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Debe contener al menos un carácter especial');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new AuthService(); 