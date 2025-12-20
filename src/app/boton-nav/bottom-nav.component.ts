import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

type NavItem = {
  label: string;
  link: string;
  icon: 'home' | 'routes' | 'import' | 'stats';
};

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  items: NavItem[] = [
    { label: 'Inicio', link: '/dashboard', icon: 'home' },
    { label: 'Rutas', link: '/rutas', icon: 'routes' },
    { label: 'Importar', link: '/importar-csv', icon: 'import' },
    { label: 'Resúmenes', link: '/resumenes', icon: 'stats' },
  ];

  constructor(private router: Router) {}

  isActive(link: string): boolean {
    const url = this.router.url;
    return url === link || url.startsWith(link + '/');
  }
}
