import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { MENSAJES_ERROR, MENSAJES_EXITO } from '../../../common/constants';
import {
    ActualizarPerfilDto,
    CambiarContrasenaDto,
    ActualizarPreferenciasDto,
    ActualizarSeguridadDto,
} from './dto';

@Injectable()
export class MiPerfilColaboradorService {
    private readonly logger = new Logger(MiPerfilColaboradorService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {}

    // Obtener perfil completo del colaborador
    async obtenerPerfil(usuarioId: number) {
        const usuario = await this.prisma.colabUsuario.findUnique({
            where: { id: usuarioId },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                numeroIdentidad: true,
                fechaNacimiento: true,
                genero: true,
                correo: true,
                telefono: true,
                telefonoEmergencia: true,
                contactoEmergenciaNombre: true,
                codigoColaborador: true,
                cargo: true,
                fechaIngreso: true,
                tipoContrato: true,
                avatarUrl: true,
                idioma: true,
                zonaHoraria: true,
                requiere2fa: true,
                metodo2fa: true,
                maxSesionesSimultaneas: true,
                contrasenaTemporal: true,
                ultimoCambioContrasena: true,
                ultimoAcceso: true,
                esVerificado: true,
                creadoEn: true,
                roles: {
                    select: {
                        rol: {
                            select: {
                                nombre: true,
                                codigo: true,
                            },
                        },
                        esPrincipal: true,
                    },
                    where: { fechaFin: null },
                },
                asignaciones: {
                    select: {
                        almacenId: true,
                        nivelAcceso: true,
                    },
                    where: { esActiva: true },
                },
            },
        });

        if (!usuario) {
            throw new NotFoundException(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
        }

        return {
            exito: true,
            datos: await this.formatearPerfil(usuario),
        };
    }

    // Obtener resumen de seguridad
    async obtenerResumenSeguridad(usuarioId: number) {
        const [
            sesionesActivas,
            dispositivosRegistrados,
            ultimosEventos,
            ultimoCambioContrasena,
        ] = await Promise.all([
            this.prisma.colabSesion.count({
                where: { usuarioId, esActiva: true },
            }),
            this.prisma.colabDispositivo.count({
                where: { usuarioId, esActivo: true },
            }),
            this.prisma.colabBitacoraSeguridad.findMany({
                where: { usuarioId },
                orderBy: { creadoEn: 'desc' },
                take: 5,
                select: {
                    tipoEvento: true,
                    descripcion: true,
                    ipAddress: true,
                    creadoEn: true,
                    severidad: true,
                },
            }),
            this.prisma.colabUsuario.findUnique({
                where: { id: usuarioId },
                select: { ultimoCambioContrasena: true },
            }),
        ]);

        return {
            exito: true,
            datos: {
                sesionesActivas,
                dispositivosRegistrados,
                ultimoCambioContrasena: ultimoCambioContrasena?.ultimoCambioContrasena,
                ultimosEventos: ultimosEventos.map(e => ({
                    tipoEvento: this.traducirEvento(e.tipoEvento),
                    descripcion: e.descripcion,
                    ip: e.ipAddress,
                    fecha: e.creadoEn,
                    severidad: e.severidad,
                })),
            },
        };
    }

    // Obtener sesiones activas
    async obtenerSesionesActivas(usuarioId: number) {
        const sesiones = await this.prisma.colabSesion.findMany({
            where: { usuarioId, esActiva: true },
            orderBy: { ultimaActividad: 'desc' },
            select: {
                id: true,
                ipAddress: true,
                ipPais: true,
                ipCiudad: true,
                userAgent: true,
                creadoEn: true,
                ultimaActividad: true,
            },
        });

        return {
            exito: true,
            datos: sesiones.map(s => ({
                id: s.id,
                ip: s.ipAddress,
                ubicacion: [s.ipCiudad, s.ipPais].filter(Boolean).join(', ') || 'Desconocida',
                navegador: this.extraerNavegador(s.userAgent),
                sistemaOperativo: this.extraerSO(s.userAgent),
                iniciadaEn: s.creadoEn,
                ultimaActividad: s.ultimaActividad,
            })),
        };
    }

    // Obtener dispositivos registrados
    async obtenerDispositivos(usuarioId: number) {
        const dispositivos = await this.prisma.colabDispositivo.findMany({
            where: { usuarioId, esActivo: true },
            orderBy: { ultimoUso: 'desc' },
            select: {
                id: true,
                nombreDispositivo: true,
                tipoDispositivo: true,
                navegador: true,
                sistemaOperativo: true,
                esConfiable: true,
                ultimoUso: true,
                creadoEn: true,
            },
        });

        return {
            exito: true,
            datos: dispositivos.map(d => ({
                id: d.id,
                nombre: d.nombreDispositivo || 'Dispositivo sin nombre',
                tipo: d.tipoDispositivo,
                navegador: d.navegador,
                sistemaOperativo: d.sistemaOperativo,
                esConfiable: d.esConfiable,
                ultimoUso: d.ultimoUso,
                registradoEn: d.creadoEn,
            })),
        };
    }

    // Actualizar información personal
    async actualizarPerfil(usuarioId: number, dto: ActualizarPerfilDto) {
        await this.prisma.colabUsuario.update({
            where: { id: usuarioId },
            data: {
                ...(dto.nombre && { nombre: dto.nombre.trim() }),
                ...(dto.apellido && { apellido: dto.apellido.trim() }),
                ...(dto.telefono !== undefined && { telefono: dto.telefono?.trim() || null }),
                ...(dto.telefonoEmergencia !== undefined && { telefonoEmergencia: dto.telefonoEmergencia?.trim() || null }),
                ...(dto.contactoEmergenciaNombre !== undefined && { contactoEmergenciaNombre: dto.contactoEmergenciaNombre?.trim() || null }),
                ...(dto.genero && { genero: dto.genero }),
            },
        });

        await this.registrarBitacora(usuarioId, 'actualizacion_perfil', 'Información personal actualizada');

        return {
            exito: true,
            mensaje: MENSAJES_EXITO.ACTUALIZADO_EXITOSAMENTE,
        };
    }

    // Cambiar contraseña
    async cambiarContrasena(usuarioId: number, dto: CambiarContrasenaDto, ip?: string) {
        if (dto.nuevaContrasena !== dto.confirmarContrasena) {
            throw new BadRequestException('Las contraseñas no coinciden');
        }

        const usuario = await this.prisma.colabUsuario.findUnique({
            where: { id: usuarioId },
            select: { contrasenaHash: true },
        });

        if (!usuario) {
            throw new NotFoundException(MENSAJES_ERROR.USUARIO_NO_ENCONTRADO);
        }

        const contrasenaValida = await bcrypt.compare(dto.contrasenaActual, usuario.contrasenaHash);
        if (!contrasenaValida) {
            throw new BadRequestException('La contraseña actual es incorrecta');
        }

        if (dto.contrasenaActual === dto.nuevaContrasena) {
            throw new BadRequestException('La nueva contraseña debe ser diferente a la actual');
        }

        // Verificar que no sea una contraseña usada recientemente
        const historial = await this.prisma.colabHistorialContrasena.findMany({
            where: { usuarioId },
            orderBy: { creadoEn: 'desc' },
            take: 5,
            select: { contrasenaHash: true },
        });

        for (const registro of historial) {
            const coincide = await bcrypt.compare(dto.nuevaContrasena, registro.contrasenaHash);
            if (coincide) {
                throw new BadRequestException('No puede reutilizar una de las últimas 5 contraseñas');
            }
        }

        const rounds = this.configService.get<number>('BCRYPT_ROUNDS') || 12;
        const nuevoHash = await bcrypt.hash(dto.nuevaContrasena, rounds);

        await this.prisma.$transaction(async (tx) => {
            // Guardar en historial
            await tx.colabHistorialContrasena.create({
                data: {
                    usuarioId,
                    contrasenaHash: usuario.contrasenaHash,
                },
            });

            // Actualizar contraseña
            await tx.colabUsuario.update({
                where: { id: usuarioId },
                data: {
                    contrasenaHash: nuevoHash,
                    contrasenaTemporal: false,
                    ultimoCambioContrasena: new Date(),
                },
            });
        });

        await this.registrarBitacora(usuarioId, 'cambio_contrasena', 'Contraseña cambiada', ip);

        return {
            exito: true,
            mensaje: MENSAJES_EXITO.CONTRASENA_CAMBIADA,
        };
    }

    // Actualizar preferencias
    async actualizarPreferencias(usuarioId: number, dto: ActualizarPreferenciasDto) {
        const datosActualizar: Record<string, any> = {};

        if (dto.idioma) datosActualizar.idioma = dto.idioma;
        if (dto.zonaHoraria) datosActualizar.zonaHoraria = dto.zonaHoraria;

        // Guardar preferencias adicionales en JSON (configuración global)
        const preferenciasExtra: Record<string, any> = {};
        if (dto.temaColor !== undefined) preferenciasExtra.temaColor = dto.temaColor;
        if (dto.sidebarCompacto !== undefined) preferenciasExtra.sidebarCompacto = dto.sidebarCompacto;
        if (dto.notificacionesSonido !== undefined) preferenciasExtra.notificacionesSonido = dto.notificacionesSonido;
        if (dto.notificacionesEscritorio !== undefined) preferenciasExtra.notificacionesEscritorio = dto.notificacionesEscritorio;

        if (Object.keys(datosActualizar).length > 0) {
            await this.prisma.colabUsuario.update({
                where: { id: usuarioId },
                data: datosActualizar,
            });
        }

        // Guardar preferencias extra por clave individual
        for (const [clave, valor] of Object.entries(preferenciasExtra)) {
            const claveCompleta = `usr_${usuarioId}_${clave}`;
            await this.prisma.colabConfiguracion.upsert({
                where: { clave: claveCompleta },
                create: {
                    clave: claveCompleta,
                    valor: JSON.stringify(valor),
                    tipoDato: typeof valor === 'boolean' ? 'booleano' : 'texto',
                    descripcion: `Preferencia ${clave} del usuario ${usuarioId}`,
                    categoria: 'preferencias_usuario',
                },
                update: {
                    valor: JSON.stringify(valor),
                },
            });
        }

        await this.registrarBitacora(usuarioId, 'actualizacion_perfil', 'Preferencias actualizadas');

        return {
            exito: true,
            mensaje: 'Preferencias actualizadas correctamente',
        };
    }

    // Obtener preferencias del usuario
    async obtenerPreferencias(usuarioId: number) {
        const usuario = await this.prisma.colabUsuario.findUnique({
            where: { id: usuarioId },
            select: { idioma: true, zonaHoraria: true },
        });

        const configuraciones = await this.prisma.colabConfiguracion.findMany({
            where: {
                clave: { startsWith: `usr_${usuarioId}_` },
                categoria: 'preferencias_usuario',
            },
        });

        const preferencias: Record<string, any> = {
            idioma: usuario?.idioma || 'es',
            zonaHoraria: usuario?.zonaHoraria || 'America/Tegucigalpa',
            temaColor: 'teal',
            sidebarCompacto: false,
            notificacionesSonido: true,
            notificacionesEscritorio: false,
        };

        for (const config of configuraciones) {
            const claveLimpia = config.clave.replace(`usr_${usuarioId}_`, '');
            try {
                preferencias[claveLimpia] = JSON.parse(config.valor);
            } catch {
                preferencias[claveLimpia] = config.valor;
            }
        }

        return {
            exito: true,
            datos: preferencias,
        };
    }

    // Actualizar configuración de seguridad
    async actualizarSeguridad(usuarioId: number, dto: ActualizarSeguridadDto, ip?: string) {
        const datosActualizar: Record<string, any> = {};

        if (dto.requiere2fa !== undefined) datosActualizar.requiere2fa = dto.requiere2fa;
        if (dto.metodo2fa) datosActualizar.metodo2fa = dto.metodo2fa;
        if (dto.maxSesionesSimultaneas !== undefined) datosActualizar.maxSesionesSimultaneas = dto.maxSesionesSimultaneas;

        // Si desactiva 2FA, limpiar secreto
        if (dto.requiere2fa === false) {
            datosActualizar.secreto2fa = null;
            datosActualizar.metodo2fa = 'ninguno';
        }

        await this.prisma.colabUsuario.update({
            where: { id: usuarioId },
            data: datosActualizar,
        });

        await this.registrarBitacora(
            usuarioId,
            'actualizacion_seguridad',
            'Configuración de seguridad actualizada',
            ip,
        );

        return {
            exito: true,
            mensaje: 'Configuración de seguridad actualizada',
        };
    }

    // Cerrar una sesión específica
    async cerrarSesion(usuarioId: number, sesionId: number) {
        const sesion = await this.prisma.colabSesion.findFirst({
            where: { id: sesionId, usuarioId, esActiva: true },
        });

        if (!sesion) {
            throw new NotFoundException('Sesión no encontrada');
        }

        await this.prisma.colabSesion.update({
            where: { id: sesionId },
            data: {
                esActiva: false,
                cerradaEn: new Date(),
                motivoCierre: 'cierre_manual',
            },
        });

        return {
            exito: true,
            mensaje: 'Sesión cerrada correctamente',
        };
    }

    // Cerrar todas las sesiones excepto la actual
    async cerrarTodasLasSesiones(usuarioId: number, sesionActualHash?: string) {
        const condicion: any = {
            usuarioId,
            esActiva: true,
        };

        if (sesionActualHash) {
            condicion.tokenHash = { not: sesionActualHash };
        }

        const resultado = await this.prisma.colabSesion.updateMany({
            where: condicion,
            data: {
                esActiva: false,
                cerradaEn: new Date(),
                motivoCierre: 'cierre_masivo',
            },
        });

        await this.registrarBitacora(usuarioId, 'cierre_sesiones', `${resultado.count} sesiones cerradas`);

        return {
            exito: true,
            mensaje: `${resultado.count} sesión(es) cerrada(s)`,
            datos: { cerradas: resultado.count },
        };
    }

    // Eliminar dispositivo
    async eliminarDispositivo(usuarioId: number, dispositivoId: number) {
        const dispositivo = await this.prisma.colabDispositivo.findFirst({
            where: { id: dispositivoId, usuarioId, esActivo: true },
        });

        if (!dispositivo) {
            throw new NotFoundException('Dispositivo no encontrado');
        }

        await this.prisma.colabDispositivo.update({
            where: { id: dispositivoId },
            data: { esActivo: false },
        });

        return {
            exito: true,
            mensaje: 'Dispositivo eliminado correctamente',
        };
    }

    // --- Métodos privados ---

    private async formatearPerfil(usuario: any) {
        const rolPrincipal = usuario.roles?.find((r: any) => r.esPrincipal)?.rol
            || usuario.roles?.[0]?.rol;

        // Obtener datos de almacenes desde InventarioAlmacen
        const almacenesIds = usuario.asignaciones?.map((a: any) => a.almacenId) || [];
        let almacenesMap: Record<number, any> = {};
        if (almacenesIds.length > 0) {
            const almacenes = await this.prisma.inventarioAlmacen.findMany({
                where: { id: { in: almacenesIds } },
                select: { id: true, nombre: true, codigo: true },
            });
            almacenesMap = almacenes.reduce((map: any, a: any) => {
                map[a.id] = a;
                return map;
            }, {});
        }

        const almacenPrincipalAsig = usuario.asignaciones?.[0];
        const almacenPrincipal = almacenPrincipalAsig ? almacenesMap[almacenPrincipalAsig.almacenId] : null;

        return {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
            numeroIdentidad: usuario.numeroIdentidad,
            fechaNacimiento: usuario.fechaNacimiento,
            genero: usuario.genero,
            correo: usuario.correo,
            telefono: usuario.telefono,
            telefonoEmergencia: usuario.telefonoEmergencia,
            contactoEmergenciaNombre: usuario.contactoEmergenciaNombre,
            codigoColaborador: usuario.codigoColaborador,
            cargo: usuario.cargo,
            fechaIngreso: usuario.fechaIngreso,
            tipoContrato: usuario.tipoContrato,
            avatarUrl: usuario.avatarUrl,
            idioma: usuario.idioma,
            zonaHoraria: usuario.zonaHoraria,
            requiere2fa: usuario.requiere2fa,
            metodo2fa: usuario.metodo2fa,
            maxSesionesSimultaneas: usuario.maxSesionesSimultaneas,
            contrasenaTemporal: usuario.contrasenaTemporal,
            ultimoCambioContrasena: usuario.ultimoCambioContrasena,
            ultimoAcceso: usuario.ultimoAcceso,
            esVerificado: usuario.esVerificado,
            miembroDesde: usuario.creadoEn,
            rol: rolPrincipal ? { nombre: rolPrincipal.nombre, codigo: rolPrincipal.codigo } : null,
            almacen: almacenPrincipal ? {
                id: almacenPrincipal.id,
                nombre: almacenPrincipal.nombre,
                codigo: almacenPrincipal.codigo,
            } : null,
            roles: usuario.roles?.map((r: any) => ({
                nombre: r.rol.nombre,
                codigo: r.rol.codigo,
                esPrincipal: r.esPrincipal,
            })),
            almacenes: usuario.asignaciones?.map((a: any) => {
                const alm = almacenesMap[a.almacenId];
                return {
                    id: alm?.id || a.almacenId,
                    nombre: alm?.nombre || 'Almacén desconocido',
                    codigo: alm?.codigo || '',
                    nivelAcceso: a.nivelAcceso,
                };
            }),
        };
    }

    private async registrarBitacora(
        usuarioId: number,
        tipoEvento: string,
        descripcion: string,
        ip?: string,
    ) {
        try {
            await this.prisma.colabBitacoraSeguridad.create({
                data: {
                    usuarioId,
                    tipoEvento,
                    descripcion,
                    ipAddress: ip || null,
                    severidad: 'info',
                },
            });
        } catch (error) {
            this.logger.warn(`Error al registrar bitácora: ${error}`);
        }
    }

    private traducirEvento(tipo: string): string {
        const mapa: Record<string, string> = {
            login_exitoso: 'Inicio de sesión',
            login_fallido: 'Intento de inicio de sesión fallido',
            logout: 'Cierre de sesión',
            cambio_contrasena: 'Cambio de contraseña',
            actualizacion_perfil: 'Actualización de perfil',
            actualizacion_seguridad: 'Cambio de seguridad',
            cierre_sesiones: 'Cierre masivo de sesiones',
            recuperacion_contrasena: 'Recuperación de contraseña',
            bloqueo_cuenta: 'Cuenta bloqueada',
            desbloqueo_cuenta: 'Cuenta desbloqueada',
        };
        return mapa[tipo] || tipo;
    }

    private extraerNavegador(userAgent: string | null): string {
        if (!userAgent) return 'Desconocido';
        if (userAgent.includes('Edg/')) return 'Microsoft Edge';
        if (userAgent.includes('Chrome/')) return 'Google Chrome';
        if (userAgent.includes('Firefox/')) return 'Mozilla Firefox';
        if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Opera') || userAgent.includes('OPR/')) return 'Opera';
        return 'Otro';
    }

    private extraerSO(userAgent: string | null): string {
        if (!userAgent) return 'Desconocido';
        if (userAgent.includes('Windows NT 10')) return 'Windows 10/11';
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac OS X')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
        return 'Otro';
    }
}
