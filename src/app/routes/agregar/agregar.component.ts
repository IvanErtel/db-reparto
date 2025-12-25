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
  imports: [CommonModule, FormsModule],
  templateUrl: './agregar.component.html',
  styleUrl: './agregar.component.scss',
})
export class AgregarComponent implements OnInit {
  rutaId!: string;

  // Campos de la dirección
  cliente = '';
  direccion = '';
  cantidadDiarios = 1;
  referencia = '';
  etiqueta = '';
  // Coordenadas
  lat: number | null = null;
  lng: number | null = null;
  // Pegar coordenadas tipo "42.3510, -3.6634"
  coordsTexto = '';

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
    noEntregarFestivos: false, // <-- NUEVO
  };

  notas = '';
  // 🔴 Bajas temporales (vacaciones)
  bajas: { desde: string; hasta: string }[] = [];

  bajaDesde = '';
  bajaHasta = '';

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

  agregarBaja() {
    if (!this.bajaDesde || !this.bajaHasta) {
      this.toast.mostrar('Debes completar desde y hasta', 'error');
      return;
    }

    if (this.bajaDesde > this.bajaHasta) {
      this.toast.mostrar(
        'La fecha "desde" no puede ser mayor que "hasta"',
        'error'
      );
      return;
    }

    this.bajas.push({
      desde: this.bajaDesde,
      hasta: this.bajaHasta,
    });

    // limpiar inputs
    this.bajaDesde = '';
    this.bajaHasta = '';
  }

  eliminarBaja(i: number) {
    this.bajas.splice(i, 1);
  }

  private parseCoords(text: string): { lat: number; lng: number } | null {
    if (!text) return null;

    const cleaned = text
      .trim()
      .replace(/[()]/g, '')
      .replace(/;/g, ',')
      .replace(/\s+/g, ' ');

    // toma los primeros 2 números que encuentre
    const m = cleaned.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
    if (!m) return null;

    const a = Number(m[1]);
    const b = Number(m[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

    // lat entre -90 y 90, lng entre -180 y 180
    let lat = a,
      lng = b;

    // si vienen invertidas (raro), corregimos
    if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
      lat = b;
      lng = a;
    }

    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

    return { lat, lng };
  }

  onCoordsPaste(ev: ClipboardEvent) {
    const txt = ev.clipboardData?.getData('text') ?? '';
    const parsed = this.parseCoords(txt);

    if (!parsed) {
      this.toast.mostrar(
        'Formato inválido. Pegá: 42.351017, -3.663434',
        'error'
      );
      return;
    }

    ev.preventDefault();

    this.lat = parsed.lat;
    this.lng = parsed.lng;
    this.coordsTexto = `${parsed.lat}, ${parsed.lng}`;
  }

  aplicarCoordsDesdeTexto() {
    if (!this.coordsTexto?.trim()) return;

    const parsed = this.parseCoords(this.coordsTexto);
    if (!parsed) return;

    this.lat = parsed.lat;
    this.lng = parsed.lng;
    this.coordsTexto = `${parsed.lat}, ${parsed.lng}`;
  }

  async guardar() {
    this.loading.mostrar();

    try {
      if (!this.cliente.trim() || !this.direccion.trim()) {
        this.toast.mostrar('Completa cliente y dirección', 'error');
        return;
      }

      // Obtener direcciones para calcular el siguiente indiceOrden
      const existentes = await this.rutasService.obtenerDireccionesOrdenadas(
        this.rutaId
      );
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
        bajas: this.bajas,
        referencia: this.referencia,
        etiqueta: this.etiqueta,
      });

      this.toast.mostrar('Dirección agregada', 'success');
      window.location.href = `/rutas/${this.rutaId}`;
    } catch (e) {
      console.error('Error al agregar dirección', e);
      this.toast.mostrar('Error al agregar la dirección', 'error');
    } finally {
      this.loading.ocultar();
    }
  }

  cancelar() {
    window.location.href = `/rutas/${this.rutaId}`;
  }
}
