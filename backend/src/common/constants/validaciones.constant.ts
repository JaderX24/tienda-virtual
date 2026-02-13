export const VALIDACIONES = {
    // Contraseña
    CONTRASENA_LONGITUD_MINIMA: 12,
    CONTRASENA_LONGITUD_MAXIMA: 128,
    CONTRASENA_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,

    // Nombres
    NOMBRE_LONGITUD_MINIMA: 2,
    NOMBRE_LONGITUD_MAXIMA: 100,

    // Correo
    CORREO_LONGITUD_MAXIMA: 255,

    // Teléfono internacional (acepta códigos de país seguidos de 7-15 dígitos)
    TELEFONO_REGEX: /^\+[1-9]\d{0,3}\d{6,14}$/,

    // Paginación
    PAGINA_MINIMA: 1,
    ELEMENTOS_POR_PAGINA_DEFAULT: 20,
    ELEMENTOS_POR_PAGINA_MAXIMO: 100,

    // Precios
    PRECIO_MINIMO: 0.01,
    PRECIO_MAXIMO: 999999999.99,
    DECIMALES_MONEDA: 2,

    // Cantidades
    CANTIDAD_MINIMA: 1,
    CANTIDAD_MAXIMA_CARRITO: 99,

    // Descripciones
    DESCRIPCION_CORTA_MAXIMA: 255,
    DESCRIPCION_LARGA_MAXIMA: 5000,

    // SKU
    SKU_LONGITUD_MINIMA: 3,
    SKU_LONGITUD_MAXIMA: 50,
    SKU_REGEX: /^[A-Z0-9\-_]+$/,
} as const;
