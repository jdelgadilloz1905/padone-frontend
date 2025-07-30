import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  photoUploadService, 
  photoValidation
} from '../services/photoUploadService';
import type {
  PhotoUpload, 
  PhotoType, 
  DriverPhotos,
  UploadResponse,
  BulkUploadResponse
} from '../services/photoUploadService';

// ====================================
// INTERFACE DEL HOOK
// ====================================

export interface UsePhotoUploadReturn {
  // Estado
  uploads: PhotoUpload[];
  isUploading: boolean;
  hasErrors: boolean;
  
  // Fotos del conductor
  driverPhotos: DriverPhotos | undefined;
  isLoadingPhotos: boolean;
  
  // Acciones
  addPhoto: (file: File, type: PhotoType) => Promise<void>;
  addMultiplePhotos: (files: File[], types: PhotoType[]) => Promise<void>;
  removePhoto: (uploadId: string) => void;
  deleteDriverPhoto: (photoId: string) => Promise<void>;
  uploadSingle: (driverId: number, uploadId: string) => Promise<void>;
  uploadAll: (driverId: number) => Promise<void>;
  
  // Utilidades
  clearAll: () => void;
  getPhotosByType: (type: PhotoType) => PhotoUpload[];
  validateAndAdd: (file: File, type: PhotoType) => Promise<{ success: boolean; errors: string[] }>;
}

// ====================================
// HOOK PRINCIPAL
// ====================================

export const usePhotoUpload = (driverId?: number): UsePhotoUploadReturn => {
  const queryClient = useQueryClient();
  
  // ====================================
  // ESTADO LOCAL
  // ====================================
  const [uploads, setUploads] = useState<PhotoUpload[]>([]);

  // ====================================
  // QUERIES PARA FOTOS EXISTENTES
  // ====================================
  const { 
    data: driverPhotos, 
    isLoading: isLoadingPhotos 
  } = useQuery({
    queryKey: ['driverPhotos', driverId],
    queryFn: () => driverId ? photoUploadService.getDriverPhotos(driverId) : undefined,
    enabled: !!driverId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // ====================================
  // MUTATIONS
  // ====================================
  
  // Upload individual
  const uploadSingleMutation = useMutation({
    mutationFn: ({ driverId, file, type }: { driverId: number; file: File; type: PhotoType }) =>
      photoUploadService.uploadSinglePhoto(driverId, file, type),
    onSuccess: (response: UploadResponse, variables) => {
      // Actualizar el estado local
      setUploads(prev => prev.map(upload => {
        if (upload.file === variables.file) {
          return {
            ...upload,
            status: 'success',
            url: response.url,
            progress: 100
          };
        }
        return upload;
      }));
      
      // Invalidar query de fotos para refrescar
      queryClient.invalidateQueries({ queryKey: ['driverPhotos', variables.driverId] });
    },
    onError: (error: Error, variables) => {
      setUploads(prev => prev.map(upload => {
        if (upload.file === variables.file) {
          return {
            ...upload,
            status: 'error',
            error: error.message
          };
        }
        return upload;
      }));
    }
  });

  // Upload múltiple
  const uploadBulkMutation = useMutation({
    mutationFn: ({ driverId, files, types }: { driverId: number; files: File[]; types: PhotoType[] }) =>
      photoUploadService.uploadBulkPhotos(driverId, files, types),
    onSuccess: (response: BulkUploadResponse, variables) => {
      // Actualizar estado basado en respuestas
      setUploads(prev => prev.map(upload => {
        const matchingUpload = response.uploads.find(
          resp => resp.fileName === upload.file.name
        );
        
        if (matchingUpload) {
          return {
            ...upload,
            status: 'success',
            url: matchingUpload.url,
            progress: 100
          };
        }
        
        // Verificar si hay errores
        const errorMatch = response.errors.find(
          err => err.fileName === upload.file.name
        );
        
        if (errorMatch) {
          return {
            ...upload,
            status: 'error',
            error: errorMatch.error
          };
        }
        
        return upload;
      }));
      
      queryClient.invalidateQueries({ queryKey: ['driverPhotos', variables.driverId] });
    },
    onError: (error: Error) => {
      setUploads(prev => prev.map(upload => ({
        ...upload,
        status: 'error',
        error: error.message
      })));
    }
  });

  // Eliminar foto
  const deletePhotoMutation = useMutation({
    mutationFn: ({ driverId, photoId }: { driverId: number; photoId: string }) =>
      photoUploadService.deletePhoto(driverId, photoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['driverPhotos', variables.driverId] });
    }
  });

  // ====================================
  // FUNCIONES DE ACCIÓN
  // ====================================

  // Agregar foto con validación
  const addPhoto = useCallback(async (file: File, type: PhotoType): Promise<void> => {
    const validation = await photoValidation.validateFile(file, type);
    
    if (!validation.isValid) {
      throw new Error(`Archivo inválido: ${validation.errors.join(', ')}`);
    }

    const preview = await photoUploadService.createImagePreview(file);
    const newUpload: PhotoUpload = {
      id: Date.now().toString() + Math.random().toString(36),
      file,
      type,
      preview,
      status: 'pending',
      progress: 0
    };

    setUploads(prev => [...prev, newUpload]);
  }, []);

  // Agregar múltiples fotos
  const addMultiplePhotos = useCallback(async (files: File[], types: PhotoType[]): Promise<void> => {
    if (files.length !== types.length) {
      throw new Error('El número de archivos debe coincidir con el número de tipos');
    }

    const newUploads: PhotoUpload[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = types[i];
      
      const validation = await photoValidation.validateFile(file, type);
      if (!validation.isValid) {
        throw new Error(`${file.name}: ${validation.errors.join(', ')}`);
      }

      const preview = await photoUploadService.createImagePreview(file);
      newUploads.push({
        id: Date.now().toString() + Math.random().toString(36) + i,
        file,
        type,
        preview,
        status: 'pending',
        progress: 0
      });
    }

    setUploads(prev => [...prev, ...newUploads]);
  }, []);

  // Remover foto de la cola
  const removePhoto = useCallback((uploadId: string): void => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  }, []);

  // Eliminar foto del servidor
  const deleteDriverPhoto = useCallback(async (photoId: string): Promise<void> => {
    if (!driverId) {
      throw new Error('Driver ID requerido para eliminar foto');
    }
    
    await deletePhotoMutation.mutateAsync({ driverId, photoId });
  }, [driverId, deletePhotoMutation]);

  // Upload individual por ID
  const uploadSingle = useCallback(async (targetDriverId: number, uploadId: string): Promise<void> => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload) {
      throw new Error('Upload no encontrado');
    }

    setUploads(prev => prev.map(u => 
      u.id === uploadId ? { ...u, status: 'uploading', progress: 0 } : u
    ));

    await uploadSingleMutation.mutateAsync({
      driverId: targetDriverId,
      file: upload.file,
      type: upload.type
    });
  }, [uploads, uploadSingleMutation]);

  // Upload todos los pendientes
  const uploadAll = useCallback(async (targetDriverId: number): Promise<void> => {
    const pendingUploads = uploads.filter(u => u.status === 'pending');
    
    if (pendingUploads.length === 0) {
      return;
    }

    // Marcar todos como uploading
    setUploads(prev => prev.map(u => 
      u.status === 'pending' ? { ...u, status: 'uploading', progress: 0 } : u
    ));

    const files = pendingUploads.map(u => u.file);
    const types = pendingUploads.map(u => u.type);

    await uploadBulkMutation.mutateAsync({
      driverId: targetDriverId,
      files,
      types
    });
  }, [uploads, uploadBulkMutation]);

  // Limpiar todo
  const clearAll = useCallback((): void => {
    setUploads([]);
  }, []);

  // Obtener fotos por tipo
  const getPhotosByType = useCallback((type: PhotoType): PhotoUpload[] => {
    return uploads.filter(upload => upload.type === type);
  }, [uploads]);

  // Validar y agregar
  const validateAndAdd = useCallback(async (file: File, type: PhotoType): Promise<{ success: boolean; errors: string[] }> => {
    try {
      const validation = await photoValidation.validateFile(file, type);
      
      if (validation.isValid) {
        await addPhoto(file, type);
        return { success: true, errors: [] };
      } else {
        return { success: false, errors: validation.errors };
      }
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Error desconocido'] 
      };
    }
  }, [addPhoto]);

  // ====================================
  // ESTADOS COMPUTADOS
  // ====================================
  const isUploading = uploads.some(upload => upload.status === 'uploading') || 
                     uploadSingleMutation.isPending || 
                     uploadBulkMutation.isPending;
                     
  const hasErrors = uploads.some(upload => upload.status === 'error');

  // ====================================
  // RETURN DEL HOOK
  // ====================================
  return {
    // Estado
    uploads,
    isUploading,
    hasErrors,
    
    // Fotos del conductor
    driverPhotos,
    isLoadingPhotos,
    
    // Acciones
    addPhoto,
    addMultiplePhotos,
    removePhoto,
    deleteDriverPhoto,
    uploadSingle,
    uploadAll,
    
    // Utilidades
    clearAll,
    getPhotosByType,
    validateAndAdd
  };
}; 