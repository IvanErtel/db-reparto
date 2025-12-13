import { Component, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Direccion } from '../../models/direccion';
import { ToastService } from '../../shared/toast.service';
import { LoadingService } from '../../loading/loading.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reparto',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
animando = false;
busqueda = signal('');

private esperar(ms: number) {
  return new Promise(res => setTimeout(res, ms));
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
    private toast: ToastService
  ) {}

async ngOnInit() {
  this.loading.mostrar();

  try {
    this.rutaId = this.route.snapshot.params['id'];
    this.hoy = new Date();
    this.diaSemana = this.obtenerDia(this.hoy.getDay());
    this.fechaHoy = this.hoy.toLocaleDateString('es-ES');

    const guardado = localStorage.getItem(`reparto_${this.rutaId}`);
    if (guardado) {
      this.indiceActual.set(Number(guardado));
    }

    const dirs = await this.rutasService.obtenerDireccionesOrdenadas(this.rutaId);

    const filtradas: Direccion[] = [];
    for (const d of dirs) {
      if (await this.rutasService.esDiaDeEntrega(d, this.hoy)) {
        filtradas.push(d);
      }
    }
    this.direcciones.set(filtradas);

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
    return ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][n];
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

  return this.direcciones().filter(d =>
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
    const i = this.indiceActual();
    const total = this.direcciones().length;

    // Si ya estoy en la última, mostrar fin de reparto
    if (i >= total - 1) {
      this.mostrarFinDeReparto();
      return;
    }

    // Si no, avanzar
    const nuevo = i + 1;
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
  abrirMaps() {
    const d = this.actual();
    if (!d) return;

    if (d.lat && d.lng) {
      window.open(`https://www.google.com/maps/@${d.lat},${d.lng},20z`, '_blank');
      return;
    }

    const encoded = encodeURIComponent(d.direccion);
    window.open(`https://www.google.com/maps?q=${encoded}`, '_blank');
  }

  // SALTAR
async saltar() {
  const d = this.actual();
  if (!d) return;

  this.animando = true;

  await this.esperar(250);

  // Tu código original
  await this.rutasService.registrarSalto(this.rutaId, d, 'Salteado');
  this.siguiente();

  this.animando = false;
}

  // ENTREGAR
async entregar() {
  const d = this.actual();
  if (!d) return;

  this.animando = true;

  // Espera 250ms para mostrar la animación
  await this.esperar(250);

  // Tu código original
  await this.rutasService.registrarEntrega(this.rutaId, d.id!, d);
  this.siguiente();

  this.animando = false;
}

  mostrarFinDeReparto() {
    this.toast.mostrar('🎉 Reparto finalizado. Buen trabajo.', 'success');

    // Limpiamos progreso guardado
    localStorage.removeItem(`reparto_${this.rutaId}`);

    // Volvemos a la lista de rutas
    this.router.navigate(['/rutas', this.rutaId]);
  }

  // Reiniciar reparto manualmente
  reiniciarReparto() {
    const ok = confirm('¿Seguro que desea reiniciar el reparto?\nSe perderá el progreso del día.');
    if (!ok) return;

    localStorage.removeItem(`reparto_${this.rutaId}`);
    this.indiceActual.set(0);
  }

  volver() {
    this.router.navigate(['/rutas', this.rutaId]);
  }
}
