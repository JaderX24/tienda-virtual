export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    GERENTE: 'gerente',
    VENDEDOR: 'vendedor',
    BODEGUERO: 'bodeguero',
    CLIENTE: 'cliente',
} as const;

export type TipoRol = (typeof ROLES)[keyof typeof ROLES];
