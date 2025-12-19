import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';

import { Ruta } from '../models/ruta';
import { RutasService } from './rutas.service';

@Injectable({ providedIn: 'root' })
export class RutasBaseService {
  private readonly BASE_OWNER = '__BASE__';

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private rutasService: RutasService
  ) {}

  async obtenerRutasBase(): Promise<Ruta[]> {
    const col = collection(this.firestore, 'routes');
    const q = query(col, where('usuarioId', '==', this.BASE_OWNER));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Ruta));
  }

  async obtenerRutaBasePorNombreBase(
    nombreBase: Ruta['nombreBase']
  ): Promise<Ruta | null> {
    const col = collection(this.firestore, 'routes');
    const q = query(
      col,
      where('usuarioId', '==', this.BASE_OWNER),
      where('nombreBase', '==', nombreBase)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as any) } as Ruta;
  }

  async crearRutaBase(datos: {
    nombreBase: Ruta['nombreBase'];
    nombrePersonalizado: string;
  }): Promise<string> {
    const col = collection(this.firestore, 'routes');
    const ahora = new Date();

    const docRef = await addDoc(col, {
      usuarioId: this.BASE_OWNER,
      nombreBase: datos.nombreBase,
      nombrePersonalizado: datos.nombrePersonalizado,
      creadaEn: ahora,
      actualizadaEn: ahora,
    });

    return docRef.id;
  }

  async crearMiRutaDesdeBase(
    baseRutaId: string,
    nombrePersonalizado: string
  ): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const base = await this.rutasService.obtenerRutaPorId(baseRutaId);
    if (!base) throw new Error('Ruta base no encontrada');

    // 1) crear ruta del usuario
    const nuevaRutaId = await this.rutasService.crearRuta({
      nombreBase: base.nombreBase as Ruta['nombreBase'],
      nombrePersonalizado,
    });

    // 2) copiar stops
    const stopsBase = await this.rutasService.obtenerDireccionesOrdenadas(
      baseRutaId
    );

    const batchSize = 30;
    for (let i = 0; i < stopsBase.length; i += batchSize) {
      const chunk = stopsBase.slice(i, i + batchSize);

      await Promise.all(
        chunk.map(async (d) => {
          await this.rutasService.agregarDireccion(nuevaRutaId, {
            rutaId: nuevaRutaId,
            cliente: d.cliente,
            direccion: d.direccion,
            cantidadDiarios: d.cantidadDiarios,
            dias: d.dias,
            lat: d.lat ?? null,
            lng: d.lng ?? null,
            indiceOrden: d.indiceOrden ?? 9999,
            notas: d.notas ?? '',
            bajas: d.bajas ?? [],
          } as any);
        })
      );
    }

    return nuevaRutaId;
  }

  async subirRutaComoBase(rutaId: string): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const ruta = await this.rutasService.obtenerRutaPorId(rutaId);
    if (!ruta) throw new Error('Ruta no encontrada');

    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const nombreVersionado = `${ruta.nombrePersonalizado} · ${stamp}`;

    // 1) crear NUEVA ruta base (no reemplaza ninguna)
    const baseId = await this.crearRutaBase({
      nombreBase: ruta.nombreBase,
      nombrePersonalizado: nombreVersionado,
    });

    // 2) copiar stops en el mismo orden
    const stops = await this.rutasService.obtenerDireccionesOrdenadas(rutaId);

    const batchSize = 30;
    for (let i = 0; i < stops.length; i += batchSize) {
      const chunk = stops.slice(i, i + batchSize);

      await Promise.all(
        chunk.map(async (d, idx) => {
          await this.rutasService.agregarDireccion(baseId, {
            rutaId: baseId,
            cliente: d.cliente ?? '',
            direccion: d.direccion ?? '',
            cantidadDiarios: d.cantidadDiarios ?? 1,
            dias: d.dias as any,
            lat: d.lat ?? null,
            lng: d.lng ?? null,
            indiceOrden: i + idx,
            notas: d.notas ?? '',
            bajas: d.bajas ?? [],
          } as any);
        })
      );
    }

    return baseId;
  }

  esRutaBase(ruta: Ruta | null | undefined): boolean {
    return !!ruta && ruta.usuarioId === this.BASE_OWNER;
  }
}
