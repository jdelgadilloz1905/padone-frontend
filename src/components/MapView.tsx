import { useState, useRef, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import useGoogleMaps from '../hooks/useGoogleMaps';

// Este componente se renderiza mientras Google Maps se está cargando
const LoadingMap = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    height="100%" 
    width="100%"
    bgcolor="#f5f5f5"
    borderRadius={1}
  >
    <CircularProgress size={40} />
  </Box>
);

// Estilos para el contenedor del mapa
const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '200px'
};

// Opciones para Google Maps
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false
};

interface MapViewProps {
  lat: number;
  lng: number;
  popupContent?: React.ReactNode;
  showDestination?: {
    lat: number;
    lng: number;
    title: string;
  };
  driverLocation?: {
    lat: number;
    lng: number;
    profileImage?: string;
  };
  onMapClick?: (lat: number, lng: number, address: string) => void;
}

const MapView = ({ lat, lng, popupContent, showDestination, driverLocation, onMapClick }: MapViewProps) => {
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(!!popupContent);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const centerRef = useRef({ lat, lng });
  
  // Usar el hook centralizado de Google Maps
  const { isLoaded, loadError, apiKey } = useGoogleMaps();
  
  // Si no hay API key, mostrar mensaje
  if (!apiKey) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        height="100%" 
        width="100%"
        bgcolor="#f5f5f5"
        borderRadius={1}
        p={2}
      >
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div>🗺️ Google Maps no disponible</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            Configura VITE_GOOGLE_MAPS_API_KEY en .env
          </div>
        </div>
      </Box>
    );
  }

  // Función para calcular la ruta, solo si el mapa y la API están listos
  const calculateRoute = () => {
    if (showDestination && window.google && window.google.maps && mapRef.current) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat, lng },
          destination: { lat: showDestination.lat, lng: showDestination.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          } else {
            setDirections(null);
            console.error('Error al calcular la ruta:', status);
          }
        }
      );
    } else {
      setDirections(null);
    }
  };

  // Actualizar centro del mapa cuando cambien las coordenadas
  useEffect(() => {
    centerRef.current = { lat, lng };
    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng });
      calculateRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, showDestination]);

  // Manejar error de carga
  if (loadError) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        height="100%" 
        width="100%"
        bgcolor="#f5f5f5"
        borderRadius={1}
        p={2}
      >
        <div style={{ textAlign: 'center', color: '#d32f2f' }}>
          <div>❌ Error al cargar Google Maps</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            Verifica tu API key o conexión
          </div>
        </div>
      </Box>
    );
  }

  // Mostrar componente de carga mientras se carga la API
  if (!isLoaded) {
    return <LoadingMap />;
  }

  // Handler para click en el mapa
  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!onMapClick || !e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    let address = '';
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      await new Promise<void>((resolve) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            address = results[0].formatted_address;
          }
          resolve();
        });
      });
    }
    onMapClick(lat, lng, address);
  };

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={centerRef.current}
      zoom={15}
      options={mapOptions}
      onLoad={(map) => {
        mapRef.current = map;
        // Solo ajustar bounds en la carga inicial
        if (showDestination || driverLocation) {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(centerRef.current);
          if (showDestination) {
            bounds.extend({ lat: showDestination.lat, lng: showDestination.lng });
          }
          if (driverLocation) {
            bounds.extend({ lat: driverLocation.lat, lng: driverLocation.lng });
          }
          setTimeout(() => {
            map.fitBounds(bounds);
          }, 100);
        }
        // Calcular la ruta cuando el mapa esté listo
        calculateRoute();
      }}
      onClick={onMapClick ? handleMapClick : undefined}
    >
      {/* Marcador principal (origen/cliente) */}
      <Marker 
        position={centerRef.current}
        onClick={() => popupContent && setIsInfoWindowOpen(true)}
        title="Origen"
      >
        {popupContent && isInfoWindowOpen && (
          <InfoWindow
            position={centerRef.current}
            onCloseClick={() => setIsInfoWindowOpen(false)}
          >
            <div>{popupContent}</div>
          </InfoWindow>
        )}
      </Marker>

      {/* Marcador de destino */}
      {showDestination && (
        <Marker
          position={{ lat: showDestination.lat, lng: showDestination.lng }}
          title={`Destino: ${showDestination.title}`}
        />
      )}

      {/* Marcador del conductor */}
      {driverLocation && (
        <Marker
          position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
          title="Conductor"
          icon={{
            url: driverLocation.profileImage || 'https://maps.google.com/mapfiles/ms/icons/cabs.png',
            scaledSize: new window.google.maps.Size(40, 40)
          }}
        />
      )}

      {/* Renderizar la ruta */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            polylineOptions: {
              strokeColor: '#e5308a',
              strokeWeight: 4,
              strokeOpacity: 0.8
            },
            suppressMarkers: true
          }}
        />
      )}
    </GoogleMap>
  );
};

export default MapView; 