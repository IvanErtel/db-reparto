import { Component, signal, HostListener } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { ToastComponent } from './shared/toast.component';
import { MenuComponent } from './menu/menu.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { LoadingComponent } from './loading/loading.component';
import { BottomNavComponent } from './boton-nav/bottom-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastComponent,
    MenuComponent,
    CommonModule,
    LoadingComponent,
    BottomNavComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  appLista = false;
  pageTitle = '';
  mostrarHamburguesa = signal(true);
  mostrarFooter = signal(true);
  isMobile = signal(
    window.matchMedia('(max-width: 820px)').matches ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches
  );

  mostrarBottomNav = signal(false);
  currentYear = new Date().getFullYear();
  constructor(private router: Router) {
    setTimeout(() => {
      this.appLista = true;
    }, 1000);

    // Cambiar título dinámicamente según ruta
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url;

        if (url.startsWith('/rutas')) this.pageTitle = 'Mis rutas';
        if (url.includes('/crear')) this.pageTitle = 'Crear nueva ruta';
        if (url.includes('/editar-ruta')) this.pageTitle = 'Editar ruta';
        if (url.includes('/editar/')) this.pageTitle = 'Editar dirección';
        if (url.includes('/agregar')) this.pageTitle = 'Agregar dirección';
        if (url.includes('/dashboard')) this.pageTitle = 'Dashboard';
        if (url.includes('/importar-csv')) this.pageTitle = 'Importar CSV';
        if (url.startsWith('/resumenes')) this.pageTitle = 'Resúmenes';

        // ✅ Layout móvil/pc + login
        this.aplicarLayout(url);

        // ✅ (IMPORTANTE) No pongas más setTimeout que pisen flags acá
        if (url.includes('/login')) this.pageTitle = '';
      });
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(
      window.matchMedia('(max-width: 820px)').matches ||
        window.matchMedia('(hover: none) and (pointer: coarse)').matches
    );
    this.aplicarLayout(this.router.url);
  }

  private aplicarLayout(url: string) {
    const enLogin = url.includes('/login');
    if (enLogin) {
      this.mostrarHamburguesa.set(false);
      this.mostrarFooter.set(false);
      this.mostrarBottomNav.set(false);
      return;
    }

    const mobile = this.isMobile();

    // ✅ móvil: bottom-nav SI, hamburguesa NO
    this.mostrarHamburguesa.set(!mobile);

    // si querés footer solo en PC:
    this.mostrarFooter.set(!mobile);

    this.mostrarBottomNav.set(mobile);
  }

  toggleMenu() {
    const menu = document.querySelector('app-menu') as any;
    if (menu?.toggle) menu.toggle();
  }
}
