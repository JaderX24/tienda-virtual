export interface ItemMenuColab {
    id: string;
    titulo: string;
    icono: string;
    ruta?: string;
    permisos?: string[];
    hijos?: ItemMenuColab[];
    badge?: { texto: string; clase: string };
    expandido?: boolean;
    activo?: boolean;
}

export interface SeccionMenuColab {
    titulo: string;
    items: ItemMenuColab[];
}
