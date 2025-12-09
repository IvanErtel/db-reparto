import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Ruta } from '../../models/ruta';

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

  constructor(
    private rutasService: RutasService,
    private router: Router
  ) {}

  async ngOnInit() {
    console.log('ListComponent: ngOnInit');

    try {
      const data = await this.rutasService.obtenerMisRutas();
      console.log('ListComponent: rutas cargadas', data);

      this.rutas.set(data);     // 👈 AHORA Angular detecta cambios SIEMPRE
    } catch (e) {
      console.error('Error cargando rutas', e);
    } finally {
      this.cargando.set(false);
    }
  }

  crearNuevaRuta() {
    this.router.navigate(['/rutas/crear']);
  }

  abrirRuta(id: string) {
    this.router.navigate(['/rutas', id]);
  }
}
