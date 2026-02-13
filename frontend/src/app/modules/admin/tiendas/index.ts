// ========================================
// TIENDAS MODULE EXPORTS
// Archivo de barril para exportaciones limpias del módulo de tiendas
// ========================================

// ==============================
// INTERFACES Y TIPOS
// ==============================
export * from './interfaces/tienda.interface';

// ==============================
// SERVICIOS
// ==============================
export * from './services/tiendas.service';

// ==============================
// COMPONENTES - PÁGINAS
// ==============================
export * from './pages/lista-tiendas/lista-tiendas.component';
export * from './pages/formulario-tienda/formulario-tienda.component';
export * from './pages/detalle-tienda/detalle-tienda.component';

// ==============================
// RUTAS
// ==============================
export * from './tiendas.routes';
export { default as TIENDAS_ROUTES } from './tiendas.routes';

// ==============================
// EXPORTACIONES POR CATEGORÍA
// (Para imports más específicos)
// ==============================

// Interfaces principales
export type {
    Tienda,
    CrearTiendaDto,
    ActualizarTiendaDto,
    FiltrosTienda,
    RespuestaPaginadaTiendas
} from './interfaces/tienda.interface';

// Enums
export {
    TipoTienda,
    TipoNegocioTienda,
    EstadoTienda,
    PlanSuscripcionTienda
} from './interfaces/tienda.interface';

// Servicio principal
export { TiendasService } from './services/tiendas.service';

// Componentes
export { ListaTiendasComponent } from './pages/lista-tiendas/lista-tiendas.component';
export { FormularioTiendaComponent } from './pages/formulario-tienda/formulario-tienda.component';
export { DetalleTiendaComponent } from './pages/detalle-tienda/detalle-tienda.component';