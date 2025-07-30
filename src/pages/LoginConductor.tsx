import { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { conductorService } from '../services/conductorService';
import authService from '../services/authService';
import PhoneNumberInput from '../components/PhoneNumberInput';
import { usePhoneValidation } from '../hooks/usePhoneValidation';
import taxiLogo from '../assets/logo.svg';

// Importamos las imágenes que serán usadas como fondos
import userWorkingImage from '../assets/user-working.jpg';
import userTaxiImage1 from '../assets/user-taxi-1.jpg';
import userTaxiImage2 from '../assets/user-taxi-2.jpg';

const LoginConductor = () => {
  const { t } = useTranslation();
  const [phoneNumber, setphoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSolicitado, setOtpSolicitado] = useState(false);
  const [error, setError] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const navigate = useNavigate();
  const { validatePhone, formatForAPI } = usePhoneValidation();

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

  // Mutation para solicitar OTP
  const requestOtpMutation = useMutation({
    mutationFn: (phoneNumber: string) => 
      conductorService.requestOtp(phoneNumber),
    onSuccess: (data) => {
      console.log('OTP solicitado exitosamente:', data);
      setOtpSolicitado(true);
    },
    onError: (err: any) => {
      console.error('Error al solicitar OTP:', err);
      
      if (err?.response?.status === 400) {
        setError(err.response.data?.message || 'Datos inválidos');
      } else if (err?.response?.status === 404) {
        setError('Número de teléfono no encontrado en el sistema');
      } else if (err?.response?.status >= 500) {
        setError('Error del servidor. Intenta de nuevo más tarde.');
      } else if (err?.message?.includes('Network Error') || err?.code === 'NETWORK_ERROR') {
        setError('Error de conexión. Verifica tu internet.');
      } else {
        setError(err?.message || t('auth.otpRequestError', 'Error al solicitar código'));
      }
    }
  });

  // Mutation para verificar OTP
  const verifyOtpMutation = useMutation({
    mutationFn: (credentials: { phoneNumber: string; otp: string }) => 
      conductorService.verifyOtp(credentials.phoneNumber, credentials.otp),
    onSuccess: (data) => {
      console.log('✅ Verificación OTP exitosa:', data);
      
      try {
        // Detectar automáticamente la estructura del token
        let sessionToken = null;
        let userData = null;
        
        // Verificar si hay data wrapper
        if (data && typeof data === 'object') {
          // Buscar token en diferentes ubicaciones posibles
          sessionToken = data.session_token || 
                        data.access_token || 
                        data.token ||
                        data.data?.session_token || 
                        data.data?.access_token || 
                        data.data?.token;
          
          // Usar data wrapper si existe, sino usar data directamente
          userData = data.data || data;
        }
        
        console.log('🔍 Token detectado:', sessionToken);
        console.log('🔍 User data procesada:', userData);
        
        if (!sessionToken) {
          throw new Error('No se recibió token de sesión del servidor. Respuesta: ' + JSON.stringify(data));
        }
        
        // Guardar token
        localStorage.setItem('token', sessionToken);
        
        // Guardar datos de usuario sin tokens
        const cleanUserData = { ...userData };
        delete cleanUserData.session_token;
        delete cleanUserData.access_token;
        delete cleanUserData.token;
        
        localStorage.setItem('user', JSON.stringify(cleanUserData));
        localStorage.setItem('userRole', 'conductor');
        
        console.log('✅ Datos guardados correctamente, redirigiendo a /conductor');
        
        // Redirigir al dashboard del conductor
        navigate('/conductor');
      } catch (err: any) {
        console.error('❌ Error procesando respuesta exitosa:', err);
        setError('Error procesando la respuesta del servidor: ' + (err.message || 'Error desconocido'));
      }
    },
    onError: (err: any) => {
      console.error('❌ Error al verificar OTP:', err);
      
      // Logging detallado del error
      console.error('❌ Error completo:', {
        message: err.message,
        status: err.status,
        response: err.response,
        stack: err.stack
      });
      
      if (err?.response?.status === 401) {
        setError(t('auth.invalidOtp', 'Código OTP inválido'));
      } else if (err?.response?.status === 400) {
        setError(err.response.data?.message || 'Código OTP expirado o inválido');
      } else if (err?.response?.status === 404) {
        setError('Sesión expirada. Solicita un nuevo código.');
      } else if (err?.response?.status >= 500) {
        setError('Error del servidor. Intenta de nuevo más tarde.');
      } else if (err?.message?.includes('Network Error') || err?.code === 'NETWORK_ERROR') {
        setError('Error de conexión. Verifica tu internet.');
      } else {
        // Error genérico con más información
        setError(`Error al verificar código: ${err?.message || 'Error desconocido'}`);
      }
    }
  });

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPhoneError('');
    
    try {
      // Validar número de teléfono
      const phoneValidation = validatePhone(phoneNumber);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.errorMessage || 'Número de teléfono inválido');
        return;
      }

      // Formatear número para la API
      const formattedPhone = formatForAPI(phoneNumber);
      console.log('📱 Enviando número formateado:', formattedPhone);

      // Solicitar OTP
      requestOtpMutation.mutate(formattedPhone);
    } catch (err: any) {
      console.error('Error inesperado en handleRequestOtp:', err);
      setError(t('auth.otpRequestError', 'Error al solicitar código'));
      // Evitar que el error se propague y cause un refresh
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    console.log('🔐 Iniciando verificación OTP...', { phoneNumber, otp });
    
    try {
      // Validar campo OTP
      if (!otp || otp.trim().length === 0) {
        setError(t('auth.requiredOtp'));
        return;
      }

      console.log('📞 Llamando verifyOtp mutation...');
      // Verificar OTP
      verifyOtpMutation.mutate({ phoneNumber, otp });
    } catch (err: any) {
      console.error('❌ Error inesperado en handleVerifyOtp:', err);
      setError(t('auth.otpVerificationError', 'Error al verificar código'));
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
            Panel del Conductor
          </Typography>
          
          {!otpSolicitado ? (
            // Paso 1: Formulario para solicitar OTP
            <Box component="form" onSubmit={handleRequestOtp} sx={{ width: '100%' }}>
              <PhoneNumberInput
                value={phoneNumber}
                onChange={(value) => {
                  setphoneNumber(value || '');
                  setPhoneError(''); // Limpiar error al cambiar
                }}
                label={t('auth.phoneNumber', 'Número de teléfono')}
                placeholder="(555) 123-4567"
                error={!!phoneError}
                helperText={phoneError}
                disabled={requestOtpMutation.isPending}
                defaultCountry="US"
                autoFocus
                required
              />
              
              {error && (
                <Typography color="error" align="center" sx={{ mt: 2, mb: 2 }}>
                  {error}
                </Typography>
              )}
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={requestOtpMutation.isPending}
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
                {requestOtpMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  t('auth.requestOtp')
                )}
              </Button>
            </Box>
          ) : (
            // Paso 2: Formulario para verificar OTP
            <Box component="form" onSubmit={handleVerifyOtp} sx={{ width: '100%' }}>
              <Typography component="p" sx={{ mb: 3, textAlign: 'center', fontSize: '0.9rem' }}>
                {t('auth.otpSent')}
              </Typography>
              
              <Typography component="p" sx={{ mb: 1, ml: 1, fontSize: '0.875rem', color: '#666' }}>
                {t('auth.otp')}
              </Typography>
              <TextField
                fullWidth
                id="otp"
                name="otp"
                placeholder={t('auth.otp')}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                size="small"
                variant="outlined"
                sx={{ mb: 2 }}
                disabled={verifyOtpMutation.isPending}
                InputProps={{
                  sx: { borderRadius: 1 }
                }}
              />
              
              {error && (
                <Typography color="error" align="center" sx={{ mt: 2, mb: 2 }}>
                  {error}
                </Typography>
              )}
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={verifyOtpMutation.isPending}
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
                {verifyOtpMutation.isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  t('auth.verify')
                )}
              </Button>
              
              <Button
                variant="text"
                onClick={() => setOtpSolicitado(false)}
                sx={{ 
                  fontSize: '0.8rem', 
                  color: '#e5308a',
                  textTransform: 'none',
                  width: '100%'
                }}
              >
                {t('auth.changePhone')}
              </Button>
            </Box>
          )}
          
          <Box textAlign="center" sx={{ mt: 2 }}>
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              sx={{ 
                fontSize: '0.8rem', 
                color: '#e5308a',
                textTransform: 'none'
              }}
            >
              Acceso para administradores
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginConductor; 