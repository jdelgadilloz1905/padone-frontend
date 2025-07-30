import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, TextField, InputAdornment, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, List, ListItem, ListItemText,
  ListItemIcon, Paper, ClickAwayListener, CircularProgress, Typography
} from '@mui/material';
import RoomIcon from '@mui/icons-material/Room';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import MapView from './MapView';
import useGoogleMaps from '../hooks/useGoogleMaps';
import { useTranslation } from 'react-i18next';

interface LocationValue {
  address: string;
  lat: number | null;
  lng: number | null;
}

interface LocationAutocompleteInputProps {
  label: string;
  value: LocationValue;
  onChange: (val: LocationValue) => void;
  required?: boolean;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({ label, value, onChange, required }) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(value.address || '');
  const [showMap, setShowMap] = useState(false);
  const [mapLocation, setMapLocation] = useState<{lat: number, lng: number} | null>(value.lat && value.lng ? {lat: value.lat, lng: value.lng} : null);
  const [mapSearchValue, setMapSearchValue] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSelecting, setIsSelecting] = useState(false);
  
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const mapSearchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  
  const { isLoaded, apiKey } = useGoogleMaps();

  // Inicializar servicios de Google Places
  useEffect(() => {
    if (isLoaded && window.google?.maps?.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      // Crear un div temporal para el PlacesService
      const tempDiv = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(tempDiv);
    }
  }, [isLoaded]);

  // Actualizar el valor del input cuando cambie el valor externo
  useEffect(() => {
    const newAddress = value.address || '';
    setInputValue(newAddress);
    if (value.lat && value.lng) {
      setMapLocation({ lat: value.lat, lng: value.lng });
    }
    // Cerrar sugerencias si hay un valor completo
    if (value.address && value.lat && value.lng) {
      setShowSuggestions(false);
      setPredictions([]);
      setSelectedIndex(-1);
    }
  }, [value]);

  // Función para buscar sugerencias con la API de Places (con debounce)
  const searchPredictions = async (input: string) => {
    if (!autocompleteService.current || input.length < 2) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const request = {
        input: input,
        componentRestrictions: { country: 'us' },
        types: ['establishment', 'geocode'], // Incluir establecimientos y direcciones
        language: 'en'
      };

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions.slice(0, 8)); // Mostrar hasta 8 sugerencias
          setShowSuggestions(true);
        } else {
          setPredictions([]);
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      console.error('Error al buscar predicciones:', error);
      setIsLoading(false);
      setPredictions([]);
      setShowSuggestions(false);
    }
  };

  // Debounce para la búsqueda
  useEffect(() => {
    // No buscar si estamos en proceso de selección
    if (isSelecting) {
      setIsSelecting(false);
      return;
    }

    // No buscar si el input coincide exactamente con el valor externo (evitar bucles)
    if (inputValue === value.address) {
      return;
    }

    if (inputValue.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchPredictions(inputValue);
      }, 300); // 300ms de delay

      return () => clearTimeout(timeoutId);
    } else {
      setPredictions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, isSelecting, value.address]);

  // Manejar cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1); // Resetear selección
    
    if (!newValue.trim()) {
      onChange({ address: '', lat: null, lng: null });
      setMapLocation(null);
      setPredictions([]);
      setShowSuggestions(false);
    }
    // El debounce se encarga de la búsqueda
  };

  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < predictions.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : predictions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          handleSelectPrediction(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Seleccionar una sugerencia
  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    if (!placesService.current) return;

    setIsLoading(true);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setIsSelecting(true); // Marcar que estamos seleccionando
    setInputValue(prediction.description);

    const request = {
      placeId: prediction.place_id,
      fields: ['geometry', 'formatted_address', 'name']
    };

    placesService.current.getDetails(request, (place, status) => {
      setIsLoading(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
        const lat = place.geometry.location!.lat();
        const lng = place.geometry.location!.lng();
        const address = place.formatted_address || place.name || prediction.description;
        
        // Actualizar con la dirección final
        setInputValue(address);
        onChange({ address, lat, lng });
        setMapLocation({ lat, lng });
      }
    });
  };

  // Handler para seleccionar desde el mapa
  const handleMapSelect = (lat: number, lng: number, address: string) => {
    setShowMap(false);
    setInputValue(address);
    onChange({ address, lat, lng });
    setMapLocation({ lat, lng });
  };

  // Handler para búsqueda en el mapa
  const handleMapSearch = (place: google.maps.places.PlaceResult) => {
    if (!place.geometry || !place.geometry.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address || place.name || '';
    setMapSearchValue(address);
    setMapLocation({ lat, lng });
  };

  // Obtener icono según el tipo de lugar
  const getPlaceIcon = (types: string[]) => {
    if (types.includes('establishment') || types.includes('point_of_interest')) {
      return <BusinessIcon fontSize="small" color="primary" />;
    }
    return <LocationOnIcon fontSize="small" color="action" />;
  };

  return (
    <>
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label={label}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.length >= 2 && predictions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Pequeño delay para permitir clicks en las sugerencias
            setTimeout(() => {
              setShowSuggestions(false);
              setSelectedIndex(-1);
            }, 150);
          }}
          required={required}
          fullWidth
          inputRef={autocompleteRef}
          placeholder={t('components.locationInput.placeholder')}
          autoComplete="off"
          InputLabelProps={{ shrink: true }}
          helperText={t('components.locationInput.helperText')}
        />
        
        <InputAdornment position="end">
          <IconButton onClick={() => setShowMap(true)} title={t('components.locationInput.selectOnMap')}>
            <RoomIcon color={value.lat && value.lng ? 'primary' : 'action'} />
          </IconButton>
        </InputAdornment>

        {/* Lista de sugerencias */}
        {showSuggestions && (isLoading || predictions.length > 0) && (
          <ClickAwayListener onClickAway={() => {
            setShowSuggestions(false);
            setSelectedIndex(-1);
          }}>
            <Paper
              ref={suggestionsRef}
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1300,
                maxHeight: 300,
                overflow: 'auto',
                mt: 1
              }}
              elevation={3}
            >
              <List dense>
                {isLoading ? (
                  <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('components.locationInput.searching')}
                    </Typography>
                  </ListItem>
                                 ) : predictions.length > 0 ? (
                   predictions.map((prediction, index) => (
                     <ListItem
                       key={prediction.place_id}
                       onClick={() => handleSelectPrediction(prediction)}
                       sx={{
                         cursor: 'pointer',
                         backgroundColor: selectedIndex === index ? 'action.hover' : 'transparent',
                         '&:hover': {
                           backgroundColor: 'action.hover'
                         }
                       }}
                     >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getPlaceIcon(prediction.types)}
                      </ListItemIcon>
                      <ListItemText
                        primary={prediction.structured_formatting.main_text}
                        secondary={prediction.structured_formatting.secondary_text}
                        primaryTypographyProps={{
                          fontWeight: 500,
                          fontSize: '0.9rem'
                        }}
                        secondaryTypographyProps={{
                          fontSize: '0.8rem',
                          color: 'text.secondary'
                        }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                    <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('components.locationInput.noResults')}
                    </Typography>
                  </ListItem>
                )}
              </List>
            </Paper>
          </ClickAwayListener>
        )}
      </Box>
      
      <Dialog open={showMap} onClose={() => setShowMap(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>{t('components.locationInput.mapDialog.title')}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {/* Buscador para el mapa */}
          <Box sx={{ mb: 2, mt: 1 }}>
            {isLoaded && apiKey ? (
              <AutocompleteInput
                inputValue={mapSearchValue}
                onInputChange={(e) => setMapSearchValue(e.target.value)}
                onPlaceSelect={handleMapSearch}
                label={t('components.locationInput.mapDialog.searchLabel')}
                required={false}
                inputRef={mapSearchRef}
              />
            ) : (
              <TextField
                label={t('components.locationInput.mapDialog.searchLabel')}
                value={mapSearchValue}
                onChange={(e) => setMapSearchValue(e.target.value)}
                fullWidth
                placeholder={t('components.locationInput.mapDialog.searchPlaceholder')}
              />
            )}
          </Box>
          
          {/* Mapa */}
          <Box sx={{ height: 400 }}>
            {isLoaded && apiKey && (
              <MapView
                lat={mapLocation?.lat || 39.0997}
                lng={mapLocation?.lng || -94.5786}
                popupContent={inputValue || mapSearchValue}
                onMapClick={(lat: number, lng: number, address: string) => handleMapSelect(lat, lng, address)}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMap(false)}>{t('common.cancel')}</Button>
          <Button 
            onClick={() => {
              if (mapLocation) {
                handleMapSelect(mapLocation.lat, mapLocation.lng, mapSearchValue || inputValue);
              }
            }}
            variant="contained"
            disabled={!mapLocation}
          >
            {t('components.locationInput.mapDialog.select')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Componente avanzado para el buscador del mapa con sugerencias
const MapSearchInput: React.FC<{
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  label: string;
  required?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}> = ({ inputValue, onInputChange, onPlaceSelect, label, required, inputRef }) => {
  const { t } = useTranslation();
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [lastSearchValue, setLastSearchValue] = useState('');

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  // Inicializar servicios
  useEffect(() => {
    if (window.google?.maps?.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      const tempDiv = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(tempDiv);
    }
  }, []);

  // Búsqueda de predicciones
  const searchPredictions = async (input: string) => {
    if (!autocompleteService.current || input.length < 2) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const request = {
        input: input,
        componentRestrictions: { country: 've' },
        types: ['establishment', 'geocode'],
        language: 'es'
      };

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions.slice(0, 6)); // Menos sugerencias para el mapa
          setShowSuggestions(true);
        } else {
          setPredictions([]);
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      console.error('Error al buscar predicciones:', error);
      setIsLoading(false);
      setPredictions([]);
      setShowSuggestions(false);
    }
  };

  // Debounce para búsqueda
  useEffect(() => {
    if (inputValue.length >= 2 && inputValue !== lastSearchValue) {
      const timeoutId = setTimeout(() => {
        searchPredictions(inputValue);
        setLastSearchValue(inputValue);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (inputValue.length < 2) {
      setPredictions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, lastSearchValue]);

  // Manejar cambio en el input del mapa
  const handleMapInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIndex(-1); // Resetear selección
    onInputChange(e); // Permitir que el padre maneje el cambio
  };

  // Manejar selección de predicción
  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    if (!placesService.current) return;

    setIsLoading(true);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    const request = {
      placeId: prediction.place_id,
      fields: ['geometry', 'formatted_address', 'name']
    };

    placesService.current.getDetails(request, (place, status) => {
      setIsLoading(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.geometry) {
        const address = place.formatted_address || place.name || prediction.description;
        setLastSearchValue(address); // Prevenir nueva búsqueda
        
        // Actualizar el input primero
        const fakeEvent = {
          target: { value: address }
        } as React.ChangeEvent<HTMLInputElement>;
        onInputChange(fakeEvent);
        
        // Luego llamar a onPlaceSelect para mover el mapa
        onPlaceSelect(place);
      }
    });
  };

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < predictions.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : predictions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          handleSelectPrediction(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Iconos para tipos de lugar
  const getPlaceIcon = (types: string[]) => {
    if (types.includes('establishment') || types.includes('point_of_interest')) {
      return <BusinessIcon fontSize="small" color="primary" />;
    }
    return <LocationOnIcon fontSize="small" color="action" />;
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        label={label}
        value={inputValue}
        onChange={handleMapInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (inputValue.length >= 2 && predictions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={() => {
          setTimeout(() => {
            setShowSuggestions(false);
            setSelectedIndex(-1);
          }, 150);
        }}
        required={required}
        fullWidth
        inputRef={inputRef}
        placeholder={t('components.locationInput.placeholder')}
        autoComplete="off"
        InputLabelProps={{ shrink: true }}
      />

      {/* Lista de sugerencias para el mapa */}
      {showSuggestions && (isLoading || predictions.length > 0) && (
        <ClickAwayListener onClickAway={() => {
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }}>
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1400, // Mayor que el modal
              maxHeight: 250,
              overflow: 'auto',
              mt: 1
            }}
            elevation={3}
          >
            <List dense>
              {isLoading ? (
                <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={18} sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('components.locationInput.searching')}
                  </Typography>
                </ListItem>
              ) : predictions.length > 0 ? (
                predictions.map((prediction, index) => (
                  <ListItem
                    key={prediction.place_id}
                    onClick={() => handleSelectPrediction(prediction)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: selectedIndex === index ? 'action.hover' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 35 }}>
                      {getPlaceIcon(prediction.types)}
                    </ListItemIcon>
                    <ListItemText
                      primary={prediction.structured_formatting.main_text}
                      secondary={prediction.structured_formatting.secondary_text}
                      primaryTypographyProps={{
                        fontWeight: 500,
                        fontSize: '0.85rem'
                      }}
                      secondaryTypographyProps={{
                        fontSize: '0.75rem',
                        color: 'text.secondary'
                      }}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem sx={{ justifyContent: 'center', py: 1 }}>
                  <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    {t('components.locationInput.noResults')}
                  </Typography>
                </ListItem>
              )}
            </List>
          </Paper>
        </ClickAwayListener>
      )}
    </Box>
  );
};

// Componente simplificado de respaldo
const AutocompleteInput: React.FC<{
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  label: string;
  required?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}> = (props) => {
  // Usar el nuevo componente avanzado
  return <MapSearchInput {...props} />;
};

export default LocationAutocompleteInput;