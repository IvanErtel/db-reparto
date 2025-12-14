export interface ResumenReparto {
  id?: string;
  rutaId: string;
  rutaNombre: string;
  fecha: string;      // yyyy-mm-dd
  inicio: number;     // timestamp
  fin: number;        // timestamp

  entregados: string[]; // nombres entregados
  salteados: string[];  // nombres salteados
}
