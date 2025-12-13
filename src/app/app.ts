import { Component, signal } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { ToastComponent } from './shared/toast.component';
import { MenuComponent } from './menu/menu.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { LoadingComponent } from './loading/loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent,
    MenuComponent,
    CommonModule,
  LoadingComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  appLista = false;
  pageTitle = '';
  mostrarHamburguesa = signal(true);
  mostrarFooter = signal(true);
currentYear = new Date().getFullYear();
  constructor(private router: Router) {

      setTimeout(() => {
    this.appLista = true;
  }, 1000);
  
    // Cambiar título dinámicamente según ruta
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url;

        if (url.startsWith('/rutas')) this.pageTitle = 'Mis rutas';
        if (url.includes('/crear')) this.pageTitle = 'Crear nueva ruta';
        if (url.includes('/editar-ruta')) this.pageTitle = 'Editar ruta';
        if (url.includes('/editar/')) this.pageTitle = 'Editar dirección';
        if (url.includes('/agregar')) this.pageTitle = 'Agregar dirección';
        if (url.includes('/dashboard')) this.pageTitle = 'Dashboard';

if (url.includes('/login')) {
  this.pageTitle = '';

  setTimeout(() => {
    this.mostrarHamburguesa.set(false);
    this.mostrarFooter.set(false);
  });

} else {

  setTimeout(() => {
    this.mostrarHamburguesa.set(true);
    this.mostrarFooter.set(true);
  });
}

      });
  }

  toggleMenu() {
    const menu = document.querySelector('app-menu') as any;
    if (menu?.toggle) menu.toggle();
  }
}