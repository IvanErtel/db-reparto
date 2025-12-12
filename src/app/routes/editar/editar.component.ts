import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Direccion } from '../../models/direccion';
import { ToastService } from '../../shared/toast.service';
import { LoadingService } from '../../loading/loading.service';

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
  bajas: { desde: string; hasta: string }[] = [];
bajaDesde = '';
bajaHasta = '';
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService,
    private toast: ToastService,
    private loading: LoadingService
  ) {}

  async ngOnInit() {
    this.rutaId = this.route.snapshot.params['rutaId'];
    this.direccionId = this.route.snapshot.params['direccionId'];

    const dirs = await this.rutasService.obtenerDireccionesOrdenadas(this.rutaId);
    const d = dirs.find(x => x.id === this.direccionId) || null;

    this.direccion.set(d);
    this.bajas = d?.bajas ? [...d.bajas] : [];
    this.cargando.set(false);
  }

async guardar() {
  this.loading.mostrar();

  try {
    const d = this.direccion();
    if (!d) return;

    await this.rutasService.actualizarDireccion(this.rutaId, this.direccionId, {
      cliente: d.cliente,
      direccion: d.direccion,
      cantidadDiarios: d.cantidadDiarios,
      dias: d.dias,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      notas: d.notas ?? '',
      bajas: this.bajas,
    });

    this.toast.mostrar("Dirección actualizada", "success");
    window.location.href = `/rutas/${this.rutaId}`;

  } catch (e) {
    console.error("Error actualizando la dirección:", e);
    this.toast.mostrar("Error al actualizar la dirección", "error");

  } finally {
    this.loading.ocultar();
  }
}

async eliminarDireccion() {
  const ok = confirm("¿Eliminar esta dirección? Esta acción no se puede deshacer.");
  if (!ok) return;

  const rutaId = this.route.snapshot.params['rutaId'];
  const direccionId = this.route.snapshot.params['direccionId'];

  try {
    await this.rutasService.eliminarDireccion(rutaId, direccionId);
    this.toast.show("Dirección eliminada", "success");

    this.router.navigate(['/rutas', rutaId]);

  } catch (e) {
    console.error(e);
    this.toast.show("Error al eliminar la dirección", "error");
  }
}

agregarBaja() {
  if (!this.bajaDesde || !this.bajaHasta) return;
  if (this.bajaDesde > this.bajaHasta) return;

  this.bajas.push({
    desde: this.bajaDesde,
    hasta: this.bajaHasta
  });

  this.bajaDesde = '';
  this.bajaHasta = '';
}

eliminarBaja(i: number) {
  this.bajas.splice(i, 1);
}

  cancelar() {
    window.location.href = `/rutas/${this.rutaId}`;
  }
}
