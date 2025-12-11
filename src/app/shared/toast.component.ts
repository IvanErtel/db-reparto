import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast" *ngIf="toast.visible()"
         [class.success]="toast.tipo() === 'success'"
         [class.error]="toast.tipo() === 'error'"
         [class.info]="toast.tipo() === 'info'">
      {{ toast.mensaje() }}
    </div>
  `,
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
}
