# 🚖 PLAN DE IMPLEMENTACIÓN: MÓDULO DE PROGRAMACIÓN DE CARRERAS

## 📋 ANÁLISIS DEL CONTEXTO ACTUAL

**Fecha de Creación:** 2024-01-XX  
**Estado del Proyecto:** Arquitectura sólida con React 19 + TypeScript + Vite  
**Patrones Establecidos:** Material-UI + Tailwind CSS, WebSocket, Autenticación Dual  

### **✅ INFRAESTRUCTURA EXISTENTE APROVECHABLE**
- ✅ React 19 + TypeScript + Vite (configuración optimizada)
- ✅ Material-UI + Tailwind CSS (sistema responsive implementado)
- ✅ Sistema de autenticación dual (admin/conductor) - 100% funcional
- ✅ WebSocket para tiempo real (Socket.io) - 100% funcional
- ✅ Patrones de servicios bien establecidos (rideService.ts, conductorService.ts, etc.)
- ✅ Sistema de mapas dual (Google Maps + Leaflet) - 100% funcional
- ✅ Internacionalización completa (i18next) - 90% implementado
- ✅ React Query para gestión de estado del servidor - optimizado
- ✅ Sistema responsive implementado (85% completado)

### **🎯 OBJETIVO DEL MÓDULO**
Crear un sistema completo de programación de carreras que permita:
- Programar carreras para días/semanas futuras
- Vista de calendario intuitiva para administradores
- Asignación inteligente de conductores
- Sistema de notificaciones automáticas
- Métricas y reportes de cumplimiento

---

## 🏗️ ESTRATEGIA DE IMPLEMENTACIÓN BASADA EN PATRONES EXISTENTES

### **FASE 1: INFRAESTRUCTURA BASE (2-3 días)**

#### **1.1 Estructura de Servicios (Siguiendo patrones existentes)**
```typescript
// Nuevos servicios siguiendo el patrón de rideService.ts (780 líneas)
src/services/
├── scheduledRideService.ts     // CRUD de carreras programadas (patrón conductorService.ts)
├── calendarService.ts          // Lógica de calendario (patrón mapService.ts)
├── notificationService.ts      // Notificaciones automáticas (patrón socketService.ts)
└── assignmentService.ts        // Asignación inteligente (patrón rideService.ts)

// Nuevos hooks siguiendo el patrón de useRideService.ts
src/hooks/
├── useScheduledRides.ts        // Gestión de carreras programadas
├── useCalendar.ts              // Lógica del calendario
├── useDriverAssignment.ts      // Asignación de conductores
└── useNotifications.ts         // Sistema de notificaciones
```

#### **1.2 Modelos de Datos (Siguiendo patrones existentes)**
```typescript
// Siguiendo el patrón de interfaces en rideService.ts
interface ScheduledRide {
  id: string;
  client_id?: string;
  client_name: string;
  client_phone: string;
  driver_id?: string;
  pickup_location: string;
  pickup_coordinates: { lat: number; lng: number };
  destination: string;
  destination_coordinates: { lat: number; lng: number };
  scheduled_date: string; // ISO 8601
  scheduled_time: string; // HH:MM
  estimated_duration: number;
  estimated_cost: number;
  status: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    end_date?: string;
    days_of_week?: number[];
  };
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Siguiendo el patrón de métricas en Dashboard.tsx
interface ScheduledRideMetrics {
  // Métricas de programación
  total_scheduled: number;
  scheduled_today: number;
  scheduled_this_week: number;
  scheduled_this_month: number;
  
  // Métricas de cumplimiento
  completion_rate: number;
  on_time_rate: number;
  cancellation_rate: number;
  
  // Métricas de asignación
  auto_assignment_rate: number;
  average_assignment_time: number;
  unassigned_rides: number;
  
  // Métricas de conductores
  most_scheduled_driver: Driver;
  driver_punctuality: Array<{driver_id: string; on_time_percentage: number}>;
}
```

### **FASE 2: COMPONENTES DE CALENDARIO (3-4 días)**

#### **2.1 Estructura de Componentes (Siguiendo patrones existentes)**
```
src/components/calendar/
├── CalendarView.tsx           # Vista principal (patrón Solicitudes.tsx)
├── CalendarHeader.tsx         # Controles de navegación (patrón Conductores.tsx)
├── MonthView.tsx              # Vista mensual (patrón Dashboard.tsx)
├── WeekView.tsx               # Vista semanal (patrón Solicitudes.tsx)
├── DayView.tsx                # Vista detallada del día (patrón DetalleConductor.tsx)
├── RideCard.tsx               # Tarjeta de carrera (patrón RequestMobileCard.tsx)
├── ScheduleRideModal.tsx      # Modal para programar (patrón AsignarConductorModal.tsx)
├── AssignDriverModal.tsx      # Modal para asignar (patrón AsignarConductorModal.tsx)
├── RecurringRideModal.tsx     # Modal para carreras recurrentes
└── CalendarMetrics.tsx        # Métricas del calendario (patrón Dashboard.tsx)
```

#### **2.2 Página Principal (Siguiendo patrón de Conductores.tsx)**
```typescript
// src/pages/ScheduledRides.tsx - Siguiendo patrón de Conductores.tsx (865 líneas)
const ScheduledRides: React.FC = () => {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { isMobile } = useResponsive(); // Patrón existente
  
  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Header siguiendo patrón de Conductores.tsx */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center',
          mb: 3,
          gap: 2
        }}>
          <Typography variant={isMobile ? 'h5' : 'h4'}>
            📅 Carreras Programadas
          </Typography>
          
          {/* FAB para móvil siguiendo patrón existente */}
          {isMobile ? (
            <Fab
              color="primary"
              onClick={() => setShowScheduleModal(true)}
              sx={{ alignSelf: 'flex-end' }}
            >
              <AddIcon />
            </Fab>
          ) : (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setShowScheduleModal(true)}
            >
              Nueva Carrera
            </Button>
          )}
        </Box>
        
        {/* Vista del calendario */}
        <CalendarView
          view={view}
          currentDate={currentDate}
          onViewChange={setView}
          onDateChange={setCurrentDate}
          onRideSelect={handleRideSelect}
          onCreateRide={handleCreateRide}
        />
      </Box>
      
      {/* Modales siguiendo patrón de AsignarConductorModal.tsx */}
      <ScheduleRideModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        initialDate={currentDate}
      />
    </MainLayout>
  );
};
```

### **FASE 3: FUNCIONALIDADES AVANZADAS (2-3 días)**

#### **3.1 Sistema de Asignación Inteligente (Siguiendo patrón de rideService.ts)**
```typescript
// Siguiendo el patrón de asignación en rideService.ts
const assignDriverToRide = async (rideId: string) => {
  const ride = await getScheduledRide(rideId);
  const availableDrivers = await getAvailableDrivers(ride.scheduled_date, ride.scheduled_time);
  
  // Criterios de asignación siguiendo lógica existente:
  // 1. Proximidad geográfica (usando mapService.ts)
  // 2. Historial de puntualidad (usando conductorService.ts)
  // 3. Disponibilidad confirmada (usando socketService.ts)
  // 4. Preferencias del cliente (si existen)
  
  const bestDriver = calculateBestDriver(ride, availableDrivers);
  return assignDriver(rideId, bestDriver.id);
};
```

#### **3.2 Sistema de Notificaciones (Siguiendo patrón de socketService.ts)**
```typescript
// Siguiendo el patrón de socketService.ts (136 líneas)
const notificationService = {
  // Recordatorio 24h antes
  sendDayBeforeReminder: async (rideId: string) => {
    const ride = await getScheduledRide(rideId);
    await sendSMS(ride.client_phone, `Recordatorio: Su taxi mañana a las ${ride.scheduled_time}`);
  },
  
  // Recordatorio 1h antes
  sendHourBeforeReminder: async (rideId: string) => {
    const ride = await getScheduledRide(rideId);
    await sendSMS(ride.client_phone, `Su taxi llegará en 1 hora. Conductor: ${ride.driver_name}`);
  },
  
  // Notificación al conductor (usando socketService.ts)
  notifyDriver: async (rideId: string) => {
    const ride = await getScheduledRide(rideId);
    socketService.emit('scheduled_ride_assigned', {
      driver_id: ride.driver_id,
      ride_data: ride
    });
  }
};
```

### **FASE 4: INTEGRACIÓN CON SISTEMA EXISTENTE (1-2 días)**

#### **4.1 Integración con Rutas (Siguiendo patrón de AppRoutes.tsx)**
```typescript
// src/routes/AppRoutes.tsx - Agregar nueva ruta siguiendo patrón existente
{
  path: '/scheduled-rides',
  element: (
    <RequireRole allowedRoles={['admin', 'dispatcher']}>
      <ScheduledRides />
    </RequireRole>
  )
}
```

#### **4.2 Integración con Dashboard (Siguiendo patrón de Dashboard.tsx)**
```typescript
// Agregar métricas de carreras programadas al dashboard existente
const Dashboard: React.FC = () => {
  return (
    <Grid container spacing={3}>
      {/* Métricas existentes */}
      <Grid item xs={12} md={3}>
        <MetricCard title="Carreras Hoy" value={activeRides} />
      </Grid>
      
      {/* NUEVAS métricas de carreras programadas */}
      <Grid item xs={12} md={3}>
        <MetricCard title="Programadas Hoy" value={scheduledToday} />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard title="Sin Asignar" value={unassignedRides} />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard title="Tasa Cumplimiento" value={`${completionRate}%`} />
      </Grid>
    </Grid>
  );
};
```

---

## 🎨 DISEÑO DE INTERFAZ RESPONSIVE (Siguiendo patrones existentes)

### **Siguiendo los patrones de Solicitudes.tsx y Conductores.tsx:**

```typescript
// Componente responsive siguiendo el patrón de Solicitudes.tsx (909 líneas)
const CalendarView: React.FC = () => {
  const { isMobile, isTablet } = useResponsive(); // Patrón existente
  
  return (
    <Box sx={{ height: '100%' }}>
      {/* Header responsive siguiendo patrón de Conductores.tsx */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 1,
        mb: 3 
      }}>
        <Typography variant={isMobile ? 'h5' : 'h4'}>
          📅 Carreras Programadas
        </Typography>
        <Button 
          variant="contained"
          fullWidth={isMobile}
          startIcon={<AddIcon />}
        >
          Nueva Carrera
        </Button>
      </Box>
      
      {/* Vista del calendario adaptativa siguiendo patrón de Solicitudes.tsx */}
      {isMobile ? (
        <MobileCalendarView />
      ) : (
        <DesktopCalendarView />
      )}
    </Box>
  );
};
```

### **Diseño de Interfaz (Siguiendo patrones existentes)**

#### **Página Principal - Calendario (Siguiendo patrón de Solicitudes.tsx)**
```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Carreras Programadas                    [+ Nueva Carrera] │
├─────────────────────────────────────────────────────────────┤
│ [Mes] [Semana] [Día]    ← Enero 2024 →    [Hoy] [Filtros]  │
├─────────────────────────────────────────────────────────────┤
│ Dom    Lun    Mar    Mié    Jue    Vie    Sáb              │
│  1      2      3      4      5      6      7               │
│         🚗     🚗🚗           🚗                           │
│                                                             │
│  8      9     10     11     12     13     14               │
│  🚗🚗   🚗    🚗🚗🚗   🚗     🚗🚗    🚗     🚗              │
│                                                             │
│ 15     16     17     18     19     20     21               │
│  🚗     🚗     🚗     🚗🚗    🚗     🚗🚗    🚗              │
└─────────────────────────────────────────────────────────────┘

📊 Estadísticas del Mes:
• Total programadas: 45
• Completadas: 38 (84%)
• Canceladas: 4 (9%)
• Pendientes: 3 (7%)
```

#### **Modal de Nueva Carrera (Siguiendo patrón de AsignarConductorModal.tsx)**
```
┌─────────────────────────────────────────────────────────────┐
│ ✨ Programar Nueva Carrera                            [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 👤 Información del Cliente                                  │
│ Nombre: [Juan Carlos Pérez        ]                        │
│ Teléfono: [+58 414-123-4567      ]                        │
│                                                             │
│ 📍 Ubicaciones                                             │
│ Recogida: [Centro Comercial Sambil    ] [📍]              │
│ Destino:  [Aeropuerto Maiquetía       ] [📍]              │
│                                                             │
│ 🕐 Programación                                            │
│ Fecha: [15/01/2024 ▼] Hora: [14:30 ▼]                     │
│ Prioridad: [Normal ▼]                                      │
│                                                             │
│ 🔄 Opciones Avanzadas                                      │
│ ☐ Carrera recurrente                                       │
│ ☐ Asignar conductor automáticamente                        │
│                                                             │
│ 📝 Notas adicionales:                                      │
│ [Vuelo a las 16:00, confirmar 30 min antes]               │
│                                                             │
│                            [Cancelar] [Programar Carrera]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTACIÓN TÉCNICA DETALLADA

### **1. Servicios Backend Necesarios (Siguiendo patrón de rideService.ts)**
```typescript
// API endpoints siguiendo patrón de rideService.ts
GET    /api/scheduled-rides           // Listar con filtros
POST   /api/scheduled-rides           // Crear nueva
PUT    /api/scheduled-rides/:id       // Actualizar
DELETE /api/scheduled-rides/:id       // Cancelar

GET    /api/calendar/rides/:date      // Carreras de un día
GET    /api/calendar/month/:year/:month // Vista mensual
GET    /api/calendar/week/:date       // Vista semanal

POST   /api/scheduled-rides/:id/assign   // Asignar conductor
DELETE /api/scheduled-rides/:id/unassign // Desasignar conductor
GET    /api/drivers/available/:date/:time // Conductores disponibles

POST   /api/scheduled-rides/:id/notify   // Enviar recordatorio
GET    /api/scheduled-rides/upcoming     // Carreras próximas
```

### **2. Integración con WebSocket (Siguiendo patrón de socketService.ts)**
```typescript
// Extender el sistema WebSocket existente siguiendo patrón de socketService.ts
useEffect(() => {
  socketService.on('scheduled_ride_created', (ride) => {
    queryClient.invalidateQueries(['scheduled-rides']);
  });
  
  socketService.on('scheduled_ride_updated', (ride) => {
    queryClient.setQueryData(['scheduled-rides', ride.id], ride);
  });
  
  socketService.on('driver_assigned', (data) => {
    queryClient.invalidateQueries(['scheduled-rides']);
  });
}, []);
```

### **3. Sistema de Cache Inteligente (Siguiendo patrón de useRideService.ts)**
```typescript
// Configuración de React Query siguiendo patrón de useRideService.ts
const useScheduledRides = (filters: ScheduledRideFilters) => {
  return useQuery({
    queryKey: ['scheduled-rides', filters],
    queryFn: () => scheduledRideService.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
    refetchInterval: 30 * 1000, // 30 segundos
  });
};
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN POR FASES

### **SEMANA 1: Infraestructura Base**
- **Día 1-2:** Modelos de datos y servicios backend (siguiendo patrón de conductorService.ts)
- **Día 3-4:** Componentes base del calendario (siguiendo patrón de Solicitudes.tsx)
- **Día 5:** Integración con rutas y navegación (siguiendo patrón de AppRoutes.tsx)

### **SEMANA 2: Funcionalidades Core**
- **Día 1-2:** Modal de programación de carreras (siguiendo patrón de AsignarConductorModal.tsx)
- **Día 3-4:** Sistema de asignación de conductores (siguiendo patrón de rideService.ts)
- **Día 5:** Vistas del calendario (mes/semana/día) (siguiendo patrón de Dashboard.tsx)

### **SEMANA 3: Funcionalidades Avanzadas**
- **Día 1-2:** Sistema de notificaciones (siguiendo patrón de socketService.ts)
- **Día 3-4:** Carreras recurrentes
- **Día 5:** Métricas y dashboard (siguiendo patrón de Dashboard.tsx)

### **SEMANA 4: Testing y Optimización**
- **Día 1-2:** Testing responsive en dispositivos (siguiendo patrón de TASK-054)
- **Día 3-4:** Optimización de performance (siguiendo patrón de TASK-029)
- **Día 5:** Documentación y refinamientos

---

## 🎯 CARACTERÍSTICAS INNOVADORAS

### **1. 🤖 Asignación Inteligente**
- Algoritmo que considera proximidad geográfica (usando mapService.ts)
- Historial de puntualidad del conductor (usando conductorService.ts)
- Disponibilidad confirmada (usando socketService.ts)
- Preferencias del cliente (si existen)

### **2. 🔔 Notificaciones Proactivas**
- Recordatorios automáticos para clientes
- Notificaciones push para conductores (usando socketService.ts)
- Confirmaciones de disponibilidad
- Alertas de carreras próximas

### **3. 🔄 Carreras Recurrentes**
- Programación automática de viajes regulares
- Configuración de patrones (diario/semanal/mensual)
- Gestión de excepciones y cancelaciones
- Generación automática de carreras futuras

### **4. 📊 Analytics en Tiempo Real**
- Métricas de cumplimiento y eficiencia (siguiendo patrón de Dashboard.tsx)
- Tendencias de programación
- Análisis de conductores más solicitados
- Reportes de puntualidad

### **5. 🗺️ Integración con Mapas**
- Visualización de rutas programadas (usando mapService.ts)
- Optimización de rutas para eficiencia
- Cálculo automático de distancias y tiempos
- Integración con el sistema de tracking existente

### **6. ⚡ Performance Optimizada**
- Cache inteligente con React Query (siguiendo patrón de useRideService.ts)
- Lazy loading de componentes pesados
- Paginación para calendarios grandes
- Optimización de consultas a base de datos

---

## 🔒 CONSIDERACIONES DE SEGURIDAD

### **1. Control de Acceso**
- Validación de permisos por rol (admin/dispatcher) - siguiendo patrón existente
- Protección de rutas sensibles - siguiendo patrón de RequireRole.tsx
- Auditoría de acciones críticas

### **2. Validación de Datos**
- Sanitización de datos de entrada
- Validación de fechas y horarios
- Verificación de coordenadas geográficas

### **3. Rate Limiting**
- Límites en creación de carreras
- Protección contra spam de notificaciones
- Control de acceso a APIs sensibles

### **4. Auditoría**
- Log de cambios en carreras programadas
- Registro de asignaciones de conductores
- Trazabilidad de cancelaciones

---

## 📊 MÉTRICAS DE ÉXITO

### **KPIs Principales**
- **Tasa de Cumplimiento:** > 90% de carreras programadas completadas
- **Puntualidad:** > 85% de carreras que salen a tiempo
- **Asignación Automática:** > 80% de asignaciones exitosas
- **Satisfacción del Cliente:** > 4.5/5 en carreras programadas

### **Métricas Técnicas**
- **Tiempo de Carga:** < 2 segundos para vista de calendario
- **Disponibilidad:** > 99.9% uptime
- **Performance:** < 100ms para operaciones CRUD
- **Escalabilidad:** Soporte para 1000+ carreras programadas

---

## 🔮 FUTURAS MEJORAS

### **Fase 2: Funcionalidades Avanzadas**
- 🤖 **IA Predictiva:** Sugerir horarios óptimos basados en patrones históricos
- 🗺️ **Optimización de Rutas:** Agrupar carreras cercanas para eficiencia
- 💰 **Precios Dinámicos:** Ajustar tarifas según demanda programada
- 📱 **App Cliente:** Permitir a clientes programar sus propias carreras

### **Fase 3: Integración Empresarial**
- 🏢 **API para Empresas:** Integración con sistemas corporativos
- 📊 **Business Intelligence:** Dashboard avanzado con analytics
- 🔗 **Integración con Calendario:** Sincronizar con Google Calendar, Outlook
- 🎯 **Segmentación de Clientes:** Diferentes tipos de servicio por cliente

---

## 📝 NOTAS DE IMPLEMENTACIÓN

### **Dependencias del Sistema**
- Sistema de autenticación existente (100% funcional)
- Servicios de mapas (Google Maps/Leaflet) (100% funcional)
- Sistema WebSocket para tiempo real (100% funcional)
- Base de datos con soporte para fechas y geolocalización

### **Consideraciones de Performance**
- Paginación inteligente para calendarios con muchas carreras
- Cache de vistas de calendario frecuentemente consultadas
- Lazy loading de componentes pesados
- Optimización de consultas a base de datos

### **Escalabilidad**
- Arquitectura de microservicios para notificaciones
- Queue system para procesamiento de carreras masivas
- Sharding de base de datos por fecha
- CDN para assets estáticos del calendario

---

**📋 Estado:** Plan completo creado y listo para implementación  
**🎯 Prioridad:** ALTA - Nuevo módulo crítico para operaciones  
**⏱️ Estimación:** 4 semanas de desarrollo  
**👥 Equipo:** 1 desarrollador frontend + 1 desarrollador backend  
**🔧 Tecnologías:** React 19, TypeScript, Material-UI, WebSocket, React Query  
**📚 Patrones Base:** Siguiendo arquitectura existente del proyecto 