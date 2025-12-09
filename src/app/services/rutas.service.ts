import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Ruta } from '../models/ruta';
import { Direccion } from '../models/direccion';

@Injectable({
  providedIn: 'root'
})
export class RutasService {

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  // ============================
  // 🟦 CRUD DE RUTAS
  // ============================

  async crearRuta(datos: {
    nombreBase: Ruta['nombreBase'];
    nombrePersonalizado: string;
  }): Promise<string> {

    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const col = collection(this.firestore, 'routes');
    const ahora = new Date();

    const docRef = await addDoc(col, {
      usuarioId: user.uid,
      nombreBase: datos.nombreBase,
      nombrePersonalizado: datos.nombrePersonalizado,
      creadaEn: ahora,
      actualizadaEn: ahora
    });

    return docRef.id;
  }

  // 👉 método simple: usa el usuario actual
  async obtenerMisRutas(): Promise<Ruta[]> {
    const user = this.auth.currentUser;
    if (!user) {
      console.warn('obtenerMisRutas: no hay usuario actual');
      return [];
    }

    const col = collection(this.firestore, 'routes');
    const q = query(col, where('usuarioId', '==', user.uid));
    const snap = await getDocs(q);

    const rutas = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Ruta));
    console.log('Rutas obtenidas desde Firestore:', rutas);
    return rutas;
  }

  async actualizarRuta(id: string, parcial: Partial<Ruta>): Promise<void> {
    const ref = doc(this.firestore, 'routes', id);
    await updateDoc(ref, {
      ...parcial,
      actualizadaEn: new Date()
    });
  }

  async eliminarRuta(id: string): Promise<void> {
    const ref = doc(this.firestore, 'routes', id);
    await deleteDoc(ref);
  }

  // ============================
  // 🟧 CRUD DE DIRECCIONES (STOPS)
  // ============================

  async agregarDireccion(rutaId: string, datos: Omit<Direccion, 'id' | 'creadaEn' | 'actualizadaEn'>): Promise<string> {
    const col = collection(this.firestore, `routes/${rutaId}/stops`);
    const ahora = new Date();

    const docRef = await addDoc(col, {
      ...datos,
      creadaEn: ahora,
      actualizadaEn: ahora
    });

    return docRef.id;
  }

  async obtenerRutaPorId(id: string): Promise<Ruta | null> {
  const ref = doc(this.firestore, 'routes', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as Ruta;
}

  
  async obtenerDireccionesOrdenadas(rutaId: string): Promise<Direccion[]> {
    const col = collection(this.firestore, `routes/${rutaId}/stops`);
    const q = query(col, orderBy('indiceOrden', 'asc'));

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Direccion));
  }

  async actualizarDireccion(rutaId: string, id: string, parcial: Partial<Direccion>): Promise<void> {
    const ref = doc(this.firestore, `routes/${rutaId}/stops/${id}`);
    await updateDoc(ref, {
      ...parcial,
      actualizadaEn: new Date()
    });
  }

  async eliminarDireccion(rutaId: string, id: string): Promise<void> {
    const ref = doc(this.firestore, `routes/${rutaId}/stops/${id}`);
    await deleteDoc(ref);
  }

  // ============================
  // 🔄 REORDENAMIENTO (DRAG & DROP)
  // ============================

  async reordenarDirecciones(rutaId: string, direcciones: Direccion[]): Promise<void> {
    const promesas = direcciones.map((dir, index) => {
      const ref = doc(this.firestore, `routes/${rutaId}/stops/${dir.id}`);
      return updateDoc(ref, { indiceOrden: index });
    });

    await Promise.all(promesas);
  }

  // ============================
  // 🟩 FILTRO POR FECHA (ALTA / BAJA)
  // ============================

  private limpiarFecha(fecha: Date): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }

  private aDate(valor: any): Date | null {
    if (!valor) return null;
    if (valor instanceof Date) return valor;
    if (valor.toDate) return valor.toDate(); // Firestore Timestamp
    return null;
  }

  direccionActivaEnFecha(d: Direccion, fecha: Date): boolean {
    const hoy = this.limpiarFecha(fecha);

    if (d.fechaBaja) {
      const baja = this.aDate(d.fechaBaja);
      if (baja && baja <= hoy) return false;
    }

    if (d.fechaAlta) {
      const alta = this.aDate(d.fechaAlta);
      if (alta && alta > hoy) return false;
    }

    return true;
  }

  direccionSeEntregaEsteDia(d: Direccion, fecha: Date): boolean {
    const diaSemana = fecha.getDay(); // 0=domingo ... 6=sábado
    const mapa: (keyof Direccion['dias'])[] = [
      'domingo',
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
      'sabado'
    ];

    const clave = mapa[diaSemana];
    return d.dias[clave] === true;
  }

  async obtenerDireccionesParaReparto(rutaId: string, fecha: Date): Promise<Direccion[]> {
    const todas = await this.obtenerDireccionesOrdenadas(rutaId);

    return todas.filter(d =>
      this.direccionActivaEnFecha(d, fecha) &&
      this.direccionSeEntregaEsteDia(d, fecha)
    );
  }
}
