export enum ServiceType {
  FORMULARIO_21 = 'formulario_21',
  DECLARACION_IVA = 'declaracion_iva',
  DECLARACION_RENTA = 'declaracion_renta',
  CONTABILIDAD_MENSUAL = 'contabilidad_mensual',
  CONSTITUCION_EMPRESA = 'constitucion_empresa',
  MODIFICACION_EMPRESA = 'modificacion_empresa',
  FINIQUITO = 'finiquito',
  CERTIFICADOS = 'certificados',
  OTRO = 'otro'
}

export enum ServiceStatus {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  ENTREGADO = 'entregado',
  VENCIDO = 'vencido',
  CANCELADO = 'cancelado'
}

export enum ServicePriority {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente'
}

export interface AccountingService {
  id: string;
  type: ServiceType;
  title: string;
  description: string;
  status: ServiceStatus;
  priority: ServicePriority;
  userId: string; // ID del usuario asignado
  userName?: string; // Nombre del usuario (denormalizado para eficiencia)
  userEmail?: string; // Email del usuario
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date; // Fecha límite
  deliveredAt?: Date; // Fecha de entrega (si está entregado)
  estimatedHours: number;
  actualHours?: number;
  notes: string;
  attachments: string[]; // URLs de archivos adjuntos
  tags: string[]; // Etiquetas personalizadas
  price?: number; // Precio del servicio
  isPaid: boolean; // Si está pagado
  isUrgent: boolean; // Si es urgente (calculado automáticamente)
  daysOverdue?: number; // Días de retraso (calculado)
}

// Interfaz para estadísticas de servicios
export interface ServiceStats {
  totalServices: number;
  pendingServices: number;
  inProgressServices: number;
  deliveredServices: number;
  overdueServices: number;
  urgentServices: number;
  thisMonthServices: number;
  completionRate: number; // Porcentaje de servicios completados
  averageCompletionTime: number; // Tiempo promedio de completación en días
  totalRevenue: number; // Ingresos totales
  pendingRevenue: number; // Ingresos pendientes
}

// Interfaz para filtros de servicios
export interface ServiceFilters {
  status?: ServiceStatus[];
  type?: ServiceType[];
  priority?: ServicePriority[];
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isOverdue?: boolean;
  isUrgent?: boolean;
  searchTerm?: string;
}

// Tipos para el dashboard
export interface ServicesByStatus {
  [key: string]: number;
}

export interface ServicesByType {
  [key: string]: number;
}

export interface ServicesByUser {
  userId: string;
  userName: string;
  totalServices: number;
  pendingServices: number;
  completedServices: number;
  overdueServices: number;
}

// Configuración de tipos de servicio
export const SERVICE_TYPE_CONFIG = {
  [ServiceType.FORMULARIO_21]: {
    label: 'Formulario 21',
    icon: 'description',
    color: '#3B82F6',
    defaultDays: 30,
    description: 'Declaración anual de impuestos'
  },
  [ServiceType.DECLARACION_IVA]: {
    label: 'Declaración IVA',
    icon: 'receipt',
    color: '#10B981',
    defaultDays: 12,
    description: 'Declaración mensual de IVA'
  },
  [ServiceType.DECLARACION_RENTA]: {
    label: 'Declaración Renta',
    icon: 'account_balance',
    color: '#F59E0B',
    defaultDays: 45,
    description: 'Declaración anual de renta'
  },
  [ServiceType.CONTABILIDAD_MENSUAL]: {
    label: 'Contabilidad Mensual',
    icon: 'trending_up',
    color: '#8B5CF6',
    defaultDays: 20,
    description: 'Servicios contables mensuales'
  },
  [ServiceType.CONSTITUCION_EMPRESA]: {
    label: 'Constitución Empresa',
    icon: 'business',
    color: '#06B6D4',
    defaultDays: 60,
    description: 'Constitución de nueva empresa'
  },
  [ServiceType.MODIFICACION_EMPRESA]: {
    label: 'Modificación Empresa',
    icon: 'edit',
    color: '#84CC16',
    defaultDays: 30,
    description: 'Modificaciones societarias'
  },
  [ServiceType.FINIQUITO]: {
    label: 'Finiquito',
    icon: 'person_off',
    color: '#EF4444',
    defaultDays: 15,
    description: 'Cálculo y tramitación de finiquitos'
  },
  [ServiceType.CERTIFICADOS]: {
    label: 'Certificados',
    icon: 'verified',
    color: '#14B8A6',
    defaultDays: 10,
    description: 'Certificados varios'
  },
  [ServiceType.OTRO]: {
    label: 'Otro',
    icon: 'help',
    color: '#6B7280',
    defaultDays: 30,
    description: 'Otros servicios'
  }
};

// Configuración de estados
export const SERVICE_STATUS_CONFIG = {
  [ServiceStatus.PENDIENTE]: {
    label: 'Pendiente',
    icon: 'schedule',
    color: '#F59E0B',
    description: 'Servicio pendiente de iniciar'
  },
  [ServiceStatus.EN_PROCESO]: {
    label: 'En Proceso',
    icon: 'sync',
    color: '#3B82F6',
    description: 'Servicio en desarrollo'
  },
  [ServiceStatus.ENTREGADO]: {
    label: 'Entregado',
    icon: 'check_circle',
    color: '#10B981',
    description: 'Servicio completado'
  },
  [ServiceStatus.VENCIDO]: {
    label: 'Vencido',
    icon: 'error',
    color: '#EF4444',
    description: 'Servicio con fecha vencida'
  },
  [ServiceStatus.CANCELADO]: {
    label: 'Cancelado',
    icon: 'cancel',
    color: '#6B7280',
    description: 'Servicio cancelado'
  }
};
