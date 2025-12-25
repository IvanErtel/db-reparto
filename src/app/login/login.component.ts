import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { onAuthStateChanged } from '@angular/fire/auth';
import { LoadingService } from '../loading/loading.service';
import { ToastService } from '../shared/toast.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { signOut } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  usuarioLogueado = false;

  constructor(
    private authFirebase: Auth,
    private auth: AuthService,
    private router: Router,
    private loading: LoadingService,
    private toast: ToastService,
    private firestore: Firestore
  ) {
    onAuthStateChanged(this.authFirebase, (user) => {
      this.usuarioLogueado = !!user;
    });
  }

  private async verificarAcceso(): Promise<boolean> {
    const email = (this.authFirebase.currentUser?.email || '').trim();
    if (!email) return false;

    try {
      const ref = doc(this.firestore, `allowed_users/${email}`);
      const snap = await getDoc(ref);
      const data: any = snap.data();

      const enabled =
        snap.exists() && (data?.enabled === true || data?.enable === true);
      if (!enabled) {
        this.toast.mostrar(
          'Tu cuenta no tiene acceso. Pedí habilitación.',
          'error'
        );
        await signOut(this.authFirebase);
        return false;
      }

      return true;
    } catch (e) {
      console.error(e);
      this.toast.mostrar('No se pudo verificar acceso.', 'error');
      await signOut(this.authFirebase);
      return false;
    }
  }

  async loginGoogle() {
    if (this.usuarioLogueado) return;

    this.loading.mostrar();

    try {
      await this.auth.loginWithGoogle();

      // ✅ verificar allowlist enabled
      const ok = await this.validarEnabled();
      if (!ok) return;

      this.router.navigate(['/rutas']);
    } catch (e) {
      console.error(e);
      this.toast.mostrar('Error al iniciar sesión', 'error');
    } finally {
      this.loading.ocultar();
    }
  }

  entrar() {
    this.loading.mostrar();

    setTimeout(async () => {
      try {
        const ok = await this.validarEnabled();
        if (!ok) return;

        this.router.navigate(['/rutas']);
      } finally {
        this.loading.ocultar();
      }
    }, 300);
  }

  private async validarEnabled(): Promise<boolean> {
    const email = (this.authFirebase.currentUser?.email || '').trim();
    if (!email) return false;

    try {
      const ref = doc(this.firestore, `allowed_users/${email}`);
      const snap = await getDoc(ref);
      const data: any = snap.data();

      const enabled =
        snap.exists() && (data?.enabled === true || data?.enable === true);
      if (!enabled) {
        this.toast.mostrar(
          'Tu cuenta no tiene acceso. Pedí habilitación.',
          'error'
        );
        await signOut(this.authFirebase);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      this.toast.mostrar('No se pudo verificar acceso.', 'error');
      await signOut(this.authFirebase);
      return false;
    }
  }
}
