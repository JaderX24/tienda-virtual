export const MENSAJES_ERROR = {
    // Autenticación
    CREDENCIALES_INVALIDAS: 'Credenciales incorrectas',
    TOKEN_INVALIDO: 'Token de acceso inválido o expirado',
    TOKEN_REQUERIDO: 'Token de autenticación requerido',
    SESION_EXPIRADA: 'La sesión ha expirado, por favor inicie sesión nuevamente',
    CUENTA_BLOQUEADA: 'Cuenta temporalmente bloqueada por múltiples intentos fallidos',
    CUENTA_INACTIVA: 'La cuenta está inactiva, contacte al administrador',

    // Autorización
    SIN_PERMISOS: 'No tiene permisos para realizar esta acción',
    ROL_INSUFICIENTE: 'Su rol no permite acceder a este recurso',

    // Validación
    DATOS_INVALIDOS: 'Los datos proporcionados no son válidos',
    CAMPO_REQUERIDO: 'Este campo es requerido',
    FORMATO_INVALIDO: 'El formato del campo no es válido',
    LONGITUD_MINIMA: 'El campo no cumple con la longitud mínima requerida',
    LONGITUD_MAXIMA: 'El campo excede la longitud máxima permitida',

    // Usuarios
    USUARIO_NO_ENCONTRADO: 'Usuario no encontrado',
    USUARIO_YA_EXISTE: 'Ya existe un usuario con este correo electrónico',
    CONTRASENA_DEBIL: 'La contraseña no cumple con los requisitos de seguridad',

    // Productos
    PRODUCTO_NO_ENCONTRADO: 'Producto no encontrado',
    PRODUCTO_SIN_STOCK: 'El producto no tiene stock disponible',
    STOCK_INSUFICIENTE: 'Stock insuficiente para la cantidad solicitada',

    // Pedidos
    PEDIDO_NO_ENCONTRADO: 'Pedido no encontrado',
    PEDIDO_NO_MODIFICABLE: 'El pedido no puede ser modificado en su estado actual',
    CARRITO_VACIO: 'El carrito de compras está vacío',

    // Pagos
    PAGO_FALLIDO: 'No se pudo procesar el pago',
    MONTO_INVALIDO: 'El monto del pago no es válido',

    // General
    RECURSO_NO_ENCONTRADO: 'El recurso solicitado no fue encontrado',
    OPERACION_NO_PERMITIDA: 'Esta operación no está permitida',
    ERROR_INTERNO: 'Error interno del servidor',
    SERVICIO_NO_DISPONIBLE: 'El servicio no está disponible temporalmente',
    DEMASIADAS_SOLICITUDES: 'Demasiadas solicitudes, por favor espere',
} as const;

export const MENSAJES_EXITO = {
    // Autenticación
    LOGIN_EXITOSO: 'Inicio de sesión exitoso',
    LOGOUT_EXITOSO: 'Sesión cerrada correctamente',
    REGISTRO_EXITOSO: 'Registro completado exitosamente',
    CONTRASENA_CAMBIADA: 'Contraseña actualizada correctamente',

    // CRUD
    CREADO_EXITOSAMENTE: 'Registro creado exitosamente',
    ACTUALIZADO_EXITOSAMENTE: 'Registro actualizado exitosamente',
    ELIMINADO_EXITOSAMENTE: 'Registro eliminado exitosamente',

    // Pedidos
    PEDIDO_CREADO: 'Pedido creado exitosamente',
    PEDIDO_CONFIRMADO: 'Pedido confirmado exitosamente',
    PEDIDO_ENVIADO: 'Pedido enviado exitosamente',
    PEDIDO_ENTREGADO: 'Pedido entregado exitosamente',
    PEDIDO_CANCELADO: 'Pedido cancelado exitosamente',

    // Pagos
    PAGO_PROCESADO: 'Pago procesado exitosamente',
    REEMBOLSO_PROCESADO: 'Reembolso procesado exitosamente',
} as const;
