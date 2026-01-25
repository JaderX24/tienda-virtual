import { SetMetadata } from '@nestjs/common';
import { TipoPermiso } from '../constants/roles.constant';

export const PERMISOS_KEY = 'permisos';
export const Permisos = (...permisos: TipoPermiso[]) => SetMetadata(PERMISOS_KEY, permisos);
