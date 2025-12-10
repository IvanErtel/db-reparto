import { Routes } from '@angular/router';
import { ListComponent } from './routes/list/list.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './login/login.component';
import { CrearRutaComponent } from './routes/crear/crear.component';
import { DetalleComponent } from './routes/detalle/detalle.component';
import { AgregarComponent } from './routes/agregar/agregar.component';
import { EditarComponent } from './routes/editar/editar.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },

  { path: 'rutas', component: ListComponent, canActivate: [authGuard] },
  { path: 'rutas/crear', component: CrearRutaComponent, canActivate: [authGuard] },

  // 🔥 EDITAR RUTA DEBE IR ANTES QUE rutas/:id
  {
    path: 'rutas/:id/editar-ruta',
    loadComponent: () =>
      import('./routes/editar-ruta/editar-ruta.component')
        .then(m => m.EditarRutaComponent),
    canActivate: [authGuard]
  },

  // Detalle de ruta
  { path: 'rutas/:id', component: DetalleComponent, canActivate: [authGuard] },

  // Agregar dirección
  { path: 'rutas/:id/agregar', component: AgregarComponent, canActivate: [authGuard] },

  // Editar dirección
  { path: 'rutas/:rutaId/editar/:direccionId', component: EditarComponent, canActivate: [authGuard] },

  // Reparto
  {
    path: 'rutas/:id/reparto',
    loadComponent: () =>
      import('./routes/reparto/reparto.component')
        .then(m => m.RepartoComponent)
  },

  { path: '', redirectTo: 'rutas', pathMatch: 'full' },
  { path: '**', redirectTo: 'rutas' }
];
