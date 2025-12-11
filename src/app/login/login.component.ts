import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { onAuthStateChanged } from '@angular/fire/auth';

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
    private router: Router
  ) {

    onAuthStateChanged(this.authFirebase, (user) => {
      this.usuarioLogueado = !!user;
    });
  }

  loginGoogle() {
    // SOLO SI NO ESTÁ LOGUEADO
    this.auth.loginWithGoogle().then(() => {
      this.router.navigate(['/rutas']);
    });
  }

  entrar() {
    this.router.navigate(['/rutas']);
  }
}
