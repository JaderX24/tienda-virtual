import { Module } from '@nestjs/common';
import { CategoriasAdminController } from './categorias-admin.controller';
import { CategoriasAdminService } from './categorias-admin.service';

@Module({
    controllers: [CategoriasAdminController],
    providers: [CategoriasAdminService],
    exports: [CategoriasAdminService],
})
export class CategoriasAdminModule {}
