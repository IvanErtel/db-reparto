import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RutasService } from '../../app/services/rutas.service';
import { LoadingService } from '../../app/loading/loading.service';
import { ToastService } from '../../app/shared/toast.service';
import { Router } from '@angular/router';

type ResumenItem = any & { id: string };

@Component({
  selector: 'app-resumenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-resumenes.component.html',
  styleUrl: './panel-resumenes.component.scss',
})
export class ResumenesComponent implements OnInit {
  resumenes = signal<ResumenItem[]>([]);
  filtro = signal('');

  // ✅ Confirm moderno (sin confirm() del navegador)
  confirmOpen = signal(false);
  pendiente = signal<ResumenItem | null>(null);

  constructor(
    private rutasService: RutasService,
    private loading: LoadingService,
    private toast: ToastService,
    private router: Router
  ) {}

  filtrados = computed(() => {
    const t = this.filtro().toLowerCase().trim();
    if (!t) return this.resumenes();

    return this.resumenes().filter(
      (r) =>
        (r.rutaNombre || '').toLowerCase().includes(t) ||
        (r.fecha || '').toLowerCase().includes(t)
    );
  });

  async ngOnInit() {
    this.loading.mostrar();
    try {
      const data = await this.rutasService.obtenerResumenes();
      this.resumenes.set(data);
    } catch (e) {
      console.error(e);
      this.toast.mostrar('Error cargando los resúmenes', 'error');
    } finally {
      this.loading.ocultar();
    }
  }

  verDetalle(id: string) {
    this.router.navigate(['/resumenes', id]);
  }

  duracionMin(inicio: number, fin: number): number {
    if (!inicio || !fin) return 0;
    const ms = fin - inicio;
    return Math.max(0, Math.round(ms / 60000));
  }

  // ====== ELIMINAR (UI moderna) ======
  abrirEliminar(r: ResumenItem) {
    this.pendiente.set(r);
    this.confirmOpen.set(true);
  }

  cerrarEliminar() {
    this.confirmOpen.set(false);
    this.pendiente.set(null);
  }

  async confirmarEliminar() {
    const r = this.pendiente();
    if (!r) return;

    this.loading.mostrar();
    try {
      await this.rutasService.eliminarResumen(r.id);

      // ✅ actualizar UI sin recargar
      this.resumenes.set(this.resumenes().filter((x) => x.id !== r.id));

      this.toast.mostrar('Resumen eliminado', 'success');
      this.cerrarEliminar();
    } catch (e) {
      console.error(e);
      this.toast.mostrar('Error eliminando el resumen', 'error');
    } finally {
      this.loading.ocultar();
    }
  }
}
