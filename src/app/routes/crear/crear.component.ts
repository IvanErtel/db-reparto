import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';

@Component({
  selector: 'app-crear-ruta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear.component.html',
  styleUrl: './crear.component.scss'
})
export class CrearRutaComponent {

  nombreBase: 'GAMONAL' | 'ESTE' | 'CENTRO' | 'OESTE' | 'SUR' = 'GAMONAL';
  nombrePersonalizado: string = '';

  constructor(
    private rutasService: RutasService,
    private router: Router
  ) {}

  async guardar() {
    if (!this.nombrePersonalizado.trim()) {
      alert('Debes ingresar un nombre para la ruta.');
      return;
    }

    const id = await this.rutasService.crearRuta({
      nombreBase: this.nombreBase,
      nombrePersonalizado: this.nombrePersonalizado
    });

    alert('Ruta creada correctamente');
    this.router.navigate(['/rutas']);
  }

  cancelar() {
    this.router.navigate(['/rutas']);
  }
}
