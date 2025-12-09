import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  currentUser$!: Observable<User | null>;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {
    // Ahora sí: se usa auth DESPUÉS de ser inicializado
    this.currentUser$ = user(this.auth);
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);

      const email = result.user.email;

      if (!email) {
        await this.logout();
        alert("No se encontró email en la cuenta.");
        return;
      }

      const allowed = await this.isAllowedUser(email);

      if (!allowed) {
        await this.logout();
        alert("Tu usuario no está autorizado.");
        return;
      }

      this.router.navigate(['/rutas']);

    } catch (error) {
      console.error("Error en login:", error);
    }
  }

  async isAllowedUser(email: string): Promise<boolean> {
    const colRef = collection(this.firestore, 'allowed_users');
    const q = query(colRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }
}
