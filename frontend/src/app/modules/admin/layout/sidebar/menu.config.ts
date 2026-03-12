export interface ItemMenu {
    id: string;
    titulo: string;
    icono: string;
    ruta?: string;
    permisos?: string[];
    hijos?: ItemMenu[];
    badge?: {
        texto: string;
        clase: string;
    };
    expandido?: boolean;
    activo?: boolean;
}

export interface SeccionMenu {
    titulo: string;
    items: ItemMenu[];
}
