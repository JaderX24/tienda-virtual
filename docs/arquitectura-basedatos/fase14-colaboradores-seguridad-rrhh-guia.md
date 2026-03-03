# Fase 14: Colaboradores - Seguridad Avanzada y Gestión RRHH

## Descripción General

Capa complementaria a la Fase 13 (Portal de Colaboradores) que agrega seguridad empresarial avanzada y gestión de recursos humanos completa. Se enfoca en crear el ecosistema de control que necesita una operación de inventario/bodega profesional.

## Dependencias

- **Fases 1-13** instaladas
- Tablas existentes referenciadas: `colab_usuarios`, `colab_sesiones`, `colab_bitacora_seguridad`, `colab_turnos`, `colab_configuracion`, `colab_modulos`, `colab_permisos`, `colab_roles`, `colab_roles_permisos`, `inventario_almacenes`, `empresas`, `permisos`, `roles_permisos`

## Nuevas Tablas (14)

### Seguridad Avanzada

| Tabla | Descripción |
|-------|-------------|
| `colab_intentos_login` | Registro de cada intento de login (exitoso/fallido) con geolocalización |
| `colab_bloqueos` | Bloqueos de cuenta/IP/dispositivo con escalamiento progresivo (3 niveles) |
| `colab_ips_confiables` | Lista blanca de IPs permitidas por colaborador |
| `colab_horarios_acceso` | Horarios de acceso permitidos por día de semana |

### Gestión Documental

| Tabla | Descripción |
|-------|-------------|
| `colab_documentos` | Contratos, identidad, certificados, licencias con vigencia y verificación |

### Capacitación y Formación

| Tabla | Descripción |
|-------|-------------|
| `colab_capacitaciones` | Programas de capacitación (inducción, seguridad, inventario, etc.) |
| `colab_capacitaciones_participantes` | Inscripción, asistencia, evaluación y certificación de participantes |

### Evaluaciones de Desempeño

| Tabla | Descripción |
|-------|-------------|
| `colab_evaluaciones` | Evaluaciones periódicas con 6 categorías de puntuación |
| `colab_evaluaciones_criterios` | Criterios personalizados con pesos porcentuales |

### Equipos de Trabajo

| Tabla | Descripción |
|-------|-------------|
| `colab_equipos` | Brigadas/equipos con líder, almacén y turno asignado |
| `colab_equipos_miembros` | Membresía con roles (líder, sublíder, miembro, apoyo) |

### Incidencias Operativas

| Tabla | Descripción |
|-------|-------------|
| `colab_incidencias` | Incidencias operativas, disciplinarias, de seguridad, accidentes |
| `colab_incidencias_seguimiento` | Historial de seguimiento con cambios de estado |

### Alertas

| Tabla | Descripción |
|-------|-------------|
| `colab_alertas` | Alertas automáticas y manuales de seguridad/operaciones |

## Vistas (9)

| Vista | Descripción |
|-------|-------------|
| `vista_colab_intentos_login_recientes` | Intentos de login últimas 24 horas |
| `vista_colab_bloqueos_activos` | Bloqueos vigentes con tiempo restante |
| `vista_colab_documentos_vencidos` | Documentos vencidos o próximos a vencer (30 días) |
| `vista_colab_capacitaciones_pendientes` | Capacitaciones activas con estadísticas de participantes |
| `vista_colab_evaluaciones_resumen` | Resumen de evaluaciones con evaluador y calificación |
| `vista_colab_equipos_completa` | Equipos con líder, miembros y almacén |
| `vista_colab_incidencias_abiertas` | Incidencias no resueltas priorizadas |
| `vista_colab_alertas_no_leidas` | Alertas pendientes de atención |
| `vista_colab_seguridad_resumen` | Resumen de estado de seguridad por colaborador |

## Procedimientos Almacenados (7)

| Procedimiento | Descripción |
|----------------|-------------|
| `sp_colab_registrar_intento_login` | Registra intento con auditoría automática |
| `sp_colab_verificar_bloqueo` | Verifica bloqueos y cuenta intentos fallidos |
| `sp_colab_bloquear_cuenta` | Bloqueo manual o automático con niveles |
| `sp_colab_desbloquear_cuenta` | Desbloqueo con auditoría |
| `sp_colab_generar_alerta_seguridad` | Genera alertas de seguridad |
| `sp_colab_registrar_incidencia` | Registra incidencia con alerta automática si es crítica |
| `sp_colab_cerrar_incidencia` | Cierra incidencia con resolución y seguimiento |

## Triggers (2)

| Trigger | Tabla | Descripción |
|---------|-------|-------------|
| `trg_colab_auto_bloqueo_login` | `colab_intentos_login` | Bloqueo automático progresivo (5→15min, 10→1hr, 20→24hr) |
| `trg_colab_auditoria_cambio_estado` | `colab_usuarios` | Audita activación/desactivación e historial de contraseñas |

## Eventos Programados (4)

| Evento | Frecuencia | Descripción |
|--------|------------|-------------|
| `evento_colab_limpiar_intentos_login` | Diario (4 AM) | Limpia intentos >90 días |
| `evento_colab_alertar_documentos_vencidos` | Diario (7 AM) | Alerta documentos por vencer |
| `evento_colab_alertar_capacitaciones_vencidas` | Diario (7:30 AM) | Alerta certificaciones por vencer |
| `evento_colab_alertar_evaluaciones_pendientes` | Diario (8 AM) | Alerta evaluaciones retrasadas |

## Sistema de Bloqueo Progresivo

```
Nivel 1: 5 intentos fallidos en 15 minutos  → Bloqueo 15 minutos
Nivel 2: 10 intentos fallidos en 15 minutos → Bloqueo 1 hora
Nivel 3: 20 intentos fallidos en 15 minutos → Bloqueo 24 horas + notificación admin
```

Todos los umbrales y duraciones son configurables desde `colab_configuracion`.

## Instalación

```sql
-- 1. Ejecutar script principal
SOURCE 14-fase-(24-02-2026)-v1-6483.sql;

-- 2. Verificar instalación
SOURCE 14-fase-verificacion.sql;
```

## Integración con el Backend (Prisma)

Después de instalar la fase, ejecutar `npx prisma db pull` para sincronizar los nuevos modelos al schema de Prisma, y luego `npx prisma generate` para generar el cliente actualizado.

## Notas de Seguridad

- Los intentos de login y bloqueos son **completamente aislados** del sistema admin
- Las alertas se generan automáticamente pero no se envían por correo (se implementa en el backend)
- Las incidencias críticas generan alertas de emergencia automáticas
- Los documentos confidenciales requieren permisos especiales para acceso
- Las evaluaciones requieren firma digital tanto del evaluador como del colaborador
