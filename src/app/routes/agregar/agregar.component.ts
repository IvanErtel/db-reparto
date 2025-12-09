import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';

@Component({
  selector: 'app-agregar-direccion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar.component.html',
  styleUrl: './agregar.component.scss'
})
export class AgregarComponent implements OnInit {

  rutaId!: string;

  cliente = '';
  direccion = '';
  cantidadDiarios = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService
  ) {}

  ngOnInit() {
    this.rutaId = this.route.snapshot.params['id'];
  }

async guardar() {
  if (!this.cliente.trim() || !this.direccion.trim()) {
    alert("Completa cliente y dirección");
    return;
  }

  await this.rutasService.agregarDireccion(this.rutaId, {
    rutaId: this.rutaId,
    cliente: this.cliente,
    direccion: this.direccion,
    cantidadDiarios: this.cantidadDiarios,
    indiceOrden: 9999,       // se ordenará luego
    dias: {
      lunes: true,
      martes: true,
      miercoles: true,
      jueves: true,
      viernes: true,
      sabado: true,
      domingo: true,
      festivos: false,
      guardarFinSemanaParaLunes: false
    },
    notas: '',
    infoLlaves: ''
  });

  alert("Dirección agregada");

  window.location.href = `/rutas/${this.rutaId}`;
}

  cancelar() {
    window.location.href = `/rutas/${this.rutaId}`;
  }
}
