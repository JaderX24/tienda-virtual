import { PartialType } from '@nestjs/swagger';
import { CrearProveedorEnvioDto } from './crear-proveedor-envio.dto';

export class ActualizarProveedorEnvioDto extends PartialType(CrearProveedorEnvioDto) {}
