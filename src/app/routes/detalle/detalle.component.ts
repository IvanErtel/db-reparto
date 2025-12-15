import { Component, OnInit, ChangeDetectionStrategy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Ruta } from '../../models/ruta';
import { Direccion } from '../../models/direccion';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-detalle-ruta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
mostrarScrollTop = false;

  // Para el filtro por día
  diaSeleccionado = 'todos';
  todasLasDirecciones: Direccion[] = [];

  // Para el modal de detalle
  detalleSeleccionado = signal<Direccion | null>(null);
  modalAbierto = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService,
    private auth: Auth,
    private toast: ToastService
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
    const dirs = await this.rutasService.obtenerDireccionesOrdenadas(this.rutaId);

this.todasLasDirecciones = dirs;
this.direcciones.set(dirs);
this.direccionesFiltradas.set(dirs);   // ← IMPORTANTE
this.cargandoDirecciones.set(false);

  }

      @HostListener('window:scroll', [])
onWindowScroll() {
  this.mostrarScrollTop = window.scrollY > 300;
}
  // -------------------------
  // MODAL
  // -------------------------

  abrirDetalle(d: Direccion) {
    this.detalleSeleccionado.set(d);
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  // -------------------------
  // FILTRO POR DÍA
  // -------------------------

  filtrarPorDia() {
if (this.diaSeleccionado === 'todos') {
  this.direcciones.set(this.todasLasDirecciones);
  this.direccionesFiltradas.set(this.todasLasDirecciones);
  return;
}

const filtradas = this.todasLasDirecciones.filter(d =>
  d.dias[this.diaSeleccionado as keyof typeof d.dias]
);

this.direcciones.set(filtradas);
this.direccionesFiltradas.set(filtradas);
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
    this.direccionesFiltradas.set(this.direcciones());
    return;
  }

  const filtradas = this.direcciones().filter(d =>
    d.cliente.toLowerCase().includes(texto) ||
    d.direccion.toLowerCase().includes(texto)
  );

  this.direccionesFiltradas.set(filtradas);
}

async subirDireccion(d: Direccion) {
  const lista = [...this.todasLasDirecciones];
  const index = lista.findIndex(x => x.id === d.id);
  if (index <= 0) return; // ya está arriba

  // intercambiar con la anterior
  const tmp = lista[index - 1];
  lista[index - 1] = lista[index];
  lista[index] = tmp;

  // guardar nuevo orden en Firestore
  await this.rutasService.reordenarDirecciones(this.rutaId, lista);

  // actualizar en memoria y filtros
  this.todasLasDirecciones = lista;
  this.direcciones.set(lista);
  this.filtrarPorDia();
  this.filtrarBusqueda();
}

volverArriba() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async bajarDireccion(d: Direccion) {
  const lista = [...this.todasLasDirecciones];
  const index = lista.findIndex(x => x.id === d.id);
  if (index === -1 || index >= lista.length - 1) return; // ya está abajo o no existe

  // intercambiar con la siguiente
  const tmp = lista[index + 1];
  lista[index + 1] = lista[index];
  lista[index] = tmp;

  // guardar nuevo orden en Firestore
  await this.rutasService.reordenarDirecciones(this.rutaId, lista);

  // actualizar en memoria y filtros
  this.todasLasDirecciones = lista;
  this.direcciones.set(lista);
  this.filtrarPorDia();
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

  abrirEnMaps() {
  const d = this.detalleSeleccionado();

  if (!d) return;

  // Primero probamos coordenadas (cuando existan)
  if ((d as any).lat && (d as any).lng) {
    window.open(`https://www.google.com/maps?q=${d.lat},${d.lng}`, "_blank");
    return;
  }

  // Si no hay coordenadas, buscamos por dirección
  const encoded = encodeURIComponent(d.direccion);
  window.open(`https://www.google.com/maps?q=${encoded}`, "_blank");
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
  const base = (ruta?.nombrePersonalizado || ruta?.nombreBase || 'ruta');

  const safeName = base
    .toString()
    .trim()
    .replace(/[^\w\- ]+/g, '')
    .replace(/\s+/g, '_');

  const hoy = new Date().toISOString().slice(0, 10);

  // Exporta en el orden real (todasLasDirecciones ya está ordenada)
  const lista = (this.todasLasDirecciones?.length ? this.todasLasDirecciones : this.direcciones()) || [];

  const sep = ';';
  const header = ['Orden', 'Cantidad', 'Cliente', 'Direccion', 'Notas', 'Dias', 'BajaDesde', 'BajaHasta']
    .map(x => this.csvEscape(x))
    .join(sep);

  const lines: string[] = [header];

  lista.forEach((d: any, idx: number) => {
    const baja = Array.isArray(d?.bajas) && d.bajas.length ? d.bajas[0] : null;

    lines.push([
      this.csvEscape(idx + 1),
      this.csvEscape(d?.cantidadDiarios ?? ''),
      this.csvEscape(d?.cliente ?? ''),
      this.csvEscape(d?.direccion ?? ''),
      this.csvEscape(d?.notas ?? ''),
      this.csvEscape(this.diasTexto(d)),
      this.csvEscape(baja?.desde ?? ''),
      this.csvEscape(baja?.hasta ?? ''),
    ].join(sep));
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
