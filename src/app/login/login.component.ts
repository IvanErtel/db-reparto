import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { onAuthStateChanged } from '@angular/fire/auth';
import { LoadingService } from '../loading/loading.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  usuarioLogueado = false;

  constructor(
    private authFirebase: Auth,
    private auth: AuthService,
    private router: Router,
    private loading: LoadingService,
    private toast: ToastService
  ) {

    onAuthStateChanged(this.authFirebase, (user) => {
      this.usuarioLogueado = !!user;
    });
  }

async loginGoogle() {
  if (this.usuarioLogueado) return;  // evita repetir login

  this.loading.mostrar();  // ⭐ mostramos animación de carga

  try {
    await this.auth.loginWithGoogle();
    this.router.navigate(['/rutas']);
  } catch (e) {
    console.error(e);
    this.toast.mostrar("Error al iniciar sesión", "error");
  } finally {
    this.loading.ocultar();  // ⭐ siempre se oculta aunque falle
  }
}

entrar() {
  this.loading.mostrar();
  setTimeout(() => {
    this.router.navigate(['/rutas']);
    this.loading.ocultar();
  }, 300);
}
}
