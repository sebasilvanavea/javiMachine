// Script para generar datos dummy masivos para el sistema contable
// Ejecutar en la consola de Firebase o como función Cloud Function

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  writeBatch, 
  doc 
} from 'firebase/firestore';

// Configuración de Firebase (reemplaza con tu config)
const firebaseConfig = {
  // Tu configuración de Firebase aquí
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === DATOS BASE PARA GENERAR INFORMACIÓN REALISTA ===

const nombres = [
  'Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Diego', 'Carmen', 'Luis', 'Elena',
  'Miguel', 'Isabel', 'José', 'Patricia', 'Francisco', 'Rosa', 'Antonio', 'Marta', 'Manuel', 'Pilar',
  'Fernando', 'Mercedes', 'Alberto', 'Dolores', 'Rafael', 'Antonia', 'Javier', 'Francisca', 'Ramón', 'Teresa',
  'Enrique', 'Josefa', 'Gonzalo', 'Esperanza', 'Arturo', 'Gloria', 'Ricardo', 'Amparo', 'Sergio', 'Rocío',
  'Roberto', 'Montserrat', 'Alejandro', 'Inmaculada', 'Andrés', 'Concepción', 'Tomás', 'Remedios', 'Rubén', 'Cristina'
];

const apellidos = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
  'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez',
  'Molina', 'Morales', 'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias',
  'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano', 'Prieto', 'Méndez'
];

const ciudades = [
  'Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua',
  'Talca', 'Arica', 'Chillán', 'Iquique', 'Los Ángeles', 'Puerto Montt', 'Calama', 'Copiapó', 'Osorno',
  'Quillota', 'Valdivia', 'Punta Arenas', 'Coquimbo', 'Ovalle', 'Curicó', 'Linares', 'San Antonio'
];

const regiones = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso',
  'Metropolitana', 'O\'Higgins', 'Maule', 'Ñuble', 'Biobío', 'La Araucanía',
  'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
];

const profesiones = [
  'Contador', 'Ingeniero Civil', 'Médico', 'Abogado', 'Arquitecto', 'Profesor', 'Empresario', 'Comerciante',
  'Ingeniero Industrial', 'Psicólogo', 'Dentista', 'Veterinario', 'Periodista', 'Diseñador', 'Programador',
  'Enfermero', 'Farmacéutico', 'Fisioterapeuta', 'Chef', 'Electricista', 'Mecánico', 'Plomero',
  'Administrador', 'Vendedor', 'Secretario', 'Conductor', 'Guardia', 'Cajero', 'Recepcionista', 'Conserje'
];

const empresas = [
  'Falabella', 'Cencosud', 'LAN', 'Codelco', 'BancoChile', 'Santander', 'Entel', 'Movistar',
  'CCU', 'CMPC', 'Copec', 'Ripley', 'Paris', 'La Polar', 'Sodimac', 'Easy', 'Lider', 'Jumbo',
  'Santa Isabel', 'Unimarc', 'Tottus', 'Plaza Vea', 'Metro', 'Cruz Verde', 'Salcobrand', 'FASA',
  'Clínica Las Condes', 'Hospital Alemán', 'Universidad de Chile', 'PUC', 'USACH', 'UAI', 'UDP'
];

const tiposServicio = [
  'declaracion-renta', 'contabilidad-general', 'auditoria', 'consultoria-tributaria',
  'formacion-empresa', 'liquidacion-sueldos', 'finiquitos', 'contratos-trabajo',
  'facturacion-electronica', 'libros-contables', 'balances', 'flujo-efectivo',
  'presupuestos', 'analisis-financiero', 'planificacion-tributaria', 'sociedades'
];

const estadosServicio = ['pendiente', 'en-proceso', 'completado', 'cancelado', 'pausado'];
const prioridades = ['baja', 'media', 'alta', 'urgente'];

// === FUNCIONES HELPER ===

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateRUT() {
  const number = randomNumber(10000000, 25000000);
  const verificador = calculateRUTVerifier(number);
  return `${number}-${verificador}`;
}

function calculateRUTVerifier(rut) {
  let suma = 0;
  let multiplicador = 2;
  
  while (rut !== 0) {
    suma += (rut % 10) * multiplicador;
    rut = Math.floor(rut / 10);
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  if (resto === 0) return '0';
  if (resto === 1) return 'k';
  return String(11 - resto);
}

function generateEmail(nombre, apellido) {
  const dominios = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'empresa.cl'];
  const nombre_clean = nombre.toLowerCase().replace(/\s+/g, '');
  const apellido_clean = apellido.toLowerCase().replace(/\s+/g, '');
  const numero = randomNumber(1, 999);
  
  return `${nombre_clean}.${apellido_clean}${numero}@${randomElement(dominios)}`;
}

function generatePhone() {
  const prefijos = ['+56 9', '+56 2', '+56 3', '+56 4', '+56 5'];
  const numero = randomNumber(10000000, 99999999);
  return `${randomElement(prefijos)} ${numero}`;
}

// === FUNCIONES DE GENERACIÓN ===

async function generateUsers(cantidad = 1000) {
  console.log(`Generando ${cantidad} usuarios...`);
  
  const batch = writeBatch(db);
  const usuarios = [];
  
  for (let i = 0; i < cantidad; i++) {
    const nombre = randomElement(nombres);
    const apellido = `${randomElement(apellidos)} ${randomElement(apellidos)}`;
    const ciudad = randomElement(ciudades);
    const region = randomElement(regiones);
    
    const usuario = {
      // Información Personal
      name: nombre,
      lastName: apellido,
      rut: generateRUT(),
      email: generateEmail(nombre, apellido),
      phone: generatePhone(),
      birthDate: randomDate(new Date(1960, 0, 1), new Date(2000, 11, 31)),
      
      // Ubicación
      address: `${randomElement(['Av.', 'Calle', 'Pasaje'])} ${randomElement(['Los Leones', 'Providencia', 'Las Condes', 'Maipú', 'Santiago'])} ${randomNumber(100, 9999)}`,
      city: ciudad,
      region: region,
      commune: ciudad,
      postalCode: randomNumber(1000000, 9999999).toString(),
      
      // Información Profesional
      profession: randomElement(profesiones),
      company: randomElement(empresas),
      position: randomElement(['Gerente', 'Supervisor', 'Analista', 'Ejecutivo', 'Asistente', 'Jefe', 'Coordinador']),
      experience: randomNumber(0, 30),
      description: `Profesional con experiencia en ${randomElement(profesiones).toLowerCase()}`,
      
      // Configuraciones
      isActive: Math.random() > 0.1, // 90% activos
      receiveNotifications: Math.random() > 0.3, // 70% reciben notificaciones
      allowDataSharing: Math.random() > 0.5, // 50% permiten compartir datos
      
      // Metadatos
      createdAt: randomDate(new Date(2020, 0, 1), new Date()),
      updatedAt: new Date(),
      createdBy: 'system-generator',
      
      // Servicios relacionados
      totalServices: randomNumber(0, 50),
      activeServices: randomNumber(0, 10),
      completedServices: randomNumber(0, 40),
      
      // Información financiera
      monthlyIncome: randomNumber(500000, 5000000),
      hasForm21: Math.random() > 0.3,
      lastLogin: randomDate(new Date(2024, 0, 1), new Date()),
      
      // Tags y categorías
      tags: [
        randomElement(['cliente-premium', 'cliente-regular', 'cliente-nuevo']),
        randomElement(['activo', 'inactivo', 'potencial']),
        randomElement(profesiones).toLowerCase().replace(/\s+/g, '-')
      ].filter(Boolean)
    };
    
    usuarios.push(usuario);
    
    // Usar batch para optimizar escritura
    const userRef = doc(collection(db, 'users'));
    batch.set(userRef, usuario);
    
    // Escribir en lotes de 500 para evitar límites de Firestore
    if ((i + 1) % 500 === 0) {
      await batch.commit();
      console.log(`Creados ${i + 1} usuarios...`);
      // Crear nuevo batch
      const newBatch = writeBatch(db);
    }
  }
  
  // Escribir los usuarios restantes
  if (usuarios.length % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ ${cantidad} usuarios creados exitosamente`);
  return usuarios;
}

async function generateServices(cantidad = 2000, usuarios = []) {
  console.log(`Generando ${cantidad} servicios...`);
  
  const batch = writeBatch(db);
  const servicios = [];
  
  for (let i = 0; i < cantidad; i++) {
    const tipoServicio = randomElement(tiposServicio);
    const estado = randomElement(estadosServicio);
    const prioridad = randomElement(prioridades);
    const fechaCreacion = randomDate(new Date(2020, 0, 1), new Date());
    const fechaVencimiento = new Date(fechaCreacion.getTime() + randomNumber(1, 90) * 24 * 60 * 60 * 1000);
    
    const servicio = {
      // Información básica
      title: `${tipoServicio.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${randomNumber(1000, 9999)}`,
      description: `Servicio de ${tipoServicio.replace(/-/g, ' ')} para cliente empresarial o persona natural`,
      type: tipoServicio,
      status: estado,
      priority: prioridad,
      
      // Usuario asignado
      userId: usuarios.length > 0 ? usuarios[randomNumber(0, usuarios.length - 1)].id : `user_${randomNumber(1000, 9999)}`,
      
      // Fechas
      createdAt: fechaCreacion,
      updatedAt: randomDate(fechaCreacion, new Date()),
      dueDate: fechaVencimiento,
      completedAt: estado === 'completado' ? randomDate(fechaCreacion, fechaVencimiento) : null,
      
      // Información financiera
      estimatedAmount: randomNumber(50000, 2000000),
      actualAmount: estado === 'completado' ? randomNumber(50000, 2000000) : null,
      isPaid: estado === 'completado' ? Math.random() > 0.2 : false, // 80% pagados si completados
      
      // Progreso
      progress: estado === 'completado' ? 100 : 
                estado === 'en-proceso' ? randomNumber(10, 90) : 
                estado === 'pendiente' ? randomNumber(0, 30) : 0,
      
      // Archivos y documentos
      attachments: randomNumber(0, 5),
      hasForm21: tipoServicio === 'declaracion-renta',
      
      // Metadatos
      createdBy: 'system-generator',
      assignedTo: `employee_${randomNumber(1, 20)}`,
      category: randomElement(['tributario', 'contable', 'laboral', 'societario', 'consultoria']),
      
      // Observaciones
      notes: [
        'Servicio generado automáticamente para pruebas',
        `Cliente ${randomElement(['corporativo', 'individual', 'PYME'])}`,
        `Prioridad ${prioridad} asignada`
      ],
      
      // Tags
      tags: [
        tipoServicio,
        estado,
        prioridad,
        randomElement(['Q1', 'Q2', 'Q3', 'Q4']),
        randomElement(['2023', '2024', '2025'])
      ],
      
      // Configuraciones
      isArchived: estado === 'cancelado' && Math.random() > 0.5,
      requiresApproval: prioridad === 'urgente' || prioridad === 'alta',
      isRecurring: Math.random() > 0.7, // 30% servicios recurrentes
      
      // Tiempo estimado vs real
      estimatedHours: randomNumber(2, 40),
      actualHours: estado === 'completado' ? randomNumber(1, 50) : null,
      
      // Rating y feedback
      clientRating: estado === 'completado' ? randomNumber(3, 5) : null,
      clientFeedback: estado === 'completado' && Math.random() > 0.6 ? 
        randomElement([
          'Excelente servicio, muy profesional',
          'Cumplió con los plazos establecidos',
          'Buena comunicación durante el proceso',
          'Servicio de calidad, recomendado',
          'Profesional y eficiente'
        ]) : null
    };
    
    servicios.push(servicio);
    
    const serviceRef = doc(collection(db, 'services'));
    batch.set(serviceRef, servicio);
    
    if ((i + 1) % 500 === 0) {
      await batch.commit();
      console.log(`Creados ${i + 1} servicios...`);
    }
  }
  
  if (servicios.length % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ ${cantidad} servicios creados exitosamente`);
  return servicios;
}

async function generateForm21Records(cantidad = 500, usuarios = []) {
  console.log(`Generando ${cantidad} registros de Formulario 21...`);
  
  const batch = writeBatch(db);
  
  for (let i = 0; i < cantidad; i++) {
    const añoTributario = randomElement([2021, 2022, 2023, 2024]);
    const fechaCreacion = randomDate(
      new Date(añoTributario + 1, 2, 1), // Marzo del año siguiente
      new Date(añoTributario + 1, 3, 30) // Abril del año siguiente
    );
    
    const ingresosDependiente = randomNumber(6000000, 25000000);
    const ingresosIndependiente = Math.random() > 0.6 ? randomNumber(0, 15000000) : 0;
    const otrosIngresos = Math.random() > 0.8 ? randomNumber(0, 5000000) : 0;
    const totalIngresos = ingresosDependiente + ingresosIndependiente + otrosIngresos;
    
    const deduccionesPersonales = randomNumber(500000, 3000000);
    const cotizacionesPrevisionales = Math.floor(totalIngresos * 0.13); // Aproximado 13%
    const totalDeducciones = deduccionesPersonales + cotizacionesPrevisionales;
    
    const baseImponible = Math.max(0, totalIngresos - totalDeducciones);
    const impuestoCalculado = calculateImpuestoRenta(baseImponible);
    const retenciones = Math.floor(ingresosDependiente * 0.1); // Aproximado 10%
    const impuestoFinal = impuestoCalculado - retenciones;
    
    const form21 = {
      // Información del contribuyente
      userId: usuarios.length > 0 ? usuarios[randomNumber(0, usuarios.length - 1)].id : `user_${randomNumber(1000, 9999)}`,
      taxYear: añoTributario,
      
      // Datos personales (algunos copiados del usuario)
      rut: generateRUT(),
      nombres: randomElement(nombres),
      apellidoPaterno: randomElement(apellidos),
      apellidoMaterno: randomElement(apellidos),
      email: generateEmail(randomElement(nombres), randomElement(apellidos)),
      telefono: generatePhone(),
      direccion: `${randomElement(['Av.', 'Calle'])} ${randomElement(['Providencia', 'Las Condes', 'Maipú'])} ${randomNumber(100, 9999)}`,
      ciudad: randomElement(ciudades),
      region: randomElement(regiones),
      actividadEconomica: randomElement(['dependiente', 'independiente', 'empresario', 'pensionado']),
      estadoCivil: randomElement(['soltero', 'casado', 'viudo', 'divorciado']),
      
      // Ingresos
      tieneIngresosDependiente: ingresosDependiente > 0,
      sueldoBase: ingresosDependiente * 0.8,
      horasExtras: ingresosDependiente * 0.1,
      bonos: ingresosDependiente * 0.08,
      aguinaldo: ingresosDependiente * 0.02,
      totalIngresosDependiente: ingresosDependiente,
      
      tieneIngresosIndependiente: ingresosIndependiente > 0,
      honorarios: ingresosIndependiente * 0.9,
      retencionHonorarios: ingresosIndependiente * 0.1,
      otrosIndependiente: ingresosIndependiente * 0.1,
      totalIngresosIndependiente: ingresosIndependiente,
      
      tieneOtrosIngresos: otrosIngresos > 0,
      pensiones: otrosIngresos * 0.4,
      arriendos: otrosIngresos * 0.3,
      dividendos: otrosIngresos * 0.2,
      intereses: otrosIngresos * 0.1,
      totalOtrosIngresos: otrosIngresos,
      
      totalIngresosBrutos: totalIngresos,
      
      // Deducciones
      gastosMedicos: deduccionesPersonales * 0.3,
      gastosEducacionales: deduccionesPersonales * 0.2,
      donaciones: deduccionesPersonales * 0.1,
      interesesHipotecario: deduccionesPersonales * 0.4,
      totalDeduccionesPersonales: deduccionesPersonales,
      
      cotizacionAFP: cotizacionesPrevisionales * 0.7,
      cotizacionSalud: cotizacionesPrevisionales * 0.2,
      seguroCesantia: cotizacionesPrevisionales * 0.05,
      apv: cotizacionesPrevisionales * 0.05,
      totalCotizacionesPrevisionales: cotizacionesPrevisionales,
      
      totalDeducciones: totalDeducciones,
      
      // Cálculos
      baseImponible: baseImponible,
      impuestoEscala: impuestoCalculado,
      creditoHijo: randomNumber(0, 500000), // Variable según número de hijos
      totalRetenciones: retenciones,
      ppmPagados: randomNumber(0, 1000000),
      impuestoFinal: impuestoFinal,
      
      // Estado del formulario
      status: randomElement(['borrador', 'enviado', 'procesado', 'aprobado', 'rechazado']),
      
      // Fechas
      createdAt: fechaCreacion,
      updatedAt: randomDate(fechaCreacion, new Date()),
      submittedAt: randomElement(['enviado', 'procesado', 'aprobado']).includes(
        randomElement(['borrador', 'enviado', 'procesado', 'aprobado', 'rechazado'])
      ) ? randomDate(fechaCreacion, new Date()) : null,
      
      // Metadatos
      createdBy: 'system-generator',
      version: '1.0',
      attachments: randomNumber(2, 8),
      
      // Validaciones
      hasErrors: Math.random() > 0.85, // 15% con errores
      isValidated: Math.random() > 0.2, // 80% validados
      requiresReview: impuestoFinal > 1000000 || Math.random() > 0.7,
      
      // Observaciones
      observations: Math.random() > 0.7 ? [
        'Formulario generado automáticamente',
        'Revisar documentación adjunta',
        'Verificar datos de ingresos'
      ] : []
    };
    
    const form21Ref = doc(collection(db, 'form21'));
    batch.set(form21Ref, form21);
    
    if ((i + 1) % 500 === 0) {
      await batch.commit();
      console.log(`Creados ${i + 1} formularios 21...`);
    }
  }
  
  if (cantidad % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ ${cantidad} formularios 21 creados exitosamente`);
}

// Función para calcular impuesto a la renta (simplificada)
function calculateImpuestoRenta(baseImponible) {
  // Escala simplificada de impuestos (valores aproximados 2024)
  if (baseImponible <= 8500000) return 0;
  if (baseImponible <= 23500000) return (baseImponible - 8500000) * 0.04;
  if (baseImponible <= 39000000) return 600000 + (baseImponible - 23500000) * 0.08;
  if (baseImponible <= 54500000) return 1840000 + (baseImponible - 39000000) * 0.135;
  if (baseImponible <= 70000000) return 3932500 + (baseImponible - 54500000) * 0.23;
  if (baseImponible <= 93500000) return 7497500 + (baseImponible - 70000000) * 0.304;
  return 14649000 + (baseImponible - 93500000) * 0.35;
}

async function generateNotifications(cantidad = 1000, usuarios = []) {
  console.log(`Generando ${cantidad} notificaciones...`);
  
  const batch = writeBatch(db);
  const tiposNotificacion = [
    'service-created', 'service-updated', 'service-completed',
    'form21-submitted', 'form21-approved', 'form21-rejected',
    'payment-received', 'payment-overdue', 'document-uploaded',
    'meeting-scheduled', 'deadline-reminder', 'system-update'
  ];
  
  const mensajes = {
    'service-created': 'Se ha creado un nuevo servicio',
    'service-updated': 'Se ha actualizado un servicio',
    'service-completed': 'Se ha completado un servicio',
    'form21-submitted': 'Se ha enviado el Formulario 21',
    'form21-approved': 'El Formulario 21 ha sido aprobado',
    'form21-rejected': 'El Formulario 21 ha sido rechazado',
    'payment-received': 'Se ha recibido un pago',
    'payment-overdue': 'Tienes un pago vencido',
    'document-uploaded': 'Se ha subido un nuevo documento',
    'meeting-scheduled': 'Se ha programado una reunión',
    'deadline-reminder': 'Recordatorio de fecha límite',
    'system-update': 'Actualización del sistema'
  };
  
  for (let i = 0; i < cantidad; i++) {
    const tipo = randomElement(tiposNotificacion);
    const fechaCreacion = randomDate(new Date(2024, 0, 1), new Date());
    
    const notification = {
      userId: usuarios.length > 0 ? usuarios[randomNumber(0, usuarios.length - 1)].id : `user_${randomNumber(1000, 9999)}`,
      type: tipo,
      title: mensajes[tipo],
      message: `${mensajes[tipo]} - Detalles adicionales del sistema`,
      read: Math.random() > 0.4, // 60% leídas
      priority: randomElement(['low', 'medium', 'high']),
      category: randomElement(['system', 'service', 'payment', 'document']),
      
      // Metadatos
      createdAt: fechaCreacion,
      readAt: Math.random() > 0.4 ? randomDate(fechaCreacion, new Date()) : null,
      
      // Datos adicionales
      relatedId: `${tipo}_${randomNumber(1000, 9999)}`,
      actionUrl: `/${tipo.split('-')[0]}s/${randomNumber(1000, 9999)}`,
      
      // Configuración
      emailSent: Math.random() > 0.3, // 70% enviadas por email
      pushSent: Math.random() > 0.5, // 50% enviadas como push
      
      // Expiración
      expiresAt: tipo.includes('reminder') ? 
        new Date(fechaCreacion.getTime() + 7 * 24 * 60 * 60 * 1000) : null
    };
    
    const notificationRef = doc(collection(db, 'notifications'));
    batch.set(notificationRef, notification);
    
    if ((i + 1) % 500 === 0) {
      await batch.commit();
      console.log(`Creadas ${i + 1} notificaciones...`);
    }
  }
  
  if (cantidad % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ ${cantidad} notificaciones creadas exitosamente`);
}

// === FUNCIÓN PRINCIPAL ===
export async function generateMassiveData() {
  console.log('🚀 Iniciando generación de datos masivos...');
  
  try {
    // 1. Generar usuarios
    const usuarios = await generateUsers(1000);
    
    // 2. Generar servicios
    await generateServices(2000, usuarios);
    
    // 3. Generar formularios 21
    await generateForm21Records(500, usuarios);
    
    // 4. Generar notificaciones
    await generateNotifications(1000, usuarios);
    
    console.log('✅ Generación de datos masivos completada exitosamente!');
    console.log('📊 Resumen:');
    console.log('- 1000 usuarios');
    console.log('- 2000 servicios');
    console.log('- 500 formularios 21');
    console.log('- 1000 notificaciones');
    console.log('Total: 4500 registros creados');
    
  } catch (error) {
    console.error('❌ Error generando datos:', error);
    throw error;
  }
}

// === FUNCIONES DE UTILIDAD ADICIONALES ===

// Generar datos específicos por rango de fechas
export async function generateDataByDateRange(startDate, endDate, multiplier = 1) {
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const usersPerDay = Math.ceil(5 * multiplier);
  const servicesPerDay = Math.ceil(10 * multiplier);
  
  console.log(`Generando datos para ${daysDiff} días...`);
  
  for (let i = 0; i < daysDiff; i += 7) { // Por semanas
    const weekStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(Math.min(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000, endDate.getTime()));
    
    await generateUsers(usersPerDay * 7);
    await generateServices(servicesPerDay * 7);
    
    console.log(`Semana ${Math.ceil(i/7) + 1} completada`);
  }
}

// Limpiar datos de prueba
export async function clearTestData() {
  console.log('🧹 Limpiando datos de prueba...');
  
  const collections = ['users', 'services', 'form21', 'notifications'];
  
  for (const collectionName of collections) {
    const querySnapshot = await getDocs(
      query(
        collection(db, collectionName),
        where('createdBy', '==', 'system-generator')
      )
    );
    
    const batch = writeBatch(db);
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ Limpiados ${querySnapshot.size} registros de ${collectionName}`);
  }
  
  console.log('✅ Limpieza completada');
}

// Ejecutar la función principal
// generateMassiveData().catch(console.error);
