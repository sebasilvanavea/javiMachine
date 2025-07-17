const admin = require('firebase-admin');
require('dotenv').config();

// === CONFIGURACIÓN DE FIREBASE ADMIN ===
// Reemplaza con tu configuración real
const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_PROJECT_ID || "tu-proyecto-id",
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
};

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

const db = admin.firestore();

// === CONFIGURACIÓN ===
const BATCH_SIZE = 500;
const DELAY_BETWEEN_BATCHES = 1000;

// === DATOS BASE ===
const nombres = [
  'Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Diego', 'Carmen', 'Luis', 'Elena',
  'Miguel', 'Isabel', 'José', 'Patricia', 'Francisco', 'Rosa', 'Antonio', 'Marta', 'Manuel', 'Pilar',
  'Fernando', 'Mercedes', 'Alberto', 'Dolores', 'Rafael', 'Antonia', 'Javier', 'Francisca', 'Ramón', 'Teresa'
];

const apellidos = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
  'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez'
];

const ciudades = [
  'Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua',
  'Talca', 'Arica', 'Chillán', 'Iquique', 'Los Ángeles', 'Puerto Montt', 'Calama', 'Copiapó'
];

const regiones = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso',
  'Metropolitana', 'O\'Higgins', 'Maule', 'Ñuble', 'Biobío', 'La Araucanía'
];

const profesiones = [
  'Contador', 'Ingeniero Civil', 'Médico', 'Abogado', 'Arquitecto', 'Profesor', 'Empresario', 'Comerciante',
  'Ingeniero Industrial', 'Psicólogo', 'Dentista', 'Veterinario', 'Periodista', 'Diseñador'
];

// === FUNCIONES HELPER ===
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateRUT = () => {
  const num = random(10000000, 25000000);
  const dv = calculateDV(num);
  return `${num}-${dv}`;
};

const calculateDV = (rut) => {
  let suma = 0, multiplicador = 2;
  while (rut !== 0) {
    suma += (rut % 10) * multiplicador;
    rut = Math.floor(rut / 10);
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = suma % 11;
  return resto === 0 ? '0' : resto === 1 ? 'k' : String(11 - resto);
};

const generateEmail = (nombre, apellido) => {
  const dominios = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'empresa.cl'];
  return `${nombre.toLowerCase()}.${apellido.toLowerCase()}${random(1, 999)}@${randomElement(dominios)}`;
};

// === BARRA DE PROGRESO ===
const createProgressBar = (total, prefix = 'Progreso') => {
  let current = 0;
  return {
    update: (value) => {
      current = value;
      const percentage = Math.round((current / total) * 100);
      const barLength = 30;
      const filledLength = Math.round((percentage / 100) * barLength);
      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
      
      process.stdout.write(`\r${prefix}: [${bar}] ${percentage}% (${current}/${total})`);
      if (current === total) console.log('');
    }
  };
};

// === GENERADORES ===
async function generateUsers(cantidad = 1000) {
  console.log(`\n🚀 Generando ${cantidad} usuarios...`);
  const progress = createProgressBar(cantidad, 'Usuarios');
  
  const totalBatches = Math.ceil(cantidad / BATCH_SIZE);
  let created = 0;
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batch = db.batch();
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, cantidad);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const nombre = randomElement(nombres);
      const apellido = randomElement(apellidos);
      const ciudad = randomElement(ciudades);
      
      const userData = {
        // Información personal
        name: nombre,
        lastName: apellido,
        rut: generateRUT(),
        email: generateEmail(nombre, apellido),
        phone: `+56 9 ${random(10000000, 99999999)}`,
        birthDate: admin.firestore.Timestamp.fromDate(randomDate(new Date(1960, 0, 1), new Date(2000, 11, 31))),
        
        // Ubicación
        address: `${randomElement(['Av.', 'Calle', 'Pasaje'])} ${randomElement(['Los Leones', 'Providencia', 'Las Condes'])} ${random(100, 9999)}`,
        city: ciudad,
        region: randomElement(regiones),
        commune: ciudad,
        postalCode: random(1000000, 9999999).toString(),
        
        // Información profesional
        profession: randomElement(profesiones),
        company: `Empresa ${random(1, 100)} Ltda.`,
        position: randomElement(['Gerente', 'Supervisor', 'Analista', 'Ejecutivo', 'Asistente']),
        experience: random(0, 30),
        description: `Profesional con experiencia en ${randomElement(profesiones).toLowerCase()}`,
        
        // Configuraciones
        isActive: Math.random() > 0.1,
        receiveNotifications: Math.random() > 0.3,
        allowDataSharing: Math.random() > 0.5,
        
        // Metadatos
        createdAt: admin.firestore.Timestamp.fromDate(randomDate(new Date(2020, 0, 1), new Date())),
        updatedAt: admin.firestore.Timestamp.now(),
        createdBy: 'massive-generator-node',
        
        // Información adicional
        totalServices: random(0, 50),
        activeServices: random(0, 10),
        completedServices: random(0, 40),
        monthlyIncome: random(500000, 5000000),
        hasForm21: Math.random() > 0.3,
        lastLogin: admin.firestore.Timestamp.fromDate(randomDate(new Date(2024, 0, 1), new Date())),
        
        // Tags
        tags: [
          randomElement(['cliente-premium', 'cliente-regular', 'cliente-nuevo']),
          randomElement(['activo', 'inactivo', 'potencial']),
          randomElement(profesiones).toLowerCase().replace(/\s+/g, '-')
        ]
      };
      
      const userRef = db.collection('users').doc();
      batch.set(userRef, userData);
    }
    
    try {
      await batch.commit();
      created += (batchEnd - batchStart);
      progress.update(created);
      
      if (batchIndex < totalBatches - 1) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    } catch (error) {
      console.error(`\n❌ Error en batch ${batchIndex + 1}:`, error.message);
    }
  }
  
  console.log(`✅ ${created} usuarios creados exitosamente`);
  return created;
}

async function generateServices(cantidad = 2000) {
  console.log(`\n🚀 Generando ${cantidad} servicios...`);
  const progress = createProgressBar(cantidad, 'Servicios');
  
  const tiposServicio = [
    'declaracion-renta', 'contabilidad-general', 'auditoria', 'consultoria-tributaria',
    'formacion-empresa', 'liquidacion-sueldos', 'finiquitos', 'contratos-trabajo',
    'facturacion-electronica', 'libros-contables', 'balances', 'flujo-efectivo'
  ];
  
  const estados = ['pendiente', 'en-proceso', 'completado', 'cancelado', 'pausado'];
  const prioridades = ['baja', 'media', 'alta', 'urgente'];
  
  const totalBatches = Math.ceil(cantidad / BATCH_SIZE);
  let created = 0;
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batch = db.batch();
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, cantidad);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const tipo = randomElement(tiposServicio);
      const estado = randomElement(estados);
      const prioridad = randomElement(prioridades);
      const fechaCreacion = randomDate(new Date(2020, 0, 1), new Date());
      const fechaVencimiento = new Date(fechaCreacion.getTime() + random(1, 90) * 24 * 60 * 60 * 1000);
      
      const serviceData = {
        // Información básica
        title: `${tipo.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${random(1000, 9999)}`,
        description: `Servicio de ${tipo.replace(/-/g, ' ')} para cliente`,
        type: tipo,
        status: estado,
        priority: prioridad,
        
        // Usuario y asignación
        userId: `user_${random(1000, 9999)}`,
        assignedTo: `employee_${random(1, 20)}`,
        
        // Fechas
        createdAt: admin.firestore.Timestamp.fromDate(fechaCreacion),
        updatedAt: admin.firestore.Timestamp.fromDate(randomDate(fechaCreacion, new Date())),
        dueDate: admin.firestore.Timestamp.fromDate(fechaVencimiento),
        completedAt: estado === 'completado' ? 
          admin.firestore.Timestamp.fromDate(randomDate(fechaCreacion, fechaVencimiento)) : null,
        
        // Información financiera
        estimatedAmount: random(50000, 2000000),
        actualAmount: estado === 'completado' ? random(50000, 2000000) : null,
        isPaid: estado === 'completado' ? Math.random() > 0.2 : false,
        
        // Progreso y estado
        progress: estado === 'completado' ? 100 : 
                  estado === 'en-proceso' ? random(10, 90) : 
                  estado === 'pendiente' ? random(0, 30) : 0,
        
        // Archivos y documentación
        attachments: random(0, 5),
        hasForm21: tipo === 'declaracion-renta',
        
        // Metadatos
        createdBy: 'massive-generator-node',
        category: randomElement(['tributario', 'contable', 'laboral', 'societario', 'consultoria']),
        
        // Configuraciones
        isArchived: estado === 'cancelado' && Math.random() > 0.5,
        requiresApproval: prioridad === 'urgente' || prioridad === 'alta',
        isRecurring: Math.random() > 0.7,
        
        // Tiempo y estimaciones
        estimatedHours: random(2, 40),
        actualHours: estado === 'completado' ? random(1, 50) : null,
        
        // Evaluación del cliente
        clientRating: estado === 'completado' && Math.random() > 0.3 ? random(3, 5) : null,
        clientFeedback: estado === 'completado' && Math.random() > 0.6 ? 
          randomElement([
            'Excelente servicio, muy profesional',
            'Cumplió con los plazos establecidos',
            'Buena comunicación durante el proceso',
            'Servicio de calidad, recomendado'
          ]) : null,
        
        // Tags y notas
        tags: [tipo, estado, prioridad, randomElement(['Q1', 'Q2', 'Q3', 'Q4'])],
        notes: ['Servicio generado automáticamente para pruebas']
      };
      
      const serviceRef = db.collection('services').doc();
      batch.set(serviceRef, serviceData);
    }
    
    try {
      await batch.commit();
      created += (batchEnd - batchStart);
      progress.update(created);
      
      if (batchIndex < totalBatches - 1) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    } catch (error) {
      console.error(`\n❌ Error en batch ${batchIndex + 1}:`, error.message);
    }
  }
  
  console.log(`✅ ${created} servicios creados exitosamente`);
  return created;
}

async function generateForm21Records(cantidad = 500) {
  console.log(`\n🚀 Generando ${cantidad} formularios 21...`);
  const progress = createProgressBar(cantidad, 'Formularios 21');
  
  const totalBatches = Math.ceil(cantidad / BATCH_SIZE);
  let created = 0;
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batch = db.batch();
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, cantidad);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const añoTributario = randomElement([2021, 2022, 2023, 2024]);
      const ingresos = random(8000000, 30000000);
      const deducciones = random(1000000, 5000000);
      const baseImponible = Math.max(0, ingresos - deducciones);
      const impuesto = Math.floor(baseImponible * random(5, 15) / 100);
      
      const form21Data = {
        // Información del contribuyente
        userId: `user_${random(1000, 9999)}`,
        taxYear: añoTributario,
        rut: generateRUT(),
        nombres: randomElement(nombres),
        apellidoPaterno: randomElement(apellidos),
        apellidoMaterno: randomElement(apellidos),
        email: generateEmail(randomElement(nombres), randomElement(apellidos)),
        telefono: `+56 9 ${random(10000000, 99999999)}`,
        
        // Dirección
        direccion: `${randomElement(['Av.', 'Calle'])} ${randomElement(['Providencia', 'Las Condes'])} ${random(100, 9999)}`,
        ciudad: randomElement(ciudades),
        region: randomElement(regiones),
        
        // Información adicional
        actividadEconomica: randomElement(['dependiente', 'independiente', 'empresario', 'pensionado']),
        estadoCivil: randomElement(['soltero', 'casado', 'viudo', 'divorciado']),
        
        // Ingresos
        totalIngresosDependiente: Math.floor(ingresos * 0.8),
        totalIngresosIndependiente: Math.floor(ingresos * 0.2),
        totalOtrosIngresos: random(0, 1000000),
        totalIngresosBrutos: ingresos,
        
        // Deducciones
        totalDeduccionesPersonales: Math.floor(deducciones * 0.6),
        totalCotizacionesPrevisionales: Math.floor(deducciones * 0.4),
        totalDeducciones: deducciones,
        
        // Cálculos
        baseImponible: baseImponible,
        impuestoCalculado: impuesto,
        totalRetenciones: random(100000, 2000000),
        impuestoFinal: impuesto - random(100000, 2000000),
        
        // Estado del formulario
        status: randomElement(['borrador', 'enviado', 'procesado', 'aprobado', 'rechazado']),
        
        // Fechas
        createdAt: admin.firestore.Timestamp.fromDate(
          randomDate(new Date(añoTributario + 1, 2, 1), new Date(añoTributario + 1, 3, 30))
        ),
        updatedAt: admin.firestore.Timestamp.now(),
        submittedAt: Math.random() > 0.3 ? 
          admin.firestore.Timestamp.fromDate(randomDate(new Date(añoTributario + 1, 2, 1), new Date())) : null,
        
        // Metadatos
        createdBy: 'massive-generator-node',
        version: '1.0',
        attachments: random(2, 8),
        
        // Validaciones
        hasErrors: Math.random() > 0.85,
        isValidated: Math.random() > 0.2,
        requiresReview: Math.random() > 0.7,
        
        // Observaciones
        observations: Math.random() > 0.7 ? [
          'Formulario generado automáticamente',
          'Revisar documentación adjunta'
        ] : []
      };
      
      const form21Ref = db.collection('form21').doc();
      batch.set(form21Ref, form21Data);
    }
    
    try {
      await batch.commit();
      created += (batchEnd - batchStart);
      progress.update(created);
      
      if (batchIndex < totalBatches - 1) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    } catch (error) {
      console.error(`\n❌ Error en batch ${batchIndex + 1}:`, error.message);
    }
  }
  
  console.log(`✅ ${created} formularios 21 creados exitosamente`);
  return created;
}

// === FUNCIÓN DE LIMPIEZA ===
async function clearTestData() {
  console.log('\n🧹 Limpiando datos de prueba...');
  
  const collections = ['users', 'services', 'form21'];
  
  for (const collectionName of collections) {
    let deleted = 0;
    let hasMore = true;
    
    console.log(`\n🗑️ Limpiando ${collectionName}...`);
    
    while (hasMore) {
      const snapshot = await db.collection(collectionName)
        .where('createdBy', '==', 'massive-generator-node')
        .limit(500)
        .get();
      
      if (snapshot.empty) {
        hasMore = false;
        break;
      }
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      deleted += snapshot.docs.length;
      
      process.stdout.write(`\r🗑️ ${collectionName}: ${deleted} registros eliminados...`);
      await delay(500);
    }
    
    console.log(`\n✅ ${collectionName}: ${deleted} registros eliminados total`);
  }
  
  console.log('\n✅ Limpieza completada');
}

// === FUNCIÓN PRINCIPAL ===
async function main() {
  const args = process.argv.slice(2);
  const typeArg = args.find(arg => arg.startsWith('--type='));
  const countArg = args.find(arg => arg.startsWith('--count='));
  const clearArg = args.includes('--clear');
  
  const type = typeArg ? typeArg.split('=')[1] : 'all';
  const count = countArg ? parseInt(countArg.split('=')[1]) : 0;
  
  console.log('🎯 GENERADOR DE DATOS MASIVOS - NODE.JS');
  console.log('=====================================');
  
  try {
    if (clearArg) {
      await clearTestData();
      return;
    }
    
    let totalCreated = 0;
    
    switch (type) {
      case 'users':
        totalCreated = await generateUsers(count || 1000);
        break;
        
      case 'services':
        totalCreated = await generateServices(count || 2000);
        break;
        
      case 'form21':
        totalCreated = await generateForm21Records(count || 500);
        break;
        
      case 'all':
      default:
        console.log('📊 Generando todos los tipos de datos...');
        const users = await generateUsers(500);
        const services = await generateServices(1000);
        const forms = await generateForm21Records(200);
        totalCreated = users + services + forms;
        break;
    }
    
    console.log('\n🎉 GENERACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('=====================================');
    console.log(`📊 Total de registros creados: ${totalCreated}`);
    
  } catch (error) {
    console.error('\n❌ Error en la generación:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  generateUsers,
  generateServices,
  generateForm21Records,
  clearTestData
};
