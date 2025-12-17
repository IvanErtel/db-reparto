import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Direccion } from '../../models/direccion';
import { ToastService } from '../../shared/toast.service';
import { LoadingService } from '../../loading/loading.service';
import { FormsModule } from '@angular/forms';
import { ResumenReparto } from '../../models/resumen-reparto';
import { ResumenRepartoComponent } from '../../resumen-reparto/resumen-reparto.component';

@Component({
  selector: 'app-reparto',
  standalone: true,
  imports: [CommonModule, FormsModule, ResumenRepartoComponent],
  templateUrl: './reparto.component.html',
  styleUrl: './reparto.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepartoComponent implements OnInit {
  rutaId = '';
  direcciones = signal<Direccion[]>([]);
  indiceActual = signal(0);
  ruta = signal<any>(null);

  cargandoDirecciones = signal(false);
  hoy = new Date();
  diaSemana = '';
  fechaHoy = '';
  animando = false;
  busqueda = signal('');

  inicioReparto = 0;
  entregadas = 0;
  saltadas = 0;
  entregados: string[] = [];
  salteados: string[] = [];

  resumenFinal: ResumenReparto | null = null;

  private esperar(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  // total de diarios de las direcciones del día
  totalDiariosHoy = computed(() =>
    this.direcciones().reduce((acc, d) => acc + (d.cantidadDiarios || 0), 0)
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService,
    private loading: LoadingService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.loading.mostrar();

    this.inicioReparto = Date.now();
    this.entregados = [];
    this.salteados = [];

    try {
      this.rutaId = this.route.snapshot.params['id'];
      localStorage.setItem(`reparto_${this.rutaId}_iniciado`, 'true');
      localStorage.removeItem(`reparto_${this.rutaId}_completado`);
      this.hoy = new Date();
      this.diaSemana = this.obtenerDia(this.hoy.getDay());
      this.fechaHoy = this.hoy.toLocaleDateString('es-ES');

      const guardado = localStorage.getItem(`reparto_${this.rutaId}`);
      if (guardado) {
        this.indiceActual.set(Number(guardado));
      }

      // 1️⃣ mostrar UI inmediatamente
      this.cargandoDirecciones.set(true);
      this.direcciones.set([]);

      // 2️⃣ cargar direcciones en segundo plano (no bloquea la UI)
      setTimeout(async () => {
        const dirs = await this.rutasService.obtenerDireccionesOrdenadas(
          this.rutaId
        );

        const esF = await this.rutasService.esFestivo(this.hoy);
        const filtradas = dirs.filter((d) =>
          this.rutasService.esDiaDeEntregaSync(d, this.hoy, esF)
        );

        this.direcciones.set(filtradas);
        this.cargandoDirecciones.set(false);
      }, 0);

      const dataRuta = await this.rutasService.obtenerRutaPorId(this.rutaId);
      this.ruta.set(dataRuta);
    } catch (e) {
      console.error('Error cargando datos para reparto', e);
      this.toast.mostrar('Error al cargar los datos del reparto', 'error');
      this.router.navigate(['/rutas', this.rutaId]);
    } finally {
      this.loading.ocultar();
    }
  }

  obtenerDia(n: number) {
    return [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ][n];
  }

  // Dirección actual (puede ser null si se acabó)
  actual = computed<Direccion | null>(() => {
    const lista = this.direcciones();
    const idx = this.indiceActual();
    return idx >= 0 && idx < lista.length ? lista[idx] : null;
  });

  // Siguientes 4
  siguientes = computed(() =>
    this.direcciones().slice(this.indiceActual() + 1, this.indiceActual() + 5)
  );

  resultadosBusqueda = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    if (!texto) return [];

    return this.direcciones().filter(
      (d) =>
        d.cliente.toLowerCase().includes(texto) ||
        d.direccion.toLowerCase().includes(texto)
    );
  });

  // Dirección anterior
  anteriorDireccion = computed(() =>
    this.indiceActual() > 0 ? this.direcciones()[this.indiceActual() - 1] : null
  );

  // 👉 Ir a siguiente (gestiona fin de reparto para ENTREGAR y SALTAR)
  siguiente() {
    const nuevo = this.indiceActual() + 1;
    this.indiceActual.set(nuevo);
    localStorage.setItem(`reparto_${this.rutaId}`, String(nuevo));
  }

  // Volver atrás
  anterior() {
    if (this.indiceActual() > 0) {
      const nuevo = this.indiceActual() - 1;
      this.indiceActual.set(nuevo);
      localStorage.setItem(`reparto_${this.rutaId}`, String(nuevo));
    }
  }

  // Total del día (ya filtrado previamente)
  totalHoy = computed(() => this.direcciones().length);

  // Restantes = total - índiceActual - 1
  restantes = computed(() => {
    const total = this.direcciones().length;
    const actual = this.indiceActual();
    return Math.max(0, total - actual - 1);
  });

  // Abrir Maps
  // Abrir Maps (modo "Cómo llegar")
  abrirMaps() {
    const d = this.actual();
    if (!d) return;

    // Si hay coordenadas: destino exacto
    if (d.lat && d.lng) {
      const destino = `${d.lat},${d.lng}`;
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          destino
        )}&travelmode=driving`,
        '_blank'
      );
      return;
    }

    // Si no: destino por texto
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        d.direccion
      )}&travelmode=driving`,
      '_blank'
    );
  }

  // SALTAR
  async saltar() {
    if (this.resumenFinal) return;

    const d = this.actual();
    if (!d) return;

    this.salteados.push(d.cliente);

    this.animando = true;
    await this.esperar(250);

    await this.rutasService.registrarSalto(this.rutaId, d, 'Salteado');

    const i = this.indiceActual();
    const total = this.direcciones().length;

    // 👇 SI ES LA ÚLTIMA → FIN DIRECTO
    if (i >= total - 1) {
      this.animando = false;
      this.mostrarFinDeReparto();
      return;
    }

    this.siguiente();
    this.animando = false;
  }

  // ENTREGAR
  async entregar() {
    if (this.resumenFinal) return;

    const d = this.actual();
    if (!d) return;

    this.entregados.push(d.cliente);

    this.animando = true;
    await this.esperar(250);

    await this.rutasService.registrarEntrega(this.rutaId, d.id!, d);

    const i = this.indiceActual();
    const total = this.direcciones().length;

    // 👇 SI ES LA ÚLTIMA → FIN DIRECTO
    if (i >= total - 1) {
      this.animando = false;
      this.mostrarFinDeReparto();
      return;
    }

    this.siguiente();
    this.animando = false;
  }

  mostrarFinDeReparto() {
    const resumen: ResumenReparto = {
      rutaId: this.rutaId,
      rutaNombre: this.ruta()?.nombrePersonalizado || 'Ruta',
      fecha: new Date().toISOString().slice(0, 10),
      inicio: this.inicioReparto,
      fin: Date.now(),
      entregados: this.entregados,
      salteados: this.salteados,
    };

    this.rutasService.guardarResumen(resumen);

    this.resumenFinal = resumen;
    this.cdr.detectChanges();
  }

  cerrarResumen() {
    this.resumenFinal = null;

    localStorage.removeItem(`reparto_${this.rutaId}`);
    localStorage.removeItem(`reparto_${this.rutaId}_iniciado`);
    localStorage.setItem(`reparto_${this.rutaId}_completado`, 'true');

    this.toast.mostrar('🎉 Reparto finalizado. Buen trabajo.', 'success');
    this.router.navigate(['/rutas', this.rutaId]);
  }

  // Reiniciar reparto manualmente
  reiniciarReparto() {
    const ok = confirm(
      '¿Seguro que desea reiniciar el reparto?\nSe perderá el progreso del día.'
    );
    if (!ok) return;

    // 🧹 limpiar estado guardado
    localStorage.removeItem(`reparto_${this.rutaId}`);
    localStorage.removeItem(`reparto_${this.rutaId}_completado`);
    localStorage.removeItem(`reparto_${this.rutaId}_iniciado`);

    // 🔄 forzar recarga REAL del componente
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/rutas', this.rutaId, 'reparto']);
    });
  }

  volver() {
    this.router.navigate(['/rutas', this.rutaId]);
  }

  irADireccion(d: Direccion) {
    const idx = this.direcciones().findIndex((x) => x.id === d.id);
    if (idx >= 0) {
      this.indiceActual.set(idx);
      localStorage.setItem(`reparto_${this.rutaId}`, String(idx));
    }
    this.busqueda.set('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
