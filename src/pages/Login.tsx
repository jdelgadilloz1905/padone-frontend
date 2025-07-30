import { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import authService from '../services/authService';
import type { LoginCredentials } from '../services/authService';
import taxiLogo from '../assets/logo.svg';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// Importamos las imágenes que serán usadas como fondos
import userWorkingImage from '../assets/user-working.jpg';
import userTaxiImage1 from '../assets/user-taxi-1.jpg';
import userTaxiImage2 from '../assets/user-taxi-2.jpg';

// Variable para activar/desactivar el modo de desarrollo
const isDevelopmentMode = false; // Cambiar a false para usar API real

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const navigate = useNavigate();

  // Mutation para login usando TanStack Query
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => {
      return authService.login(credentials);
    },
    onSuccess: (data) => {
      console.log('Login exitoso:', data);
      console.log('Token guardado:', authService.getToken());
      console.log('Usuario guardado:', authService.getCurrentUser());
      console.log('Rol del usuario:', authService.getUserRole());
      
      // Redirigir al dashboard según el rol del usuario
      const redirectPath = authService.getRedirectPath();
      console.log('Redirigiendo a:', redirectPath);
      
      // Forzar la redirección
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
    },
    onError: (err: any) => {
      console.error('Error de login:', err);
      
      // Manejar diferentes tipos de errores
      if (err?.response?.status === 401) {
        setError(t('auth.invalidCredentials', 'Credenciales inválidas'));
      } else if (err?.response?.status === 404) {
        setError('Servicio no disponible. Verifica la configuración del servidor.');
      } else if (err?.response?.status >= 500) {
        setError('Error del servidor. Intenta de nuevo más tarde.');
      } else if (err?.message?.includes('Network Error') || err?.code === 'NETWORK_ERROR') {
        setError('Error de conexión. Verifica tu internet.');
      } else if (err?.message?.includes('Sesión expirada')) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        setError(err?.message || t('auth.loginError', 'Error al iniciar sesión'));
      }
    }
  });

  // Verificar si ya existe una sesión activa
  useEffect(() => {
    if (authService.isAuthenticated()) {
      // Redirigir según el rol del usuario
      const redirectPath = authService.getRedirectPath();
      navigate(redirectPath);
    }
  }, [navigate]);

  // Seleccionar una imagen de fondo aleatoria cuando el componente se monte
  useEffect(() => {
    const images = [userWorkingImage, userTaxiImage1, userTaxiImage2];
    const randomIndex = Math.floor(Math.random() * images.length);
    setBackgroundImage(images[randomIndex]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Validar campos requeridos
      if (!email || !password) {
        setError(t('auth.requiredFields'));
        return;
      }

      // Intentar login con la API   
      if (isDevelopmentMode) {
        // Modo desarrollo: simulación local
        try {
          authService.simulateLogin(email, password);
          // Redirigir según el rol del usuario
          const redirectPath = authService.getRedirectPath();
          navigate(redirectPath);
        } catch (devError) {
          console.error('Error en modo desarrollo:', devError);
          setError(t('auth.loginError'));
        }
      } else {
        // Modo producción: usar React Query mutation
        try {
          loginMutation.mutate({ email, password });
        } catch (mutationError) {
          console.error('Error ejecutando mutation:', mutationError);
          setError(t('auth.loginError'));
        }
      }
    } catch (err: any) {
      console.error('Error inesperado en handleSubmit:', err);
      setError(t('auth.loginError'));
      // Evitar que el error se propague y cause un refresh
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'auto',
        padding: 2
      }}
    >
      {/* Capa de imagen de fondo */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: -2,
        }}
      />
      
      {/* Capa de color rosado por encima */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#e5308a',
          opacity: 0.4,
          zIndex: -1,
        }}
      />
      
      <Container maxWidth="xs" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Paper 
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            padding: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <Box 
            component="img"
            src={taxiLogo}
            alt="Taxi Logo"
            sx={{ 
              width: 80, 
              height: 80, 
              mb: 2
            }}
          />
          
          <Typography 
            component="h1" 
            variant="h5" 
            sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}
          >
            {t('auth.panelTitle', 'Panel administrativo')}
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Typography component="p" sx={{ mb: 1, ml: 1, fontSize: '0.875rem', color: '#666' }}>
              {t('auth.email')}
            </Typography>
            <TextField
              fullWidth
              id="email"
              name="email"
              autoComplete="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
              variant="outlined"
              sx={{ mb: 2 }}
              disabled={loginMutation.isPending}
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            
            <Typography component="p" sx={{ mb: 1, ml: 1, fontSize: '0.875rem', color: '#666' }}>
              {t('auth.password')}
            </Typography>
            <TextField
              fullWidth
              name="password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder={t('auth.password')}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="small"
              variant="outlined"
              sx={{ mb: 2 }}
              disabled={loginMutation.isPending}
              InputProps={{
                sx: { borderRadius: 1 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
              <Typography 
                variant="body2" 
                sx={{ fontSize: '0.8rem', color: '#e5308a', cursor: 'pointer' }}
                onClick={() => navigate('/forgot-password')}
              >
                {t('auth.forgotPassword')}
              </Typography>
            </Box>
            
            {error && (
              <Typography color="error" align="center" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Typography>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loginMutation.isPending}
              sx={{ 
                mt: 2,
                mb: 2,
                py: 1.5,
                bgcolor: '#e5308a',
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: '#c5206a',
                },
                borderRadius: 1,
                textTransform: 'none'
              }}
            >
              {loginMutation.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                t('auth.login')
              )}
            </Button>
            
            {/* <Box textAlign="center">
              <Button
                variant="text"
                onClick={() => navigate('/login-conductor')}
                sx={{ 
                  fontSize: '0.8rem', 
                  color: '#e5308a',
                  textTransform: 'none'
                }}
              >
                Acceso para conductores
              </Button>
            </Box> */}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 