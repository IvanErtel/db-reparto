import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {

  abierto = signal(false);

  constructor(
    private router: Router,
    private auth: Auth
  ) {}

  toggle() {
    this.abierto.set(!this.abierto());
  }

  navegar(ruta: string) {
    this.router.navigate([ruta]);
    this.abierto.set(false);
  }

  logout() {
    this.auth.signOut();
    this.abierto.set(false);
    this.router.navigate(['/login']);
  }

  get usuarioLogueado() {
    return !!this.auth.currentUser;
  }

}
