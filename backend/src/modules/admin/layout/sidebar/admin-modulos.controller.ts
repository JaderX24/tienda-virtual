import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AdminModulosService } from './admin-modulos.service';
import { JwtAdminGuard } from '../../../../common/guards';

@Controller('admin/menu')
@UseGuards(JwtAdminGuard)
export class AdminModulosController {
    constructor(private adminModulosService: AdminModulosService) {}

    @Get()
    async obtenerMenu(@Req() req: any) {
        const permisos: string[] = req.user?.permisos || [];
        const menu = await this.adminModulosService.obtenerMenuPorPermisos(permisos);

        return {
            exito: true,
            datos: menu,
        };
    }
}
