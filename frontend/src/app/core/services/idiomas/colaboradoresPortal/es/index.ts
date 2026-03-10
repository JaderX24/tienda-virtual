import { portal } from './portal';
import { perfil } from './perfil';
import { dashboard } from './dashboard';
import { inventario } from './inventario';
import { conteos } from './conteos';
import { productos } from './productos';
import { reportes } from './reportes';
import { actividad } from './actividad';
import { notificaciones } from './notificaciones';
import { turno } from './turno';
import { comun } from './comun';

export const ES: Record<string, string> = {
    ...portal,
    ...perfil,
    ...dashboard,
    ...inventario,
    ...conteos,
    ...productos,
    ...reportes,
    ...actividad,
    ...notificaciones,
    ...turno,
    ...comun,
};
