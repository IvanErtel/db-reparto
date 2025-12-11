import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay" *ngIf="loading.cargando()">
      <div class="spinner"></div>
    </div>
  `,
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
  constructor(public loading: LoadingService) {}
}
