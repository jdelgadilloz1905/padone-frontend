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
  Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import authService from '../services/authService';
import taxiLogo from '../assets/logo.svg';

// Reutilizar las mismas imágenes del Login
import userWorkingImage from '../assets/user-working.jpg';
import userTaxiImage1 from '../assets/user-taxi-1.jpg';
import userTaxiImage2 from '../assets/user-taxi-2.jpg';

const ForgotPassword = () => {
  // const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('');
  const navigate = useNavigate();

  // Mutation para solicitar recuperación de contraseña
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
    onSuccess: () => {
      console.log('Solicitud de recuperación enviada');
      setSuccess(true);
      setError('');
    },
    onError: (err: any) => {
      console.error('Error solicitando recuperación:', err);
      setError(err?.message || 'Error al procesar la solicitud. Intenta nuevamente.');
      setSuccess(false);
    }
  });

  // Seleccionar imagen de fondo aleatoria
  useEffect(() => {
    const images = [userWorkingImage, userTaxiImage1, userTaxiImage2];
    const randomIndex = Math.floor(Math.random() * images.length);
    setBackgroundImage(images[randomIndex]);
  }, []);

  // Validar formato de email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validaciones frontend
    if (!email) {
      setError('Por favor ingresa tu dirección de email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    // Ejecutar mutation
    forgotPasswordMutation.mutate(email);
  };

  const handleBackToLogin = () => {
    navigate('/login');
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
            sx={{ mb: 1, fontWeight: 'bold', color: '#333', textAlign: 'center' }}
          >
            Recuperar contraseña
          </Typography>

          <Typography 
            variant="body2" 
            sx={{ mb: 3, color: '#666', textAlign: 'center', lineHeight: 1.5 }}
          >
            Ingresa tu dirección de email y te enviaremos un enlace para restablecer tu contraseña
          </Typography>

          {success ? (
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  ¡Solicitud enviada exitosamente!
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Si el email existe en nuestro sistema, recibirás un mensaje con instrucciones para recuperar tu contraseña.
                </Typography>
              </Alert>

              <Button
                fullWidth
                variant="outlined"
                onClick={handleBackToLogin}
                sx={{ 
                  mt: 2,
                  py: 1.5,
                  borderColor: '#e5308a',
                  color: '#e5308a',
                  fontWeight: 'bold',
                  '&:hover': {
                    borderColor: '#c5206a',
                    backgroundColor: 'rgba(229, 48, 138, 0.1)'
                  },
                  borderRadius: 1,
                  textTransform: 'none'
                }}
              >
                Volver al inicio de sesión
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <Typography component="p" sx={{ mb: 1, ml: 1, fontSize: '0.875rem', color: '#666' }}>
                Dirección de email
              </Typography>
              <TextField
                fullWidth
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ejemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="small"
                variant="outlined"
                sx={{ mb: 3 }}
                disabled={forgotPasswordMutation.isPending}
                InputProps={{
                  sx: { borderRadius: 1 }
                }}
              />

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
                disabled={forgotPasswordMutation.isPending}
                sx={{ 
                  mt: 1,
                  mb: 3,
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
                {forgotPasswordMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Enviar enlace de recuperación'
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

export default ForgotPassword; 