import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  usuarioNombre: string = "Usuario";
  iniciales: string = "U";   // 🔥 ESTO es lo que te faltaba

  constructor(
    private authFirebase: Auth,
    private auth: AuthService,
    private router: Router
  ) {
    const displayName = this.authFirebase.currentUser?.displayName ?? "Usuario";

    this.usuarioNombre = displayName;
    this.iniciales = this.obtenerIniciales(displayName);
  }

  obtenerIniciales(nombre: string): string {
    return nombre
      .split(" ")
      .map(p => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  irRutas() {
    this.router.navigate(['/rutas']);
  }

  logout() {
    this.auth.logout();
  }
}
