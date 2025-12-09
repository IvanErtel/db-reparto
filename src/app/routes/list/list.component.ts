import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { Ruta } from '../../models/ruta';

@Component({
  selector: 'app-list-rutas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnInit {

  rutas: Ruta[] = [];
  cargando = true;

  constructor(
    private rutasService: RutasService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarRutas();
  }

  async cargarRutas() {
    this.cargando = true;
    this.rutas = await this.rutasService.obtenerRutasDelUsuario();
    this.cargando = false;
  }

  crearNuevaRuta() {
    this.router.navigate(['/rutas/crear']);
  }

  abrirRuta(id: string) {
    this.router.navigate(['/rutas', id]);
  }
}
