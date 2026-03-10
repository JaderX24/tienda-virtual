import { Pipe, PipeTransform, inject } from '@angular/core';
import { IdiomaService } from '../../services/idioma.service';

@Pipe({
    name: 'traducir',
    standalone: true,
    pure: false,
})
export class TraducirPipe implements PipeTransform {
    private idiomaService = inject(IdiomaService);

    transform(clave: string): string {
        return this.idiomaService.t(clave);
    }
}
