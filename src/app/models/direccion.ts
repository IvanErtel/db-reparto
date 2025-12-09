export interface Direccion {
  id?: string;
  rutaId: string;             // ID de la ruta padre
  indiceOrden: number;        // Para drag & drop

  // Datos del cliente
  cliente: string;
  direccion: string;
  latitud?: number;
  longitud?: number;

  // Datos del reparto
  cantidadDiarios: number;

  // Días de suscripción
  dias: {
    lunes: boolean;
    martes: boolean;
    miercoles: boolean;
    jueves: boolean;
    viernes: boolean;
    sabado: boolean;
    domingo: boolean;
    festivos: boolean;
    guardarFinSemanaParaLunes: boolean;
  };

  notas?: string;
  infoLlaves?: string;

  // Alta/baja (opcionales)
  fechaAlta?: any;
  fechaBaja?: any;

  creadaEn: any;
  actualizadaEn: any;
}
