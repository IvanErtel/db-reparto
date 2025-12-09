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

  rutaId = '';
  ruta = signal<Ruta | null>(null);
  direcciones = signal<Direccion[]>([]);
  cargandoRuta = signal(true);
  cargandoDirecciones = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService,
    private auth: Auth
  ) {}

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
    this.direcciones.set(dirs);
    this.cargandoDirecciones.set(false);
  }

  volver() {
    window.location.href = '/rutas';
  }

  agregarDireccion() {
    this.router.navigate(['/rutas', this.rutaId, 'agregar']);
  }

  editarDireccion(id: string) {
    this.router.navigate(['/rutas', this.rutaId, 'editar', id]);
  }
}
