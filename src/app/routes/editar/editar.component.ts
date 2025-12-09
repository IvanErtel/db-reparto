import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Direccion } from '../../models/direccion';

@Component({
  selector: 'app-editar-direccion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar.component.html',
  styleUrl: './editar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditarComponent implements OnInit {

  rutaId!: string;
  direccionId!: string;

  direccion = signal<Direccion | null>(null);
  cargando = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService
  ) {}

  async ngOnInit() {
    this.rutaId = this.route.snapshot.params['rutaId'];
    this.direccionId = this.route.snapshot.params['direccionId'];

    const dirs = await this.rutasService.obtenerDireccionesOrdenadas(this.rutaId);
    const d = dirs.find(x => x.id === this.direccionId) || null;

    this.direccion.set(d);
    this.cargando.set(false);
  }

async guardar() {
  const d = this.direccion();
  if (!d) return;

  await this.rutasService.actualizarDireccion(this.rutaId, this.direccionId, {
    cliente: d.cliente,
    direccion: d.direccion,
    cantidadDiarios: d.cantidadDiarios,
    dias: d.dias,
    lat: d.lat ?? null,
    lng: d.lng ?? null,
    notas: d.notas ?? ''
  });

  alert("Dirección actualizada");
  window.location.href = `/rutas/${this.rutaId}`;
}

  cancelar() {
    window.location.href = `/rutas/${this.rutaId}`;
  }
}
