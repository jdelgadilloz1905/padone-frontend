import API from './api';

// =====================================================================
// INTERFACES Y TIPOS
// =====================================================================

export interface Comment {
  id: string;
  requestId: string;
  content: string;
  author: {
    id: string;
    name: string;
    role: 'admin' | 'operator' | 'dispatcher';
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isInternal: boolean; // true para notas internas, false para comentarios públicos
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[]; // etiquetas para categorización
}

export interface CreateCommentRequest {
  requestId: string;
  content: string;
  isInternal?: boolean;
  priority?: Comment['priority'];
  tags?: string[];
}

export interface UpdateCommentRequest {
  content: string;
  priority?: Comment['priority'];
  tags?: string[];
  isInternal?: boolean; // ← Agregado para poder editar tipo de comentario
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
  hasMore: boolean;
}

export interface CommentStats {
  total: number;
  byPriority: Record<Comment['priority'], number>;
  byAuthor: Record<string, number>;
  recent: number; // comentarios de las últimas 24h
}

// =====================================================================
// SERVICIO DE COMENTARIOS
// =====================================================================

class CommentsService {
  private readonly baseUrl = '/comments/request'; // ← Corregido: usar endpoint específico

  /**
   * Obtener comentarios de una solicitud específica
   */
  async getCommentsByRequest(
    requestId: string,
    options: {
      page?: number;
      limit?: number;
      includeInternal?: boolean;
      priority?: Comment['priority'];
      sortBy?: 'createdAt' | 'priority' | 'author';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<CommentsResponse> {
    try {
      // Usar el ID del ride directamente en la URL
      const params = new URLSearchParams({
        page: String(options.page || 1),
        limit: String(options.limit || 20),
        includeInternal: String(options.includeInternal ?? true),
        sortBy: options.sortBy || 'createdAt',
        sortOrder: options.sortOrder || 'desc'
      });

      if (options.priority) {
        params.append('priority', options.priority);
      }

      const url = `${this.baseUrl}/${requestId}?${params}`;
      console.log('🔍 Fetching comments from URL:', url);
      const response = await API.get(url);
      console.log('📝 Comments response:', response);
      
      // Backend devuelve array directo, no objeto { data: [] }
      const commentsArray = Array.isArray(response) ? response : (response.data || []);
      console.log('📋 Comments array:', commentsArray);
      
      // Mapear datos del backend a la estructura esperada
      const mappedComments = this.mapBackendComments(commentsArray);
      
      return {
        comments: mappedComments,
        total: commentsArray.length, // No hay metadata de paginación
        hasMore: false // Sin paginación aparente
      };
    } catch (error) {
      console.error('Error fetching comments:', error);
      
      // Fallback con datos simulados solo si falla completamente
      return this.getSimulatedComments(requestId);
    }
  }

  /**
   * Mapear comentarios del backend a la estructura esperada por el frontend
   */
  private mapBackendComments(backendComments: any[]): Comment[] {
    return backendComments.map(comment => ({
      id: String(comment.id),
      requestId: String(comment.rideId), // Mapear rideId → requestId
      content: comment.content,
      author: {
        id: String(comment.author?.id || comment.authorId),
        name: this.getAuthorDisplayName(comment.author), // Usar author real del backend
        role: this.mapAuthorRole(comment.author?.role), // Usar rol real
        avatar: comment.author?.profile_picture || undefined
      },
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt || comment.createdAt,
      isEdited: comment.updatedAt !== comment.createdAt,
      isInternal: comment.internal ?? true,
      priority: this.mapPriority(comment.priority),
      tags: comment.tags || []
    }));
  }

  /**
   * Obtener nombre para mostrar del autor usando datos reales del backend
   */
  private getAuthorDisplayName(author: any): string {
    if (!author) return 'Unknown User'; // Usar inglés como fallback en servicios
    
    // Si tiene first_name y last_name
    if (author.first_name && author.last_name) {
      return `${author.first_name} ${author.last_name}`.trim();
    }
    
    // Si solo tiene first_name
    if (author.first_name) {
      return author.first_name;
    }
    
    // Si tiene email como fallback
    if (author.email) {
      // Extraer parte antes del @ para mostrar
      return author.email.split('@')[0];
    }
    
    return `Usuario ${author.id}`;
  }

  /**
   * Mapear rol del backend al formato esperado
   */
  private mapAuthorRole(backendRole: string): 'admin' | 'operator' | 'dispatcher' {
    const roleMap: Record<string, 'admin' | 'operator' | 'dispatcher'> = {
      'admin': 'admin',
      'operator': 'operator', 
      'dispatcher': 'dispatcher',
      'superadmin': 'admin'
    };
    return roleMap[backendRole] || 'operator';
  }



  /**
   * Mapear prioridad del backend
   */
  private mapPriority(backendPriority: string): Comment['priority'] {
    const priorityMap: Record<string, Comment['priority']> = {
      'low': 'low',
      'normal': 'normal', 
      'high': 'high',
      'urgent': 'urgent'
    };
    return priorityMap[backendPriority] || 'normal';
  }

  /**
   * Crear un nuevo comentario
   */
  async createComment(commentData: CreateCommentRequest): Promise<Comment> {
    try {
      // Mapear requestId → rideId para el backend
      const backendData = {
        rideId: commentData.requestId, // ← Corregido: usar rideId
        content: commentData.content,
        internal: commentData.isInternal ?? true, // ← Corregido: usar internal
        priority: commentData.priority || 'normal',
        tags: commentData.tags || []
      };

      console.log('📝 Creating comment with data:', backendData);
      const response = await API.post(`/comments`, backendData); // ← Usar endpoint base para crear
      console.log('✅ Comment created:', response);
      
      // Mapear respuesta del backend
      return this.mapBackendComments([response])[0];
    } catch (error) {
      console.error('Error creating comment:', error);
      
      // Simulación para desarrollo
      return this.createSimulatedComment(commentData);
    }
  }

  /**
   * Actualizar un comentario existente
   */
  async updateComment(
    commentId: string, 
    updates: UpdateCommentRequest
  ): Promise<Comment> {
    try {
      // Mapear payload para backend
      const backendData = {
        content: updates.content,
        internal: updates.isInternal ?? true, // ← Usar "internal" como backend espera
        priority: updates.priority || 'normal',
      };

      console.log('✏️ Updating comment with data:', backendData);
      const response = await API.patch(`/comments/${commentId}`, backendData); // ← URL corregida
      console.log('✅ Comment updated:', response);
      
      // Mapear respuesta del backend
      return this.mapBackendComments([response])[0];
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Failed to update comment');
    }
  }

  /**
   * Eliminar un comentario
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting comment ID:', commentId);
      await API.delete(`/comments/${commentId}`); // ← URL corregida
      console.log('✅ Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  /**
   * Obtener estadísticas de comentarios para una solicitud
   */
  async getCommentStats(requestId: string): Promise<CommentStats> {
    try {
      const response = await API.get(`${this.baseUrl}/stats/${requestId}`);
      return response;
    } catch (error) {
      console.error('Error fetching comment stats:', error);
      
      // Fallback con stats simuladas
      return {
        total: 3,
        byPriority: { low: 1, normal: 1, high: 1, urgent: 0 },
        byAuthor: { 'admin-1': 2, 'operator-1': 1 },
        recent: 1
      };
    }
  }

  /**
   * Buscar comentarios por contenido
   */
  async searchComments(
    query: string,
    options: {
      requestId?: string;
      dateFrom?: string;
      dateTo?: string;
      author?: string;
      priority?: Comment['priority'];
      tags?: string[];
    } = {}
  ): Promise<CommentsResponse> {
    try {
      const params = new URLSearchParams({ query });
      
      Object.entries(options).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await API.get(`${this.baseUrl}/search?${params}`);
      return response;
    } catch (error) {
      console.error('Error searching comments:', error);
      return { comments: [], total: 0, hasMore: false };
    }
  }

  /**
   * Obtener comentarios recientes para el dashboard
   */
  async getRecentComments(limit: number = 10): Promise<Comment[]> {
    try {
      const response = await API.get(`${this.baseUrl}/recent?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error fetching recent comments:', error);
      return [];
    }
  }

  // =====================================================================
  // MÉTODOS DE FALLBACK Y SIMULACIÓN
  // =====================================================================

  private getSimulatedComments(requestId: string): CommentsResponse {
    
    const simulatedComments: Comment[] = [
      {
        id: 'comment-1',
        requestId,
        content: 'Cliente confirmó la dirección. Proceder con asignación.',
        author: {
          id: 'admin-1',
          name: 'María González',
          role: 'admin',
          avatar: '/avatars/admin-1.jpg'
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isEdited: false,
        isInternal: true,
        priority: 'normal',
        tags: ['verificación', 'dirección']
      },
      {
        id: 'comment-2',
        requestId,
        content: 'Conductor reporta tráfico pesado en la zona. ETA actualizado.',
        author: {
          id: 'operator-1',
          name: 'Carlos Rodríguez',
          role: 'operator'
        },
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min atrás
        updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        isEdited: false,
        isInternal: true,
        priority: 'high',
        tags: ['tráfico', 'eta']
      },
      {
        id: 'comment-3',
        requestId,
        content: 'Cliente requiere factura. Contactar administración.',
        author: {
          id: 'dispatcher-1',
          name: 'Ana Martínez',
          role: 'dispatcher'
        },
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min atrás
        updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        isEdited: false,
        isInternal: true,
        priority: 'low',
        tags: ['facturación', 'administración']
      }
    ];

    return {
      comments: simulatedComments,
      total: simulatedComments.length,
      hasMore: false
    };
  }

  private createSimulatedComment(commentData: CreateCommentRequest): Comment {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      requestId: commentData.requestId,
      content: commentData.content,
      author: {
        id: currentUser.id || 'current-user',
        name: currentUser.name || 'Usuario Actual',
        role: currentUser.role || 'admin'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isEdited: false,
      isInternal: commentData.isInternal ?? true,
      priority: commentData.priority || 'normal',
      tags: commentData.tags || []
    };

    return newComment;
  }
}

// =====================================================================
// EXPORT SINGLETON
// =====================================================================

export const commentsService = new CommentsService();
export default commentsService; 