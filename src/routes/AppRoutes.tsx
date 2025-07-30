import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Box, CircularProgress, Typography, useTheme, useMediaQuery, Skeleton, Paper } from '@mui/material';
import authService from '../services/authService';
import { RequireRole } from '../components/auth/RequireRole';
import { useTranslation } from 'react-i18next';

// Layout
const MainLayout = lazy(() => import('../layouts/MainLayout'));

// Pages - Agrupadas por prioridad de carga
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Login = lazy(() => import('../pages/Login'));
const LoginConductor = lazy(() => import('../pages/LoginConductor'));

// Componentes secundarios simplificados
const Conductores = lazy(() => import('../pages/Conductores'));
const Solicitudes = lazy(() => import('../pages/Solicitudes'));
const Clientes = lazy(() => import('../pages/Clientes'));
const ScheduledRides = lazy(() => import('../pages/ScheduledRides'));

const Zonas = lazy(() => import('../pages/Zonas'));
const Comisiones = lazy(() => import('../pages/Comisiones'));

// Páginas de detalle (carga diferida completa)
const DetalleConductor = lazy(() => import('../pages/DetalleConductor'));
const EditarConductor = lazy(() => import('../pages/EditarConductor'));

// Páginas públicas
const TrackingPublico = lazy(() => import('../pages/TrackingPublico'));
const VistaConductor = lazy(() => import('../pages/VistaConductor'));

// Auth auxiliares
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));

// Componente de carga optimizado y responsive
const LoadingFallback = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();

  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: { xs: '50vh', sm: '60vh' },
        p: { xs: 2, sm: 3 },
        gap: { xs: 2, sm: 3 }
      }}
    >
      {/* Skeleton optimizado por dispositivo */}
      {isMobile ? (
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2, mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 2 }} />
        </Box>
      ) : (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 3, 
            bgcolor: 'rgba(229, 48, 138, 0.02)',
            border: '1px solid rgba(229, 48, 138, 0.1)',
            minWidth: 320,
            textAlign: 'center'
          }}
        >
          <CircularProgress 
            size={isMobile ? 40 : 48} 
            thickness={3}
            sx={{ 
              color: '#e5308a',
              mb: 2,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }} 
          />
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            sx={{ 
              fontWeight: 500,
              color: '#e5308a',
              mb: 1
            }}
          >
            {t('app.loadingTitle')}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            {t('app.loadingSubtitle')}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

// Componente de carga minimalista para cambios rápidos
const MinimalLoading = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      height: '200px'
    }}
  >
    <CircularProgress 
      size={32} 
      sx={{ color: '#e5308a' }}
    />
  </Box>
);

// Auth guard mejorado
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const AppRoutes = () => {
  return (
    <>
      <Routes>
        {/* Ruta pública para tracking - carga rápida */}
        <Route 
          path="/track/:trackingCode" 
          element={
            <Suspense fallback={<MinimalLoading />}>
              <TrackingPublico />
            </Suspense>
          } 
        />
        
        {/* Rutas públicas de autenticación - Prioridad alta */}
        <Route 
          path="/login" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Login />
            </Suspense>
          } 
        />
        <Route 
          path="/login-conductor" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <LoginConductor />
            </Suspense>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <Suspense fallback={<MinimalLoading />}>
              <ForgotPassword />
            </Suspense>
          } 
        />
        <Route 
          path="/reset-password/:token" 
          element={
            <Suspense fallback={<MinimalLoading />}>
              <ResetPassword />
            </Suspense>
          } 
        />
        
        {/* Ruta para vista del conductor - SOLO CONDUCTORES */}
        <Route 
          path="/conductor" 
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['conductor']} fallbackRedirect="/login-conductor">
                <Suspense fallback={<LoadingFallback />}>
                  <VistaConductor />
                </Suspense>
              </RequireRole>
            </RequireAuth>
          } 
        />
        
        {/* Protected routes - SOLO ADMINISTRADORES */}
        <Route 
          path="/" 
          element={
            <RequireAuth>
              <RequireRole allowedRoles={['admin']} fallbackRedirect="/conductor">
                <Suspense fallback={<LoadingFallback />}>
                  <MainLayout />
                </Suspense>
              </RequireRole>
            </RequireAuth>
          }
        >
          {/* Dashboard - Carga prioritaria */}
          <Route 
            index 
            element={
              <Suspense fallback={<MinimalLoading />}>
                <Dashboard />
              </Suspense>
            } 
          />
          
          {/* Páginas principales - Carga optimizada */}
          <Route 
            path="conductores" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Conductores />
              </Suspense>
            } 
          />
          <Route 
            path="solicitudes" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Solicitudes />
              </Suspense>
            } 
          />
          <Route 
            path="zonas" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Zonas />
              </Suspense>
            } 
          />
          <Route 
            path="clientes" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Clientes />
              </Suspense>
            } 
          />
          <Route 
            path="comisiones" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Comisiones />
              </Suspense>
            } 
          />
          <Route 
            path="scheduled-rides" 
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ScheduledRides />
              </Suspense>
            } 
          />
          
          {/* Páginas de detalle - Carga diferida */}
          <Route 
            path="conductores/:id" 
            element={
              <Suspense fallback={<MinimalLoading />}>
                <DetalleConductor />
              </Suspense>
            } 
          />
          <Route 
            path="conductores/:id/edit" 
            element={
              <Suspense fallback={<MinimalLoading />}>
                <EditarConductor />
              </Suspense>
            } 
          />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}; 