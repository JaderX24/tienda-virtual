import { SetMetadata } from '@nestjs/common';
import { TipoColabPermiso } from '../../constants/colaboradores/colab-roles.constant';

export const COLAB_PERMISOS_KEY = 'colab_permisos';
export const ColabPermisos = (...permisos: TipoColabPermiso[]) => SetMetadata(COLAB_PERMISOS_KEY, permisos);
