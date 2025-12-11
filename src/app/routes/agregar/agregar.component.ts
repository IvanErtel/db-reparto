import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-agregar-direccion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar.component.html',
  styleUrl: './agregar.component.scss'
})
export class AgregarComponent implements OnInit {

  rutaId!: string;

  // Campos de la dirección
  cliente = '';
  direccion = '';
  cantidadDiarios = 1;

  // Coordenadas
  lat: number | null = null;
  lng: number | null = null;

  // Días de entrega
dias = {
  lunes: false,
  martes: false,
  miercoles: false,
  jueves: false,
  viernes: false,
  sabado: false,
  domingo: false,
  festivos: false,
  guardarFinSemanaParaLunes: false,
  noEntregarFestivos: false      // <-- NUEVO
};

  notas = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutasService: RutasService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.rutaId = this.route.snapshot.params['id'];
  }

async guardar() {
  if (!this.cliente.trim() || !this.direccion.trim()) {
    this.toast.mostrar("Completa cliente y dirección", "error");
    return;
  }

  // 1) Obtener direcciones existentes para calcular el siguiente indiceOrden
  const existentes = await this.rutasService.obtenerDireccionesOrdenadas(this.rutaId);
  const nuevoIndice = existentes.length; // 0,1,2,3... siempre al final

  // 2) Guardar nueva dirección con indiceOrden correcto
  await this.rutasService.agregarDireccion(this.rutaId, {
    rutaId: this.rutaId,
    cliente: this.cliente,
    direccion: this.direccion,
    cantidadDiarios: this.cantidadDiarios,
    dias: this.dias,
lat: this.lat ? Number(this.lat) : null,
lng: this.lng ? Number(this.lng) : null,
    indiceOrden: nuevoIndice,   // <-- AHORA ES UN NÚMERO REAL, NO 9999
    notas: this.notas,
  });

  this.toast.mostrar("Dirección agregada", "success");
  window.location.href = `/rutas/${this.rutaId}`;
}

  cancelar() {
    window.location.href = `/rutas/${this.rutaId}`;
  }
}
