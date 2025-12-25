import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarComponent implements OnInit {
  rutaId!: string;
  direccionId!: string;

  direccion = signal<Direccion | null>(null);
  cargando = signal(true);
  bajas: { desde: string; hasta: string }[] = [];
  bajaDesde = '';
  bajaHasta = '';
  coordsTexto = '';
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

    const dirs = await this.rutasService.obtenerDireccionesOrdenadas(
      this.rutaId
    );
    const d = dirs.find((x) => x.id === this.direccionId) || null;

    this.direccion.set(d);
    this.coordsTexto =
      d?.lat != null && d?.lng != null ? `${d.lat}, ${d.lng}` : '';
    this.bajas = d?.bajas ? [...d.bajas] : [];
    this.cargando.set(false);
  }

  private parseCoords(text: string): { lat: number; lng: number } | null {
    if (!text) return null;

    const cleaned = text
      .trim()
      .replace(/[()]/g, '')
      .replace(/;/g, ',')
      .replace(/\s+/g, ' ');

    const m = cleaned.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
    if (!m) return null;

    const a = Number(m[1]);
    const b = Number(m[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

    let lat = a,
      lng = b;
    if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
      lat = b;
      lng = a;
    }

    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

    return { lat, lng };
  }

  private setDireccionCoords(lat: number, lng: number) {
    const d = this.direccion();
    if (!d) return;

    // importante: setear de nuevo la señal para que OnPush refresque seguro
    this.direccion.set({ ...d, lat, lng });
  }

  onCoordsPaste(ev: ClipboardEvent) {
    const txt = ev.clipboardData?.getData('text') ?? '';
    const parsed = this.parseCoords(txt);

    if (!parsed) {
      this.toast.mostrar(
        'Formato inválido. Pegá: 42.351017, -3.663434',
        'error'
      );
      return;
    }

    ev.preventDefault();

    this.setDireccionCoords(parsed.lat, parsed.lng);
    this.coordsTexto = `${parsed.lat}, ${parsed.lng}`;
  }

  aplicarCoordsDesdeTexto() {
    if (!this.coordsTexto?.trim()) return;

    const parsed = this.parseCoords(this.coordsTexto);
    if (!parsed) return;

    this.setDireccionCoords(parsed.lat, parsed.lng);
    this.coordsTexto = `${parsed.lat}, ${parsed.lng}`;
  }

  async guardar() {
    this.loading.mostrar();

    try {
      const d = this.direccion();
      if (!d) return;

      await this.rutasService.actualizarDireccion(
        this.rutaId,
        this.direccionId,
        {
          cliente: d.cliente,
          direccion: d.direccion,
          cantidadDiarios: d.cantidadDiarios,
          dias: d.dias,
          lat: d.lat ?? null,
          lng: d.lng ?? null,
          notas: d.notas ?? '',
          bajas: this.bajas,
        }
      );

      this.toast.mostrar('Dirección actualizada', 'success');
      window.location.href = `/rutas/${this.rutaId}`;
    } catch (e) {
      console.error('Error actualizando la dirección:', e);
      this.toast.mostrar('Error al actualizar la dirección', 'error');
    } finally {
      this.loading.ocultar();
    }
  }

  async eliminarDireccion() {
    const ok = confirm(
      '¿Eliminar esta dirección? Esta acción no se puede deshacer.'
    );
    if (!ok) return;

    this.loading.mostrar();

    try {
      await this.rutasService.eliminarDireccion(this.rutaId, this.direccionId);
      this.toast.mostrar('Dirección eliminada', 'success');
      this.router.navigate(['/rutas', this.rutaId]);
    } catch (e) {
      console.error(e);
      this.toast.mostrar('Error al eliminar la dirección', 'error');
    } finally {
      this.loading.ocultar();
    }
  }

  agregarBaja() {
    if (!this.bajaDesde || !this.bajaHasta) return;
    if (this.bajaDesde > this.bajaHasta) return;

    this.bajas.push({
      desde: this.bajaDesde,
      hasta: this.bajaHasta,
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
