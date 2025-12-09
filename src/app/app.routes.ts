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
  // Login
  { path: 'login', component: LoginComponent },

  // Dashboard principal
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },

  // Ruta donde se listan todas las rutas del usuario
  { path: 'rutas', component: ListComponent, canActivate: [authGuard] },

  { path: 'rutas/crear', component: CrearRutaComponent, canActivate: [authGuard] },

  { path: 'rutas/:id', component: DetalleComponent, canActivate: [authGuard] },

  { path: 'rutas/:id/agregar', component: AgregarComponent, canActivate: [authGuard] },
  
  { path: 'rutas/:rutaId/editar/:direccionId', component: EditarComponent, canActivate: [authGuard] },
  
  // Redirecciones
  { path: '', redirectTo: 'rutas', pathMatch: 'full' },
  { path: '**', redirectTo: 'rutas' }
];
