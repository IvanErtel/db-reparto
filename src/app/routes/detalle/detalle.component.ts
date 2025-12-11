import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Ruta } from '../../models/ruta';
import { Direccion } from '../../models/direccion';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';

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
    private auth: Auth
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

}
