import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/dashboard', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    component: Login,
    title: 'Iniciar Sesión - Sistema Contable'
  },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [authGuard],
    title: 'Dashboard - Sistema Contable'
  },
  {
    path: 'users',
    loadComponent: () => import('./components/users/user-list/user-list').then(m => m.UserList),
    canActivate: [authGuard],
    title: 'Usuarios - Sistema Contable'
  },
  {
    path: 'users/new',
    loadComponent: () => import('./components/users/user-form/user-form').then(m => m.UserForm),
    canActivate: [authGuard],
    title: 'Nuevo Usuario - Sistema Contable'
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./components/users/user-form/user-form').then(m => m.UserForm),
    canActivate: [authGuard],
    title: 'Editar Usuario - Sistema Contable'
  },
  {
    path: 'services',
    loadComponent: () => import('./components/services/service-list/service-list.component').then(m => m.ServiceListComponent),
    canActivate: [authGuard],
    title: 'Servicios - Sistema Contable'
  },
  {
    path: 'services/create',
    loadComponent: () => import('./components/services/service-form/service-form.component').then(m => m.ServiceFormComponent),
    canActivate: [authGuard],
    title: 'Nuevo Servicio - Sistema Contable'
  },
  {
    path: 'services/:id',
    loadComponent: () => import('./components/services/service-detail/service-detail.component').then(m => m.ServiceDetailComponent),
    canActivate: [authGuard],
    title: 'Detalle Servicio - Sistema Contable'
  },
  {
    path: 'services/:id/edit',
    loadComponent: () => import('./components/services/service-form/service-form.component').then(m => m.ServiceFormComponent),
    canActivate: [authGuard],
    title: 'Editar Servicio - Sistema Contable'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
