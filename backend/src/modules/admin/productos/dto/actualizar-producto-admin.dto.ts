import { PartialType } from '@nestjs/swagger';
import { CrearProductoAdminDto } from './crear-producto-admin.dto';

export class ActualizarProductoAdminDto extends PartialType(CrearProductoAdminDto) {}
