import { useJsApiLoader } from '@react-google-maps/api';

// Bibliotecas que necesitamos para todos los componentes
const libraries: ("drawing" | "geometry" | "places" | "visualization")[] = ["drawing", "geometry", "places"];

// Función para obtener la API key con fallback
const getApiKey = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return apiKey || '';
};

// Opciones estándar para todos los mapas
export const defaultMapOptions = {
  disableDefaultUI: false,
  mapTypeControl: true,
  fullscreenControl: true,
  gestureHandling: 'greedy' as const,
  streetViewControl: true,
  zoomControl: true,
  mapTypeId: 'roadmap' as const
};

// Opciones para el administrador de dibujo
export const defaultDrawingManagerOptions = {
  polygonOptions: {
    fillColor: '#FF69B4',
    fillOpacity: 0.3,
    strokeColor: '#FF1493',
    strokeWeight: 2,
    clickable: true,
    editable: true,
    draggable: true,
    zIndex: 1
  },
  drawingControl: true,
  drawingControlOptions: {
    drawingModes: ['polygon'] as google.maps.drawing.OverlayType[]
  }
};

// Hook personalizado para Google Maps
export const useGoogleMaps = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: getApiKey(),
    libraries,
    version: "weekly"
  });

  return {
    isLoaded,
    loadError,
    apiKey: getApiKey(),
    libraries,
    defaultMapOptions,
    defaultDrawingManagerOptions
  };
};

export default useGoogleMaps; 