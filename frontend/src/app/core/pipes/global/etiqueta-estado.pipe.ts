import { Pipe, PipeTransform, inject } from '@angular/core';
import { EstadoVisualizacionService } from '../../services/estado-visualizacion.service';

@Pipe({ name: 'etiquetaEstado', standalone: true })
export class EtiquetaEstadoPipe implements PipeTransform {
    private servicio = inject(EstadoVisualizacionService);

    transform(estado: string, dominio: string): string {
        return this.servicio.obtenerEtiqueta(dominio, estado);
    }
}
