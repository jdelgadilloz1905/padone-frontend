import { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { useComisiones } from '../hooks/useComisiones';
import type { FiltrosComision } from '../services/comisionService';

interface DetalleComisionesProps {
  conductorId: number;
  conductorNombre: string;
  filtros?: FiltrosComision;
}

const DetalleComisiones = ({ conductorId, conductorNombre, filtros }: DetalleComisionesProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { useComisionesConductor } = useComisiones();
  const { data: response, isLoading, error } = useComisionesConductor(conductorId, filtros);

  // Formatear moneda
  const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numericAmount);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Formato americano: MM/DD/YYYY
    const dateStr = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    // Formato 12 horas sin segundos
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateStr}, ${timeStr}`;
  };

  // Manejar paginación
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Extraer datos de la respuesta
  // La respuesta ya viene con la estructura {data: [...], summary: {...}, driverInfo: {...}}
  const comisiones = Array.isArray(response?.data) ? response.data : [];
  const summary = response?.summary;
  const driverInfo = response?.driverInfo;
  


  // Datos paginados con validación adicional
  const comisionesPaginadas = Array.isArray(comisiones) ? comisiones.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  ) : [];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error al cargar los detalles de comisiones
      </Alert>
    );
  }

  return (
    <Box>
      {/* Resumen */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Resumen de {driverInfo?.name || conductorNombre}
        </Typography>
        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total de carreras
            </Typography>
            <Typography variant="h6">
              {summary?.totalRides || 0}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total facturado
            </Typography>
            <Typography variant="h6">
              {formatCurrency(summary?.totalBilled || 0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total comisiones
            </Typography>
            <Typography variant="h6">
              {formatCurrency(summary?.totalCommissions || 0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              % Comisión promedio
            </Typography>
            <Typography variant="h6">
              {summary?.averageCommissionPercentage?.toFixed(1) || 0}%
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabla de detalles */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>ID Carrera</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Origen</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Destino</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Monto</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">% Comisión</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Comisión</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Método pago</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comisionesPaginadas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No hay comisiones disponibles
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              comisionesPaginadas.map((comision, index) => (
                <TableRow key={`${comision.ride_id}-${index}`} hover>
                  <TableCell>{formatDate(comision.date)}</TableCell>
                  <TableCell>{comision.ride_id}</TableCell>
                  <TableCell>{comision.tracking_code}</TableCell>
                  <TableCell>{comision.client_name}</TableCell>
                  <TableCell>{comision.origin}</TableCell>
                  <TableCell>{comision.destination}</TableCell>
                  <TableCell align="center">{formatCurrency(comision.amount)}</TableCell>
                  <TableCell align="center">{comision.commission_percentage}%</TableCell>
                  <TableCell align="center">{formatCurrency(comision.commission_amount)}</TableCell>
                  <TableCell align="center">{comision.payment_method}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      <TablePagination
        component="div"
        count={comisiones.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </Box>
  );
};

export default DetalleComisiones; 