import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Avatar,
  Paper,
  Stack,
  Card,
  CardContent,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

// Icono de WhatsApp como SVG
const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.687"/>
  </svg>
);

// =====================================================================
// INTERFACES Y TIPOS
// =====================================================================

export interface ScheduledRideDetailsModalProps {
  open: boolean;
  onClose: () => void;
  ride: any | null; // Tipo de carrera programada
}

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================

const ScheduledRideDetailsModal: React.FC<ScheduledRideDetailsModalProps> = ({
  open,
  onClose,
  ride
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!ride) {
    return null;
  }

  // Funciones utilitarias
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'assigned': return 'primary';
      case 'in_progress': return 'secondary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'normal': return 'info';
      case 'high': return 'warning';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'assigned': return 'Asignada';
      case 'in_progress': return 'En Proceso';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityTranslation = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'normal': return 'Normal';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  const cleanPhoneNumber = (phoneNumber: string): string => {
    return phoneNumber.replace(/[\s\-\(\)]/g, '');
  };

  const handleContactClient = () => {
    const cleanPhone = cleanPhoneNumber(ride.client_phone);
    window.open(`tel:${cleanPhone}`, '_self');
  };

  const handleMessageClient = () => {
    const cleanPhone = cleanPhoneNumber(ride.client_phone);
    const message = `Hola ${ride.client_name}, soy de Taxi Rosa. Me comunico contigo sobre tu carrera programada para el ${ride.scheduled_date} a las ${ride.scheduled_time}.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateObj = new Date(`${date}T${time}`);
      return dateObj.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return `${date} ${time}`;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          borderRadius: isMobile ? 0 : 2, 
          maxHeight: isMobile ? '100vh' : '90vh',
          margin: isMobile ? 0 : 2,
          ...(isMobile && {
            width: '100%',
            height: '100%'
          })
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        px: isMobile ? 2 : 3,
        pt: isMobile ? 2 : 3
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant={isMobile ? "h5" : "h6"} 
              sx={{ 
                fontWeight: 'bold',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                pr: isMobile ? 6 : 0
              }}
            >
              Carrera Programada #{ride.id}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={getStatusTranslation(ride.status)}
                color={getStatusColor(ride.status) as any}
                size={isMobile ? "medium" : "small"}
                sx={{ 
                  height: isMobile ? '32px' : 'auto',
                  fontSize: isMobile ? '0.875rem' : '0.75rem'
                }}
              />
              <Chip
                label={getPriorityTranslation(ride.priority)}
                color={getPriorityColor(ride.priority) as any}
                size={isMobile ? "medium" : "small"}
                sx={{ 
                  height: isMobile ? '32px' : 'auto',
                  fontSize: isMobile ? '0.875rem' : '0.75rem'
                }}
              />
            </Box>
          </Box>
          <IconButton 
            onClick={onClose} 
            size={isMobile ? "large" : "small"}
            sx={{
              position: isMobile ? 'absolute' : 'relative',
              top: isMobile ? 16 : 'auto',
              right: isMobile ? 16 : 'auto',
              ...(isMobile && {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)'
                }
              })
            }}
          >
            <CloseIcon sx={{ fontSize: isMobile ? 28 : 20 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        px: isMobile ? 2 : 3,
        py: isMobile ? 2 : 3
      }}>
        <Stack spacing={isMobile ? 2 : 3}>
          {/* Información de Cliente */}
          <Card elevation={0} sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: isMobile ? 3 : 1
          }}>
            <CardContent sx={{ p: isMobile ? 2.5 : 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ 
                  bgcolor: '#e5308a', 
                  mr: 2,
                  width: isMobile ? 48 : 40,
                  height: isMobile ? 48 : 40
                }}>
                  <PersonIcon sx={{ fontSize: isMobile ? 28 : 24 }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant={isMobile ? "h6" : "h6"}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: isMobile ? '1.125rem' : '1rem'
                    }}
                  >
                    {ride.client_name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.875rem' : '0.75rem' }}
                  >
                    {ride.client_phone}
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={isMobile ? 1.5 : 1}>
                <Button
                  variant="outlined"
                  startIcon={<PhoneIcon />}
                  onClick={handleContactClient}
                  size={isMobile ? "medium" : "small"}
                  fullWidth={isMobile}
                  sx={{
                    minHeight: isMobile ? '44px' : 'auto',
                    borderColor: '#e5308a',
                    color: '#e5308a',
                    '&:hover': {
                      borderColor: '#d12a87',
                      backgroundColor: 'rgba(229, 48, 138, 0.04)'
                    }
                  }}
                >
                  Llamar
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<WhatsAppIcon size={isMobile ? 24 : 20} />}
                  onClick={handleMessageClient}
                  size={isMobile ? "medium" : "small"}
                  fullWidth={isMobile}
                  sx={{
                    minHeight: isMobile ? '44px' : 'auto',
                    borderColor: '#757575',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  WhatsApp
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Información de Programación */}
          <Paper elevation={0} sx={{ 
            p: isMobile ? 2.5 : 2, 
            border: '1px solid #e0e0e0',
            borderRadius: isMobile ? 3 : 1
          }}>
            <Typography 
              variant={isMobile ? "h5" : "h6"} 
              sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center',
                fontSize: isMobile ? '1.25rem' : '1.125rem'
              }}
            >
              <ScheduleIcon sx={{ 
                mr: 1, 
                color: '#e5308a',
                fontSize: isMobile ? 28 : 24
              }} />
              Programación
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: isMobile ? 3 : 2, 
              flexDirection: { xs: 'column', md: 'row' } 
            }}>
              <Box sx={{ flex: 1 }}>
                <Stack spacing={isMobile ? 2 : 1}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    p: isMobile ? 1.5 : 0,
                    borderRadius: isMobile ? 2 : 0,
                    bgcolor: isMobile ? 'rgba(229, 48, 138, 0.04)' : 'transparent'
                  }}>
                    <CalendarIcon sx={{ 
                      mr: isMobile ? 2 : 1, 
                      fontSize: isMobile ? 24 : 20, 
                      color: '#e5308a'
                    }} />
                    <Box>
                      <Typography 
                        variant="body2"
                        color="text.secondary"
                        sx={{ 
                          fontSize: isMobile ? '0.75rem' : '0.6875rem',
                          fontWeight: 500
                        }}
                      >
                        Fecha y Hora
                      </Typography>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontSize: isMobile ? '1rem' : '0.875rem',
                          fontWeight: isMobile ? 500 : 400
                        }}
                      >
                        {formatDateTime(ride.scheduled_date, ride.scheduled_time)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    p: isMobile ? 1.5 : 0,
                    borderRadius: isMobile ? 2 : 0,
                    bgcolor: isMobile ? 'rgba(76, 175, 80, 0.04)' : 'transparent'
                  }}>
                    <MoneyIcon sx={{ 
                      mr: isMobile ? 2 : 1, 
                      fontSize: isMobile ? 24 : 20, 
                      color: '#4caf50'
                    }} />
                    <Box>
                      <Typography 
                        variant="body2"
                        color="text.secondary"
                        sx={{ 
                          fontSize: isMobile ? '0.75rem' : '0.6875rem',
                          fontWeight: 500
                        }}
                      >
                        Costo Estimado
                      </Typography>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontSize: isMobile ? '1rem' : '0.875rem',
                          fontWeight: isMobile ? 600 : 400,
                          color: isMobile ? '#4caf50' : 'inherit'
                        }}
                      >
                        ${(Number(ride.estimated_cost) || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                  {ride.driver_id && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: isMobile ? 1.5 : 0,
                      borderRadius: isMobile ? 2 : 0,
                      bgcolor: isMobile ? 'rgba(63, 81, 181, 0.04)' : 'transparent'
                    }}>
                      <CarIcon sx={{ 
                        mr: isMobile ? 2 : 1, 
                        fontSize: isMobile ? 24 : 20, 
                        color: '#3f51b5'
                      }} />
                      <Box>
                        <Typography 
                          variant="body2"
                          color="text.secondary"
                          sx={{ 
                            fontSize: isMobile ? '0.75rem' : '0.6875rem',
                            fontWeight: 500
                          }}
                        >
                          Conductor
                        </Typography>
                        <Typography 
                          variant="body2"
                          sx={{ 
                            fontSize: isMobile ? '1rem' : '0.875rem',
                            fontWeight: isMobile ? 500 : 400
                          }}
                        >
                          Asignado
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>
          </Paper>

          {/* Información de Ruta */}
          <Paper elevation={0} sx={{ 
            p: isMobile ? 2.5 : 2, 
            border: '1px solid #e0e0e0',
            borderRadius: isMobile ? 3 : 1
          }}>
            <Typography 
              variant={isMobile ? "h5" : "h6"} 
              sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center',
                fontSize: isMobile ? '1.25rem' : '1.125rem'
              }}
            >
              <LocationIcon sx={{ 
                mr: 1, 
                color: '#e5308a',
                fontSize: isMobile ? 28 : 24
              }} />
              Ruta
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: isMobile ? 3 : 2, 
              flexDirection: 'column'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                mb: isMobile ? 2 : 1 
              }}>
                <Box
                  sx={{
                    width: isMobile ? 16 : 12,
                    height: isMobile ? 16 : 12,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    mt: 0.5,
                    mr: 2,
                    flexShrink: 0
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: isMobile ? '0.875rem' : '0.75rem',
                      fontWeight: 500
                    }}
                  >
                    Origen
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      fontSize: isMobile ? '1rem' : '0.875rem',
                      wordWrap: 'break-word',
                      lineHeight: 1.5
                    }}
                  >
                    {ride.pickup_location}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: isMobile ? 16 : 12,
                    height: isMobile ? 16 : 12,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                    mt: 0.5,
                    mr: 2,
                    flexShrink: 0
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: isMobile ? '0.875rem' : '0.75rem',
                      fontWeight: 500
                    }}
                  >
                    Destino
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      fontSize: isMobile ? '1rem' : '0.875rem',
                      wordWrap: 'break-word',
                      lineHeight: 1.5
                    }}
                  >
                    {ride.destination}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Observaciones (si existen) */}
          {ride.notes && (
            <Paper elevation={0} sx={{ 
              p: isMobile ? 2.5 : 2, 
              border: '1px solid #e0e0e0',
              borderRadius: isMobile ? 3 : 1
            }}>
              <Typography 
                variant={isMobile ? "h5" : "h6"} 
                sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: isMobile ? '1.25rem' : '1.125rem'
                }}
              >
                <NotesIcon sx={{ 
                  mr: 1, 
                  color: '#e5308a',
                  fontSize: isMobile ? 28 : 24
                }} />
                Observaciones
              </Typography>
              <Typography 
                variant="body1"
                sx={{ 
                  fontSize: isMobile ? '1rem' : '0.875rem',
                  lineHeight: 1.6,
                  color: 'text.secondary'
                }}
              >
                {ride.notes}
              </Typography>
            </Paper>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ 
        px: isMobile ? 2 : 3, 
        pb: isMobile ? 2 : 3,
        pt: isMobile ? 1 : 2,
        justifyContent: 'center'
      }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          size={isMobile ? "large" : "medium"}
          sx={{
            minHeight: isMobile ? '48px' : 'auto',
            minWidth: isMobile ? '200px' : '120px',
            borderColor: '#e5308a',
            color: '#e5308a',
            '&:hover': {
              borderColor: '#d12a87',
              backgroundColor: 'rgba(229, 48, 138, 0.04)'
            }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduledRideDetailsModal;