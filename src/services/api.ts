import axios, { AxiosError } from 'axios';
import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const METHOD = {
  GET: 'get',
  DELETE: 'delete',
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch'
};

// Crear instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir token de autenticación a cada solicitud
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Respuesta API correcta:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    // Si el código es 201 Created, debería tratarse como éxito
    if (error.response?.status === 201) {
      console.log('Respuesta 201 tratada como éxito:', error.response.data);
      return error.response;
    }
    
    // NUEVO: Manejo de token expirado/no autorizado
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      
      // NO manejar automáticamente los errores 401 en endpoints de login
      // Permitir que los componentes de login manejen estos errores
      if (requestUrl.includes('/auth/login') || 
          requestUrl.includes('/drivers/request-code') || 
          requestUrl.includes('/drivers/validate-token') ||
          requestUrl.includes('/auth/validate-token')) {
        console.log('Error 401 en endpoint de autenticación, dejando que el componente lo maneje');
        // No hacer nada automático, dejar que el mutation/componente maneje el error
      } else {
        console.warn('Token expirado o no autorizado (401) en endpoint protegido, limpiando sesión');
        
        // Solo para endpoints protegidos (no login), limpiar sesión y redirigir
        authService.logout();
        
        // Redirigir al login apropiado
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/conductor')) {
          window.location.href = '/login-conductor';
        } else {
          window.location.href = '/login';
        }
        
        return Promise.reject(new Error('Sesión expirada. Por favor, inicia sesión nuevamente.'));
      }
    }
    
    // Formatear el error para que sea más descriptivo
    let errorMessage = 'Error de red';
    if (error.message) {
      errorMessage = error.message;
    }
    if (error.response?.data && typeof error.response.data === 'object') {
      const responseData = error.response.data as Record<string, any>;
      if (responseData.message) {
        errorMessage = responseData.message;
      }
    }
    
    const formattedError: any = new Error(errorMessage);
    
    // Añadir información del error original para debugging
    formattedError.status = error.response?.status;
    formattedError.response = error.response;
    formattedError.request = error.request;
    formattedError.config = error.config;
    
    // Mostrar error en consola para debugging
    console.error('API error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: errorMessage
    });
    
    return Promise.reject(formattedError);
  }
);

// Función principal para realizar solicitudes API
const apiRequest = async (
  method: string,
  url: string,
  data?: any
): Promise<any> => {
  return axiosInstance({
    method,
    url,
    data
  });
};

// Métodos HTTP expuestos
const get = (url: string, config?: any): Promise<any> => {
  return axiosInstance.get(url, config);
};

const postFormData = (url: string, data?: any): Promise<any> => {
  return axiosInstance({
    method: METHOD.POST,
    url,
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

const post = (url: string, data?: any): Promise<any> => 
  apiRequest(METHOD.POST, url, data);

const put = (url: string, data?: any): Promise<any> => 
  apiRequest(METHOD.PUT, url, data);

const patch = (url: string, data?: any): Promise<any> => 
  apiRequest(METHOD.PATCH, url, data);

const remove = (url: string, data?: any): Promise<any> => 
  apiRequest(METHOD.DELETE, url, data);

const API = {
  get,
  post,
  put,
  patch,
  postFormData,
  delete: remove
};

export default API; 