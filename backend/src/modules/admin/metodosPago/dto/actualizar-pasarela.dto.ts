import { PartialType } from '@nestjs/swagger';
import { CrearPasarelaDto } from './crear-pasarela.dto';

export class ActualizarPasarelaDto extends PartialType(CrearPasarelaDto) {}
