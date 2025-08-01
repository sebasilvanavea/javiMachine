import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app-fixed';

// Polyfill para buffer (necesario para docx)
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;

// Registro de Chart.js para reportes avanzados
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

ChartJS.register(
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
);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
