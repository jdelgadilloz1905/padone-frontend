import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  TextField,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Paper,
  Tooltip,
  Alert,
  Skeleton,
  Badge,
  useMediaQuery,
  useTheme,
  styled
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as TimeIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  PriorityHigh as HighPriorityIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import commentsService, { type Comment, type CreateCommentRequest } from '../../services/commentsService';
import type { RideRequest } from '../../services/requestService';
import ConfirmDeleteModal from './ConfirmDeleteModal';

// =====================================================================
// STYLED COMPONENTS RESPONSIVE
// =====================================================================

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 12,
    maxHeight: '90vh',
    [theme.breakpoints.down('md')]: {
      margin: 8,
      maxHeight: 'calc(100vh - 16px)',
      borderRadius: 8,
    },
    [theme.breakpoints.down('sm')]: {
      margin: 0,
      width: '100%',
      height: '100%',
      maxHeight: '100vh',
      borderRadius: 0,
    }
  }
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  padding: 8,
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    backdropFilter: 'blur(10px)',
    transform: 'scale(1.05)',
  },
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.down('md')]: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    '& .MuiSvgIcon-root': {
      fontSize: 24,
    }
  }
}));

const CommentCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  border: '1px solid #e0e0e0',
  borderRadius: 12,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: '#e5308a',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(229, 48, 138, 0.1)',
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1.5),
    borderRadius: 8,
  }
}));

const CommentAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: '#e5308a',
  [theme.breakpoints.down('md')]: {
    width: 48,
    height: 48,
  }
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  padding: 6,
  '&:hover': {
    backgroundColor: 'rgba(229, 48, 138, 0.1)',
    transform: 'scale(1.1)',
  },
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.down('md')]: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    '& .MuiSvgIcon-root': {
      fontSize: 18,
    }
  }
}));

const FormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  border: '1px solid #e0e0e0',
  backgroundColor: '#f9f9f9',
  borderRadius: 12,
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1.5),
    borderRadius: 8,
  }
}));

const ResponsiveTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    minHeight: 40,
    fontSize: '0.875rem',
    [theme.breakpoints.down('md')]: {
      minHeight: 48,
      fontSize: '1rem',
    }
  },
  '& .MuiInputBase-multiline': {
    padding: 12,
    [theme.breakpoints.down('md')]: {
      padding: 16,
    }
  }
}));

const ControlsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  flexDirection: 'row',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  }
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#e5308a',
  minWidth: 120,
  minHeight: 36,
  '&:hover': {
    backgroundColor: '#c42a75',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(229, 48, 138, 0.3)',
  },
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  [theme.breakpoints.down('md')]: {
    minHeight: 48,
    width: '100%',
    fontSize: '1rem',
  }
}));

const ResponsiveFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 120,
  '& .MuiInputBase-root': {
    minHeight: 36,
    [theme.breakpoints.down('md')]: {
      minHeight: 48,
    }
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
  }
}));

const CommentsListContainer = styled(Box)(({ theme }) => ({
  maxHeight: 400,
  overflowY: 'auto',
  paddingRight: theme.spacing(1),
  [theme.breakpoints.down('md')]: {
    maxHeight: 'calc(100vh - 400px)',
    paddingRight: 0,
  }
}));

// =====================================================================
// INTERFACES Y TIPOS
// =====================================================================

interface CommentsModalProps {
  open: boolean;
  onClose: () => void;
  request: RideRequest | null;
}

interface CommentFormData {
  content: string;
  priority: Comment['priority'];
  isInternal: boolean;
}

// =====================================================================
// COMPONENTE DE COMENTARIO INDIVIDUAL RESPONSIVE
// =====================================================================

const CommentItem: React.FC<{ 
  comment: Comment; 
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
}> = ({ comment, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getPriorityColor = (priority: Comment['priority']) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: Comment['priority']) => {
    const iconSize = isMobile ? 18 : 16;
    switch (priority) {
      case 'urgent': return <WarningIcon sx={{ fontSize: iconSize }} />;
      case 'high': return <HighPriorityIcon sx={{ fontSize: iconSize }} />;
      case 'normal': return <InfoIcon sx={{ fontSize: iconSize }} />;
      case 'low': return <TimeIcon sx={{ fontSize: iconSize }} />;
      default: return <InfoIcon sx={{ fontSize: iconSize }} />;
    }
  };

  const getRoleTranslation = (role: string) => {
    const translations: Record<string, string> = {
      'admin': t('comments.roles.admin'),
      'operator': t('comments.roles.operator'),
      'dispatcher': t('comments.roles.dispatcher')
    };
    return translations[role] || role;
  };

  return (
    <CommentCard elevation={0}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* Avatar */}
        <CommentAvatar>
          <PersonIcon />
        </CommentAvatar>

        {/* Contenido del comentario */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Header con autor y metadata */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between', 
            mb: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              flexWrap: 'wrap'
            }}>
              <Typography 
                variant={isMobile ? "body2" : "subtitle2"} 
                sx={{ 
                  fontWeight: 'bold',
                  lineHeight: 1.2
                }}
              >
                {comment.author.name}
              </Typography>
              <Chip
                label={getRoleTranslation(comment.author.role)}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: isMobile ? 11 : 10, 
                  height: isMobile ? 24 : 20 
                }}
              />
              <Chip
                icon={getPriorityIcon(comment.priority)}
                label={t(`comments.priorities.${comment.priority}`)}
                size="small"
                color={getPriorityColor(comment.priority) as any}
                sx={{ 
                  fontSize: isMobile ? 11 : 10, 
                  height: isMobile ? 24 : 20 
                }}
              />
            </Box>

            {/* Acciones */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              alignSelf: { xs: 'flex-end', sm: 'center' }
            }}>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: isMobile ? '0.75rem' : '0.7rem',
                  whiteSpace: isMobile ? 'normal' : 'nowrap'
                }}
              >
                {new Date(comment.createdAt).toLocaleString()}
                {comment.isEdited && ` • ${t('comments.edited')}`}
              </Typography>
              {onEdit && (
                <Tooltip title={t('common.edit')}>
                  <ActionButton size="small" onClick={() => onEdit(comment)}>
                    <EditIcon sx={{ fontSize: isMobile ? 18 : 16 }} />
                  </ActionButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title={t('common.delete')}>
                  <ActionButton size="small" onClick={() => onDelete(comment.id)}>
                    <DeleteIcon sx={{ fontSize: isMobile ? 18 : 16 }} />
                  </ActionButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Contenido del comentario */}
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 1, 
              lineHeight: 1.5,
              wordWrap: 'break-word',
              fontSize: isMobile ? '0.875rem' : '0.8rem'
            }}
          >
            {comment.content}
          </Typography>

          {/* Tags si existen */}
          {comment.tags && comment.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {comment.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={`#${tag}`}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontSize: isMobile ? 11 : 10, 
                    height: isMobile ? 22 : 18 
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </CommentCard>
  );
};

// =====================================================================
// COMPONENTE PRINCIPAL DEL MODAL RESPONSIVE
// =====================================================================

const CommentsModal: React.FC<CommentsModalProps> = ({
  open,
  onClose,
  request
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Estados locales
  const [formData, setFormData] = useState<CommentFormData>({
    content: '',
    priority: 'normal',
    isInternal: true
  });
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  // Query para obtener comentarios
  const {
    data: commentsResponse,
    isLoading,
    error
  } = useQuery({
    queryKey: ['comments', request?.id],
    queryFn: () => request ? commentsService.getCommentsByRequest(request.id) : null,
    enabled: !!request?.id,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Auto-refetch cada minuto
  });

  // Mutation para crear comentario
  const createCommentMutation = useMutation({
    mutationFn: (commentData: CreateCommentRequest) => 
      commentsService.createComment(commentData),
    onSuccess: () => {
      // Invalidar y refetch de comentarios
      queryClient.invalidateQueries({ queryKey: ['comments', request?.id] });
      
      // Limpiar formulario
      setFormData({
        content: '',
        priority: 'normal',
        isInternal: true
      });
    },
    onError: (error) => {
      console.error('Error creating comment:', error);
    }
  });

  // Mutation para actualizar comentario
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, updates }: { commentId: string; updates: { content: string; priority: Comment['priority']; isInternal: boolean; } }) =>
      commentsService.updateComment(commentId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', request?.id] });
      
      // Limpiar formulario y estado de edición
      setFormData({
        content: '',
        priority: 'normal',
        isInternal: true
      });
      setEditingComment(null);
    },
    onError: (error) => {
      console.error('Error updating comment:', error);
    }
  });

  // Mutation para eliminar comentario
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentsService.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      queryClient.invalidateQueries({ queryKey: ['comments', request?.id] });
      
      // Si estaba editando el comentario eliminado, cancelar edición
      if (editingComment?.id === commentId) {
        setEditingComment(null);
        setFormData({
          content: '',
          priority: 'normal',
          isInternal: true
        });
      }
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      alert('Error al eliminar el comentario. Por favor, inténtalo de nuevo.');
    }
  });

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!request || !formData.content.trim()) return;

    if (editingComment) {
      // EDITAR comentario existente
      updateCommentMutation.mutate({
        commentId: editingComment.id,
        updates: {
          content: formData.content.trim(),
          priority: formData.priority,
          isInternal: formData.isInternal
        }
      });
    } else {
      // CREAR nuevo comentario
      createCommentMutation.mutate({
        requestId: request.id,
        content: formData.content.trim(),
        priority: formData.priority,
        isInternal: formData.isInternal
      });
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setFormData({
      content: comment.content,
      priority: comment.priority,
      isInternal: comment.isInternal
    });
  };

  const handleDeleteComment = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setCommentToDelete(comment);
    }
  };

  const handleConfirmDelete = () => {
    if (commentToDelete) {
      deleteCommentMutation.mutate(commentToDelete.id);
      setCommentToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setCommentToDelete(null);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setFormData({
      content: '',
      priority: 'normal',
      isInternal: true
    });
  };

  const handleClose = () => {
    setFormData({
      content: '',
      priority: 'normal',
      isInternal: true
    });
    setEditingComment(null);
    setCommentToDelete(null);
    onClose();
  };

  if (!request) return null;

  const comments = commentsResponse?.comments || [];
  const totalComments = commentsResponse?.total || 0;

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ 
        pb: 1,
        px: { xs: 2, md: 3 },
        pt: { xs: 2, md: 3 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexDirection: { xs: 'row', sm: 'row' }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1.5, md: 2 },
            flex: 1,
            minWidth: 0
          }}>
            <Badge badgeContent={totalComments} color="primary">
              <MessageIcon sx={{ 
                color: '#e5308a',
                fontSize: { xs: 28, md: 24 }
              }} />
            </Badge>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant={isMobile ? "h6" : "h6"} 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  lineHeight: 1.2
                }}
              >
                {t('comments.title')}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.75rem', md: '0.7rem' },
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('dashboard.requestDetails')} #{request.id}
              </Typography>
            </Box>
          </Box>
          <CloseButton onClick={handleClose}>
            <CloseIcon />
          </CloseButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        px: { xs: 2, md: 3 },
        py: { xs: 1, md: 2 }
      }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          {/* Formulario para nuevo comentario */}
          <FormPaper elevation={0}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                fontSize: { xs: '0.9rem', md: '0.875rem' }
              }}
            >
              {editingComment ? (
                <>
                  <EditIcon sx={{ 
                    fontSize: { xs: 18, md: 16 }, 
                    mr: 1, 
                    color: 'warning.main' 
                  }} />
                  {t('comments.editComment')} #{editingComment.id}
                </>
              ) : (
                t('comments.addComment')
              )}
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={{ xs: 1.5, md: 2 }}>
                {/* Campo de texto */}
                <ResponsiveTextField
                  multiline
                  rows={isMobile ? 4 : 3}
                  placeholder={t('comments.placeholder')}
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  fullWidth
                  variant="outlined"
                  disabled={createCommentMutation.isPending}
                />

                {/* Controles de prioridad y tipo */}
                <ControlsContainer>
                  <ResponsiveFormControl size="small">
                    <InputLabel>{t('comments.priority')}</InputLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        priority: e.target.value as Comment['priority'] 
                      }))}
                      label={t('comments.priority')}
                    >
                      <MenuItem value="low">{t('comments.priorities.low')}</MenuItem>
                      <MenuItem value="normal">{t('comments.priorities.normal')}</MenuItem>
                      <MenuItem value="high">{t('comments.priorities.high')}</MenuItem>
                      <MenuItem value="urgent">{t('comments.priorities.urgent')}</MenuItem>
                    </Select>
                  </ResponsiveFormControl>

                  <ResponsiveFormControl size="small">
                    <InputLabel>{t('comments.type')}</InputLabel>
                    <Select
                      value={formData.isInternal ? 'internal' : 'public'}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        isInternal: e.target.value === 'internal' 
                      }))}
                      label={t('comments.type')}
                    >
                      <MenuItem value="internal">{t('comments.types.internal')}</MenuItem>
                      <MenuItem value="public">{t('comments.types.public')}</MenuItem>
                    </Select>
                  </ResponsiveFormControl>

                  {editingComment && (
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      sx={{ 
                        minWidth: 120,
                        minHeight: { xs: 48, md: 36 },
                        width: { xs: '100%', md: 'auto' }
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                  )}

                  <SubmitButton
                    type="submit"
                    variant="contained"
                    startIcon={<SendIcon />}
                    disabled={!formData.content.trim() || createCommentMutation.isPending || updateCommentMutation.isPending}
                  >
                    {editingComment ? (
                      updateCommentMutation.isPending ? t('common.updating') : t('common.save')
                    ) : (
                      createCommentMutation.isPending ? t('common.sending') : t('common.send')
                    )}
                  </SubmitButton>
                </ControlsContainer>
              </Stack>
            </Box>
          </FormPaper>

          {/* Lista de comentarios */}
          <Box>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                fontSize: { xs: '0.9rem', md: '0.875rem' }
              }}
            >
              {t('comments.history')} ({totalComments})
            </Typography>

            {/* Error state */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t('comments.errorLoading')}
              </Alert>
            )}

            {/* Loading state */}
            {isLoading && (
              <Stack spacing={{ xs: 1.5, md: 2 }}>
                {[1, 2, 3].map((index) => (
                  <Paper 
                    key={index} 
                    elevation={0} 
                    sx={{ 
                      p: { xs: 1.5, md: 2 }, 
                      border: '1px solid #e0e0e0',
                      borderRadius: { xs: 8, md: 12 }
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Skeleton 
                        variant="circular" 
                        width={isMobile ? 48 : 40} 
                        height={isMobile ? 48 : 40} 
                      />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="30%" height={20} />
                        <Skeleton variant="text" width="100%" height={16} />
                        <Skeleton variant="text" width="80%" height={16} />
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}

            {/* Lista de comentarios */}
            {!isLoading && comments.length > 0 && (
              <CommentsListContainer>
                <Stack spacing={{ xs: 1.5, md: 2 }}>
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                    />
                  ))}
                </Stack>
              </CommentsListContainer>
            )}

            {/* Empty state */}
            {!isLoading && comments.length === 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: { xs: 3, md: 4 },
                  color: 'text.secondary'
                }}
              >
                <MessageIcon sx={{ 
                  fontSize: { xs: 56, md: 48 }, 
                  opacity: 0.5, 
                  mb: 2 
                }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.875rem', md: '0.8rem' } }}
                >
                  {t('comments.noComments')}
                </Typography>
                <Typography 
                  variant="caption"
                  sx={{ fontSize: { xs: '0.75rem', md: '0.7rem' } }}
                >
                  {t('comments.addFirstComment')}
                </Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ 
        px: { xs: 2, md: 3 }, 
        pb: { xs: 2, md: 3 },
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        gap: { xs: 1, sm: 1 }
      }}>
        <Button 
          onClick={handleClose} 
          color="inherit"
          sx={{
            minHeight: { xs: 44, md: 36 },
            width: { xs: '100%', sm: 'auto' },
            order: { xs: 2, sm: 1 }
          }}
        >
          {t('common.close')}
        </Button>
        <Button 
          variant="outlined"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['comments', request.id] })}
          disabled={isLoading}
          sx={{
            minHeight: { xs: 44, md: 36 },
            width: { xs: '100%', sm: 'auto' },
            order: { xs: 1, sm: 2 }
          }}
        >
          {t('common.refresh')}
        </Button>
      </DialogActions>

      {/* Modal de confirmación de eliminación */}
      <ConfirmDeleteModal
        open={!!commentToDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={t('comments.delete')}
        message={t('modals.confirmations.deleteComment')}
        itemName={`${t('comments.editingComment')} #${commentToDelete?.id} de ${commentToDelete?.author?.name}`}
        itemPreview={commentToDelete?.content}
        isLoading={deleteCommentMutation.isPending}
        variant="warning"
      />
    </StyledDialog>
  );
};

export default CommentsModal; 