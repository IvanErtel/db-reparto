export interface ResumenReparto {
  id?: string;
  rutaId: string;
  rutaNombre: string;
  fecha: string;            // yyyy-mm-dd
  inicio: number;           // timestamp
  fin: number;              // timestamp
  entregadas: number;
  saltadas: number;
  total: number;
}
