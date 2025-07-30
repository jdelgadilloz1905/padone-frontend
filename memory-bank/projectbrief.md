# 🚖 PROJECT BRIEF - Taxi Rosa Frontend

## INFORMACIÓN FUNDAMENTAL DEL PROYECTO

**Nombre del Proyecto:** Taxi Rosa Frontend  
**Fecha de Inicio Memory Bank:** 2024-01-XX  
**Tipo de Proyecto:** Aplicación Web de Gestión de Servicios de Taxi  
**Estado Actual:** En desarrollo/mantenimiento  

## DESCRIPCIÓN DEL PROYECTO

Taxi Rosa Frontend es una aplicación web completa desarrollada en React + TypeScript que proporciona una plataforma integral para la gestión de servicios de taxi. La aplicación incluye funcionalidades para administradores, conductores y usuarios finales.

## OBJETIVOS PRINCIPALES

1. **Gestión Integral de Flota:** Administración completa de conductores y vehículos
2. **Operaciones en Tiempo Real:** Tracking y asignación de viajes en vivo
3. **Experiencia de Usuario Optimizada:** Interfaces intuitivas para todos los roles
4. **Escalabilidad:** Arquitectura preparada para crecimiento
5. **Transparencia:** Sistema de comisiones y reportes claros

## STAKEHOLDERS

- **Administradores:** Gestión completa del sistema
- **Conductores:** Interfaz para recibir y gestionar viajes
- **Usuarios Finales:** Tracking público de viajes
- **Operadores:** Monitoreo y asignación de solicitudes

## ALCANCE TÉCNICO

- **Frontend:** React 19 + TypeScript + Vite
- **UI Framework:** Material-UI + Tailwind CSS
- **Mapas:** Google Maps + Leaflet (dual integration)
- **Estado:** TanStack Query para server state
- **Tiempo Real:** Socket.io para comunicación live
- **Internacionalización:** i18next para múltiples idiomas

## MÓDULOS PRINCIPALES

1. **Dashboard** - Métricas y resumen ejecutivo
2. **Gestión de Conductores** - CRUD completo de conductores
3. **Solicitudes** - Gestión de pedidos de viajes
4. **Zonas de Servicio** - Configuración geográfica
5. **Comisiones** - Sistema financiero para conductores
6. **Tracking Público** - Seguimiento para usuarios
7. **Autenticación Dual** - Login admin/conductor

## ARQUITECTURA DE ALTO NIVEL

```
Frontend (React) ↔ API Backend ↔ Base de Datos
       ↕                ↕
   WebSocket        Servicios Externos
   (Real-time)      (Maps, Payments)
```

## VALOR DE NEGOCIO

- **Eficiencia Operacional:** Automatización de procesos de dispatch
- **Experiencia del Cliente:** Tracking en tiempo real
- **Gestión Financiera:** Control transparente de comisiones
- **Escalabilidad:** Soporte para crecimiento de flota
- **Competitividad:** Tecnología moderna y UX optimizada

## CRITERIOS DE ÉXITO

- Interface responsiva y performante
- Tiempo real efectivo (< 2s latencia)
- Cobertura de testing > 80%
- Tiempo de carga inicial < 3s
- Soporte multi-dispositivo completo 