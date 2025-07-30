# ⚙️ TECH CONTEXT - Taxi Rosa Frontend

## STACK TECNOLÓGICO COMPLETO

### **RUNTIME & BUILD**
- **Node.js:** Runtime para tooling y desarrollo
- **Vite 6.3.5:** Build tool y dev server ultra-rápido
- **TypeScript 5.8.3:** Superset tipado de JavaScript
- **ESM Modules:** Formato de módulos nativo

### **FRAMEWORK & UI**
- **React 19.1.0:** Framework principal de UI
- **React DOM 19.1.0:** Renderizado en DOM
- **Material-UI 7.1.0:** Design system y componentes
- **Emotion:** CSS-in-JS para Material-UI
- **Tailwind CSS 4.1.6:** Framework de utilidades CSS
- **Sass 1.88.0:** Preprocesador CSS

### **ESTADO & DATA FETCHING**
- **TanStack Query 5.76.0:** Server state management
- **React Hook Form 7.56.3:** Gestión de formularios
- **Axios 1.9.0:** Cliente HTTP para APIs

### **ROUTING & NAVEGACIÓN**
- **React Router DOM 7.6.0:** Routing declarativo
- **Lazy Loading:** Code splitting automático
- **Suspense:** Loading boundaries para componentes

### **MAPAS & GEOLOCALIZACIÓN**
- **React Leaflet 5.0.0:** Mapas con Leaflet
- **Leaflet 1.9.4:** Librería de mapas base
- **Google Maps API 2.20.6:** Integración con Google Maps
- **Dual Provider Strategy:** Fallback entre sistemas

### **TIEMPO REAL & COMUNICACIÓN**
- **Socket.io Client 4.8.1:** WebSocket para tiempo real
- **Event-driven Architecture:** Comunicación asíncrona
- **Auto-reconnection:** Manejo de conexiones

### **INTERNACIONALIZACIÓN**
- **i18next 25.1.2:** Framework de internacionalización
- **react-i18next 15.5.1:** React bindings para i18n
- **Browser Language Detector 8.1.0:** Detección automática
- **Namespace Organization:** Traducciones por feature

### **FECHAS & TIEMPO**
- **date-fns 4.1.0:** Utilidades de fechas modernas
- **MUI Date Pickers 8.4.0:** Componentes de fecha

### **DESARROLLO & CALIDAD**
- **ESLint 9.25.0:** Linting de código
- **TypeScript ESLint:** Reglas específicas para TS
- **Globals 16.0.0:** Configuración de globales
- **React Hooks ESLint:** Reglas específicas para hooks

## CONFIGURACIÓN DEL PROYECTO

### **VITE CONFIGURATION**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  // Configuración optimizada para desarrollo
});
```

### **TYPESCRIPT CONFIGURATION**
```json
// tsconfig.json - Configuración estricta
{
  "extends": "./tsconfig.app.json",
  "references": [
    { "path": "./tsconfig.node.json" }
  ]
}
```

### **BUILD TARGETS**
- **App Config:** `tsconfig.app.json` para código de aplicación
- **Node Config:** `tsconfig.node.json` para tooling
- **Strict Type Checking:** Configuración estricta habilitada

## ARQUITECTURA DE DESARROLLO

### **ESTRUCTURA DE DIRECTORIOS**
```
src/
├── pages/           # Componentes de página (route-level)
├── components/      # Componentes reutilizables
├── services/        # Lógica de negocio y API
├── hooks/          # Custom React hooks
├── layouts/        # Layouts de aplicación
├── routes/         # Configuración de routing
├── theme/          # Configuración de Material-UI
├── i18n/           # Configuración de internacionalización
├── utils/          # Funciones utilitarias
└── assets/         # Recursos estáticos
```

### **SERVICIOS PRINCIPALES**
```typescript
// Service layer organization
api.ts              # Configuración base de HTTP client
authService.ts      # Autenticación y autorización
rideService.ts      # Gestión de viajes (24KB - core business)
conductorService.ts # Gestión de conductores
zoneService.ts      # Gestión de zonas geográficas
comisionService.ts  # Sistema de comisiones
trackingService.ts  # Seguimiento en tiempo real
socketService.ts    # Comunicación WebSocket
mapService.ts       # Servicios de mapas
```

## CONFIGURACIÓN DE APIS

### **HTTP CLIENT SETUP**
```typescript
// Configuración centralizada
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Interceptores automáticos
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### **WEBSOCKET CONFIGURATION**
```typescript
// Socket.io setup para tiempo real
const socketService = {
  connect: () => io(SOCKET_URL),
  on: (event: string, callback: Function) => socket.on(event, callback),
  emit: (event: string, data: any) => socket.emit(event, data),
  disconnect: () => socket.disconnect()
};
```

## PATTERNS DE IMPLEMENTACIÓN

### **LAZY LOADING STRATEGY**
```typescript
// Code splitting por rutas
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Conductores = lazy(() => import('../pages/Conductores'));

// Suspense boundaries
<Suspense fallback={<Loading />}>
  <Routes>{/* rutas */}</Routes>
</Suspense>
```

### **QUERY MANAGEMENT**
```typescript
// TanStack Query patterns
const { data, isLoading, error } = useQuery({
  queryKey: ['conductores'],
  queryFn: conductorService.getAll,
  staleTime: 5 * 60 * 1000, // 5 minutos
  refetchOnWindowFocus: false
});
```

### **FORM HANDLING**
```typescript
// React Hook Form integration
const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema), // Validation opcional
  defaultValues: {}
});
```

## CONFIGURACIÓN DE UI

### **MATERIAL-UI THEME**
```typescript
// Theme customization
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
  }
});
```

### **TAILWIND INTEGRATION**
```css
/* Integración con Material-UI */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utilities para proyecto */
```

## OPTIMIZACIONES DE PERFORMANCE

### **BUNDLE OPTIMIZATION**
- **Tree Shaking:** Eliminación automática de código no usado
- **Code Splitting:** División automática por rutas
- **Dynamic Imports:** Carga bajo demanda de funcionalidades
- **Asset Optimization:** Optimización automática de imágenes

### **RUNTIME OPTIMIZATION**
- **React.memo:** Memoización de componentes
- **useMemo/useCallback:** Optimización de renders
- **Virtual Scrolling:** Para listas grandes
- **Image Lazy Loading:** Carga diferida de imágenes

### **NETWORK OPTIMIZATION**
- **Request Caching:** Cache inteligente con React Query
- **Request Deduplication:** Eliminación de requests duplicados
- **Background Refetching:** Actualización en background
- **Optimistic Updates:** Updates inmediatos en UI

## CONFIGURACIÓN DE DESARROLLO

### **DEVELOPMENT SERVER**
```bash
npm run dev     # Vite dev server con HMR
npm run build   # Build de producción
npm run preview # Preview del build
npm run lint    # Linting del código
```

### **ENVIRONMENT VARIABLES**
```env
VITE_API_URL=http://localhost:8000/api
VITE_SOCKET_URL=ws://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_ENVIRONMENT=development
```

### **HOT MODULE REPLACEMENT**
- **Vite HMR:** Actualizaciones instantáneas sin refresh
- **React Fast Refresh:** Preservación de estado en desarrollo
- **CSS Hot Reload:** Actualizaciones de estilos en tiempo real

## DEPLOYMENT & BUILD

### **BUILD PROCESS**
1. **TypeScript Compilation:** `tsc -b` para verificación de tipos
2. **Vite Build:** Optimización y bundling
3. **Asset Processing:** Optimización de recursos
4. **Static Generation:** Generación de archivos estáticos

### **OUTPUT STRUCTURE**
```
dist/
├── assets/        # JS, CSS y recursos optimizados
├── index.html     # HTML principal
└── vite.manifest.json # Manifest de assets
```

### **PRODUCTION OPTIMIZATIONS**
- **Minification:** Código JavaScript y CSS minificado
- **Compression:** Gzip/Brotli para archivos estáticos
- **Asset Hashing:** Cache busting automático
- **Bundle Analysis:** Análisis de tamaño de bundle

## CONSIDERACIONES TÉCNICAS

### **BROWSER SUPPORT**
- **Browsers Modernos:** Chrome, Firefox, Safari, Edge
- **ES2020+ Features:** Async/await, optional chaining, etc.
- **Progressive Enhancement:** Degradación graceful

### **ACCESSIBILITY**
- **Material-UI A11y:** Componentes accesibles por defecto
- **ARIA Labels:** Etiquetas semánticas
- **Keyboard Navigation:** Navegación completa por teclado
- **Screen Reader Support:** Compatibilidad con lectores de pantalla

### **SECURITY CONSIDERATIONS**
- **XSS Protection:** Sanitización automática de React
- **CSRF Protection:** Configuración en API backend
- **Secure Storage:** Consideraciones para tokens JWT
- **Content Security Policy:** Headers de seguridad (backend) 