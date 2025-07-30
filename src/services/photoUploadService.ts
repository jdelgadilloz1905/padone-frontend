import axios from 'axios';
import api from './api';

// ====================================
// INTERFACES Y TIPOS
// ====================================

export type PhotoType = 'profile' | 'vehicle' | 'document';

export interface PhotoUpload {
  id: string;
  file: File;
  type: PhotoType;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

export interface PhotoValidationRule {
  type: 'size' | 'format' | 'dimensions' | 'quality';
  rule: any;
  message: string;
}

export interface DriverPhotoObject {
  id?: string;
  url: string;
  s3_key?: string;
  type?: string;
  is_primary?: boolean;
  uploaded_at?: string;
}

export interface DriverPhotos {
  profile_picture: DriverPhotoObject[];
  vehicle_photos: DriverPhotoObject[];
  document_photos: DriverPhotoObject[];
}

export interface UploadResponse {
  id: string;
  url: string;
  type: PhotoType;
  fileName: string;
  size: number;
  uploadedAt: string;
}

export interface BulkUploadResponse {
  uploads: UploadResponse[];
  errors: Array<{
    fileName: string;
    error: string;
  }>;
}

// ====================================
// VALIDACIONES Y CONFIGURACIÓN
// ====================================

export const PHOTO_CONFIG = {
  // Tamaños máximos por tipo (en bytes)
  MAX_SIZES: {
    profile: 2 * 1024 * 1024,      // 2MB
    vehicle: 3 * 1024 * 1024,      // 3MB
    document: 5 * 1024 * 1024      // 5MB
  },
  
  // Formatos permitidos
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Dimensiones mínimas
  MIN_DIMENSIONS: {
    profile: { width: 200, height: 200 },
    vehicle: { width: 800, height: 600 },
    document: { width: 800, height: 500 }
  },
  
  // Máximo de archivos por tipo
  MAX_FILES: {
    profile: 1,
    vehicle: 5,
    document: 10
  }
} as const;

// ====================================
// UTILIDADES DE VALIDACIÓN
// ====================================

export const photoValidation = {
  // Validar formato de archivo
  validateFileType: (file: File): boolean => {
    return PHOTO_CONFIG.ALLOWED_FORMATS.includes(file.type as any);
  },

  // Validar tamaño de archivo
  validateFileSize: (file: File, photoType: PhotoType): boolean => {
    return file.size <= PHOTO_CONFIG.MAX_SIZES[photoType];
  },

  // Validar dimensiones de imagen
  validateDimensions: (file: File, photoType: PhotoType): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const { width, height } = PHOTO_CONFIG.MIN_DIMENSIONS[photoType];
        const isValid = img.width >= width && img.height >= height;
        URL.revokeObjectURL(url);
        resolve(isValid);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      
      img.src = url;
    });
  },

  // Validar roles de usuario
  validateUserRole: (): boolean => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      // Decodificar el JWT para verificar roles
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role || payload.roles?.[0];
      
      return ['admin', 'operator'].includes(userRole);
    } catch (error) {
      console.error('Error validating user role:', error);
      return false;
    }
  },

  // Validación completa de archivo
  validateFile: async (file: File, photoType: PhotoType): Promise<{
    isValid: boolean;
    errors: string[];
  }> => {
    const errors: string[] = [];

    // Validar tipo
    if (!photoValidation.validateFileType(file)) {
      errors.push(`Formato no válido. Use: ${PHOTO_CONFIG.ALLOWED_FORMATS.join(', ')}`);
    }

    // Validar tamaño
    if (!photoValidation.validateFileSize(file, photoType)) {
      const maxSizeMB = PHOTO_CONFIG.MAX_SIZES[photoType] / (1024 * 1024);
      errors.push(`Archivo muy grande. Máximo: ${maxSizeMB}MB`);
    }


    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// ====================================
// SERVICIO PRINCIPAL
// ====================================

export const photoUploadService = {
  // ====================================
  // SUBIR FOTO INDIVIDUAL
  // ====================================
  uploadSinglePhoto: async (
    driverId: number, 
    file: File, 
    photoType: PhotoType
  ): Promise<UploadResponse> => {
    // Validar roles
    if (!photoValidation.validateUserRole()) {
      throw new Error('No tienes permisos para subir fotos');
    }

    // Validar archivo
    const validation = await photoValidation.validateFile(file, photoType);
    if (!validation.isValid) {
      throw new Error(`Archivo inválido: ${validation.errors.join(', ')}`);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('photo_type', photoType);
      if (photoType === 'profile') {
        formData.append('replace_existing', 'true');
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/uploads/admin/drivers/${driverId}/photos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Adaptar la respuesta para que coincida con UploadResponse
      const data = response.data.data || response.data;
      return {
        id: data.id,
        url: data.url,
        type: data.type,
        fileName: data.original_filename || file.name,
        size: data.size_bytes || file.size,
        uploadedAt: data.uploaded_at,
      };

      
    } catch (error: any) {
      console.error('Error uploading single photo:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error al subir la foto'
      );
    }
  },

  // ====================================
  // SUBIR MÚLTIPLES FOTOS (BULK)
  // ====================================
  uploadBulkPhotos: async (
    driverId: number,
    files: File[],
    types: PhotoType[]
  ): Promise<BulkUploadResponse> => {
    // Validar roles
    if (!photoValidation.validateUserRole()) {
      throw new Error('No tienes permisos para subir fotos');
    }

    // Validar que arrays tengan el mismo tamaño
    if (files.length !== types.length) {
      throw new Error('Número de archivos y tipos no coinciden');
    }

    // Validar todos los archivos
    const validationResults = await Promise.all(
      files.map((file, index) => photoValidation.validateFile(file, types[index]))
    );

    const invalidFiles = validationResults
      .map((result, index) => ({ ...result, fileName: files[index].name, index }))
      .filter(result => !result.isValid);

    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(
        file => `${file.fileName}: ${file.errors.join(', ')}`
      );
      throw new Error(`Archivos inválidos:\n${errorMessages.join('\n')}`);
    }

    // Subir cada archivo individualmente
    const uploads: UploadResponse[] = [];
    const errors: Array<{ fileName: string; error: string }> = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const response = await photoUploadService.uploadSinglePhoto(driverId, files[i], types[i]);
        uploads.push(response);
      } catch (error: any) {
        errors.push({
          fileName: files[i].name,
          error: error.message || 'Error desconocido'
        });
      }
    }

    return { uploads, errors };
  },

  // ====================================
  // OBTENER FOTOS DEL CONDUCTOR
  // ====================================
  getDriverPhotos: async (driverId: number): Promise<DriverPhotos> => {
    try {
      const response = await api.get(`/uploads/admin/drivers/${driverId}/photos`);
      const data = response.data || response; // En caso de que api.get devuelva directamente los datos
      return {
        profile_picture: Array.isArray(data.profile_picture)
          ? data.profile_picture
          : data.profile_picture
            ? [data.profile_picture]
            : [],
        vehicle_photos: data.vehicle_photos || [],
        document_photos: data.document_photos || [],
      };
    } catch (error: any) {
      console.error('Error getting driver photos:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error al obtener las fotos del conductor'
      );
    }
  },

  // ====================================
  // ELIMINAR FOTO ESPECÍFICA
  // ====================================
  deletePhoto: async (driverId: number, photoId: string): Promise<void> => {
    // Validar roles
    if (!photoValidation.validateUserRole()) {
      throw new Error('No tienes permisos para eliminar fotos');
    }

    try {
      await api.delete(`/uploads/admin/drivers/${driverId}/photos/${photoId}`);
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error al eliminar la foto'
      );
    }
  },

  // ====================================
  // UTILIDADES ADICIONALES
  // ====================================
  
  // Crear preview de imagen
  createImagePreview: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Comprimir imagen (opcional)
  compressImage: async (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo ratio
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar y comprimir
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback al archivo original
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  },

  // Obtener información del archivo
  getFileInfo: (file: File) => ({
    name: file.name,
    size: file.size,
    type: file.type,
    sizeFormatted: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    lastModified: new Date(file.lastModified).toLocaleString()
  })
}; 