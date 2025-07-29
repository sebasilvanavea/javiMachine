import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthService } from './services/auth.service';
import { Sidebar } from './components/layout/sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    Sidebar
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  title = 'Sistema Contable';
  showHeader = true;
  sidebarCollapsed = false;
  isMobile = false;
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

  getUserInitials(user: any): string {
    if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return nameParts[0].charAt(0) + nameParts[1].charAt(0);
      }
      return nameParts[0].charAt(0);
    }
    return user.email.charAt(0).toUpperCase();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/dashboard')) return 'Dashboard';
    if (url.includes('/users')) return 'Usuarios';
    if (url.includes('/services')) return 'Servicios';
    if (url.includes('/reports')) return 'Reportes';
    if (url.includes('/form21')) return 'Formulario 21';
    if (url.includes('/nomina')) return 'Nómina';
    if (url.includes('/contabilidad')) return 'Contabilidad';
    if (url.includes('/documentos')) return 'Documentos';
    if (url.includes('/configuracion')) return 'Configuración';
    if (url.includes('/auditoria')) return 'Auditoría';
    return 'Sistema Contable';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
