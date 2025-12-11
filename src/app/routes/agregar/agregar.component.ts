import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RutasService } from '../../services/rutas.service';
import { ToastService } from '../../shared/toast.service';
import { LoadingService } from '../../loading/loading.service';

@Component({
  selector: 'app-agregar-direccion',
  standalone: true,
  imports: [CommonModule, FormsModule,],
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
    private toast: ToastService,
    private loading: LoadingService
  ) {}

  ngOnInit() {
    this.rutaId = this.route.snapshot.params['id'];
  }

async guardar() {
  this.loading.mostrar();

  try {
    if (!this.cliente.trim() || !this.direccion.trim()) {
      this.toast.mostrar("Completa cliente y dirección", "error");
      return;
    }

    // Obtener direcciones para calcular el siguiente indiceOrden
    const existentes = await this.rutasService.obtenerDireccionesOrdenadas(this.rutaId);
    const nuevoIndice = existentes.length;

    await this.rutasService.agregarDireccion(this.rutaId, {
      rutaId: this.rutaId,
      cliente: this.cliente,
      direccion: this.direccion,
      cantidadDiarios: this.cantidadDiarios,
      dias: this.dias,
      lat: this.lat,
      lng: this.lng,
      indiceOrden: nuevoIndice,
      notas: this.notas,
    });

    this.toast.mostrar("Dirección agregada", "success");
    window.location.href = `/rutas/${this.rutaId}`;

  } catch (e) {
    console.error("Error al agregar dirección", e);
    this.toast.mostrar("Error al agregar la dirección", "error");
  } finally {
    this.loading.ocultar();
  }
}

  cancelar() {
    window.location.href = `/rutas/${this.rutaId}`;
  }
}
