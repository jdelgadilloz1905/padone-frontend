import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, MenuItem, CircularProgress, Typography,
  FormControlLabel, Checkbox, Chip, FormControl, FormLabel
} from '@mui/material';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enUS } from 'date-fns/locale';
import Autocomplete from '@mui/material/Autocomplete';
import { useClients } from '../hooks/useClientService';
import LocationAutocompleteInput from './LocationAutocompleteInput';
import { createScheduledRide, scheduledRideService, type ScheduledRideCreateDTO } from '../services/scheduledRideService';
import rideService, { type Driver } from '../services/rideService';
import { conductorService } from '../services/conductorService';
import { useTranslation } from 'react-i18next';

interface ScheduledRideModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editingRide?: any; // Datos de la carrera a editar
}

export default function ScheduledRideModal({ open, onClose, onSave, editingRide }: ScheduledRideModalProps) {
  const { t } = useTranslation();
  
  const PRIORITIES = [
    { value: 'low', label: t('scheduledRides.priorities.low') },
    { value: 'normal', label: t('scheduledRides.priorities.normal') },
    { value: 'high', label: t('scheduledRides.priorities.high') },
    { value: 'urgent', label: t('scheduledRides.priorities.urgent') },
  ] as const;

  const RECURRING_TYPES = [
    { value: 'daily', label: t('scheduledRides.modal.recurringTypes.daily') },
    { value: 'weekly', label: t('scheduledRides.modal.recurringTypes.weekly') },
    { value: 'monthly', label: t('scheduledRides.modal.recurringTypes.monthly') },
  ] as const;

  const DAYS_OF_WEEK = [
    { value: 0, label: t('common.days.sunday'), short: t('common.days.sunShort') },
    { value: 1, label: t('common.days.monday'), short: t('common.days.monShort') },
    { value: 2, label: t('common.days.tuesday'), short: t('common.days.tueShort') },
    { value: 3, label: t('common.days.wednesday'), short: t('common.days.wedShort') },
    { value: 4, label: t('common.days.thursday'), short: t('common.days.thuShort') },
    { value: 5, label: t('common.days.friday'), short: t('common.days.friShort') },
    { value: 6, label: t('common.days.saturday'), short: t('common.days.satShort') },
  ] as const;
  const [clientSearch, setClientSearch] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [origin, setOrigin] = useState<{ address: string; lat: number | null; lng: number | null }>({ address: '', lat: null, lng: null });
  const [destination, setDestination] = useState<{ address: string; lat: number | null; lng: number | null }>({ address: '', lat: null, lng: null });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date | null>(new Date());
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [inputOpen, setInputOpen] = useState(false);
  const [clientOptions, setClientOptions] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const listboxRef = useRef<HTMLUListElement>(null);

  const [loading, setLoading] = useState(false);
  const [driverOptions, setDriverOptions] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  
  // Estados para recurrencia
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [recurringEndDate, setRecurringEndDate] = useState<Date | null>(null);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);

  // Hook para obtener clientes paginados
  const { data, isLoading, isFetching } = useClients({
    search: clientSearch,
    page: clientPage,
    active: true,
    limit: 20
  });

  // Manejar la carga incremental de clientes
  useEffect(() => {
    if (data && data.clients) {
      if (clientPage === 1) {
        setClientOptions(data.clients);
      } else {
        setClientOptions((prev) => [...prev, ...data.clients]);
      }
      setHasMore(data.page < data.totalPages);
    }
  }, [data, clientPage]);

  // Resetear opciones al abrir/cerrar
  useEffect(() => {
    if (!open) {
      setClientSearch('');
      setClientPage(1);
      setClientOptions([]);
      setSelectedClient(null);
      setOrigin({ address: '', lat: null, lng: null });
      setDestination({ address: '', lat: null, lng: null });
      const now = new Date();
      setSelectedDate(now);
      setSelectedTime(now);
      setPriority('normal');
      setNotes('');
      setError('');
      setSelectedDriver(null);
      setDriverOptions([]);
      setIsRecurring(false);
      setRecurringType('daily');
      setRecurringEndDate(null);
      setSelectedDaysOfWeek([]);
    }
  }, [open]);

  // Pre-llenar campos al editar
  useEffect(() => {
    if (open && editingRide) {
      console.log('🔧 Pre-llenando campos para editar:', editingRide);
      
      // Pre-llenar cliente
      if (editingRide.client) {
        setSelectedClient(editingRide.client);
      } else if (editingRide.client_name) {
        // Crear objeto cliente temporal si no existe
        setSelectedClient({
          id: editingRide.client_id,
          first_name: editingRide.client_name,
          last_name: '',
          phone_number: editingRide.client_phone
        });
      }
      
      // Pre-llenar origen
      if (editingRide.pickup_location) {
        const pickupCoords = editingRide.pickup_coordinates?.coordinates;
        setOrigin({
          address: editingRide.pickup_location,
          lat: pickupCoords ? pickupCoords[1] : null, // GeoJSON: [lng, lat]
          lng: pickupCoords ? pickupCoords[0] : null
        });
      }
      
      // Pre-llenar destino
      if (editingRide.destination) {
        const destCoords = editingRide.destination_coordinates?.coordinates;
        setDestination({
          address: editingRide.destination,
          lat: destCoords ? destCoords[1] : null, // GeoJSON: [lng, lat]
          lng: destCoords ? destCoords[0] : null
        });
      }
      
      // Pre-llenar fecha y hora
      if (editingRide.scheduled_at) {
        const scheduledDate = new Date(editingRide.scheduled_at);
        setSelectedDate(scheduledDate);
        setSelectedTime(scheduledDate);
      }
      
      // Pre-llenar prioridad
      if (editingRide.priority) {
        setPriority(editingRide.priority);
      }
      
      // Pre-llenar notas
      if (editingRide.notes) {
        setNotes(editingRide.notes);
      }
      
      // Pre-llenar conductor si está asignado - se hará después de cargar la lista de conductores
    }
  }, [open, editingRide]);

  // Scroll infinito en el Autocomplete
  const handleListboxScroll = (event: React.SyntheticEvent) => {
    const listboxNode = event.currentTarget as HTMLUListElement;
    if (
      listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 10 &&
      hasMore &&
      !loadingMore &&
      !isFetching
    ) {
      setLoadingMore(true);
      setClientPage((prev) => prev + 1);
      setTimeout(() => setLoadingMore(false), 500); // Simula delay
    }
  };

  // Combinar fecha y hora para validación
  const getDateTime = () => {
    if (!selectedDate || !selectedTime) return null;
    const dateTime = new Date(selectedDate);
    dateTime.setHours(selectedTime.getHours());
    dateTime.setMinutes(selectedTime.getMinutes());
    dateTime.setSeconds(0);
    dateTime.setMilliseconds(0);
    return dateTime;
  };

  // Cargar conductores al abrir el modal
  useEffect(() => {
    if (open) {
      setLoadingDrivers(true);
      
      const loadDriversAndAssigned = async () => {
        try {
          // Obtener conductores disponibles
          const availableDrivers = await rideService.getAvailableDrivers();
          
          // Si estamos editando y hay un driver_id, obtener los datos del conductor asignado
          if (editingRide?.driver_id) {
            try {
              const assignedDriver = await conductorService.getConductorById(editingRide.driver_id.toString());
              
                             // Crear objeto Driver compatible con el dropdown
               const driverForDropdown: Driver = {
                 id: assignedDriver.id.toString(),
                 name: `${assignedDriver.first_name} ${assignedDriver.last_name}`.trim(),
                 phone: assignedDriver.phone_number,
                 email: assignedDriver.email || '',
                 vehicle_plate: assignedDriver.license_plate || '',
                 is_active: assignedDriver.active,
                 streetName: '',
                 latitude: assignedDriver.current_location?.coordinates[1], // GeoJSON: [lng, lat]
                 longitude: assignedDriver.current_location?.coordinates[0]
               };
              
              // Verificar si el conductor asignado ya está en la lista de disponibles
              const isAlreadyInList = availableDrivers.some(driver => 
                driver.id === driverForDropdown.id
              );
              
              // Si no está en la lista, agregarlo
              const allDrivers = isAlreadyInList ? availableDrivers : [driverForDropdown, ...availableDrivers];
              
              setDriverOptions(allDrivers);
              setSelectedDriver(driverForDropdown);
              
              console.log('🚗 Conductor asignado cargado:', driverForDropdown);
              console.log('📋 Total conductores en dropdown:', allDrivers.length);
              
            } catch (error) {
              console.error('❌ Error al cargar conductor asignado:', error);
              // Si falla, usar solo los conductores disponibles
              setDriverOptions(availableDrivers);
            }
          } else {
            // Si no hay conductor asignado, usar solo los disponibles
            setDriverOptions(availableDrivers);
          }
          
          setLoadingDrivers(false);
        } catch (error) {
          console.error('❌ Error al cargar conductores:', error);
          setDriverOptions([]);
          setLoadingDrivers(false);
        }
      };
      
      loadDriversAndAssigned();
    } else {
      setSelectedDriver(null);
      setDriverOptions([]);
    }
  }, [open, editingRide]);

  // Validación básica
  const handleSave = async () => {
    if (!selectedClient) {
      setError(t('scheduledRides.modal.validation.clientRequired'));
      return;
    }
    if (!origin.address.trim() || !destination.address.trim()) {
      setError(t('scheduledRides.modal.validation.locationsRequired'));
      return;
    }
    if (origin.lat == null || origin.lng == null || destination.lat == null || destination.lng == null) {
      setError(t('scheduledRides.modal.validation.coordinatesRequired'));
      return;
    }
    const dateTime = getDateTime();
    if (!dateTime || dateTime < new Date()) {
      setError(t('scheduledRides.modal.validation.futureDateRequired'));
      return;
    }
    setError('');
    setLoading(true);
    
    const payload: ScheduledRideCreateDTO = {
      client_id: selectedClient.id,
      client_name: `${selectedClient.first_name} ${selectedClient.last_name || ''}`.trim(),
      client_phone: selectedClient.phone_number,
      pickup_location: origin.address,
      pickup_coordinates: { lat: origin.lat, lng: origin.lng },
      destination: destination.address,
      destination_coordinates: { lat: destination.lat, lng: destination.lng },
      scheduled_at: dateTime.toISOString(), // ISO completo con zona horaria
      priority,
      notes: notes || undefined,
      driver_id: selectedDriver ? parseInt(selectedDriver.id) : undefined,
      recurring: isRecurring ? {
        type: recurringType,
        end_date: recurringEndDate ? recurringEndDate.toISOString().split('T')[0] : undefined,
        days_of_week: recurringType === 'weekly' ? selectedDaysOfWeek : undefined,
      } : undefined,
    };

    // Preparar payload para actualización (convertir types correctos)
    const updatePayload = {
      client_id: selectedClient.id,
      client_name: `${selectedClient.first_name} ${selectedClient.last_name || ''}`.trim(),
      client_phone: selectedClient.phone_number,
      pickup_location: origin.address,
      pickup_coordinates: { lat: origin.lat, lng: origin.lng },
      destination: destination.address,
      destination_coordinates: { lat: destination.lat, lng: destination.lng },
      scheduled_at: dateTime.toISOString(),
      priority: priority as 'low' | 'normal' | 'high' | 'urgent',
      notes: notes || undefined,
      driver_id: selectedDriver ? selectedDriver.id : undefined,
      recurring: isRecurring ? {
        type: recurringType,
        end_date: recurringEndDate ? recurringEndDate.toISOString().split('T')[0] : undefined,
        days_of_week: recurringType === 'weekly' ? selectedDaysOfWeek : undefined,
      } : undefined,
    };

    try {
      if (editingRide) {
        // Actualizar carrera existente
        console.log('🔄 Actualizando carrera:', editingRide.id, updatePayload);
        await scheduledRideService.update(editingRide.id, updatePayload);
      } else {
        // Crear nueva carrera
        console.log('➕ Creando nueva carrera:', payload);
        await createScheduledRide(payload);
      }
      setLoading(false);
      onSave(payload); // O puedes recargar la lista, cerrar modal, etc.
    } catch (e: any) {
      setLoading(false);
      const errorMessage = editingRide 
        ? t('scheduledRides.notifications.updateError')
        : t('scheduledRides.notifications.createError');
      setError(e.message || errorMessage);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enUS}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRide ? t('scheduledRides.modal.editTitle') : t('scheduledRides.modal.createTitle')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              open={inputOpen}
              onOpen={() => setInputOpen(true)}
              onClose={() => setInputOpen(false)}
              value={selectedClient}
              onChange={(_e, value) => setSelectedClient(value)}
              inputValue={clientSearch}
              onInputChange={(_e, value) => {
                setClientSearch(value);
                setClientPage(1);
              }}
              options={clientOptions}
              getOptionLabel={(option) => option ? `${option.first_name} ${option.last_name || ''} (${option.phone_number})` : ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={isLoading || isFetching}
              ListboxProps={{
                ref: listboxRef,
                onScroll: handleListboxScroll,
                style: { maxHeight: 240, overflow: 'auto' }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('scheduledRides.modal.fields.client')}
                  placeholder={t('scheduledRides.modal.fields.clientPlaceholder')}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {(isLoading || isFetching || loadingMore) ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText={clientSearch.length < 3 ? t('scheduledRides.modal.fields.minChars') : t('scheduledRides.modal.fields.noResults')}
            />
            
            <LocationAutocompleteInput
              label={t('scheduledRides.modal.fields.origin')}
              value={origin}
              onChange={setOrigin}
              required
            />
            
            <LocationAutocompleteInput
              label={t('scheduledRides.modal.fields.destination')}
              value={destination}
              onChange={setDestination}
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker
                label={t('scheduledRides.modal.fields.date')}
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={new Date()}
                format="MM/dd/yyyy"
                slotProps={{ textField: { fullWidth: true } }}
              />
              <TimePicker
                label={t('scheduledRides.modal.fields.time')}
                value={selectedTime}
                onChange={setSelectedTime}
                ampm={true}
                format="hh:mm aa"
                views={['hours', 'minutes']}
                localeText={{ 
                  hours: 'Horas',
                  minutes: 'Minutos'
                }}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    inputProps: {
                      style: { 
                        textTransform: 'uppercase',
                        padding: '8px 14px'
                      }
                    }
                  },
                  layout: {
                    sx: {
                      '& .MuiPickersLayout-contentWrapper': {
                        padding: 0
                      }
                    }
                  }
                }}
              />
            </Box>
            
            <TextField
              select
              label={t('scheduledRides.modal.fields.priority')}
              value={priority}
              onChange={e => setPriority(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
            >
              {PRIORITIES.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            
            <TextField
              label={t('scheduledRides.modal.fields.notes')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              multiline
              minRows={2}
            />
            
            {/* Sección de Recurrencia */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
              }
              label={t('scheduledRides.modal.fields.recurring')}
            />
            
            {isRecurring && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <TextField
                  select
                  label={t('scheduledRides.modal.fields.recurringType')}
                  value={recurringType}
                  onChange={e => setRecurringType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  fullWidth
                >
                  {RECURRING_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </TextField>
                
                <DatePicker
                  label={t('scheduledRides.modal.fields.endDate')}
                  value={recurringEndDate}
                  onChange={setRecurringEndDate}
                  minDate={selectedDate || new Date()}
                  format="MM/dd/yyyy"
                  slotProps={{ textField: { fullWidth: true } }}
                />
                
                {recurringType === 'weekly' && (
                  <FormControl component="fieldset">
                    <FormLabel component="legend">{t('scheduledRides.modal.fields.daysOfWeek')}</FormLabel>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {DAYS_OF_WEEK.map(day => (
                        <Chip
                          key={day.value}
                          label={day.short}
                          clickable
                          color={selectedDaysOfWeek.includes(day.value) ? 'primary' : 'default'}
                          variant={selectedDaysOfWeek.includes(day.value) ? 'filled' : 'outlined'}
                          onClick={() => {
                            setSelectedDaysOfWeek(prev => 
                              prev.includes(day.value) 
                                ? prev.filter(d => d !== day.value)
                                : [...prev, day.value].sort()
                            );
                          }}
                        />
                      ))}
                    </Box>
                  </FormControl>
                )}
              </Box>
            )}
            
            
            <Autocomplete
              value={selectedDriver}
              onChange={(_e, value) => setSelectedDriver(value)}
              options={driverOptions}
              getOptionLabel={(option) => option ? `${option.name} (${option.phone})` : ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={loadingDrivers}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('scheduledRides.modal.fields.driver')}
                  placeholder={t('scheduledRides.modal.fields.driverPlaceholder')}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingDrivers ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText={loadingDrivers ? t('common.loading') : t('scheduledRides.modal.fields.noDrivers')}
            />
            
            {error && <Typography color="error">{error}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? t('common.saving') : editingRide ? t('common.update') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
} 