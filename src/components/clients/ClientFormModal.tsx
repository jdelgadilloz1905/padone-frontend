import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,

  Divider,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Snackbar,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Save as SaveIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useResponsive } from '../../hooks/useResponsive';
import { usePhoneValidation } from '../../hooks/usePhoneValidation';
import PhoneNumberInput from '../PhoneNumberInput';
import { useCreateClient, useUpdateClient } from '../../hooks/useClientService';
import type { Client, CreateClientDto, UpdateClientDto } from '../../services/clientService';

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
  onSuccess?: (client: Client) => void;
}

interface FormData {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  notes: string;
  is_vip: boolean;
  vip_rate_type: 'flat_rate' | 'minute_rate' | null;
  flat_rate: string;
  minute_rate: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  notes?: string;
  flat_rate?: string;
  minute_rate?: string;
}

// Estado para notificación
interface NotificacionState {
  open: boolean;
  mensaje: string;
  tipo: 'success' | 'error';
}

function safeNumber(val: any, fallback: any) {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? fallback : Number(trimmed);
  }
  if (typeof val === 'number') {
    return val;
  }
  return fallback;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({
  open,
  onClose,
  client = null,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const { validatePhone, formatForAPI, normalizeExistingPhone } = usePhoneValidation();

  const isEditMode = Boolean(client?.id);

  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    notes: '',
    is_vip: false,
    vip_rate_type: null,
    flat_rate: '',
    minute_rate: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  // Estado para notificación
  const [notificacion, setNotificacion] = useState<NotificacionState>({
    open: false,
    mensaje: '',
    tipo: 'success'
  });

  useEffect(() => {
    if (client && open) {
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        phone_number: client.phone_number ? normalizeExistingPhone(client.phone_number) : '',
        email: client.email || '',
        notes: client.notes || '',
        is_vip: client.is_vip || false,
        vip_rate_type: client.vip_rate_type || null,
        flat_rate: client.flat_rate || '',
        minute_rate: client.minute_rate || '',
      });
    } else if (!client && open) {
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        notes: '',
        is_vip: false,
        vip_rate_type: null,
        flat_rate: '',
        minute_rate: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, open]);

  useEffect(() => {
    if (!open) {
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  }, [errors]);

  const handlePhoneChange = useCallback((value: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      phone_number: value || ''
    }));
    
    if (errors.phone_number) {
      setErrors(prev => ({
        ...prev,
        phone_number: undefined
      }));
    }
  }, [errors.phone_number]);

  const handleVipChange = useCallback((checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_vip: checked,
      // Reset VIP fields when disabling VIP
      vip_rate_type: checked ? prev.vip_rate_type : null,
      flat_rate: checked ? prev.flat_rate : '',
      minute_rate: checked ? prev.minute_rate : ''
    }));
  }, []);

  const handleVipRateTypeChange = useCallback((rateType: 'flat_rate' | 'minute_rate') => {
    setFormData(prev => ({
      ...prev,
      vip_rate_type: rateType
    }));
  }, []);

  const handleVipAmountChange = useCallback((field: 'flat_rate' | 'minute_rate', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = t('clients.form.validation.firstNameRequired');
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = t('clients.form.validation.phoneRequired');
    } else {
      const phoneValidation = validatePhone(formData.phone_number, true);
      if (!phoneValidation.isValid) {
        newErrors.phone_number = phoneValidation.errorMessage || t('clients.form.validation.phoneInvalid');
      }
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t('clients.form.validation.emailInvalid');
      }
    }

    // Validar campos VIP si está activado
    if (formData.is_vip) {
      if (!formData.vip_rate_type) {
        newErrors.flat_rate = 'Debe seleccionar un tipo de tarifa VIP';
      } else if (formData.vip_rate_type === 'flat_rate') {
        if (
          formData.flat_rate === undefined ||
          formData.flat_rate === null ||
          (typeof formData.flat_rate === 'string' && formData.flat_rate.trim() === '') ||
          (typeof formData.flat_rate === 'number' && isNaN(formData.flat_rate))
        ) {
          newErrors.flat_rate = 'Debe ingresar el monto de la tarifa plana';
        }
      } else if (formData.vip_rate_type === 'minute_rate') {
        if (
          formData.minute_rate === undefined ||
          formData.minute_rate === null ||
          (typeof formData.minute_rate === 'string' && formData.minute_rate.trim() === '') ||
          (typeof formData.minute_rate === 'number' && isNaN(formData.minute_rate))
        ) {
          newErrors.minute_rate = 'Debe ingresar el precio por minuto';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validatePhone, t]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let result: Client;
      if (isEditMode && client?.id) {
        const updateData: UpdateClientDto = {
          first_name: formData.first_name.trim() || client.first_name,
          last_name: formData.last_name.trim() || client.last_name || undefined,
          phone_number: formatForAPI(formData.phone_number) || client.phone_number,
          email: formData.email.trim() || client.email,
          notes: formData.notes.trim() || client.notes,
          is_vip: formData.is_vip,
          vip_rate_type: formData.vip_rate_type,
          flat_rate: safeNumber(formData.flat_rate, client.flat_rate),
          minute_rate: safeNumber(formData.minute_rate, client.minute_rate),
          active: true
        };
        result = await updateMutation.mutateAsync({ id: client.id, data: updateData });
        setNotificacion({
          open: true,
          mensaje: 'Cliente actualizado exitosamente',
          tipo: 'success'
        });
      } else {
        const submitData: CreateClientDto = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim() || undefined,
          phone_number: formatForAPI(formData.phone_number),
          email: formData.email.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          is_vip: formData.is_vip,
          vip_rate_type: formData.vip_rate_type,
          flat_rate: safeNumber(formData.flat_rate, undefined),
          minute_rate: safeNumber(formData.minute_rate, undefined),
          active: true
        };
        result = await createMutation.mutateAsync(submitData);
        setNotificacion({
          open: true,
          mensaje: 'Cliente registrado exitosamente',
          tipo: 'success'
        });
      }

      onSuccess?.(result);
      onClose();

    } catch (error: any) {
      setNotificacion({
        open: true,
        mensaje: error?.message || 'Error al registrar/actualizar cliente',
        tipo: 'error'
      });
      console.error('Error al enviar formulario:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateForm,
    formData,
    formatForAPI,
    isEditMode,
    client?.id,
    updateMutation,
    createMutation,
    onSuccess,
    onClose
  ]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  const handleCloseNotificacion = () => {
    setNotificacion(prev => ({ ...prev, open: false }));
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1,
        bgcolor: '#fafafa',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ color: '#e5308a' }} />
          <Typography variant="h6" component="div">
            {isEditMode ? t('clients.form.editClient') : t('clients.form.newClient')}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={isSubmitting} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2, maxHeight: '85vh', minHeight: '600px', overflowY: 'auto' }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#666', fontWeight: 600 }}>
                {t('clients.form.personalInfo')}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  name="first_name"
                  label={t('clients.form.firstName')}
                  value={formData.first_name}
                  onChange={handleInputChange}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                  required
                  fullWidth
                  autoFocus={!isMobile}
                  disabled={isSubmitting}
                />

                <TextField
                  name="last_name"
                  label={t('clients.form.lastName')}
                  value={formData.last_name}
                  onChange={handleInputChange}
                  error={!!errors.last_name}
                  helperText={errors.last_name}
                  fullWidth
                  disabled={isSubmitting}
                />

                <PhoneNumberInput
                  value={formData.phone_number}
                  onChange={handlePhoneChange}
                  error={!!errors.phone_number}
                  helperText={errors.phone_number}
                  required
                  disabled={isSubmitting}
                  fullWidth
                  label={t('clients.form.phone')}
                />
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#666', fontWeight: 600 }}>
                {t('clients.form.contactInfo')}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  name="email"
                  type="email"
                  label={t('clients.form.email')}
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  fullWidth
                  disabled={isSubmitting}
                />

                <TextField
                  name="notes"
                  label={t('clients.form.notes') || 'Notas'}
                  value={formData.notes}
                  onChange={handleInputChange}
                  error={!!errors.notes}
                  helperText={errors.notes}
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={4}
                  disabled={isSubmitting}
                />
              </Box>
            </Box>

            {/* Sección VIP */}
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 3 }} />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_vip}
                    onChange={(e) => handleVipChange(e.target.checked)}
                    disabled={isSubmitting}
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
                      {t('clients.form.vip.title')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {t('clients.form.vip.description')}
                    </Typography>
                  </Box>
                }
              />

              {formData.is_vip && (
                <Box sx={{ mt: 2, pl: 4 }}>
                  <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                      Tipo de tarifa VIP
                    </FormLabel>
                    <RadioGroup
                      row={false}
                      value={formData.vip_rate_type || ''}
                      onChange={(e) => handleVipRateTypeChange(e.target.value as 'flat_rate' | 'minute_rate')}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, ml: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Radio
                            checked={formData.vip_rate_type === 'flat_rate'}
                            onChange={() => handleVipRateTypeChange('flat_rate')}
                            value="flat_rate"
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 120 }}>
                            {t('clients.form.vip.flatRate')}
                          </Typography>
                          <TextField
                            name="flat_rate"
                            placeholder={t('clients.form.vip.amount')}
                            value={formData.flat_rate}
                            onChange={(e) => handleVipAmountChange('flat_rate', e.target.value)}
                            error={!!errors.flat_rate}
                            helperText={''}
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            disabled={formData.vip_rate_type !== 'flat_rate' || isSubmitting}
                            sx={{ width: 140, ml: 2 }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Radio
                            checked={formData.vip_rate_type === 'minute_rate'}
                            onChange={() => handleVipRateTypeChange('minute_rate')}
                            value="minute_rate"
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 120 }}>
                            {t('clients.form.vip.minuteRate')}
                          </Typography>
                          <TextField
                            name="minute_rate"
                            placeholder={t('clients.form.vip.pricePerMinute')}
                            value={formData.minute_rate}
                            onChange={(e) => handleVipAmountChange('minute_rate', e.target.value)}
                            error={!!errors.minute_rate}
                            helperText={''}
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            disabled={formData.vip_rate_type !== 'minute_rate' || isSubmitting}
                            sx={{ width: 140, ml: 2 }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>
                            }}
                          />
                        </Box>
                      </Box>
                    </RadioGroup>
                  </FormControl>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {(createMutation.error || updateMutation.error) && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {createMutation.error?.message || updateMutation.error?.message || 
             'Error al procesar la solicitud'}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        bgcolor: '#fafafa',
        borderTop: '1px solid #e0e0e0',
        gap: 1
      }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          variant="outlined"
          sx={{ minWidth: '100px' }}
        >
          {t('clients.form.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          variant="contained"
          startIcon={isSubmitting ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            isEditMode ? <SaveIcon /> : <AddIcon />
          )}
          sx={{
            minWidth: '120px',
            bgcolor: '#e5308a',
            '&:hover': {
              bgcolor: '#c5206a'
            }
          }}
        >
          {isSubmitting 
            ? t('clients.form.saving')
            : (isEditMode ? t('clients.form.save') : t('clients.form.createClient'))
          }
        </Button>
      </DialogActions>

      <Snackbar 
        open={notificacion.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotificacion}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotificacion} severity={notificacion.tipo} sx={{ width: '100%' }}>
          {notificacion.mensaje}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ClientFormModal;
