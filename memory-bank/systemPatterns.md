# 🏗️ SYSTEM PATTERNS - Taxi Rosa Frontend

## PATRONES ARQUITECTÓNICOS

### 1. **COMPONENT-BASED ARCHITECTURE**
```
App
├── Pages (Route Components)
├── Layouts (Structure Components)
├── Components (Reusable UI)
├── Services (Business Logic)
├── Hooks (Custom React Hooks)
└── Utils (Helper Functions)
```

### 2. **SERVICE LAYER PATTERN**
- **Separación de responsabilidades** entre UI y lógica de negocio
- **Servicios especializados** por dominio (auth, rides, conductors, etc.)
- **Configuración centralizada** de API calls
- **Interceptores HTTP** para concerns transversales

### 3. **ROUTE-BASED CODE SPLITTING**
```typescript
// Lazy loading pattern
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Conductores = lazy(() => import('../pages/Conductores'));
```
- **Carga diferida** de componentes por ruta
- **Suspense boundaries** para loading states
- **Optimización automática** del bundle

## PATRONES DE ESTADO

### 1. **SERVER STATE MANAGEMENT**
```typescript
// TanStack Query pattern
const { data, isLoading, error } = useQuery({
  queryKey: ['conductores'],
  queryFn: conductorService.getAll
});
```
- **React Query** para estado del servidor
- **Cache automático** con invalidación inteligente
- **Optimistic updates** para mejor UX
- **Background refetching** para datos frescos

### 2. **CLIENT STATE PATTERN**
- **React Hook Form** para estado de formularios
- **useState/useReducer** para estado local
- **Context API** para estado compartido (cuando necesario)
- **Lifting state up** para comunicación entre componentes

### 3. **REAL-TIME STATE SYNC**
```typescript
// WebSocket pattern
useEffect(() => {
  socketService.on('ride_updated', (ride) => {
    queryClient.setQueryData(['rides', ride.id], ride);
  });
}, []);
```

## PATRONES DE UI/UX

### 1. **COMPOUND COMPONENTS PATTERN**
- **Material-UI** como base del design system
- **Custom hooks** para lógica reutilizable
- **Render props** para flexibilidad
- **Children as function** para composición avanzada

### 2. **RESPONSIVE DESIGN PATTERN**
- **Mobile-first** approach con Tailwind
- **Breakpoints consistentes** across components
- **Flexible grid system** con CSS Grid + Flexbox
- **Touch-friendly** interfaces para conductores

### 3. **LOADING & ERROR BOUNDARIES**
```typescript
// Error boundary pattern
<Suspense fallback={<Loading />}>
  <ErrorBoundary fallback={<ErrorUI />}>
    <Component />
  </ErrorBoundary>
</Suspense>
```

## PATRONES DE COMUNICACIÓN

### 1. **HTTP CLIENT PATTERN**
```typescript
// Axios interceptor pattern
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
- **Interceptores centralizados** para auth y logging
- **Error handling uniforme** across all requests
- **Request/Response transformation** automática
- **Retry logic** para requests fallidos

### 2. **WEBSOCKET COMMUNICATION**
```typescript
// Event-driven pattern
class SocketService {
  on(event: string, callback: Function) { /* ... */ }
  emit(event: string, data: any) { /* ... */ }
  off(event: string, callback: Function) { /* ... */ }
}
```
- **Event-driven architecture** para tiempo real
- **Automatic reconnection** logic
- **Graceful degradation** cuando WebSocket falla
- **Queue system** para mensajes offline

### 3. **API SERVICE PATTERN**
```typescript
// Service abstraction
export const conductorService = {
  getAll: () => API.get('/conductores'),
  getById: (id: string) => API.get(`/conductores/${id}`),
  create: (data: CreateConductor) => API.post('/conductores', data),
  update: (id: string, data: UpdateConductor) => API.put(`/conductores/${id}`, data),
  delete: (id: string) => API.delete(`/conductores/${id}`)
};
```

## PATRONES DE AUTENTICACIÓN

### 1. **ROUTE GUARDS PATTERN**
```typescript
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? children : <Navigate to="/login" />;
};
```

### 2. **TOKEN MANAGEMENT**
- **JWT storage** en localStorage
- **Automatic token refresh** (si implementado)
- **Token validation** en cada request
- **Logout automático** en token expiration

### 3. **ROLE-BASED ACCESS**
- **Dual authentication** (admin/conductor)
- **Route segregation** por tipo de usuario
- **Permission-based rendering** de UI elements

## PATRONES DE MAPAS

### 1. **DUAL PROVIDER PATTERN**
```typescript
// Fallback pattern para mapas
const MapComponent = ({ preferredProvider = 'google' }) => {
  return preferredProvider === 'google' ? 
    <GoogleMapComponent /> : 
    <LeafletMapComponent />;
};
```

### 2. **GEOLOCATION ABSTRACTION**
- **Unified interface** para diferentes map providers
- **Error handling** para servicios de geolocalización
- **Caching strategy** para reduce API calls
- **Offline support** con mapas precargados

## PATRONES DE PERFORMANCE

### 1. **CODE SPLITTING STRATEGIES**
- **Route-based splitting** para pages
- **Component-based splitting** para grandes componentes
- **Vendor splitting** para librerías externas
- **Dynamic imports** para funcionalidades opcionales

### 2. **MEMOIZATION PATTERNS**
```typescript
// React optimization patterns
const MemoizedComponent = React.memo(Component);
const memoizedValue = useMemo(() => expensiveCalculation(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
```

### 3. **VIRTUALIZATION**
- **Virtual scrolling** para listas grandes de conductores
- **Infinite loading** para solicitudes históricas
- **Pagination strategy** para datasets grandes

## PATRONES DE TESTING

### 1. **TESTING PYRAMID**
- **Unit tests** para servicios y utilities
- **Integration tests** para components con logic
- **E2E tests** para flujos críticos
- **Visual regression tests** para UI consistency

### 2. **MOCKING STRATEGIES**
```typescript
// Service mocking pattern
jest.mock('../services/conductorService', () => ({
  getAll: jest.fn().mockResolvedValue(mockConductores),
  create: jest.fn().mockResolvedValue(mockConductor)
}));
```

## PATRONES DE INTERNACIONALIZACIÓN

### 1. **I18N PATTERN**
```typescript
// Translation pattern
const { t } = useTranslation();
return <h1>{t('dashboard.title')}</h1>;
```
- **Namespace organization** por feature
- **Lazy loading** de traducciones
- **Pluralization support** para contadores
- **Context-aware translations**

## PATRONES DE DESARROLLO

### 1. **FEATURE-BASED ORGANIZATION**
```
src/
├── features/
│   ├── conductores/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   └── solicitudes/
│       ├── components/
│       ├── services/
│       └── hooks/
```

### 2. **TYPESCRIPT PATTERNS**
- **Interface segregation** para tipos específicos
- **Union types** para estados mutuamente exclusivos
- **Generic types** para componentes reutilizables
- **Strict type checking** en configuración

### 3. **ERROR HANDLING PATTERNS**
- **Error boundaries** para React errors
- **Global error handler** para API errors
- **User-friendly error messages** con i18n
- **Error reporting** para debugging (opcional) 