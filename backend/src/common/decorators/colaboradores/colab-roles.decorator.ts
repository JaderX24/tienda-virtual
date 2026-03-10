import { SetMetadata } from '@nestjs/common';
import { TipoColabRol } from '../../constants/colaboradores/colab-roles.constant';

export const COLAB_ROLES_KEY = 'colab_roles';
export const ColabRoles = (...roles: TipoColabRol[]) => SetMetadata(COLAB_ROLES_KEY, roles);
