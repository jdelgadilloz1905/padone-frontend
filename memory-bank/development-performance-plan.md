# 🚀 PLAN DE OPTIMIZACIÓN DE RENDIMIENTO EN DESARROLLO
*TASK-029 - Detailed Implementation Plan*

## DIAGNÓSTICO INICIAL

### **PROBLEMAS IDENTIFICADOS**
1. **Vite Config Básico:** Configuración mínima sin optimizaciones
2. **Componentes Pesados:** ActiveRideView (14KB), Modal assignments (9.8KB)
3. **Bundle Analysis:** No hay análisis de dependencias
4. **Re-renders:** Posibles re-renderizados innecesarios
5. **Memory Usage:** No hay optimizaciones de memoria en desarrollo

### **MÉTRICAS ACTUALES (estimadas)**
- ⏱️ **Tiempo de arranque:** 10-15 segundos
- 🔄 **Hot reload:** 3-5 segundos  
- 📦 **Bundle size:** ~2-3MB inicial
- 🧠 **Memory usage:** 300-500MB

### **OBJETIVOS TARGET**
- ⏱️ **Tiempo de arranque:** < 3 segundos
- 🔄 **Hot reload:** < 1 segundo
- 📦 **Bundle size:** < 500KB inicial
- 🧠 **Memory usage:** < 200MB estable

---

## FASE 1: VITE OPTIMIZATION (2-3 horas)

### **1.1 Configuración Avanzada de Vite**
```typescript
// vite.config.ts - Configuración optimizada
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: false
    }
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          maps: ['@react-google-maps/api', 'leaflet', 'react-leaflet'],
          utils: ['axios', 'date-fns', 'i18next']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 
      '@mui/material', '@mui/icons-material',
      '@tanstack/react-query',
      'react-router-dom'
    ],
    exclude: ['@react-google-maps/api']
  }
})
```

### **1.2 Package.json Scripts Optimization**
```json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--max-old-space-size=4096' vite --host",
    "dev:debug": "NODE_OPTIONS='--max-old-space-size=4096 --inspect' vite --host",
    "build": "tsc -b && vite build",
    "build:analyze": "npm run build && npx vite-bundle-analyzer dist",
    "preview": "vite preview --host"
  }
}
```

### **1.3 TypeScript Incremental Compilation**
```json
// tsconfig.json optimization
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

---

## FASE 2: REACT PERFORMANCE AUDIT (2-3 horas)

### **2.1 Componentes Críticos a Optimizar**

#### **ActiveRideView.tsx (14KB - PRIORIDAD ALTA)**
```typescript
// Optimizaciones específicas:
- React.memo() para evitar re-renders
- useMemo() para cálculos pesados
- useCallback() para funciones que se pasan a children
- Lazy loading de subcomponentes
- Virtualization si hay listas grandes
```

#### **AsignarConductorModal.tsx (9.8KB)**
```typescript
// Optimizaciones específicas:
- Lazy load del modal (solo cargar cuando se abre)
- React.memo() con comparación customizada
- Debounce en búsquedas de conductores
- Memoizar opciones de select
```

#### **MapView.tsx (4.3KB)**
```typescript
// Optimizaciones específicas:
- React.memo() para evitar re-renderizados de mapa
- useCallback() para event handlers
- Throttle/debounce en eventos de mapa
- Lazy loading de marcadores
```

### **2.2 Optimizaciones Generales**
```typescript
// Patterns a implementar:
1. React.memo() en componentes presentacionales
2. useMemo() para cálculos costosos 
3. useCallback() para funciones en props
4. Code splitting adicional con React.lazy()
5. Suspense boundaries apropiados
```

### **2.3 Route-level Code Splitting**
```typescript
// Implementar lazy loading en todas las páginas:
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Conductores = lazy(() => import('./pages/Conductores'));
const Solicitudes = lazy(() => import('./pages/Solicitudes'));
// etc...
```

---

## FASE 3: DEVELOPMENT TOOLING (1-2 horas)

### **3.1 React DevTools Profiler**
- [ ] Instalar React DevTools profiler
- [ ] Configurar profiling en desarrollo
- [ ] Identificar componentes con re-renders excesivos
- [ ] Documentar componentes problemáticos

### **3.2 Bundle Analysis Setup**
```bash
# Instalar herramientas de análisis
npm install --save-dev vite-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer
```

### **3.3 Performance Monitoring**
```typescript
// Agregar métricas de performance
if (process.env.NODE_ENV === 'development') {
  // Performance observer para métricas
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`${entry.name}: ${entry.duration}ms`);
    }
  });
  observer.observe({ entryTypes: ['measure', 'navigation'] });
}
```

### **3.4 TanStack Query Optimization**
```typescript
// queryClient optimization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});
```

---

## FASE 4: INFRASTRUCTURE IMPROVEMENTS (1-2 horas)

### **4.1 Environment Variables**
```bash
# .env.development
VITE_NODE_OPTIONS=--max-old-space-size=4096
VITE_DEV_SERVER_POLL=false
VITE_HMR_OVERLAY=false
```

### **4.2 ESLint Performance**
```json
// .eslintrc.json optimization
{
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": false // Disable type-checking for faster linting
  }
}
```

### **4.3 Git Ignore Optimization**
```
# Performance-related ignores
.tsbuildinfo
*.tsbuildinfo
dist-dev/
.vite/
node_modules/.cache/
```

---

## IMPLEMENTACIÓN PASO A PASO

### **DÍA 1: CONFIGURACIÓN BASE (3-4 horas)**
1. ✅ Configurar vite.config.ts optimizado
2. ✅ Actualizar package.json scripts
3. ✅ Configurar TypeScript incremental
4. ✅ Instalar herramientas de análisis
5. ✅ Baseline performance measurement

### **DÍA 2: COMPONENTES (3-4 horas)**
1. ✅ Optimizar ActiveRideView.tsx 
2. ✅ Optimizar AsignarConductorModal.tsx
3. ✅ Optimizar MapView.tsx
4. ✅ Implementar lazy loading en rutas
5. ✅ Performance testing

### **DÍA 3: VALIDACIÓN (1-2 horas)**
1. ✅ Medir mejoras de performance
2. ✅ Documenter optimizaciones
3. ✅ Crear guidelines para el futuro
4. ✅ Update memory bank con resultados

---

## MÉTRICAS DE VALIDACIÓN

### **ANTES vs DESPUÉS**
| Métrica | Antes | Objetivo | Medición |
|---------|-------|----------|----------|
| Arranque | 10-15s | < 3s | TBD |
| Hot Reload | 3-5s | < 1s | TBD |
| Bundle Size | 2-3MB | < 500KB | TBD |
| Memory | 300-500MB | < 200MB | TBD |
| Re-renders | TBD | Minimizado | TBD |

### **HERRAMIENTAS DE MEDICIÓN**
- 🧮 **Bundle Size:** vite-bundle-analyzer
- ⏱️ **Loading Time:** Chrome DevTools Performance
- 🧠 **Memory:** Chrome DevTools Memory  
- 🔄 **React Performance:** React DevTools Profiler
- 📊 **Network:** Network tab analysis

---

## MANTENIMIENTO FUTURO

### **GUIDELINES PARA DESARROLLO**
1. 📏 **Component Size Limit:** Máximo 8KB por componente
2. 🎯 **Performance Budget:** Bundle chunks < 200KB  
3. 🔄 **Re-render Policy:** Usar React.memo() por defecto
4. 📦 **Import Policy:** Usar imports específicos vs barrel exports
5. 🧪 **Testing Policy:** Performance tests en CI/CD

### **MONITORING CONTINUO**
- 📊 Performance dashboard en desarrollo
- 🚨 Alerts si bundle size excede límites
- 📈 Métricas semanales de performance
- 🔍 Code review checklist para performance

---

**📝 Nota:** Este plan será ejecutado en 3 días máximo. Progreso será trackeado en tasks.md con updates diarios. 