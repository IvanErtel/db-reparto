import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Direccion } from '../../models/direccion';

@Component({
  selector: 'app-reparto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reparto.component.html',
  styleUrl: './reparto.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RepartoComponent implements OnInit {

  rutaId = '';
  direcciones = signal<Direccion[]>([]);
  indiceActual = signal(0);
  ruta = signal<any>(null);

  hoy = new Date();
  diaSemana = '';
  fechaHoy = '';

  totalDiariosHoy = computed(() =>
    this.direcciones().reduce((acc, d) => acc + (d.cantidadDiarios || 0), 0)
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService
  ) {}

  async ngOnInit() {
    this.rutaId = this.route.snapshot.params['id'];
    this.diaSemana = this.obtenerDia(this.hoy.getDay());
    this.fechaHoy = this.hoy.toLocaleDateString("es-ES");

    // Restaurar progreso si existe
    const guardado = localStorage.getItem(`reparto_${this.rutaId}`);
    if (guardado) {
      this.indiceActual.set(Number(guardado));
    }

    // Cargar direcciones
    const dirs = await this.rutasService.obtenerDireccionesOrdenadas(this.rutaId);
    this.direcciones.set(dirs);
    // Cargar datos de la ruta (nombre personalizado, etc.)
const dataRuta = await this.rutasService.obtenerRutaPorId(this.rutaId);
this.ruta.set(dataRuta);
  }

  obtenerDia(n: number) {
    return ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][n];
  }

  // Dirección actual
  actual = computed(() => this.direcciones()[this.indiceActual()]);

  // Siguientes 4
  siguientes = computed(() =>
    this.direcciones().slice(this.indiceActual() + 1, this.indiceActual() + 5)
  );

  // Dirección anterior
  anteriorDireccion = computed(() =>
    this.indiceActual() > 0 ? this.direcciones()[this.indiceActual() - 1] : null
  );

  // Ir a siguiente
  siguiente() {
    if (this.indiceActual() < this.direcciones().length - 1) {
      this.indiceActual.update(v => v + 1);
      localStorage.setItem(`reparto_${this.rutaId}`, String(this.indiceActual()));
    }
  }

  // Volver atrás
  anterior() {
    if (this.indiceActual() > 0) {
      this.indiceActual.update(v => v - 1);
      localStorage.setItem(`reparto_${this.rutaId}`, String(this.indiceActual()));
    }
  }

  // Abrir Maps
  abrirMaps() {
    const d = this.actual();
    if (!d) return;

    if (d.lat && d.lng) {
      window.open(`https://www.google.com/maps/@${d.lat},${d.lng},20z`, "_blank");
      return;
    }

    const encoded = encodeURIComponent(d.direccion);
    window.open(`https://www.google.com/maps?q=${encoded}`, "_blank");
  }

  // SALTAR
  async saltar() {
    const d = this.actual();
    if (!d) return;

    await this.rutasService.registrarSalto(this.rutaId, d, "Salteado");
    this.siguiente();
  }

  // ENTREGAR
  async entregar() {
    const d = this.actual();
    if (!d) return;

    await this.rutasService.registrarEntrega(this.rutaId, d);
    this.siguiente();
  }

  // Reiniciar reparto
  reiniciarReparto() {
    const ok = confirm("¿Seguro que desea reiniciar el reparto?\nSe perderá el progreso del día.");
    if (!ok) return;

    localStorage.removeItem(`reparto_${this.rutaId}`);
    this.indiceActual.set(0);
  }

  volver() {
    this.router.navigate(['/rutas', this.rutaId]);
  }
}
