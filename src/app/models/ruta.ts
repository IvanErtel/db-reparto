export interface Ruta {
  id?: string;
  usuarioId: string;          // UID del usuario dueño de la ruta
  nombreBase: 'GAMONAL' | 'ESTE' | 'CENTRO' | 'OESTE' | 'SUR';
  nombrePersonalizado: string;
  creadaEn: any;              // Timestamp o Date
  actualizadaEn: any;
}
