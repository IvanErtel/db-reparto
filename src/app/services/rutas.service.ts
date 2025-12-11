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
import { setDoc, serverTimestamp } from 'firebase/firestore';

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
  const colRef = collection(this.firestore, `routes/${rutaId}/stops`);

  const snap = await getDocs(colRef);

  let dirs = snap.docs.map(d => {
    const data = d.data() as any;

    // Si no tiene indiceOrden, le asignamos uno grande para no romper
    if (data.indiceOrden === undefined || data.indiceOrden === null) {
      data.indiceOrden = 9999;
    }

    return { id: d.id, ...data } as Direccion;
  });

  // Ordenar en memoria por indiceOrden
  dirs.sort((a, b) => (a.indiceOrden ?? 9999) - (b.indiceOrden ?? 9999));

  return dirs;
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

  async obtenerUnaRuta(id: string): Promise<Ruta | null> {
    const ref = doc(this.firestore, 'routes', id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return {
      id: snap.id,
      ...(snap.data() as any)
    } as Ruta;
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

async registrarSalto(rutaId: string, direccion: Direccion, razon: string = '') {
  const hoy = new Date().toISOString().split('T')[0];

  const ref = doc(
    this.firestore,
    `routes/${rutaId}/historial/${hoy}/direcciones/${direccion.id}`
  );

  await setDoc(ref, {
    entregado: false,
    hora: serverTimestamp(),
    razonSalto: razon || null,

    // También guardamos los datos completos
    cliente: direccion.cliente,
    direccion: direccion.direccion,
    cantidadDiarios: direccion.cantidadDiarios,
    notas: direccion.notas || null,
    lat: direccion.lat || null,
    lng: direccion.lng || null
  });
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

async registrarEntrega(rutaId: string, direccionId: string, datos?: Direccion) {
  const hoy = new Date().toISOString().split('T')[0]; // AAAA-MM-DD

  // Si no recibimos datos, intentar obtener la dirección desde Firestore
  let direccion: Direccion | null | undefined = datos;
  if (!direccion) {
    direccion = await this.obtenerDireccion(rutaId, direccionId);
  }

  const ref = doc(
    this.firestore,
    `routes/${rutaId}/historial/${hoy}/direcciones/${direccionId}`
  );

  await setDoc(ref, {
    entregado: true,
    hora: serverTimestamp(),
    razonSalto: null,

    // Guardamos información útil
    cliente: direccion?.cliente || null,
    direccion: direccion?.direccion || null,
    cantidadDiarios: direccion?.cantidadDiarios || null,
    notas: direccion?.notas || null,
    lat: direccion?.lat || null,
    lng: direccion?.lng || null
  });
}

async obtenerDireccion(rutaId: string, direccionId: string): Promise<Direccion | null> {
  const ref = doc(this.firestore, `routes/${rutaId}/stops/${direccionId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return { id: snap.id, ...snap.data() } as Direccion;
}

  async obtenerDireccionesParaReparto(rutaId: string, fecha: Date): Promise<Direccion[]> {
    const todas = await this.obtenerDireccionesOrdenadas(rutaId);

    return todas.filter(d =>
      this.direccionActivaEnFecha(d, fecha) &&
      this.direccionSeEntregaEsteDia(d, fecha)
    );
  }

  async esFestivo(fecha: Date): Promise<boolean> {
  const fechaISO = fecha.toISOString().split('T')[0]; // ejemplo: "2025-01-06"

  const ref = doc(this.firestore, 'config/festivos');
  const snap = await getDoc(ref);

  if (!snap.exists()) return false;

  const data = snap.data();
  const dias: string[] = data['dias'] || [];

  return dias.includes(fechaISO);   // true si es festivo
}

async esDiaDeEntrega(d: Direccion, fecha: Date = new Date()): Promise<boolean> {
  if (!d.dias) return true;

  const dia = fecha.getDay(); // 0 Domingo, 1 Lunes...
  const esFestivo = await this.esFestivo(fecha);

  // ----- 🔥 NUEVA LÓGICA DE FESTIVOS -----
  if (esFestivo) {
    // Si marcó "no entregar en festivos", NO SE ENTREGA
    if (d.dias.noEntregarFestivos) return false;

    // Si marcó "festivos", entonces SÍ se entrega
    return d.dias.festivos === true;
  }

  // ----- 🔥 LÓGICA ESPECIAL DE FIN DE SEMANA → LUNES -----
  if (dia === 1 && d.dias.guardarFinSemanaParaLunes) {
    return true;
  }

  // ----- 🔥 MAPEO NORMAL -----
  const mapa = [
    d.dias.domingo,
    d.dias.lunes,
    d.dias.martes,
    d.dias.miercoles,
    d.dias.jueves,
    d.dias.viernes,
    d.dias.sabado
  ];

  return mapa[dia] === true;
}

}
