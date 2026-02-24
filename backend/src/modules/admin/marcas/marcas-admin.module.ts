import { Module } from '@nestjs/common';
import { MarcasAdminController } from './marcas-admin.controller';
import { MarcasAdminService } from './marcas-admin.service';

@Module({
    controllers: [MarcasAdminController],
    providers: [MarcasAdminService],
    exports: [MarcasAdminService],
})
export class MarcasAdminModule {}
