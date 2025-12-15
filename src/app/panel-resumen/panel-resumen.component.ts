import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RutasService } from '../../app/services/rutas.service';
import { LoadingService } from '../../app/loading/loading.service';
import { ToastService } from '../../app/shared/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resumenes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-resumenes.component.html',
  styleUrl: './panel-resumenes.component.scss'
})
export class ResumenesComponent implements OnInit {

  resumenes = signal<(any & { id: string })[]>([]);
  filtro = signal('');

  constructor(
    private rutasService: RutasService,
    private loading: LoadingService,
    private toast: ToastService,
    private router: Router,
  ) {}

  filtrados = computed(() => {
    const t = this.filtro().toLowerCase().trim();
    if (!t) return this.resumenes();

    return this.resumenes().filter(r =>
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
      this.toast.mostrar('Error cargando resúmenes', 'error');
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
}
