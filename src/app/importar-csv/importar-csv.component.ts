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
  styleUrl: './importar-csv.component.scss',
})
export class ImportarCsvComponent {
  nombreBase: NombreBase = 'GAMONAL';
  archivo: File | null = null;

  constructor(
    private rutasService: RutasService,
    private toast: ToastService,
    private loading: LoadingService,
    private router: Router,
    private rutasBaseService: RutasBaseService
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
      lunes: true,
      martes: true,
      miercoles: true,
      jueves: true,
      viernes: true,
      sabado: true,
      domingo: true,
      festivos: true,
      guardarFinSemanaParaLunes: false,
      noEntregarFestivos: false,
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
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

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
      return out.map((x) => x.trim());
    };

    const headers = parseLine(lines[0]).map((h) =>
      h
        .replace(/^\uFEFF/, '')
        .replace(/\s+/g, ' ')
        .trim()
    );

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      const obj: any = {};
      headers.forEach((h, idx) => (obj[h] = cols[idx] ?? ''));
      rows.push(obj);
    }
    return rows;
  }

  async importar() {
    if (!this.archivo) {
      this.toast.mostrar('Seleccioná un CSV', 'error');
      return;
    }

    this.loading.mostrar();
    try {
      const text = await this.archivo.text();
      const rows = this.parseCSV(text);

      type Item = {
        cliente: string;
        direccion: string;
        sub: string;
        poblacion: string;
        cantidad: number;
        bajaDesde?: string;
        bajaHasta?: string;
      };

      // ✅ Detectar si es CSV exportado por TU APP
      const esCSVApp =
        rows.length > 0 && 'Cliente' in rows[0] && 'Direccion' in rows[0];

      let items: Item[] = [];

      if (esCSVApp) {
        // ✅ CSV de tu app: respeta el orden del archivo
        items = rows
          .map((r: any) => {
            const cliente = String(r['Cliente'] || '').trim();
            const direccion = String(r['Direccion'] || '').trim();
            const sub = String(r['Notas'] || '').trim();
            const cant = Number(String(r['Cantidad'] ?? '1').replace(',', '.'));
            const cantidad = Number.isFinite(cant) && cant > 0 ? cant : 1;

            const bajaDesde = String(r['BajaDesde'] || '').trim();
            const bajaHasta = String(r['BajaHasta'] || '').trim();

            return {
              cliente,
              direccion,
              sub,
              poblacion: '',
              cantidad,
              bajaDesde,
              bajaHasta,
            };
          })
          .filter((it) => it.cliente.length > 0);
      } else {
        // ✅ CSV “original” (NOMBRE ENVIO / DIRECCION ENVIO...)
        const agrupado = new Map<string, Item>();

        for (const r of rows as any[]) {
          const cliente = String(
            r['NOMBRE ENVIO'] || r['NOMBRE_ENVIO'] || ''
          ).trim();
          const direccion = String(
            r['DIRECCION ENVIO'] ||
              r['DIRECCIÓN ENVIO'] ||
              r['DIRECCION_ENVIO'] ||
              ''
          ).trim();
          const sub = String(
            r['SUBDIRECCION'] || r['SUBDIRECCIÓN'] || ''
          ).trim();
          const poblacion = String(
            r['NOMBRE POBLACION E.'] ||
              r['NOMBRE POBLACION E'] ||
              r['POBLACION'] ||
              ''
          ).trim();

          if (!cliente) continue;

          // excluir fila tipo "REPARTO ..."
          if (
            cliente.toUpperCase().startsWith('REPARTO') &&
            (direccion === '.' || direccion === '')
          )
            continue;

          const ej = Number(String(r['EJEMP.'] ?? '1').replace(',', '.'));
          const cantidad = Number.isFinite(ej) && ej > 0 ? ej : 1;

          const key =
            `${cliente}||${direccion}||${sub}||${poblacion}`.toUpperCase();
          const prev = agrupado.get(key);
          if (prev) prev.cantidad += cantidad;
          else
            agrupado.set(key, { cliente, direccion, sub, poblacion, cantidad });
        }

        items = Array.from(agrupado.values());
      }

      if (items.length === 0) {
        this.toast.mostrar(
          'No se encontraron direcciones para importar',
          'error'
        );
        return;
      }

      const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const rutaId = await this.rutasBaseService.crearRutaBase({
        nombreBase: this.nombreBase,
        nombrePersonalizado: `${this.nombreBase} · ${stamp}`,
      });

      const dias = this.diasSiempre();

      let indice = 0;
      const batchSize = 30;

      for (let i = 0; i < items.length; i += batchSize) {
        const chunk = items.slice(i, i + batchSize);
        await Promise.all(
          chunk.map(async (it) => {
            const miIndice = indice++;
            const bajas =
              it.bajaDesde && it.bajaHasta
                ? [{ desde: it.bajaDesde, hasta: it.bajaHasta }]
                : [];

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
              bajas,
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
