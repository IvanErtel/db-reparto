export interface Direccion {
  id?: string;
  rutaId: string;
  cliente: string;
  direccion: string;
  cantidadDiarios: number;
  orden?: number;
  
  // NUEVO: coordenadas
  lat?: number | null;
  lng?: number | null;

  // Días de entrega
  dias: {
    lunes: boolean;
    martes: boolean;
    miercoles: boolean;
    jueves: boolean;
    viernes: boolean;
    sabado: boolean;
    domingo: boolean;
    festivos: boolean;
    noEntregarFestivos?: boolean;
    guardarFinSemanaParaLunes: boolean;
  };

  notas?: string;
  indiceOrden: number;

  fechaAlta?: any;
  fechaBaja?: any;

  creadaEn?: any;
  actualizadaEn?: any;
}
