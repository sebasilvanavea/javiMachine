import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { Header } from './components/layout/header/header';
import { AuthService } from './services/auth.service';
import { NotificationToastComponent } from './components/notification-toast/notification-toast.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    Header,
    NotificationToastComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  title = 'Sistema Contable';
  showHeader = true;
  currentUser$ = this.authService.currentUser$;

  ngOnInit(): void {
    // Escuchar cambios de ruta para mostrar/ocultar header
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showHeader = !event.url.includes('/login');
      });

    // Verificar autenticación al iniciar
    this.currentUser$.subscribe(user => {
      if (!user && !this.router.url.includes('/login')) {
        this.router.navigate(['/login']);
      }
    });
  }
}
