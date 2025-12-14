import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumenReparto } from '../models/resumen-reparto';

@Component({
  selector: 'app-resumen-reparto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resumen-reparto.component.html',
  styleUrls: ['./resumen-reparto.component.scss']
})
export class ResumenRepartoComponent {

  @Input() resumen!: ResumenReparto;
  @Output() cerrarResumen = new EventEmitter<void>();

  cerrar() {
    this.cerrarResumen.emit();
  }
}
