import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

// import { Sidebar } from './components/layout/sidebar/sidebar'; // No usado en esta versión
import { AuthService } from './services/auth.service';
import { NotificationToastComponent } from './components/notification-toast/notification-toast.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    NotificationToastComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  title = 'Sistema Contable';
  showHeader = true;
  showSidebar = true;
  sidebarCollapsed = false;
  isMobile = false;
  sidenavOpened = true;
  currentUser$ = this.authService.currentUser$;

  ngOnInit(): void {
    // Detectar dispositivos móviles
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
        this.sidenavOpened = !this.isMobile;
      });

    // Escuchar cambios de ruta para mostrar/ocultar sidebar
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showSidebar = !event.url.includes('/login');
        // Cerrar sidebar en móvil después de navegar
        if (this.isMobile) {
          this.sidenavOpened = false;
        }
      });

    // Verificar autenticación al iniciar
    this.currentUser$.subscribe(user => {
      if (!user && !this.router.url.includes('/login')) {
        this.router.navigate(['/login']);
      }
    });
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.sidenavOpened = !this.sidenavOpened;
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    // Manejar cambios de tamaño de ventana
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
        if (!this.isMobile) {
          this.sidenavOpened = true;
        }
      });
  }
}
