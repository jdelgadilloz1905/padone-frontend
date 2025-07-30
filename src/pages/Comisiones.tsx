import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  useMediaQuery,
  useTheme,
  Divider,
  Avatar,
  Chip,
  Stack

} from '@mui/material';
import { 
  titleStyle, 
  FilterContainer, 
  PageContainer,
  secondaryButtonStyle
} from '../theme/standardStyles';
import {
  AttachMoney as MoneyIcon,
  DirectionsCar as CarIcon,
  TrendingUp as TrendingIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useComisiones } from '../hooks/useComisiones';
import type { ComisionConductor, FiltrosComision } from '../services/comisionService';
import DetalleComisiones from '../components/DetalleComisiones';
import { Refresh as RefreshIcon } from '@mui/icons-material';


// Componente móvil para comisiones de conductor
const ComisionMobileCard = ({ 
  conductor, 
  onVerDetalles,
  formatCurrency 
}: {
  conductor: ComisionConductor;
  onVerDetalles: (conductor: ComisionConductor) => void;
  formatCurrency: (amount: number) => string;
}) => {
  const { t } = useTranslation();
  return (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 2,
        borderRadius: 2,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header con nombre y acciones */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#e91e63', fontSize: '0.875rem' }}>
              {conductor.driver_name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {conductor.driver_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {conductor.driver_phone}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => onVerDetalles(conductor)}
            size="small"
            sx={{
              bgcolor: 'rgba(233, 30, 99, 0.1)',
              color: '#e91e63',
              minWidth: 40,
              minHeight: 40,
              '&:hover': { bgcolor: 'rgba(233, 30, 99, 0.2)' }
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Información de comisiones */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Fila 1: Carreras y Porcentaje */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                🚗 {t('commissions.ridesCompleted')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {conductor.total_rides}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                📊 {t('commissions.averageCommissionPercentage')}
              </Typography>
              <Chip 
                label={`${conductor.average_commission_percentage.toFixed(1)}%`}
                size="small"
                sx={{ 
                  bgcolor: '#e3f2fd', 
                  color: '#1976d2',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            </Box>
          </Box>

          {/* Fila 2: Facturado y Comisiones */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                💰 {t('commissions.totalBilled')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                {formatCurrency(conductor.total_billed)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                💎 {t('commissions.totalCommissionsCol')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#e91e63' }}>
                {formatCurrency(conductor.total_commissions)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Comisiones = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  
  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosComision>({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    page: 1,
    limit: 10
  });
  
  // Estados para la tabla
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para el modal de detalles
  const [selectedConductor, setSelectedConductor] = useState<ComisionConductor | null>(null);
  const [openDetalles, setOpenDetalles] = useState(false);
  
  // Estados para notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Hooks de comisiones
  const { 
    useResumenComisiones, 
    useConductoresComisiones, 
    useEstadisticasComisiones,
    useExportarComisiones 
  } = useComisiones();

  // Llamar a los hooks correctamente
  const { data: resumenData, error: errorResumen, refetch: refetchResumen } = useResumenComisiones(filtros);
  const { data: conductoresData, isLoading: loadingConductores, error: errorConductores, refetch: refetchConductores } = useConductoresComisiones(filtros);
  const { data: estadisticasData, isLoading: loadingEstadisticas, error: errorEstadisticas, refetch: refetchEstadisticas } = useEstadisticasComisiones(filtros);
  const exportarMutation = useExportarComisiones();

  // Debug: Mostrar datos recibidos
  console.log('📊 Comisiones - Datos recibidos:', {
    resumenData,
    conductoresData,
    estadisticasData,
    errorResumen,
    errorConductores,
    errorEstadisticas,
    filtros
  });

  // Manejar cambios en filtros
  const handleFiltroChange = (campo: keyof FiltrosComision, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      page: 1 // Resetear página al cambiar filtros
    }));
    setPage(0); // Resetear página al cambiar filtros
  };

  // Manejar paginación
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    setFiltros(prev => ({
      ...prev,
      page: newPage + 1
    }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    setFiltros(prev => ({
      ...prev,
      limit: newRowsPerPage,
      page: 1
    }));
  };

  // Manejar vista de detalles
  const handleVerDetalles = (conductor: ComisionConductor) => {
    setSelectedConductor(conductor);
    setOpenDetalles(true);
  };

  const handleCloseDetalles = () => {
    setOpenDetalles(false);
    setSelectedConductor(null);
  };

  // Manejar exportación
  const handleExportar = () => {
    exportarMutation.mutate(filtros, {
      onSuccess: () => {
        setNotification({
          open: true,
          message: t('commissions.exportedSuccessfully'),
          severity: 'success'
        });
      },
      onError: () => {
        setNotification({
          open: true,
          message: t('commissions.exportError'),
          severity: 'error'
        });
      }
    });
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Función para refrescar todos los datos
  const handleRefresh = async () => {
    await Promise.all([
      refetchResumen(),
      refetchConductores(),
      refetchEstadisticas()
    ]);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <PageContainer>
        {/* Header unificado */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center',
          mb: 3,
          gap: isMobile ? 2 : 0
        }}>
          <Typography {...titleStyle}>
            {t('commissions.title')}
          </Typography>
          <Stack 
            direction={isMobile ? "column" : "row"} 
            spacing={1}
            sx={{ width: isMobile ? '100%' : 'auto' }}
          >
            <Button
              {...secondaryButtonStyle}
              startIcon={!isMobile && <ExportIcon />}
              onClick={handleExportar}
              disabled={exportarMutation.isPending}
              fullWidth={isMobile}
              size={isMobile ? "medium" : "small"}
              sx={{ minHeight: '44px' }}
            >
              {exportarMutation.isPending ? t('commissions.exporting') : t('commissions.exportCsv')}
            </Button>
          </Stack>
        </Box>

        {/* Filtros - UNIFICADO (SIN Paper) */}
        <FilterContainer>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
            <DatePicker
              label={t('commissions.startDate')}
              value={filtros.start_date ? new Date(filtros.start_date) : null}
              onChange={(date: Date | null) => handleFiltroChange('start_date', date?.toISOString().split('T')[0])}
              slotProps={{
                textField: { 
                  size: 'small', 
                  sx: { 
                    minWidth: 150,
                    '& .MuiInputBase-root': {
                      minHeight: '44px' // Touch-friendly
                    }
                  } 
                }
              }}
            />
            <DatePicker
              label={t('commissions.endDate')}
              value={filtros.end_date ? new Date(filtros.end_date) : null}
              onChange={(date: Date | null) => handleFiltroChange('end_date', date?.toISOString().split('T')[0])}
              slotProps={{
                textField: { 
                  size: 'small', 
                  sx: { 
                    minWidth: 150,
                    '& .MuiInputBase-root': {
                      minHeight: '44px' // Touch-friendly
                    }
                  } 
                }
              }}
            />
            <TextField
              label={t('commissions.driverName')}
              value={filtros.driver_name || ''}
              onChange={(e) => handleFiltroChange('driver_name', e.target.value)}
              size="small"
              sx={{ 
                minWidth: 200,
                '& .MuiInputBase-root': {
                  minHeight: '44px' // Touch-friendly
                }
              }}
              placeholder={t('commissions.driverName')}
            />
          </Box>
          
          
        </FilterContainer>

        {/* Tarjetas de resumen responsive - Estilo Dashboard */}
        {loadingEstadisticas ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <CircularProgress />
          </Box>
        ) : errorEstadisticas ? (
          <Box sx={{ mb: 3 }}>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: '#fff9f9' }}>
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                Error al cargar las estadísticas
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                {errorEstadisticas.message || 'Error desconocido'}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                sx={{ mt: 1 }}
              >
                Reintentar
              </Button>
            </Paper>
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Stack 
              direction={isMobile ? "column" : "row"} 
              spacing={isMobile ? 1.5 : 2} 
              flexWrap={!isMobile ? "wrap" : undefined}
              justifyContent={isMobile ? "center" : 'space-between'}
            >
              {/* Total comisiones */}
          <Box sx={{ 
                flexBasis: { xs: '100%', sm: '45%', md: '22%' }, 
                marginBottom: isMobile ? 0 : 2 
          }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: isMobile ? 1.5 : 2, 
                    height: isMobile ? '80px' : '106px', 
                    borderRadius: 2, 
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      width: isMobile ? 32 : 40, 
                      height: isMobile ? 32 : 40, 
                      borderRadius: '50%', 
                      bgcolor: 'rgba(233, 30, 99, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mr: isMobile ? 1.5 : 2
                    }}
                  >
                    <MoneyIcon 
                      sx={{ 
                        fontSize: isMobile ? 16 : 20, 
                        color: '#e91e63'
                      }} 
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant={isMobile ? "caption" : "body2"} 
                      color="text.secondary"
                      sx={{ 
                        fontWeight: 500,
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {t('commissions.totalCommissions')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: isMobile ? '1.5rem' : '2rem',
                          lineHeight: 1
                        }}
                      >
                      {formatCurrency(estadisticasData?.data.totalCommissions || 0)}
                    </Typography>
                    </Box>
                  </Box>
                </Paper>
                </Box>

              {/* Carreras realizadas */}
              <Box sx={{ 
                flexBasis: { xs: '100%', sm: '45%', md: '22%' }, 
                marginBottom: isMobile ? 0 : 2 
              }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: isMobile ? 1.5 : 2, 
                    height: isMobile ? '80px' : '106px', 
                    borderRadius: 2, 
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      width: isMobile ? 32 : 40, 
                      height: isMobile ? 32 : 40, 
                      borderRadius: '50%', 
                      bgcolor: 'rgba(156, 39, 176, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mr: isMobile ? 1.5 : 2
                    }}
                  >
                    <CarIcon 
                      sx={{ 
                        fontSize: isMobile ? 16 : 20, 
                        color: '#9c27b0'
                      }} 
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant={isMobile ? "caption" : "body2"} 
                      color="text.secondary"
                      sx={{ 
                        fontWeight: 500,
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {t('commissions.ridesCompleted')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: isMobile ? '1.5rem' : '2rem',
                          lineHeight: 1
                        }}
                      >
                      {estadisticasData?.data.totalRides || 0}
                    </Typography>
                    </Box>
                  </Box>
                </Paper>
                </Box>

              {/* Comisión promedio */}
              <Box sx={{ 
                flexBasis: { xs: '100%', sm: '45%', md: '22%' }, 
                marginBottom: isMobile ? 0 : 2 
              }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: isMobile ? 1.5 : 2, 
                    height: isMobile ? '80px' : '106px', 
                    borderRadius: 2, 
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      width: isMobile ? 32 : 40, 
                      height: isMobile ? 32 : 40, 
                      borderRadius: '50%', 
                      bgcolor: 'rgba(63, 81, 181, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mr: isMobile ? 1.5 : 2
                    }}
                  >
                    <TrendingIcon 
                      sx={{ 
                        fontSize: isMobile ? 16 : 20, 
                        color: '#3f51b5'
                      }} 
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant={isMobile ? "caption" : "body2"} 
                      color="text.secondary"
                      sx={{ 
                        fontWeight: 500,
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                     {t('commissions.averageCommission')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: isMobile ? '1.5rem' : '2rem',
                          lineHeight: 1
                        }}
                      >
                      {estadisticasData?.data.averageCommissionPercentage?.toFixed(1) || 0}%
                    </Typography>
                    </Box>
                  </Box>
                </Paper>
                </Box>

              {/* Conductores activos */}
              <Box sx={{ 
                flexBasis: { xs: '100%', sm: '45%', md: '22%' }, 
                marginBottom: isMobile ? 0 : 2 
              }}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: isMobile ? 1.5 : 2, 
                    height: isMobile ? '80px' : '106px', 
                    borderRadius: 2, 
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      width: isMobile ? 32 : 40, 
                      height: isMobile ? 32 : 40, 
                      borderRadius: '50%', 
                      bgcolor: 'rgba(76, 175, 80, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mr: isMobile ? 1.5 : 2
                    }}
                  >
                    <PeopleIcon 
                      sx={{ 
                        fontSize: isMobile ? 16 : 20, 
                        color: '#4caf50'
                      }} 
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant={isMobile ? "caption" : "body2"} 
                      color="text.secondary"
                      sx={{ 
                        fontWeight: 500,
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {t('commissions.totalDrivers')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: isMobile ? '1.5rem' : '2rem',
                          lineHeight: 1
                        }}
                      >
                      {estadisticasData?.data.totalDrivers || 0}
                    </Typography>
                    </Box>
                  </Box>
                </Paper>
                </Box>
            </Stack>
          </Box>
        )}

        {/* Tabla de conductores / Vista móvil condicional */}
        {isMobile ? (
          // Vista móvil - Cards
          <Box>
            {loadingConductores ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : errorConductores ? (
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: '#fff9f9' }}>
                <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                  Error al cargar las comisiones
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  {errorConductores.message || 'Error desconocido'}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  sx={{ mt: 1 }}
                >
                  Reintentar
                </Button>
              </Paper>
            ) : !conductoresData || conductoresData.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('commissions.noData')}
                </Typography>
              </Paper>
            ) : (
              <>
                <Box sx={{ mb: 2 }}>
                  {conductoresData.map((conductor) => (
                    <ComisionMobileCard
                      key={conductor.driver_id}
                      conductor={conductor}
                      onVerDetalles={handleVerDetalles}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </Box>
                
                {/* Paginación móvil */}
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <TablePagination
                    component="div"
                    count={resumenData?.total || 0}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage={t('common.rowsPerPage')}
                    labelDisplayedRows={({ from, to, count }) => t('common.paginationDisplayedRows', { from, to, count })}
                    sx={{
                      '& .MuiTablePagination-toolbar': {
                        flexDirection: 'column',
                        gap: 1
                      },
                      '& .MuiTablePagination-selectLabel': {
                        m: 0
                      },
                      '& .MuiTablePagination-displayedRows': {
                        m: 0
                      }
                    }}
                  />
                </Paper>
              </>
            )}
          </Box>
        ) : (
          // Vista desktop - Tabla
          <Paper sx={{ borderRadius: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('commissions.driver')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('commissions.phone')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('commissions.totalRides')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('commissions.averageCommissionPercentage')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('commissions.totalBilled')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('commissions.totalCommissionsCol')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">{t('commissions.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingConductores ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : errorConductores ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                                                 <Box sx={{ py: 2 }}>
                           <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                             Error al cargar las comisiones
                           </Typography>
                           <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                             {errorConductores.message || 'Error desconocido'}
                           </Typography>
                           <Button
                             variant="outlined"
                             size="small"
                             startIcon={<RefreshIcon />}
                             onClick={handleRefresh}
                             sx={{ mt: 1 }}
                           >
                             Reintentar
                           </Button>
                         </Box>
                      </TableCell>
                    </TableRow>
                  ) : !conductoresData || conductoresData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          {t('commissions.noData')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    conductoresData.map((conductor) => (
                      <TableRow key={conductor.driver_id} hover>
                        <TableCell>{conductor.driver_name}</TableCell>
                        <TableCell align="center">{conductor.driver_phone}</TableCell>
                        <TableCell align="center">{conductor.total_rides}</TableCell>
                        <TableCell align="center">{conductor.average_commission_percentage.toFixed(1)}%</TableCell>
                        <TableCell align="center">{formatCurrency(conductor.total_billed)}</TableCell>
                        <TableCell align="center">{formatCurrency(conductor.total_commissions)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={() => handleVerDetalles(conductor)}
                            size="small"
                            sx={{ color: '#e91e63' }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={resumenData?.total || 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('common.rowsPerPage')}
              labelDisplayedRows={({ from, to, count }) => t('common.paginationDisplayedRows', { from, to, count })}
            />
          </Paper>
        )}

        {/* Modal de detalles responsive */}
        <Dialog
          open={openDetalles}
          onClose={handleCloseDetalles}
          maxWidth="lg"
          fullWidth
          fullScreen={isMobile}
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: isMobile ? 0 : 2,
              margin: isMobile ? 0 : 2
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 1,
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: 600
          }}>
            Detalles de comisiones - {selectedConductor?.driver_name}
          </DialogTitle>
          <DialogContent sx={{ p: isMobile ? 1 : 3 }}>
            {selectedConductor && (
              <DetalleComisiones
                conductorId={selectedConductor.driver_id}
                conductorNombre={selectedConductor.driver_name}
                filtros={filtros}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ 
            p: isMobile ? 2 : 3,
            pt: isMobile ? 1 : 2
          }}>
            <Button 
              onClick={handleCloseDetalles}
              fullWidth={isMobile}
              variant={isMobile ? "contained" : "text"}
              sx={{ 
                minHeight: isMobile ? '44px' : 'auto',
                backgroundColor: isMobile ? '#e91e63' : 'transparent',
                color: isMobile ? 'white' : 'inherit',
                '&:hover': {
                  backgroundColor: isMobile ? '#c2185b' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              {t('common.close')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notificaciones */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setNotification(prev => ({ ...prev, open: false }))}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </PageContainer>
    </LocalizationProvider>
  );
};

export default Comisiones; 