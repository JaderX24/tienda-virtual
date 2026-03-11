import { Pipe, PipeTransform, inject } from '@angular/core';
import { EstadoVisualizacionService } from '../../services/estado-visualizacion.service';

@Pipe({ name: 'iconoEstado', standalone: true })
export class IconoEstadoPipe implements PipeTransform {
    private servicio = inject(EstadoVisualizacionService);

    transform(estado: string, dominio: string): string {
        return this.servicio.obtenerIcono(dominio, estado);
    }
}
