import { SetMetadata } from '@nestjs/common';
import { TipoRol } from '../../constants/admin/roles.constant';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: TipoRol[]) => SetMetadata(ROLES_KEY, roles);
