import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clientService from '../services/clientService';
import type { ClientFilters, CreateClientDto, UpdateClientDto } from '../services/clientService';

// Query Keys para cache management
export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (filters: ClientFilters) => [...clientKeys.lists(), filters] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: number) => [...clientKeys.details(), id] as const,
  stats: () => [...clientKeys.all, 'stats'] as const,
  search: (term: string) => [...clientKeys.all, 'search', term] as const,
};

// Hook para obtener lista de clientes con filtros
export const useClients = (filters: ClientFilters = {}) => {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => clientService.getClients(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 2,
    placeholderData: (previousData) => previousData, // Mantener datos anteriores mientras carga
  });
};

// Hook para obtener cliente por ID
export const useClient = (id: number, enabled = true) => {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientService.getClient(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  });
};


// Hook para obtener estadísticas de clientes
export const useClientStats = () => {
  return useQuery({
    queryKey: clientKeys.stats(),
    queryFn: () => clientService.getClientStats(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook para búsqueda de clientes
export const useSearchClients = (searchTerm: string, enabled = true) => {
  return useQuery({
    queryKey: clientKeys.search(searchTerm),
    queryFn: () => clientService.searchClients(searchTerm),
    enabled: enabled && searchTerm.length > 2,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 3 * 60 * 1000, // 3 minutos
    retry: 1,
  });
};

// Hook para obtener historial de rides de un cliente
export const useClientRides = (clientId: number, enabled = true) => {
  return useQuery({
    queryKey: [...clientKeys.detail(clientId), 'rides'],
    queryFn: () => clientService.getClientRides(clientId),
    enabled: enabled && !!clientId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};

// Hook para exportar clientes
export const useExportClients = () => {
  return {
    exportClients: async (filters: ClientFilters = {}) => {
      try {
        const blob = await clientService.exportClients(filters);
        
        // Verificar que el blob no esté vacío
        if (blob.size === 0) {
          throw new Error('El archivo exportado está vacío');
        }
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error exporting clients:', error);
        throw error;
      }
    }
  };
};

// Hook para invalidar cache de clientes
export const useInvalidateClients = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: clientKeys.lists() }),
    invalidateStats: () => queryClient.invalidateQueries({ queryKey: clientKeys.stats() }),
  };
};

// Hook para prefetch de cliente
export const usePrefetchClient = () => {
  const queryClient = useQueryClient();
  
  return {
    prefetchClient: (id: number) => {
      queryClient.prefetchQuery({
        queryKey: clientKeys.detail(id),
        queryFn: () => clientService.getClient(id),
        staleTime: 5 * 60 * 1000,
      });
    }
  };
};

// MUTATIONS PARA OPERACIONES CRUD

// Hook para crear nuevo cliente
export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (clientData: CreateClientDto) => clientService.crearCliente(clientData),
    onSuccess: (newClient) => {
      // Invalidar cache de listas para mostrar el nuevo cliente
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.stats() });
      
      // Agregar el nuevo cliente al cache específico
      queryClient.setQueryData(clientKeys.detail(newClient.id), newClient);
      
      console.log('✅ Cliente creado exitosamente:', newClient);
    },
    onError: (error) => {
      console.error('❌ Error al crear cliente:', error);
    }
  });
};

// Hook para actualizar cliente existente
export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClientDto }) => 
      clientService.updateClient(id, data),
    onSuccess: (updatedClient, variables) => {
      // Actualizar cache específico del cliente
      queryClient.setQueryData(clientKeys.detail(variables.id), updatedClient);
      
      // Invalidar listas para reflejar cambios
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.stats() });
      
      console.log('✅ Cliente actualizado exitosamente:', updatedClient);
    },
    onError: (error) => {
      console.error('❌ Error al actualizar cliente:', error);
    }
  });
};

// Hook para eliminar cliente
export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => clientService.deleteClient(id),
    onSuccess: (_, deletedId) => {
      // Remover del cache específico
      queryClient.removeQueries({ queryKey: clientKeys.detail(deletedId) });
      
      // Invalidar listas para reflejar eliminación
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.stats() });
      
      console.log('✅ Cliente eliminado exitosamente:', deletedId);
    },
    onError: (error) => {
      console.error('❌ Error al eliminar cliente:', error);
    }
  });
};

// Hook para cambiar estado del cliente
export const useToggleClientStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => clientService.toggleClientStatus(id),
    onSuccess: (updatedClient, id) => {
      // Actualizar cache específico del cliente
      queryClient.setQueryData(clientKeys.detail(id), updatedClient);
      // Invalidar listas para reflejar cambios
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientKeys.stats() });
      console.log('✅ Estado del cliente actualizado:', updatedClient);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Error al cambiar el estado del cliente';
      console.error('❌ Error al cambiar estado del cliente:', message);
      throw new Error(message);
    }
  });
}; 