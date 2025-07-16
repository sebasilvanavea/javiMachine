export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  rut: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  company?: string;
  profession: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  photoUrl?: string;
  services: Service[];
}

export interface Service {
  id: string;
  userId: string;
  type: ServiceType;
  description: string;
  amount: number;
  status: ServiceStatus;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  formData?: Form21Data;
  documents: Document[];
}

export enum ServiceType {
  FORM_21 = 'FORM_21',
  TAX_DECLARATION = 'TAX_DECLARATION',
  ACCOUNTING = 'ACCOUNTING',
  PAYROLL = 'PAYROLL',
  CONSULTING = 'CONSULTING',
  OTHER = 'OTHER'
}

export enum ServiceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: Date;
}

export interface Form21Data {
  id: string;
  serviceId: string;
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  tax: number;
  details: Form21Detail[];
  submittedAt?: Date;
}

export interface Form21Detail {
  concept: string;
  amount: number;
  category: 'INCOME' | 'EXPENSE';
  date: Date;
}

export interface DashboardStats {
  totalUsers: number;
  totalServices: number;
  pendingServices: number;
  overdueServices: number;
  monthlyRevenue: number;
  completedServicesThisMonth: number;
  userGrowthPercentage: number;
  revenueGrowthPercentage: number;
  serviceGrowthPercentage: number;
  revenueThisMonth: number;
  servicesByStatus: {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  servicesByType: {
    type: ServiceType;
    count: number;
  }[];
  revenueByMonth: SimpleChartData[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

export interface SimpleChartData {
  label: string;
  value: number;
}
