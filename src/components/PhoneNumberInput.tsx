import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PhoneInput from 'react-phone-number-input';
import ReactCountryFlag from "react-country-flag"
import { 
  Box, 
  FormHelperText, 
  InputLabel,
  TextField,
  InputAdornment,
  Typography,
  Divider,
  Portal,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { getCountries, getCountryCallingCode, parsePhoneNumber } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
// import en from 'react-phone-number-input/locale/es.json'; // No usado por ahora
import 'react-phone-number-input/style.css';


interface PhoneNumberInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  defaultCountry?: string;
  autoFocus?: boolean;
  fullWidth?: boolean;
}

const frequentCountries = ['US', 'ES', 'MX', 'CO', 'AR', 'VE', 'PE', 'CL', 'EC', 'BR'];

// Obtener nombre del país en español
const getCountryName = (countryCode: string): string => {
  const names: Record<string, string> = {
    'CO': 'Colombia', 'US': 'Estados Unidos', 'MX': 'México', 'ES': 'España', 'AR': 'Argentina',
    'VE': 'Venezuela', 'PE': 'Perú', 'CL': 'Chile', 'EC': 'Ecuador', 'BR': 'Brasil',
    'BO': 'Bolivia', 'PY': 'Paraguay', 'UY': 'Uruguay', 'CR': 'Costa Rica', 'PA': 'Panamá',
    'GT': 'Guatemala', 'HN': 'Honduras', 'SV': 'El Salvador', 'NI': 'Nicaragua', 'CU': 'Cuba',
    'DO': 'República Dominicana', 'PR': 'Puerto Rico', 'CA': 'Canadá', 'GB': 'Reino Unido',
    'FR': 'Francia', 'DE': 'Alemania', 'IT': 'Italia', 'PT': 'Portugal', 'NL': 'Países Bajos',
    'BE': 'Bélgica', 'CH': 'Suiza', 'AT': 'Austria', 'SE': 'Suecia', 'NO': 'Noruega',
    'DK': 'Dinamarca', 'FI': 'Finlandia', 'IS': 'Islandia', 'IE': 'Irlanda', 'PL': 'Polonia',
    'CZ': 'República Checa', 'SK': 'Eslovaquia', 'HU': 'Hungría', 'RO': 'Rumania', 'BG': 'Bulgaria',
    'HR': 'Croacia', 'SI': 'Eslovenia', 'RS': 'Serbia', 'ME': 'Montenegro', 'BA': 'Bosnia y Herzegovina',
    'MK': 'Macedonia del Norte', 'AL': 'Albania', 'GR': 'Grecia', 'TR': 'Turquía', 'CY': 'Chipre',
    'MT': 'Malta', 'RU': 'Rusia', 'UA': 'Ucrania', 'BY': 'Bielorrusia', 'LT': 'Lituania',
    'LV': 'Letonia', 'EE': 'Estonia', 'MD': 'Moldavia', 'GE': 'Georgia', 'AM': 'Armenia',
    'AZ': 'Azerbaiyán', 'KZ': 'Kazajistán', 'UZ': 'Uzbekistán', 'TM': 'Turkmenistán',
    'KG': 'Kirguistán', 'TJ': 'Tayikistán', 'AF': 'Afganistán', 'PK': 'Pakistán', 'IN': 'India',
    'BD': 'Bangladesh', 'LK': 'Sri Lanka', 'MV': 'Maldivas', 'NP': 'Nepal', 'BT': 'Bután',
    'MM': 'Myanmar', 'TH': 'Tailandia', 'LA': 'Laos', 'VN': 'Vietnam', 'KH': 'Camboya',
    'MY': 'Malasia', 'SG': 'Singapur', 'BN': 'Brunéi', 'ID': 'Indonesia', 'TL': 'Timor Oriental',
    'PH': 'Filipinas', 'CN': 'China', 'HK': 'Hong Kong', 'MO': 'Macao', 'TW': 'Taiwán',
    'KR': 'Corea del Sur', 'KP': 'Corea del Norte', 'JP': 'Japón', 'MN': 'Mongolia',
    'AU': 'Australia', 'NZ': 'Nueva Zelanda', 'PG': 'Papúa Nueva Guinea', 'FJ': 'Fiyi',
    'NC': 'Nueva Caledonia', 'VU': 'Vanuatu', 'SB': 'Islas Salomón', 'TO': 'Tonga',
    'WS': 'Samoa', 'KI': 'Kiribati', 'TV': 'Tuvalu', 'NR': 'Nauru', 'PW': 'Palaos',
    'FM': 'Micronesia', 'MH': 'Islas Marshall', 'EG': 'Egipto', 'LY': 'Libia', 'TN': 'Túnez',
    'DZ': 'Argelia', 'MA': 'Marruecos', 'SD': 'Sudán', 'SS': 'Sudán del Sur', 'ET': 'Etiopía',
    'ER': 'Eritrea', 'DJ': 'Yibuti', 'SO': 'Somalia', 'KE': 'Kenia', 'UG': 'Uganda',
    'TZ': 'Tanzania', 'RW': 'Ruanda', 'BI': 'Burundi', 'ZA': 'Sudáfrica', 'NA': 'Namibia',
    'BW': 'Botsuana', 'ZM': 'Zambia', 'ZW': 'Zimbabue', 'MZ': 'Mozambique', 'MW': 'Malaui',
    'MG': 'Madagascar', 'MU': 'Mauricio', 'SC': 'Seychelles', 'KM': 'Comoras', 'YT': 'Mayotte',
    'RE': 'Reunión', 'AO': 'Angola', 'CD': 'Rep. Dem. del Congo', 'CG': 'Congo', 'CF': 'Rep. Centroafricana',
    'CM': 'Camerún', 'GQ': 'Guinea Ecuatorial', 'GA': 'Gabón', 'ST': 'Santo Tomé y Príncipe',
    'TD': 'Chad', 'NE': 'Níger', 'NG': 'Nigeria', 'BJ': 'Benín', 'TG': 'Togo', 'GH': 'Ghana',
    'CI': 'Costa de Marfil', 'LR': 'Liberia', 'SL': 'Sierra Leona', 'GN': 'Guinea', 'GW': 'Guinea-Bissau',
    'GM': 'Gambia', 'SN': 'Senegal', 'MR': 'Mauritania', 'ML': 'Malí', 'BF': 'Burkina Faso',
    'IL': 'Israel', 'PS': 'Palestina', 'JO': 'Jordania', 'LB': 'Líbano', 'SY': 'Siria',
    'IQ': 'Irak', 'IR': 'Irán', 'SA': 'Arabia Saudí', 'YE': 'Yemen', 'OM': 'Omán',
    'AE': 'Emiratos Árabes Unidos', 'QA': 'Catar', 'BH': 'Baréin', 'KW': 'Kuwait'
  };
  return names[countryCode] || countryCode;
};

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({ 
  label, 
  error, 
  helperText, 
  defaultCountry = 'US',
  placeholder = '(555) 123-4567',
  value,
  onChange,
  disabled = false,
  required = false,
  autoFocus = false,
  fullWidth = false
}) => {
  // Responsive detection - memoizado para evitar re-renders
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Estados para la búsqueda de países
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
 

  // Detectar país automáticamente cuando cambia el valor o forzar país por defecto cuando está vacío
  useEffect(() => {
    if (!value || value.trim() === '') {
      // Si está vacío, usar país por defecto
      console.log('📱 Input vacío, usando país por defecto:', defaultCountry);
      setSelectedCountry(defaultCountry);
    } else {
      // Si tiene valor, intentar detectar país automáticamente
      try {
        const parsed = parsePhoneNumber(value);
        if (parsed && parsed.country) {
          console.log('🌍 País detectado automáticamente:', parsed.country, 'para número:', value);
          setSelectedCountry(parsed.country);
        } else {
          // Si no se puede detectar, mantener el país por defecto
          console.log('⚠️ No se pudo detectar país, manteniendo:', defaultCountry);
          setSelectedCountry(defaultCountry);
        }
      } catch (error) {
        console.log('⚠️ Error al detectar país, usando por defecto:', defaultCountry);
        setSelectedCountry(defaultCountry);
      }
    }
  }, [value, defaultCountry]);

  // Memoizar callbacks para evitar re-renders
  const handlePhoneChange = useCallback((phoneValue: string | undefined) => {
    onChange(phoneValue);
  }, [onChange]);

  const handleCountrySelect = useCallback((country: CountryCode) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchTerm('');
    
    // Actualizar PhoneInput con el nuevo país
    const countrySelector = document.querySelector('.PhoneInputCountry');
    if (countrySelector) {
      const selectElement = countrySelector.querySelector('select') as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = country;
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Manejar clicks fuera del componente para cerrar dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.phone-input-container') && !target.closest('.country-dropdown-portal')) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };

    const handleScroll = () => {
      if (isDropdownOpen) {
        const countrySelector = document.querySelector('.PhoneInputCountry');
        const phoneContainer = countrySelector?.closest('.phone-input-container');
        if (phoneContainer) {
          const rect = phoneContainer.getBoundingClientRect();
          
          if (isMobile) {
            // En mobile, usar posición fullscreen centrada
            setDropdownPosition({
              top: 0,
              left: 0,
              width: window.innerWidth
            });
          } else {
            // En desktop, posición normal
            setDropdownPosition({
              top: rect.bottom + window.scrollY + 8,
              left: rect.left + window.scrollX,
              width: rect.width
            });
          }
        }
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [isDropdownOpen]);

  // Interceptar click en selector de país para abrir dropdown personalizado
  useEffect(() => {
    const countrySelector = document.querySelector('.PhoneInputCountry');
    if (countrySelector) {
      const handleCountryClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Calcular posición del dropdown
        const phoneContainer = countrySelector.closest('.phone-input-container');
        if (phoneContainer) {
          const rect = phoneContainer.getBoundingClientRect();
          
          if (isMobile) {
            // En mobile, usar posición fullscreen
            setDropdownPosition({
              top: 0,
              left: 0,
              width: window.innerWidth
            });
          } else {
            // En desktop, posición normal
            setDropdownPosition({
              top: rect.bottom + window.scrollY + 8,
              left: rect.left + window.scrollX,
              width: rect.width
            });
          }
        }
        
        setIsDropdownOpen(!isDropdownOpen);
      };
      
      countrySelector.addEventListener('click', handleCountryClick);
      return () => countrySelector.removeEventListener('click', handleCountryClick);
    }
  }, [isDropdownOpen]);

  // Actualizar emoji de bandera dinámicamente
  useEffect(() => {
    const countrySelector = document.querySelector('.PhoneInputCountry');
    if (countrySelector) {
      // Crear un elemento temporal para mostrar la bandera
      const flagElement = countrySelector.querySelector('.custom-flag');
      if (flagElement) {
      } else {
        const newFlagElement = document.createElement('span');
        newFlagElement.className = 'custom-flag';
        newFlagElement.style.cssText = `
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          fontSize: 1.3rem;
          zIndex: 2;
          pointerEvents: none;
        `;
        countrySelector.appendChild(newFlagElement);
      }
    }
  }, [selectedCountry]);

  // Obtener lista de países filtrada y ordenada
  const filteredCountries = useMemo(() => {
    const allCountries = getCountries();
    
    // Filtrar por búsqueda
    const filtered = searchTerm
      ? allCountries.filter(country => 
          getCountryName(country).toLowerCase().includes(searchTerm.toLowerCase()) ||
          country.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getCountryCallingCode(country).includes(searchTerm)
        )
      : allCountries;
    
    // Ordenar: frecuentes primero, luego alfabético
    const frequent = filtered.filter(country => frequentCountries.includes(country));
    const others = filtered.filter(country => !frequentCountries.includes(country))
      .sort((a, b) => getCountryName(a).localeCompare(getCountryName(b)));
    
    return [...frequent, ...others];
  }, [searchTerm]);

  // Manejar cambio de país - memoizado
  const handleCountryChange = useCallback((country: CountryCode) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchTerm('');
  }, []);

  // Renderizar opción de país mejorada
  const renderCountryOption = (country: CountryCode, isSelected: boolean = false) => {
    const countryName = getCountryName(country);
    const countryCode = `+${getCountryCallingCode(country)}`;
    const isFrequent = frequentCountries.includes(country);
    
    return (
      <Box
        key={country}
        onClick={() => handleCountrySelect(country)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '12px 16px' : '6px 12px', // Touch-friendly padding
          margin: isMobile ? '4px 8px' : '2px 10px',
          minHeight: isMobile ? '56px' : '44px', // Touch-friendly height
          cursor: 'pointer',
          borderRadius: '10px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          background: isSelected 
            ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.12), rgba(25, 118, 210, 0.08))'
            : 'transparent',
          border: isSelected ? '2px solid rgba(25, 118, 210, 0.3)' : '2px solid transparent',
          
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
            transform: isMobile ? 'scale(0.98)' : 'translateX(6px)',
            boxShadow: '0 6px 16px rgba(25, 118, 210, 0.15)',
          },
          
          '&:active': {
            transform: 'scale(0.95)',
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
          }
        }}
      >
        {/* Bandera mejorada */}
        <Box sx={{ 
          fontSize: isMobile ? '1.8rem' : '1.5rem', 
          marginRight: isMobile ? '16px' : '12px', 
          width: isMobile ? '32px' : '28px', 
          height: isMobile ? '32px' : '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          flexShrink: 0,
        }}>
          <span style={{ 
            fontSize: isMobile ? '1.5rem' : '1.3rem',
            lineHeight: 1,
            display: 'block'
          }}>
            <ReactCountryFlag countryCode={country} svg />
          </span>
        </Box>
        
        {/* Información del país */}
        <Box sx={{ flex: 1, minWidth: 0 , padding: isMobile ? '8px 0' : '6px 8px' }}>
          <Typography variant="caption" sx={{ 
            fontWeight: isSelected ? 600 : 500,
            color: isSelected ? '#1976d2' : 'inherit',
            fontSize: isMobile ? '1rem' : '0.9rem', // Larger text for mobile
            marginBottom: '2px',
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
             {countryCode} {countryName} 
          </Typography>
        
        </Box>
        
        {/* Indicador de país frecuente */}
        {isFrequent && (
          <Box sx={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#4caf50',
            marginLeft: '8px',
            flexShrink: 0
          }} />
        )}
        
        {/* Indicador de selección */}
        {isSelected && (
          <Box sx={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#1976d2',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            marginLeft: '8px',
            flexShrink: 0
          }}>
            ✓
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ width: fullWidth ? '100%' : '100%', mb: 2 }}>
      {/* Label profesional estilo Material-UI Premium */}
      {label && (
        <InputLabel 
          sx={{ 
            mb: 1.5, 
            color: error ? 'error.main' : 'text.primary',
            fontWeight: 600,
            fontSize: '0.875rem',
            letterSpacing: '0.00938em',
            textTransform: 'uppercase',
            opacity: 0.9
          }}
        >
          {label} {required && <span style={{ color: '#d32f2f', marginLeft: '2px' }}>*</span>}
        </InputLabel>
      )}
      
      {/* PhoneInput con diseño Enterprise Premium */}
      <Box 
        className={`phone-input-container ${disabled ? 'disabled' : ''}`}
        sx={{ 
          position: 'relative', // Necesario para el dropdown absoluto
          
          // Container principal con diseño premium
          '& .PhoneInput': {
            border: `2px solid ${error ? '#d32f2f' : 'rgba(0, 0, 0, 0.12)'}`,
            borderRadius: '4px',
            padding: '0',
            backgroundColor: '#ffffff',
            fontSize: '1rem',
            minHeight: '40px',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'visible',
            position: 'relative',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            
            '&:hover': {
              borderColor: error ? '#d32f2f' : '#1976d2',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
              transform: 'translateY(-1px)',
            },
            
            '&:focus-within': {
              borderColor: error ? '#d32f2f' : '#1976d2',
              borderWidth: '2px',
              boxShadow: `0 0 0 3px ${error ? 'rgba(211, 47, 47, 0.2)' : 'rgba(25, 118, 210, 0.2)'}, 0 8px 16px rgba(25, 118, 210, 0.2)`,
              transform: 'translateY(-2px)',
            }
          },
          
          // Selector de país premium con emoji mejorado
          '& .PhoneInputCountry': {
            display: 'flex',
            alignItems: 'center',
            padding: '8px 10px',
            marginRight: '0',
            borderRight: '2px solid rgba(0, 0, 0, 0.06)',
            minWidth: '50px',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: 'rgba(0, 0, 0, 0.01)',
            borderTopLeftRadius: '12px',
            borderBottomLeftRadius: '12px',
            position: 'relative',
            '& .PhoneInputCountryIcon--border': {
              boxShadow: 'none !important',
              border: 'none !important',
            },
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.06)',
              borderRight: '2px solid rgba(25, 118, 210, 0.3)',
              transform: 'scale(1.02)',
            },
            
            // Añadir emoji de bandera como overlay (se maneja dinámicamente)
            '&::before': {
              content: '""', // Se actualiza dinámicamente con JavaScript
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1.3rem',
              zIndex: 2,
              pointerEvents: 'none',
            }
          },
          
         
          // Flecha del dropdown profesional
          '& .PhoneInputCountrySelectArrow': {
            marginLeft: '0.75rem',
            fontSize: '0.875rem',
            color: 'rgba(0, 0, 0, 0.6)',
            opacity: 0.8,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'rotate(45deg)',
            fontWeight: 'bold',
            
            '.PhoneInputCountry:hover &': {
              color: '#1976d2',
              opacity: 1,
              transform: 'rotate(45deg) scale(1.2)',
            }
          },
          
          // Input de texto premium
          '& .PhoneInputInput': {
            border: 'none',
            outline: 'none',
            flex: 1,
            padding: '10px 14px',
            fontSize: '1.125rem',
            backgroundColor: 'transparent',
            color: 'rgba(0, 0, 0, 0.87)',
            fontWeight: 500,
            letterSpacing: '0.00938em',
            
            '&::placeholder': {
              color: 'rgba(0, 0, 0, 0.5)',
              opacity: 1,
              fontWeight: 400,
              fontStyle: 'italic',
            },
            
            '&:disabled': {
              color: 'rgba(0, 0, 0, 0.38)',
              cursor: 'not-allowed',
            }
          },
          
          
          // Dropdown ultra-profesional y hermoso con búsqueda
          '& .PhoneInputCountrySelect': {
            display: 'none', // Ocultamos el dropdown original para usar el personalizado
          },
          
          // Opciones de país premium y hermosas
          '& .PhoneInputCountrySelectOption': {
            display: 'flex',
            alignItems: 'center',
            padding: '8px 14px',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            borderBottom: 'none',
            margin: '4px 10px',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '58px',
            background: 'transparent',
            
            // Pseudo-elemento para background gradient elegante
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08), rgba(25, 118, 210, 0.03))',
              opacity: 0,
              transition: 'opacity 0.25s ease-in-out',
              zIndex: 0,
              borderRadius: '12px',
            },
            
            // Todos los elementos dentro en z-index superior
            '& > *': {
              position: 'relative',
              zIndex: 1,
            },
            
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              color: '#1976d2',
              transform: 'translateX(8px) scale(1.02)',
              fontWeight: 600,
              boxShadow: '0 8px 20px rgba(25, 118, 210, 0.2), 0 3px 8px rgba(25, 118, 210, 0.15)',
              
              '&::before': {
                opacity: 1,
              }
            },

            
            
            '&--selected, &:active': {
              backgroundColor: 'rgba(25, 118, 210, 0.12) !important',
              color: '#1976d2 !important',
              fontWeight: 700,
              borderLeft: '4px solid #1976d2',
              transform: 'translateX(8px)',
              boxShadow: '0 12px 24px rgba(25, 118, 210, 0.3), 0 4px 12px rgba(25, 118, 210, 0.2)',
              
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.18) !important',
                transform: 'translateX(10px) scale(1.02)',
              }
            },
            
            '& .PhoneInputCountryFlag': {
              marginRight: '16px',
              width: '1.6em',
              height: '1.2em',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
              borderRadius: '5px',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25), 0 3px 8px rgba(0, 0, 0, 0.15)',
              }
            },
            
            // Nombre del país con tipografía hermosa
            '& .PhoneInputCountrySelectOption__countryName': {
              transition: 'all 0.25s ease-in-out',
              letterSpacing: '0.00938em',
              color: 'inherit',
              flex: 1,
              fontSize: '0.9375rem',
              fontWeight: 'inherit',
              
              '&:hover': {
                letterSpacing: '0.015em',
              }
            }
          },
          
          // Estados disabled premium
          '&.disabled': {
            '& .PhoneInput': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              borderColor: 'rgba(0, 0, 0, 0.18)',
              cursor: 'not-allowed',
              boxShadow: 'none',
              
              '&:hover': {
                transform: 'none',
                boxShadow: 'none',
              }
            },
            
            '& .PhoneInputCountry': {
              backgroundColor: 'rgba(0, 0, 0, 0.06)',
              cursor: 'not-allowed',
              
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                transform: 'none',
              }
            }
          }
        }}
      >
        <PhoneInput
          value={value || ''}
          onChange={(newValue) => {
            handlePhoneChange(newValue);
          }}
          onCountryChange={(country) => {
            if (country && country !== selectedCountry) {
              handleCountryChange(country);
            }
          }}
          defaultCountry={defaultCountry as CountryCode}
          country={selectedCountry as CountryCode}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          flagComponent={(props)=>{
            return <ReactCountryFlag style={{width: '24px', height: '18px', verticalAlign: 'text-top'}}  countryCode={props.country} svg />
          }}
          international={false}
          smartCaret={true}
          countryCallingCodeEditable={false}
          addInternationalOption={false}
        />
        
        {/* Dropdown personalizado con búsqueda usando Portal */}
        {isDropdownOpen && (
          <Portal>
            {/* Backdrop para mobile */}
            {isMobile && (
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 9998,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 2
                }}
                onClick={() => {
                  setIsDropdownOpen(false);
                  setSearchTerm('');
                }}
              />
            )}
            
            <Box
              className="country-dropdown-portal"
              sx={{
                position: 'fixed',
                ...(isMobile ? {
                  // Mobile: modal centrado
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'calc(100vw - 32px)',
                  maxWidth: '400px',
                  height: '70vh',
                  maxHeight: '500px'
                } : {
                  // Desktop: dropdown normal
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  maxHeight: '450px'
                }),
                zIndex: 9999, // Z-index muy alto para estar por encima de todo
                backgroundColor: '#ffffff',
                border: 'none',
                borderRadius: isMobile ? '16px' : '12px',
                boxShadow: isMobile 
                  ? '0 32px 64px rgba(0, 0, 0, 0.25), 0 16px 32px rgba(0, 0, 0, 0.15)'
                  : '0 24px 48px rgba(0, 0, 0, 0.15), 0 12px 24px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
                backdropFilter: 'blur(24px) saturate(180%)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95))',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
            {/* Header con búsqueda */}
            <Box sx={{
              padding: isMobile ? '16px' : '8px 10px',
              borderBottom: '2px solid rgba(25, 118, 210, 0.1)',
              backgroundColor: 'rgba(25, 118, 210, 0.03)',
              borderTopLeftRadius: isMobile ? '16px' : '4px',
              borderTopRightRadius: isMobile ? '16px' : '4px',
              flexShrink: 0
            }}>
              <Typography variant="caption" sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'rgba(0, 0, 0, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '12px',
                display: 'block',
                textAlign: 'center'
              }}>
                🌍 Seleccionar País
              </Typography>
              
              {/* Campo de búsqueda */}
              <TextField
                size="small"
                fullWidth
                placeholder="Buscar país..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: '1.2rem', color: 'rgba(0, 0, 0, 0.5)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <Clear 
                        sx={{ 
                          fontSize: '1.2rem', 
                          color: 'rgba(0, 0, 0, 0.5)', 
                          cursor: 'pointer',
                          '&:hover': { color: 'rgba(0, 0, 0, 0.8)' }
                        }}
                        onClick={handleSearchClear}
                      />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    minHeight: isMobile ? '48px' : '40px', // Touch-friendly height
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(25, 118, 210, 0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                      borderWidth: '2px',
                    }
                  }
                }}
              />
            </Box>
            
            {/* Lista de países */}
            <Box sx={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '8px 0' : '8px 0',
              
              // Scrollbar moderna
              '&::-webkit-scrollbar': {
                width: isMobile ? '12px' : '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
                borderRadius: '10px',
                border: '2px solid transparent',
                backgroundClip: 'content-box',
                
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                }
              }
            }}>
              {/* Sección de países frecuentes */}
              {searchTerm === '' && (
                <>
                  <Typography variant="caption" sx={{
                    padding: '8px 10px',
                    color: 'rgba(0, 0, 0, 0.6)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block'
                  }}>
                    ⭐ Países Frecuentes
                  </Typography>
                  {frequentCountries.map((country) => 
                    renderCountryOption(country as CountryCode, country === selectedCountry)
                  )}
                  
                  <Divider sx={{ margin: '12px 16px', backgroundColor: 'rgba(25, 118, 210, 0.2)' }} />
                  
                  <Typography variant="caption" sx={{
                    padding: '8px 10px',
                    color: 'rgba(0, 0, 0, 0.6)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block'
                  }}>
                    🌎 Todos los Países
                  </Typography>
                </>
              )}
              
              {/* Lista filtrada de países */}
              {filteredCountries.length === 0 ? (
                <Box sx={{ 
                  padding: '10px',
                  textAlign: 'center',
                  color: 'rgba(0, 0, 0, 0.5)'
                }}>
                  <Typography variant="body2">
                    No se encontraron países que coincidan con "{searchTerm}"
                  </Typography>
                </Box>
              ) : (
                filteredCountries.map((country) => 
                  renderCountryOption(country as CountryCode, country === selectedCountry)
                )
              )}
            </Box>
            </Box>
          </Portal>
        )}
      </Box>
      
      {/* Helper text premium */}
      {helperText && (
        <FormHelperText 
          error={error} 
          sx={{ 
            mt: 1,
            mx: 2,
            fontSize: '0.8125rem',
            lineHeight: 1.5,
            fontWeight: 500,
            letterSpacing: '0.00938em'
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default React.memo(PhoneNumberInput); 