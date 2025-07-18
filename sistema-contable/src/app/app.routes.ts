import { Routes } from '@angular/router';
import { Login } from './components/auth/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { authGuard } from './guards/auth.guard';
import { noAuthGuard } from './guards/no-auth.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/dashboard', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    component: Login,
    canActivate: [noAuthGuard],
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
    path: 'form21',
    loadComponent: () => import('./components/form21/form21.component').then(m => m.Form21Component),
    canActivate: [authGuard],
    title: 'Formulario 21 - Sistema Contable'
  },
  {
    path: 'reports',
    loadComponent: () => import('./components/reports/advanced-reports.component').then(m => m.AdvancedReportsComponent),
    canActivate: [authGuard],
    title: 'Reportes Avanzados - Sistema Contable'
  },
  {
    path: 'nomina',
    loadComponent: () => import('./components/nomina/nomina.component').then(m => m.NominaComponent),
    canActivate: [authGuard],
    title: 'Nómina - Sistema Contable'
  },
  {
    path: 'contabilidad',
    loadComponent: () => import('./components/contabilidad/contabilidad.component').then(m => m.ContabilidadComponent),
    canActivate: [authGuard],
    title: 'Contabilidad - Sistema Contable'
  },
  {
    path: 'documentos',
    loadComponent: () => import('./components/documentos/documentos.component').then(m => m.DocumentosComponent),
    canActivate: [authGuard],
    title: 'Documentos - Sistema Contable'
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./components/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
    canActivate: [authGuard],
    title: 'Configuración - Sistema Contable'
  },
  {
    path: 'auditoria',
    loadComponent: () => import('./components/auditoria/auditoria.component').then(m => m.AuditoriaComponent),
    canActivate: [authGuard],
    title: 'Auditoría - Sistema Contable'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
