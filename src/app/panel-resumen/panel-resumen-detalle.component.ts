import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RutasService } from '../services/rutas.service';
import { LoadingService } from '../loading/loading.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-panel-resumen-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './panel-resumen-detalle.component.html',
  styleUrl: './panel-resumen-detalle.component.scss',
})
export class PanelResumenDetalleComponent implements OnInit {
  resumen = signal<any | null>(null);

  entregados = computed(() => this.resumen()?.entregados ?? []);
  salteados = computed(() => this.resumen()?.salteados ?? []);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService,
    private loading: LoadingService,
    private toast: ToastService
  ) {}

  volver() {
    this.router.navigate(['/resumenes']);
  }

  duracionMin(): number {
    const r = this.resumen();
    if (!r?.inicio || !r?.fin) return 0;
    return Math.max(0, Math.round((r.fin - r.inicio) / 60000));
  }

  nombre(x: any): string {
    if (!x || typeof x === 'string') return '';
    return x.cliente || x.nombre || '';
  }

  direccion(x: any): string {
    if (!x) return '';
    if (typeof x === 'string') return x;
    return x.direccion || '';
  }

  abrirMaps(x: any) {
    const lat = x?.lat;
    const lng = x?.lng;

    if (lat && lng) {
      const destino = `${lat},${lng}`;
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}&travelmode=driving`,
        '_blank'
      );
      return;
    }

    const dir = this.direccion(x);
    if (!dir) return;

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dir)}&travelmode=driving`,
      '_blank'
    );
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.volver();
      return;
    }

    this.loading.mostrar();
    try {
      const data = await this.rutasService.obtenerResumen(id);
      if (!data) {
        this.toast.mostrar('No se encontró el resumen', 'error');
        this.volver();
        return;
      }
      this.resumen.set(data);
    } catch (e) {
      console.error(e);
      this.toast.mostrar('Error cargando el resumen', 'error');
      this.volver();
    } finally {
      this.loading.ocultar();
    }
  }
}
