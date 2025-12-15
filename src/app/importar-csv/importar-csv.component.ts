import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RutasService } from '../services/rutas.service';
import { ToastService } from '../shared/toast.service';
import { LoadingService } from '../loading/loading.service';
import { Router } from '@angular/router';
import { RutasBaseService } from '../services/rutas-base.service';

type NombreBase = 'GAMONAL' | 'OESTE' | 'SUR' | 'ESTE' | 'CENTRO';

@Component({
  selector: 'app-importar-csv',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './importar-csv.component.html',
  styleUrl: './importar-csv.component.scss'
})
export class ImportarCsvComponent {
  nombreBase: NombreBase = 'GAMONAL';
  archivo: File | null = null;

  constructor(
    private rutasService: RutasService,
    private toast: ToastService,
    private loading: LoadingService,
      private router: Router,
      private rutasBaseService: RutasBaseService,
  ) {}

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.archivo = input.files?.[0] || null;
  }

  private hoyISO(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }

  private diasSiempre() {
    return {
      lunes: true, martes: true, miercoles: true, jueves: true, viernes: true,
      sabado: true, domingo: true, festivos: true,
      guardarFinSemanaParaLunes: false,
      noEntregarFestivos: false
    };
  }

  private detectarSeparador(headerLine: string): string {
    // España suele ser ';'
    const semi = (headerLine.match(/;/g) || []).length;
    const coma = (headerLine.match(/,/g) || []).length;
    return semi >= coma ? ';' : ',';
  }

  private parseCSV(text: string): any[] {
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) return [];

    const sep = this.detectarSeparador(lines[0]);

    // parser simple: asume que no hay saltos de línea dentro de comillas
    const parseLine = (line: string): string[] => {
      const out: string[] = [];
      let cur = '';
      let inQ = false;

      for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (ch === '"') {
          // "" escape
          if (inQ && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQ = !inQ;
          }
          continue;
        }

        if (!inQ && ch === sep) {
          out.push(cur);
          cur = '';
          continue;
        }

        cur += ch;
      }
      out.push(cur);
      return out.map(x => x.trim());
    };

    const headers = parseLine(lines[0]);

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      const obj: any = {};
      headers.forEach((h, idx) => obj[h] = cols[idx] ?? '');
      rows.push(obj);
    }
    return rows;
  }

  async importar() {
    if (!this.archivo) {
      this.toast.mostrar('Seleccioná un CSV', 'error');
      return;
    }

const nombre = this.nombreBase;

    this.loading.mostrar();
    try {
      const text = await this.archivo.text();
      const rows = this.parseCSV(text);

      const agrupado = new Map<string, {
        cliente: string;
        direccion: string;
        sub: string;
        poblacion: string;
        cantidad: number;
      }>();

      for (const r of rows) {
        const cliente = String(r['NOMBRE ENVIO'] || '').trim();
        const direccion = String(r['DIRECCION ENVIO'] || '').trim();
        const sub = String(r['SUBDIRECCION'] || '').trim();
        const poblacion = String(r['NOMBRE POBLACION E.'] || '').trim();

        if (!cliente) continue;

        // excluir fila tipo "REPARTO ..."
        if (cliente.toUpperCase().startsWith('REPARTO') && (direccion === '.' || direccion === '')) continue;

        // cantidad
        const ej = Number(String(r['EJEMP.'] ?? '1').replace(',', '.'));
        const cantidad = Number.isFinite(ej) && ej > 0 ? ej : 1;

        const key = `${cliente}||${direccion}||${sub}||${poblacion}`.toUpperCase();

        const prev = agrupado.get(key);
        if (prev) prev.cantidad += cantidad;
        else agrupado.set(key, { cliente, direccion, sub, poblacion, cantidad });
      }

      const items = Array.from(agrupado.values());
      if (items.length === 0) {
        this.toast.mostrar('No se encontraron direcciones para importar', 'error');
        return;
      }
      
// ✅ No permitir re-importar la misma zona BASE (evita duplicados)
const existente = await this.rutasBaseService.obtenerRutaBasePorNombreBase(this.nombreBase);

if (existente?.id) {
  this.toast.mostrar(`Ya existe la ruta BASE ${this.nombreBase}. No se importó para evitar duplicados.`, 'error');
  this.router.navigate(['/rutas', existente.id]);
  return;
}


const rutaId = await this.rutasBaseService.crearRutaBase({
  nombreBase: this.nombreBase,
  nombrePersonalizado: nombre
});

      const dias = this.diasSiempre();

      let indice = 0;
      const batchSize = 30;

      for (let i = 0; i < items.length; i += batchSize) {
        const chunk = items.slice(i, i + batchSize);
        await Promise.all(
          chunk.map(async (it) => {
            const miIndice = indice++;
            await this.rutasService.agregarDireccion(rutaId, {
              rutaId,
              cliente: it.cliente,
              direccion: it.direccion,
              cantidadDiarios: it.cantidad,
              dias,
              lat: null,
              lng: null,
              indiceOrden: miIndice,
              notas: it.sub ? it.sub : '',
              bajas: []
            } as any);
          })
        );
      }

      this.toast.mostrar(`Importado: ${items.length} direcciones`, 'success');
      window.location.href = `/rutas/${rutaId}`;
    } catch (e) {
      console.error(e);
      this.toast.mostrar('Error importando CSV', 'error');
    } finally {
      this.loading.ocultar();
    }
  }
}
