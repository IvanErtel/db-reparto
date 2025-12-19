import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Ruta } from '../../models/ruta';
import { Direccion } from '../../models/direccion';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { ToastService } from '../../shared/toast.service';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { RutasBaseService } from '../../services/rutas-base.service';
import { LoadingService } from '../../loading/loading.service';

@Component({
  selector: 'app-detalle-ruta',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleComponent implements OnInit {
  // -------------------------
  // VARIABLES PRINCIPALES
  // -------------------------

  rutaId = '';
  ruta = signal<Ruta | null>(null);
  direcciones = signal<Direccion[]>([]);
  cargandoRuta = signal(true);
  cargandoDirecciones = signal(true);
  busqueda = '';
  direccionesFiltradas = signal<Direccion[]>([]);
  resultadosBusqueda = signal<Direccion[]>([]);
  resaltadoId = signal<string | null>(null);
  mostrarScrollTop = false;
  moverOpen = signal(false);
  moverDir = signal<Direccion | null>(null);
  moverPos = signal<number>(1);
  todasLasDirecciones: Direccion[] = [];

  // Para el modal de detalle
  detalleSeleccionado = signal<Direccion | null>(null);
  modalAbierto = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService,
    private auth: Auth,
    private toast: ToastService,
    private rutasBaseService: RutasBaseService,
    private loading: LoadingService
  ) {}

  // -------------------------
  // CARGA INICIAL
  // -------------------------

  async ngOnInit() {
    this.rutaId = this.route.snapshot.params['id'];

    await this.cargarRuta();
    await this.cargarDirecciones();
  }

  async cargarRuta() {
    const r = await this.rutasService.obtenerRutaPorId(this.rutaId);
    this.ruta.set(r);
    this.cargandoRuta.set(false);
  }

  async cargarDirecciones() {
    const dirs = await this.rutasService.obtenerDireccionesOrdenadas(
      this.rutaId
    );

    this.todasLasDirecciones = dirs;
    this.direcciones.set(dirs);
    this.direccionesFiltradas.set(dirs); // ← IMPORTANTE
    this.cargandoDirecciones.set(false);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.mostrarScrollTop = window.scrollY > 300;
  }
  // -------------------------
  // MODAL
  // -------------------------

  @ViewChild('listaScroll') listaScroll!: ElementRef<HTMLElement>;
  private raf: number | null = null;

  private scrollDelta = 0;

  private getScrollEl(): HTMLElement {
    return (document.scrollingElement ||
      document.documentElement) as HTMLElement;
  }

  onDragMoved(ev: CdkDragMove<any>) {
    const y = ev.pointerPosition.y;
    const vh = window.innerHeight;

    const edge = 120; // zona activa arriba/abajo
    let delta = 0;

    if (y < edge) {
      const t = Math.max(0, edge - y); // qué tan cerca del borde
      delta = -Math.min(120, 22 + Math.floor(t / 2)); // velocidad ↑
    } else if (y > vh - edge) {
      const t = Math.max(0, y - (vh - edge));
      delta = Math.min(120, 22 + Math.floor(t / 2)); // velocidad ↓
    }

    this.scrollDelta = delta;

    // si no está en zona, frenar
    if (delta === 0) {
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = null;
      }
      return;
    }

    // loop continuo mientras mantenga el puntero en zona
    if (!this.raf) {
      const step = () => {
        const el = this.getScrollEl();
        el.scrollTop += this.scrollDelta;
        this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    }
  }

  onDragEnded() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    this.scrollDelta = 0;
  }

  abrirDetalle(d: Direccion) {
    this.detalleSeleccionado.set(d);
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  // -------------------------
  // NAVEGACIÓN
  // -------------------------

  volver() {
    this.router.navigate(['/rutas']);
  }

  agregarDireccion() {
    this.router.navigate(['/rutas', this.rutaId, 'agregar']);
  }

  filtrarBusqueda() {
    const texto = this.busqueda.toLowerCase().trim();

    if (!texto) {
      this.resultadosBusqueda.set([]);
      return;
    }

    const res = this.direcciones()
      .filter(
        (d) =>
          d.cliente.toLowerCase().includes(texto) ||
          d.direccion.toLowerCase().includes(texto)
      )
      .slice(0, 25); // para no listar 200 resultados

    this.resultadosBusqueda.set(res);
  }

  abrirMover(d: Direccion) {
    const base = this.todasLasDirecciones?.length
      ? this.todasLasDirecciones
      : this.direcciones();
    const idx = base.findIndex((x) => x.id === d.id);

    this.moverDir.set(d);
    this.moverPos.set(idx >= 0 ? idx + 1 : 1);
    this.moverOpen.set(true);
  }

  cerrarMover() {
    this.moverOpen.set(false);
    this.moverDir.set(null);
  }

  async confirmarMover() {
    const d = this.moverDir();
    if (!d) return;

    // ✅ SIEMPRE trabajamos sobre la lista real completa
    const base = this.todasLasDirecciones?.length
      ? this.todasLasDirecciones
      : this.direcciones();
    const lista = [...base];
    const total = lista.length;

    let pos = Number(this.moverPos());
    if (!Number.isFinite(pos)) pos = 1;
    pos = Math.max(1, Math.min(total, pos));

    const from = lista.findIndex((x) => x.id === d.id);
    if (from < 0) {
      this.cerrarMover();
      return;
    }

    let to = pos - 1;

    const [item] = lista.splice(from, 1);
    if (to > from) to--;
    lista.splice(to, 0, item);

    // ✅ actualizamos la lista REAL que pinta la UI
    this.todasLasDirecciones = lista;
    this.direcciones.set(lista);

    // si tu HTML usa direccionesFiltradas(), también hay que setearla:
    if ((this as any).direccionesFiltradas?.set) {
      (this as any).direccionesFiltradas.set(lista);
    }

    const desde = Math.min(from, to);
    const hasta = Math.max(from, to);

    this.loading.mostrar();
    try {
      await this.rutasService.reordenarRango(this.rutaId, lista, desde, hasta);
      this.toast.mostrar(`Movido a posición ${pos}`, 'success');
      this.cerrarMover();
    } catch (e) {
      console.error(e);
      this.toast.mostrar('Error guardando el orden', 'error');
    } finally {
      this.loading.ocultar();
    }
  }

  irA(d: Direccion) {
    this.resultadosBusqueda.set([]);

    const id = d.id ? `dir-${d.id}` : null;
    if (!id) return;

    // scroll al elemento en la lista real
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.resaltadoId.set(d.id!);
        setTimeout(() => this.resaltadoId.set(null), 1600);
      }
    }, 0);
  }

  posicion(d: Direccion): number {
    const idx = this.todasLasDirecciones.findIndex((x) => x.id === d.id);
    return idx >= 0 ? idx + 1 : 0;
  }

  async subirDireccion(d: Direccion) {
    const lista = [...this.todasLasDirecciones];
    const index = lista.findIndex((x) => x.id === d.id);
    if (index <= 0) return; // ya está arriba

    // intercambiar con la anterior
    const tmp = lista[index - 1];
    lista[index - 1] = lista[index];
    lista[index] = tmp;

    // ✅ guardar SOLO el rango afectado (2 elementos)
    const desde = index - 1;
    const hasta = index;
    await this.rutasService.reordenarRango(this.rutaId, lista, desde, hasta);

    // actualizar en memoria y filtros
    this.todasLasDirecciones = lista;
    this.direcciones.set(lista);
    this.filtrarBusqueda();
  }

  volverArriba() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async subirComoBase() {
    this.loading.mostrar();
    try {
      const baseId = await this.rutasBaseService.subirRutaComoBase(this.rutaId);
      this.toast.mostrar('Ruta subida a BASE (nueva versión)', 'success');
      this.router.navigate(['/rutas', baseId]);
    } catch (e) {
      console.error(e);
      this.toast.mostrar('No se pudo subir la ruta a BASE', 'error');
    } finally {
      this.loading.ocultar();
    }
  }

  async bajarDireccion(d: Direccion) {
    const lista = [...this.todasLasDirecciones];
    const index = lista.findIndex((x) => x.id === d.id);
    if (index === -1 || index >= lista.length - 1) return; // ya está abajo o no existe

    // intercambiar con la siguiente
    const tmp = lista[index + 1];
    lista[index + 1] = lista[index];
    lista[index] = tmp;

    // guardar nuevo orden en Firestore
    const desde = index;
    const hasta = index + 1;
    await this.rutasService.reordenarRango(this.rutaId, lista, desde, hasta);

    // actualizar en memoria y filtros
    this.todasLasDirecciones = lista;
    this.direcciones.set(lista);
    this.filtrarBusqueda();
  }

  estaDeBajaHoy(d: Direccion): boolean {
    return (this.rutasService as any).direccionEstaDeBaja(d, new Date());
  }

  editarDireccion(id: string) {
    this.router.navigate(['/rutas', this.rutaId, 'editar', id]);
  }

  iniciarReparto() {
    this.router.navigate(['/rutas', this.rutaId, 'reparto']);
  }

  editarRuta() {
    this.router.navigate(['/rutas', this.rutaId, 'editar-ruta']);
  }

  hayProgresoGuardado(): boolean {
    return localStorage.getItem(`reparto_${this.rutaId}`) !== null;
  }

  esRutaBase(): boolean {
    return this.ruta()?.usuarioId === '__BASE__';
  }

  reordenHabilitado(): boolean {
    // Reordenar solo si NO es ruta base (tu regla original)
    return !this.esRutaBase();
  }

  async drop(event: CdkDragDrop<Direccion[]>) {
    if (!this.reordenHabilitado()) {
      alert('Para reordenar, borrá el texto del buscador.');
      return;
    }

    // ✅ usar el data del dropList (es la lista renderizada)
    const lista = [...(event.container.data || [])];

    moveItemInArray(lista, event.previousIndex, event.currentIndex);

    // ✅ actualizar UI primero (si no, vuelve al lugar original)
    this.todasLasDirecciones = lista;
    this.direcciones.set(lista);
    this.direccionesFiltradas.set(lista);

    try {
      await this.rutasService.reordenarDirecciones(this.rutaId, lista);
      this.toast.mostrar('Orden guardado', 'success');
    } catch (e) {
      console.error(e);
      this.toast.mostrar(
        'No se pudo guardar el orden, se recarga la lista',
        'error'
      );
      await this.cargarDirecciones(); // vuelve al último orden real
    }
  }

  abrirEnMaps() {
    const d = this.detalleSeleccionado();

    if (!d) return;

    // Primero probamos coordenadas (cuando existan)
    if ((d as any).lat && (d as any).lng) {
      window.open(`https://www.google.com/maps?q=${d.lat},${d.lng}`, '_blank');
      return;
    }

    // Si no hay coordenadas, buscamos por dirección
    const encoded = encodeURIComponent(d.direccion);
    window.open(`https://www.google.com/maps?q=${encoded}`, '_blank');
  }

  private csvEscape(v: any): string {
    const s = String(v ?? '');
    // Excel/CSV: escapamos comillas y encerramos en comillas si hace falta
    const needs = /[;"\n\r]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needs ? `"${escaped}"` : escaped;
  }

  private diasTexto(d: any): string {
    const dias = d?.dias || {};
    const parts: string[] = [];
    if (dias.lunes) parts.push('L');
    if (dias.martes) parts.push('M');
    if (dias.miercoles) parts.push('X');
    if (dias.jueves) parts.push('J');
    if (dias.viernes) parts.push('V');
    if (dias.sabado) parts.push('S');
    if (dias.domingo) parts.push('D');

    if (dias.festivos) parts.push('Festivos');
    if (dias.noEntregarFestivos) parts.push('NoFestivos');
    if (dias.guardarFinSemanaParaLunes) parts.push('GuardarFS->L');

    return parts.join(' ');
  }

  exportarCSV() {
    const ruta = this.ruta();
    const base = ruta?.nombrePersonalizado || ruta?.nombreBase || 'ruta';

    const safeName = base
      .toString()
      .trim()
      .replace(/[^\w\- ]+/g, '')
      .replace(/\s+/g, '_');

    const hoy = new Date().toISOString().slice(0, 10);

    // Exporta en el orden real (todasLasDirecciones ya está ordenada)
    const lista =
      (this.todasLasDirecciones?.length
        ? this.todasLasDirecciones
        : this.direcciones()) || [];

    const sep = ';';
    const header = [
      'Orden',
      'Cantidad',
      'Cliente',
      'Direccion',
      'Notas',
      'Dias',
      'BajaDesde',
      'BajaHasta',
    ]
      .map((x) => this.csvEscape(x))
      .join(sep);

    const lines: string[] = [header];

    lista.forEach((d: any, idx: number) => {
      const baja =
        Array.isArray(d?.bajas) && d.bajas.length ? d.bajas[0] : null;

      lines.push(
        [
          this.csvEscape(idx + 1),
          this.csvEscape(d?.cantidadDiarios ?? ''),
          this.csvEscape(d?.cliente ?? ''),
          this.csvEscape(d?.direccion ?? ''),
          this.csvEscape(d?.notas ?? ''),
          this.csvEscape(this.diasTexto(d)),
          this.csvEscape(baja?.desde ?? ''),
          this.csvEscape(baja?.hasta ?? ''),
        ].join(sep)
      );
    });

    // BOM para que Excel lea bien acentos
    const csv = '\ufeff' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}_${hoy}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.toast.mostrar('CSV exportado', 'success');
  }
}
