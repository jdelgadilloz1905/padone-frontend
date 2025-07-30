// =====================================================================
// SISTEMA DE PERFORMANCE MONITORING - TAXI ROSA
// Herramientas para medir y optimizar el rendimiento de la aplicación
// =====================================================================

// Métricas de Web Vitals
export interface WebVitals {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

// Métricas personalizadas de la aplicación
export interface AppMetrics {
  routeChangeTime?: number;
  componentMountTime?: number;
  apiResponseTime?: number;
  mapLoadTime?: number;
  dataFetchTime?: number;
}

// Store para métricas
const metrics: WebVitals & AppMetrics = {};
const observers: PerformanceObserver[] = [];

// Utilidad para medir tiempo de ejecución
export const measurePerformance = <T>(
  name: string, 
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> => {
  return new Promise(async (resolve) => {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      // Registrar métrica
      console.log(`⚡ Performance [${name}]: ${duration.toFixed(2)}ms`);
      
      resolve({ result, duration });
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ Performance Error [${name}]: ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  });
};

// Monitor de Web Vitals
export const initWebVitalsMonitoring = () => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;
    const lcpValue = lastEntry.startTime;
    metrics.LCP = lcpValue;
    
    if (lcpValue > 2500) {
      console.warn(`🐌 LCP lento: ${lcpValue.toFixed(2)}ms (objetivo: <2500ms)`);
    } else {
      console.log(`⚡ LCP: ${lcpValue.toFixed(2)}ms`);
    }
  });
  
  try {
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    observers.push(lcpObserver);
  } catch (e) {
    console.warn('LCP monitoring no soportado');
  }

  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      metrics.FID = entry.processingStart - entry.startTime;
      
      if (metrics.FID > 100) {
        console.warn(`🐌 FID lento: ${metrics.FID.toFixed(2)}ms (objetivo: <100ms)`);
      } else {
        console.log(`⚡ FID: ${metrics.FID.toFixed(2)}ms`);
      }
    });
  });
  
  try {
    fidObserver.observe({ entryTypes: ['first-input'] });
    observers.push(fidObserver);
  } catch (e) {
    console.warn('FID monitoring no soportado');
  }

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });
    
    metrics.CLS = clsValue;
    
    if (clsValue > 0.1) {
      console.warn(`🐌 CLS alto: ${clsValue.toFixed(3)} (objetivo: <0.1)`);
    }
  });
  
  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    observers.push(clsObserver);
  } catch (e) {
    console.warn('CLS monitoring no soportado');
  }

  // First Contentful Paint (FCP)
  const fcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      const fcpValue = entry.startTime;
      metrics.FCP = fcpValue;
      
      if (fcpValue > 1800) {
        console.warn(`🐌 FCP lento: ${fcpValue.toFixed(2)}ms (objetivo: <1800ms)`);
      } else {
        console.log(`⚡ FCP: ${fcpValue.toFixed(2)}ms`);
      }
    });
  });
  
  try {
    fcpObserver.observe({ entryTypes: ['paint'] });
    observers.push(fcpObserver);
  } catch (e) {
    console.warn('FCP monitoring no soportado');
  }
};

// Monitor de navegación y rutas
export const measureRouteChange = (routeName: string) => {
  const startTime = performance.now();
  
  return {
    finish: () => {
      const duration = performance.now() - startTime;
      metrics.routeChangeTime = duration;
      
      console.log(`🔄 Route Change [${routeName}]: ${duration.toFixed(2)}ms`);
      
      if (duration > 1000) {
        console.warn(`🐌 Cambio de ruta lento: ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
  };
};

// Monitor de carga de componentes
export const measureComponentMount = (componentName: string) => {
  const startTime = performance.now();
  
  return {
    finish: () => {
      const duration = performance.now() - startTime;
      metrics.componentMountTime = duration;
      
      console.log(`🏗️ Component Mount [${componentName}]: ${duration.toFixed(2)}ms`);
      
      if (duration > 500) {
        console.warn(`🐌 Montaje de componente lento: ${componentName} - ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
  };
};

// Monitor de respuestas API
export const measureApiCall = async <T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;
    metrics.apiResponseTime = duration;
    
    console.log(`🌐 API Call [${apiName}]: ${duration.toFixed(2)}ms`);
    
    if (duration > 2000) {
      console.warn(`🐌 API lenta: ${apiName} - ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ API Error [${apiName}]: ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};

// Monitor de carga de mapas
export const measureMapLoad = (mapType: 'google' | 'leaflet' = 'google') => {
  const startTime = performance.now();
  
  return {
    finish: () => {
      const duration = performance.now() - startTime;
      metrics.mapLoadTime = duration;
      
      console.log(`🗺️ Map Load [${mapType}]: ${duration.toFixed(2)}ms`);
      
      if (duration > 3000) {
        console.warn(`🐌 Carga de mapa lenta: ${mapType} - ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
  };
};

// Reportar métricas
export const getPerformanceReport = (): WebVitals & AppMetrics => {
  return { ...metrics };
};

// Imprimir reporte en consola
export const logPerformanceReport = () => {
  console.group('📊 Taxi Rosa - Performance Report');
  
  console.group('🌐 Web Vitals');
  if (metrics.FCP) console.log(`FCP: ${metrics.FCP.toFixed(2)}ms`);
  if (metrics.LCP) console.log(`LCP: ${metrics.LCP.toFixed(2)}ms`);
  if (metrics.FID) console.log(`FID: ${metrics.FID.toFixed(2)}ms`);
  if (metrics.CLS) console.log(`CLS: ${metrics.CLS.toFixed(3)}`);
  console.groupEnd();
  
  console.group('⚡ App Metrics');
  if (metrics.routeChangeTime) console.log(`Route Change: ${metrics.routeChangeTime.toFixed(2)}ms`);
  if (metrics.componentMountTime) console.log(`Component Mount: ${metrics.componentMountTime.toFixed(2)}ms`);
  if (metrics.apiResponseTime) console.log(`API Response: ${metrics.apiResponseTime.toFixed(2)}ms`);
  if (metrics.mapLoadTime) console.log(`Map Load: ${metrics.mapLoadTime.toFixed(2)}ms`);
  console.groupEnd();
  
  console.groupEnd();
};

// Limpiar observers (cleanup)
export const cleanupPerformanceMonitoring = () => {
  observers.forEach(observer => observer.disconnect());
  observers.length = 0;
};

// Hook React para performance monitoring
export const usePerformanceMonitoring = (componentName: string) => {
  const measureMount = () => measureComponentMount(componentName);
  const measureRoute = (routeName: string) => measureRouteChange(routeName);
  const measureApi = <T>(apiName: string, apiCall: () => Promise<T>) => 
    measureApiCall(apiName, apiCall);
  
  return {
    measureMount,
    measureRoute,
    measureApi,
    getReport: getPerformanceReport,
    logReport: logPerformanceReport
  };
};

// Auto-inicialización en desarrollo
if (import.meta.env.DEV) {
  setTimeout(() => {
    initWebVitalsMonitoring();
    console.log('🚀 Performance monitoring iniciado en modo desarrollo');
  }, 1000);
} 