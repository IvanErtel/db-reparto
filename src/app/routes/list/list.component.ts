import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Ruta } from '../../models/ruta';
import { RutasBaseService } from '../../services/rutas-base.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-list-rutas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent implements OnInit {

  rutas = signal<Ruta[]>([]);
  cargando = signal(true);

  rutasBase = signal<Ruta[]>([]);
cargandoBase = signal(true);
copiando = signal(false);

  constructor(
    private rutasService: RutasService,
    private router: Router,
    private rutasBaseService: RutasBaseService,
    private toast: ToastService
  ) {}

iniciarReparto(rutaId: string) {
  // Empezar desde cero
  localStorage.removeItem(`reparto_${rutaId}`);
  localStorage.removeItem(`reparto_${rutaId}_iniciado`);
  localStorage.removeItem(`reparto_${rutaId}_completado`);

  this.router.navigate(['/rutas', rutaId, 'reparto']);
}

continuarReparto(rutaId: string) {
  this.router.navigate(['/rutas', rutaId, 'reparto']);
}

reiniciarReparto(rutaId: string) {
  if (!confirm("¿Seguro que deseas reiniciar el reparto?")) return;

  // Reiniciar = empezar desde cero también
  localStorage.removeItem(`reparto_${rutaId}`);
  localStorage.removeItem(`reparto_${rutaId}_iniciado`);
  localStorage.removeItem(`reparto_${rutaId}_completado`);

  this.router.navigate(['/rutas', rutaId, 'reparto']);
}

async ngOnInit() {
  try {
    const mis = await this.rutasService.obtenerMisRutas();
    this.rutas.set(mis);

    const base = await this.rutasBaseService.obtenerRutasBase();
    this.rutasBase.set(base);
  } catch (e) {
    console.error('Error cargando rutas', e);
  } finally {
    this.cargando.set(false);
    this.cargandoBase.set(false);
  }
}

  crearNuevaRuta() {
    this.router.navigate(['/rutas/crear']);
  }

  abrirRuta(id: string) {
    this.router.navigate(['/rutas', id]);
  }

estadoReparto(rutaId: string): "nuevo" | "continuar" | "finalizado" {
  const terminado = localStorage.getItem(`reparto_${rutaId}_completado`) === "true";
  if (terminado) return "finalizado";

  const iniciado = localStorage.getItem(`reparto_${rutaId}_iniciado`) === "true";
  const tieneIndice = localStorage.getItem(`reparto_${rutaId}`) !== null;

  if (iniciado || tieneIndice) return "continuar";
  return "nuevo";
}

async crearMiCopiaDesdeBase(base: Ruta, ev?: MouseEvent) {
  ev?.stopPropagation();

  if (this.copiando()) return;
  this.copiando.set(true);
  this.toast.mostrar('Creando tu copia…', 'success');

  try {
    const nombre = `Mi ${String(base.nombreBase || '').toUpperCase()}`;

    const nuevaId = await this.rutasBaseService.crearMiRutaDesdeBase(base.id!, nombre);

    // ✅ refrescar lista SIN F5
    const mis = await this.rutasService.obtenerMisRutas();
    this.rutas.set(mis);

    // ✅ abrir la copia
    this.router.navigate(['/rutas', nuevaId]);

  } catch (e) {
    console.error(e);
    this.toast.mostrar('Error creando la copia', 'error');
  } finally {
    this.copiando.set(false);
  }
}

}
