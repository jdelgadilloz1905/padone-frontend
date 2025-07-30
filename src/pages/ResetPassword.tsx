import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container, 
  CircularProgress,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  // LinearProgress
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle, Cancel } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import authService from '../services/authService';
import taxiLogo from '../assets/logo.svg';

// Reutilizar las mismas imágenes del Login
import userWorkingImage from '../assets/user-working.jpg';
import userTaxiImage1 from '../assets/user-taxi-1.jpg';
import userTaxiImage2 from '../assets/user-taxi-2.jpg';

const ResetPassword = () => {
  // const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  const navigate = useNavigate();

  // Query para validar el token al cargar la página
  const tokenValidationQuery = useQuery({
    queryKey: ['validateResetToken', token],
    queryFn: () => authService.validateResetToken(token!),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false
  });

  // Mutation para resetear contraseña
  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, password, confirmPassword }: { token: string, password: string, confirmPassword: string }) => 
      authService.resetPassword(token, password, confirmPassword),
    onSuccess: () => {
      console.log('Contraseña restablecida exitosamente');
      setSuccess(true);
      setError('');
    },
    onError: (err: any) => {
      console.error('Error restableciendo contraseña:', err);
      setError(err?.message || 'Error al restablecer la contraseña. Intenta nuevamente.');
      setSuccess(false);
    }
  });

  // Seleccionar imagen de fondo aleatoria
  useEffect(() => {
    const images = [userWorkingImage, userTaxiImage1, userTaxiImage2];
    const randomIndex = Math.floor(Math.random() * images.length);
    setBackgroundImage(images[randomIndex]);
  }, []);

  // Validar fortaleza de contraseña en tiempo real
  const getPasswordStrength = (password: string) => {
    return authService.validatePasswordStrength(password);
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones frontend
    if (!password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!passwordStrength.isValid) {
      setError('La contraseña no cumple con los criterios de seguridad');
      return;
    }

    if (!token) {
      setError('Token de recuperación inválido');
      return;
    }

    // Ejecutar mutation
    resetPasswordMutation.mutate({ token, password, confirmPassword });
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  // Si no hay token en la URL, redirigir
  if (!token) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" color="error">
          Token de recuperación no válido
        </Typography>
        <Button onClick={handleBackToLogin} sx={{ mt: 2 }}>
          Volver al inicio de sesión
        </Button>
      </Box>
    );
  }

  // Mostrar loading mientras se valida el token
  if (tokenValidationQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} sx={{ color: '#e5308a' }} />
      </Box>
    );
  }

  // Si el token no es válido, mostrar error
  if (tokenValidationQuery.isError || tokenValidationQuery.data === false) {
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
          padding: 2
        }}
      >
        <Container maxWidth="xs">
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Box 
              component="img"
              src={taxiLogo}
              alt="Taxi Logo"
              sx={{ width: 80, height: 80, mb: 2 }}
            />
            <Typography variant="h6" color="error" sx={{ mb: 2 }}>
              Enlace de recuperación expirado
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
              El enlace de recuperación ha expirado o no es válido. Por favor, solicita uno nuevo.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/forgot-password')}
              sx={{ 
                mb: 2,
                bgcolor: '#e5308a',
                '&:hover': { bgcolor: '#c5206a' }
              }}
            >
              Solicitar nuevo enlace
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleBackToLogin}
              sx={{ 
                borderColor: '#e5308a',
                color: '#e5308a',
                '&:hover': { borderColor: '#c5206a' }
              }}
            >
              Volver al inicio de sesión
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

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
      
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Paper 
          elevation={3}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            padding: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
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
            sx={{ mb: 1, fontWeight: 'bold', color: '#333', textAlign: 'center' }}
          >
            Nueva contraseña
          </Typography>

          <Typography 
            variant="body2" 
            sx={{ mb: 3, color: '#666', textAlign: 'center', lineHeight: 1.5 }}
          >
            Ingresa tu nueva contraseña. Debe cumplir con los criterios de seguridad mostrados abajo.
          </Typography>

          {success ? (
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  ¡Contraseña restablecida exitosamente!
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Tu contraseña ha sido actualizada. Ya puedes iniciar sesión con tu nueva contraseña.
                </Typography>
              </Alert>

              <Button
                fullWidth
                variant="contained"
                onClick={handleBackToLogin}
                sx={{ 
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
                Ir al inicio de sesión
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              {/* Campo de nueva contraseña */}
              <Typography component="p" sx={{ mb: 1, ml: 1, fontSize: '0.875rem', color: '#666' }}>
                Nueva contraseña
              </Typography>
              <TextField
                fullWidth
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Ingresa tu nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="small"
                variant="outlined"
                sx={{ mb: 2 }}
                disabled={resetPasswordMutation.isPending}
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

              {/* Campo de confirmar contraseña */}
              <Typography component="p" sx={{ mb: 1, ml: 1, fontSize: '0.875rem', color: '#666' }}>
                Confirmar contraseña
              </Typography>
              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirma tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                size="small"
                variant="outlined"
                sx={{ mb: 3 }}
                disabled={resetPasswordMutation.isPending}
                InputProps={{
                  sx: { borderRadius: 1 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              {/* Indicador de fortaleza de contraseña */}
              {password && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium', color: '#666' }}>
                    Criterios de seguridad:
                  </Typography>
                  {passwordStrength.errors.map((error, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Cancel sx={{ color: '#f44336', fontSize: 16, mr: 1 }} />
                      <Typography variant="body2" sx={{ color: '#f44336', fontSize: '0.8rem' }}>
                        {error}
                      </Typography>
                    </Box>
                  ))}
                  {passwordStrength.isValid && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CheckCircle sx={{ color: '#4caf50', fontSize: 16, mr: 1 }} />
                      <Typography variant="body2" sx={{ color: '#4caf50', fontSize: '0.8rem' }}>
                        ¡Contraseña segura!
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Indicador de coincidencia de contraseñas */}
              {confirmPassword && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    {password === confirmPassword ? (
                      <CheckCircle sx={{ color: '#4caf50', fontSize: 16, mr: 1 }} />
                    ) : (
                      <Cancel sx={{ color: '#f44336', fontSize: 16, mr: 1 }} />
                    )}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: password === confirmPassword ? '#4caf50' : '#f44336', 
                        fontSize: '0.8rem' 
                      }}
                    >
                      {password === confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                    </Typography>
                  </Box>
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    {error}
                  </Typography>
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={resetPasswordMutation.isPending || !passwordStrength.isValid || password !== confirmPassword}
                sx={{ 
                  mt: 1,
                  mb: 3,
                  py: 1.5,
                  bgcolor: '#e5308a',
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: '#c5206a',
                  },
                  '&:disabled': {
                    bgcolor: '#ccc',
                  },
                  borderRadius: 1,
                  textTransform: 'none'
                }}
              >
                {resetPasswordMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Actualizar contraseña'
                )}
              </Button>

              <Box textAlign="center">
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleBackToLogin}
                  sx={{ 
                    fontSize: '0.875rem', 
                    color: '#e5308a',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  ← Volver al inicio de sesión
                </Link>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPassword; 