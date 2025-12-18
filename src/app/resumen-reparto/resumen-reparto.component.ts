import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumenReparto } from '../models/resumen-reparto';

@Component({
  selector: 'app-resumen-reparto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resumen-reparto.component.html',
  styleUrls: ['./resumen-reparto.component.scss'],
})
export class ResumenRepartoComponent {
  @Input() resumen!: ResumenReparto;

  @Output() cerrarResumen = new EventEmitter<void>();
  @Output() eliminarResumen = new EventEmitter<string>();

  cerrar() {
    this.cerrarResumen.emit();
  }

  pedirEliminar() {
    const id =
      this.resumen.id ?? `${this.resumen.fecha}_${this.resumen.rutaId}`;
    const ok = confirm(
      '¿Eliminar este resumen? Esta acción no se puede deshacer.'
    );
    if (!ok) return;
    this.eliminarResumen.emit(id);
  }
}
