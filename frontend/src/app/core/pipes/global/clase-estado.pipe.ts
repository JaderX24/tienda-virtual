import { Pipe, PipeTransform, inject } from '@angular/core';
import { EstadoVisualizacionService } from '../../services/estado-visualizacion.service';

@Pipe({ name: 'claseEstado', standalone: true })
export class ClaseEstadoPipe implements PipeTransform {
    private servicio = inject(EstadoVisualizacionService);

    transform(estado: string, dominio: string): string {
        return this.servicio.obtenerClase(dominio, estado);
    }
}
