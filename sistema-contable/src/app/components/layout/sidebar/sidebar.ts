import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../../services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    MatBadgeModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$ = this.authService.currentUser$;
  isCollapsed = false;
  isMobileOpen = false;
  activeRoute = '';
  expandedMenus: Set<string> = new Set();
  isMobile = false;

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Usuarios',
      icon: 'group',
      route: '/users'
    },
    {
      label: 'Servicios',
      icon: 'work_outline',
      route: '/services'
    },
    {
      label: 'Formulario 21',
      icon: 'description',
      route: '/form21'
    },
    {
      label: 'Reportes',
      icon: 'assessment',
      route: '/reports',
      children: [
        {
          label: 'Reportes Básicos',
          icon: 'bar_chart',
          route: '/reports/basic'
        },
        {
          label: 'Reportes Avanzados',
          icon: 'analytics',
          route: '/reports/advanced'
        }
      ]
    }
  ];

  ngOnInit(): void {
    // Escuchar cambios de ruta para marcar el elemento activo
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.activeRoute = event.url;
        this.autoExpandActiveMenu();
      });

    // Establecer ruta inicial
    this.activeRoute = this.router.url;
    this.autoExpandActiveMenu();
    
    this.checkIfMobile();
    window.addEventListener('resize', () => this.checkIfMobile());
  }

  private checkIfMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isMobileOpen = false;
    }
  }

  private autoExpandActiveMenu(): void {
    this.menuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => 
          this.activeRoute === child.route || this.activeRoute.startsWith(child.route + '/')
        );
        if (hasActiveChild) {
          this.expandedMenus.add(item.route);
        }
      }
    });
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.isMobileOpen = !this.isMobileOpen;
    } else {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  closeMobileSidebar(): void {
    if (this.isMobile) {
      this.isMobileOpen = false;
    }
  }

  toggleSubmenu(route: string): void {
    if (this.expandedMenus.has(route)) {
      this.expandedMenus.delete(route);
    } else {
      this.expandedMenus.add(route);
    }
  }

  isSubmenuExpanded(route: string): boolean {
    return this.expandedMenus.has(route);
  }

  isRouteActive(route: string): boolean {
    return this.activeRoute === route || this.activeRoute.startsWith(route + '/');
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    if (this.isMobile) {
      this.isMobileOpen = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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
}
