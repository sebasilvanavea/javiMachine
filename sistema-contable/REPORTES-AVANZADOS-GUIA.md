# Sistema de Reportes Avanzados - Contabilium

## ✨ Características Principales

### 📊 **Visualizaciones Interactivas**
- **Gráficos de Dona**: Distribución de servicios por estado
- **Gráficos de Barras**: Ingresos mensuales y comparativas
- **Gráficos de Líneas**: Tendencias temporales
- **Gráficos Polares**: Análisis de categorías de servicios

### 🔍 **Filtros Avanzados**
- **Filtros por Fecha**: Desde/hasta con validación automática
- **Filtros por Estado**: Pendiente, En Proceso, Completado, etc.
- **Filtros por Cliente**: Búsqueda autocompletada
- **Filtros por Tipo**: Categorización de servicios
- **Filtros por Rango de Montos**: Mínimo y máximo configurable
- **Búsqueda Global**: Texto libre en todos los campos

### 📈 **Métricas en Tiempo Real**
- **Ingresos Totales**: Con indicadores de crecimiento
- **Servicios Completados**: Porcentaje de finalización
- **Calificación Promedio**: Rating de satisfacción
- **Tiempo Promedio**: Duración de servicios
- **Servicios Pendientes**: Alertas de vencimiento

### 📄 **Exportación Múltiple**
- **PDF Profesional**: Con gráficos e imágenes
- **Excel Avanzado**: Múltiples hojas con formato
- **CSV Simple**: Para análisis externos

### 🎨 **Vistas Personalizables**
- **Vista de Tarjetas**: Visualización rica con detalles
- **Vista de Tabla**: Datos tabulares optimizados
- **Vista de Gráficos**: Análisis visual completo

## 🚀 Acceso Rápido

### Desde el Dashboard
1. Click en el botón **"Reportes"** en el header principal
2. Acceso directo desde el panel de control

### URL Directa
```
http://localhost:4200/reports
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Angular 18+**: Framework principal
- **Angular Material**: Componentes UI
- **Chart.js**: Visualizaciones interactivas
- **SCSS**: Estilos avanzados con variables

### Librerías de Exportación
- **jsPDF**: Generación de documentos PDF
- **jsPDF-AutoTable**: Tablas profesionales en PDF
- **XLSX**: Generación de archivos Excel
- **FileSaver**: Descarga de archivos

### Características Técnicas
- **Reactive Forms**: Formularios reactivos
- **RxJS**: Programación reactiva
- **Lazy Loading**: Carga bajo demanda
- **TypeScript**: Tipado fuerte

## 📋 Funcionalidades Detalladas

### Panel de Filtros
```typescript
interface ReportFilter {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string[];
  serviceType?: string[];
  clientSearch?: string;
  amountMin?: number;
  amountMax?: number;
  searchText?: string;
}
```

### Métricas Disponibles
- **Ingresos del Período**: Total de facturación
- **Número de Servicios**: Conteo total y por estado
- **Tiempo Promedio**: Duración de servicios
- **Calificación**: Rating promedio de clientes
- **Porcentaje de Completitud**: Servicios finalizados vs total

### Tipos de Gráficos
1. **Distribución por Estado** (Dona)
2. **Ingresos Mensuales** (Barras)
3. **Tendencia de Servicios** (Líneas)
4. **Categorías de Servicios** (Polar)

## 🎯 Casos de Uso

### Para Administradores
- Análisis de rendimiento mensual
- Identificación de servicios más rentables
- Control de servicios vencidos
- Generación de reportes ejecutivos

### Para Contadores
- Exportación para declaraciones
- Análisis de ingresos por período
- Control de servicios completados
- Reportes de clientes específicos

### Para Gerencia
- Dashboard ejecutivo con KPIs
- Tendencias de crecimiento
- Análisis de satisfacción
- Reportes de productividad

## 📱 Diseño Responsivo

### Desktop (1200px+)
- Vista completa con múltiples columnas
- Gráficos side-by-side
- Filtros expandidos

### Tablet (768px - 1199px)
- Vista adaptativa de 2 columnas
- Gráficos apilados
- Navegación optimizada

### Mobile (< 768px)
- Vista de columna única
- Filtros colapsables
- Navegación por pestañas

## 🔧 Configuración Técnica

### Dependencias Principales
```json
{
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.5.31",
  "xlsx": "^0.18.5",
  "file-saver": "^2.0.5",
  "chart.js": "^4.4.0"
}
```

### Importaciones en main.ts
```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
} from 'chart.js';
```

## 📊 Estructura de Datos

### ReportData Interface
```typescript
interface ReportData {
  id: string;
  clientName: string;
  serviceTitle: string;
  serviceType: string;
  status: 'pendiente' | 'en-proceso' | 'completado' | 'cancelado' | 'pausado';
  amount: number;
  startDate: Date;
  dueDate: Date;
  completedDate?: Date;
  progress: number;
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  rating?: number;
  estimatedHours: number;
  actualHours?: number;
  assignedTo: string;
  category: string;
}
```

## 🎨 Temas y Personalización

### Variables SCSS
```scss
$primary-color: #3B82F6;
$secondary-color: #1E40AF;
$success-color: #10B981;
$warning-color: #F59E0B;
$error-color: #EF4444;
```

### Efectos Visuales
- **Glass Effect**: Transparencias con blur
- **Card Shadows**: Sombras suaves multicapa
- **Hover Effects**: Animaciones de interacción
- **Gradient Backgrounds**: Fondos degradados

## 🚀 Rendimiento

### Optimizaciones Implementadas
- **Lazy Loading**: Carga bajo demanda
- **OnPush Strategy**: Detección de cambios optimizada
- **Debounced Search**: Búsqueda con retraso
- **Virtual Scrolling**: Para listas largas
- **Chart.js Tree Shaking**: Solo componentes usados

### Métricas de Bundle
- **Main Bundle**: ~193 KB
- **Reports Bundle**: ~177 KB (lazy)
- **Styles**: ~136 KB
- **Total Inicial**: ~379 KB

## 📞 Soporte

Para dudas o mejoras del sistema de reportes:
1. Revisar la documentación en el código
2. Consultar los ejemplos de uso
3. Verificar la consola de errores
4. Revisar los logs del servidor

---

> **Desarrollado con ❤️ para Contabilium**  
> Sistema contable moderno y eficiente
