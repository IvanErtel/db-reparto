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
  orderBy,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Ruta } from '../models/ruta';
import { Direccion } from '../models/direccion';
import { setDoc, serverTimestamp } from 'firebase/firestore';
import { ResumenReparto } from '../models/resumen-reparto';

@Injectable({
  providedIn: 'root',
})
export class RutasService {
  // 🔥 cache en memoria para rutas grandes
  private cacheDirecciones = new Map<string, Direccion[]>();

  constructor(private firestore: Firestore, private auth: Auth) {}

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
      actualizadaEn: ahora,
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

    const rutas = snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as any) } as Ruta)
    );
    console.log('Rutas obtenidas desde Firestore:', rutas);
    return rutas;
  }

  async actualizarRuta(id: string, parcial: Partial<Ruta>): Promise<void> {
    const ref = doc(this.firestore, 'routes', id);
    await updateDoc(ref, {
      ...parcial,
      actualizadaEn: new Date(),
    });
  }

  async eliminarRuta(id: string): Promise<void> {
    const ref = doc(this.firestore, 'routes', id);
    await deleteDoc(ref);
  }

  // ============================
  // 🟧 CRUD DE DIRECCIONES (STOPS)
  // ============================

  async agregarDireccion(
    rutaId: string,
    datos: Omit<Direccion, 'id' | 'creadaEn' | 'actualizadaEn'>
  ): Promise<string> {
    const col = collection(this.firestore, `routes/${rutaId}/stops`);
    const ahora = new Date();

    const docRef = await addDoc(col, {
      ...datos,
      creadaEn: ahora,
      actualizadaEn: ahora,
    });
    // 🔥 invalidar cache
    this.cacheDirecciones.delete(rutaId);

    return docRef.id;
  }

  async obtenerRutaPorId(id: string): Promise<Ruta | null> {
    const ref = doc(this.firestore, 'routes', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as any) } as Ruta;
  }

  async obtenerDireccionesOrdenadas(rutaId: string): Promise<Direccion[]> {
    // ✅ devolver cache si ya existe
    if (this.cacheDirecciones.has(rutaId)) {
      return this.cacheDirecciones.get(rutaId)!;
    }

    // ⏬ tu código ACTUAL para traer de Firestore
    const col = collection(this.firestore, `routes/${rutaId}/stops`);
    const q = query(col, orderBy('indiceOrden', 'asc'));
    const snap = await getDocs(q);

    const dirs = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as Direccion[];

    // ✅ guardar en cache
    this.cacheDirecciones.set(rutaId, dirs);

    return dirs;
  }

  async actualizarDireccion(
    rutaId: string,
    id: string,
    parcial: Partial<Direccion>
  ): Promise<void> {
    const ref = doc(this.firestore, `routes/${rutaId}/stops/${id}`);
    await updateDoc(ref, {
      ...parcial,
      actualizadaEn: new Date(),
    });
    this.cacheDirecciones.delete(rutaId);
  }

  async eliminarDireccion(rutaId: string, id: string): Promise<void> {
    const ref = doc(this.firestore, `routes/${rutaId}/stops/${id}`);
    await deleteDoc(ref);
    this.cacheDirecciones.delete(rutaId);
  }

  // ============================
  // 🔄 REORDENAMIENTO (DRAG & DROP)
  // ============================

  async reordenarDirecciones(
    rutaId: string,
    direcciones: Direccion[]
  ): Promise<void> {
    const promesas = direcciones.map((dir, index) => {
      const ref = doc(this.firestore, `routes/${rutaId}/stops/${dir.id}`);
      return updateDoc(ref, { indiceOrden: index });
    });

    await Promise.all(promesas);
    this.cacheDirecciones.delete(rutaId);
  }

  // ============================
  // 🟩 FILTRO POR FECHA (ALTA / BAJA)
  // ============================

  private limpiarFecha(fecha: Date): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }

  private direccionEstaDeBaja(d: Direccion, fecha: Date): boolean {
    if (!d.bajas || d.bajas.length === 0) return false;

    const hoy = fecha.toISOString().split('T')[0]; // YYYY-MM-DD

    return d.bajas.some((baja) => {
      if (!baja.desde || !baja.hasta) return false;
      return hoy >= baja.desde && hoy <= baja.hasta;
    });
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
      ...(snap.data() as any),
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

  async registrarSalto(
    rutaId: string,
    direccion: Direccion,
    razon: string = ''
  ) {
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
      lng: direccion.lng || null,
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
      'sabado',
    ];

    const clave = mapa[diaSemana];
    return d.dias[clave] === true;
  }

  async registrarEntrega(
    rutaId: string,
    direccionId: string,
    datos?: Direccion
  ) {
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
      lng: direccion?.lng || null,
    });
  }

  async guardarResumen(resumen: ResumenReparto): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const fecha = resumen.fecha; // YYYY-MM-DD

    // lo guardamos en: users/{uid}/resumenes/{fecha}_{rutaId}
    const ref = doc(
      this.firestore,
      `users/${user.uid}/resumenes/${fecha}_${resumen.rutaId}`
    );
    await setDoc(ref, resumen);
  }

  async obtenerResumenes(): Promise<(ResumenReparto & { id: string })[]> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const col = collection(this.firestore, `users/${user.uid}/resumenes`);
    const q = query(col, orderBy('fecha', 'desc'));

    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
  }

  async obtenerResumen(
    id: string
  ): Promise<(ResumenReparto & { id: string }) | null> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const ref = doc(this.firestore, `users/${user.uid}/resumenes/${id}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return {
      id: snap.id,
      ...(snap.data() as any),
    };
  }

  async eliminarResumen(id: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const ref = doc(this.firestore, `users/${user.uid}/resumenes/${id}`);
    await deleteDoc(ref);
  }

  async obtenerDireccion(
    rutaId: string,
    direccionId: string
  ): Promise<Direccion | null> {
    const ref = doc(this.firestore, `routes/${rutaId}/stops/${direccionId}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    return { id: snap.id, ...snap.data() } as Direccion;
  }

  async obtenerDireccionesParaReparto(
    rutaId: string,
    fecha: Date
  ): Promise<Direccion[]> {
    const todas = await this.obtenerDireccionesOrdenadas(rutaId);

    return todas.filter(
      (d) =>
        this.direccionActivaEnFecha(d, fecha) &&
        this.direccionSeEntregaEsteDia(d, fecha)
    );
  }

  private festivosSet: Set<string> | null = null;
  private festivosPromise: Promise<Set<string>> | null = null;

  private async getFestivosSet(): Promise<Set<string>> {
    if (this.festivosSet) return this.festivosSet;
    if (this.festivosPromise) return this.festivosPromise;

    this.festivosPromise = (async () => {
      const ref = doc(this.firestore, 'config/festivos');
      const snap = await getDoc(ref);

      const dias: string[] = snap.exists() ? snap.data()['dias'] || [] : [];
      this.festivosSet = new Set(dias);

      this.festivosPromise = null;
      return this.festivosSet!;
    })();

    return this.festivosPromise;
  }

  async esFestivo(fecha: Date): Promise<boolean> {
    const fechaISO = fecha.toISOString().split('T')[0];
    const set = await this.getFestivosSet();
    return set.has(fechaISO);
  }

  async esDiaDeEntrega(
    d: Direccion,
    fecha: Date = new Date()
  ): Promise<boolean> {
    if (!d.dias) return true;
    // 🚫 Si la dirección está de baja, NO se entrega
    if (this.direccionEstaDeBaja(d, fecha)) {
      return false;
    }

    const dia = fecha.getDay(); // 0 = domingo, 1 = lunes...
    const esFestivo = await this.esFestivo(fecha);

    // 1) Si el usuario NO quiere entregar en festivos → nunca se entrega en festivo
    if (d.dias.noEntregarFestivos === true && esFestivo) {
      return false;
    }

    // 2) Si es festivo y el usuario SÍ marcó "festivos" → entregar SIEMPRE
    if (esFestivo && d.dias.festivos === true) {
      return true;
    }

    // 3) Si es festivo, pero NO marcó festivos → se entrega igual
    //    si marcó el día de semana correspondiente.
    if (esFestivo && d.dias.festivos === false) {
      // se entrega si marcó el día de la semana (lunes, martes, etc.)
      const mapa = [
        d.dias.domingo,
        d.dias.lunes,
        d.dias.martes,
        d.dias.miercoles,
        d.dias.jueves,
        d.dias.viernes,
        d.dias.sabado,
      ];
      return mapa[dia] === true;
    }

    // 4) Día normal (no festivo)
    const mapa = [
      d.dias.domingo,
      d.dias.lunes,
      d.dias.martes,
      d.dias.miercoles,
      d.dias.jueves,
      d.dias.viernes,
      d.dias.sabado,
    ];

    return mapa[dia] === true;
  }

  esDiaDeEntregaSync(d: Direccion, fecha: Date, esFestivo: boolean): boolean {
    if (!d.dias) return true;

    // 🚫 Si está de baja, NO se entrega
    if (this.direccionEstaDeBaja(d, fecha)) return false;

    const dia = fecha.getDay();

    // 1) No entregar festivos
    if (d.dias.noEntregarFestivos === true && esFestivo) return false;

    // 2) Si es festivo y marcó festivos → entregar
    if (esFestivo && d.dias.festivos === true) return true;

    // 3) Si es festivo y NO marcó festivos → depende del día de semana
    const mapa = [
      d.dias.domingo,
      d.dias.lunes,
      d.dias.martes,
      d.dias.miercoles,
      d.dias.jueves,
      d.dias.viernes,
      d.dias.sabado,
    ];

    if (esFestivo && d.dias.festivos === false) return mapa[dia] === true;

    // 4) día normal
    return mapa[dia] === true;
  }
}
