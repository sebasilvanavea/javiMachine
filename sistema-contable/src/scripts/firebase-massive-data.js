// Script simplificado para ejecutar en la consola de Firebase
// Ve a Firebase Console > Firestore > Consola del navegador y pega este código

// === CONFIGURACIÓN ===
const BATCH_SIZE = 500; // Firestore permite máximo 500 operaciones por batch
const DELAY_BETWEEN_BATCHES = 1000; // 1 segundo entre lotes

// === DATOS BASE ===
const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Diego', 'Carmen', 'Luis', 'Elena', 'Miguel', 'Isabel', 'José', 'Patricia', 'Francisco', 'Rosa', 'Antonio', 'Marta', 'Manuel', 'Pilar'];
const apellidos = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno'];
const ciudades = ['Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Talca', 'Arica'];
const profesiones = ['Contador', 'Ingeniero', 'Médico', 'Abogado', 'Arquitecto', 'Profesor', 'Empresario', 'Comerciante'];

// === FUNCIONES HELPER ===
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
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
  const dominios = ['gmail.com', 'hotmail.com', 'yahoo.com'];
  return `${nombre.toLowerCase()}.${apellido.toLowerCase()}${random(1, 999)}@${randomElement(dominios)}`;
};

// === FUNCIÓN PARA DELAY ===
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// === GENERAR USUARIOS ===
async function createMassiveUsers(cantidad = 100) {
  console.log(`🚀 Generando ${cantidad} usuarios...`);
  
  const totalBatches = Math.ceil(cantidad / BATCH_SIZE);
  let created = 0;
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batch = firebase.firestore().batch();
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, cantidad);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const nombre = randomElement(nombres);
      const apellido = randomElement(apellidos);
      
      const userData = {
        // Información básica
        name: nombre,
        lastName: apellido,
        rut: generateRUT(),
        email: generateEmail(nombre, apellido),
        phone: `+56 9 ${random(10000000, 99999999)}`,
        
        // Ubicación
        city: randomElement(ciudades),
        address: `Calle ${randomElement(['Los Leones', 'Providencia', 'Las Condes'])} ${random(100, 9999)}`,
        
        // Profesional
        profession: randomElement(profesiones),
        isActive: Math.random() > 0.1,
        
        // Fechas
        createdAt: firebase.firestore.Timestamp.fromDate(randomDate(new Date(2020, 0, 1), new Date())),
        updatedAt: firebase.firestore.Timestamp.now(),
        
        // Metadatos
        createdBy: 'massive-generator',
        totalServices: random(0, 20),
        monthlyIncome: random(500000, 3000000)
      };
      
      const userRef = firebase.firestore().collection('users').doc();
      batch.set(userRef, userData);
    }
    
    try {
      await batch.commit();
      created += (batchEnd - batchStart);
      console.log(`✅ Batch ${batchIndex + 1}/${totalBatches} - Creados ${created}/${cantidad} usuarios`);
      
      // Delay entre batches para evitar rate limiting
      if (batchIndex < totalBatches - 1) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    } catch (error) {
      console.error(`❌ Error en batch ${batchIndex + 1}:`, error);
    }
  }
  
  console.log(`🎉 ¡${created} usuarios creados exitosamente!`);
}

// === GENERAR SERVICIOS ===
async function createMassiveServices(cantidad = 200) {
  console.log(`🚀 Generando ${cantidad} servicios...`);
  
  const tiposServicio = ['declaracion-renta', 'contabilidad-general', 'auditoria', 'consultoria'];
  const estados = ['pendiente', 'en-proceso', 'completado', 'cancelado'];
  
  const totalBatches = Math.ceil(cantidad / BATCH_SIZE);
  let created = 0;
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batch = firebase.firestore().batch();
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, cantidad);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const tipo = randomElement(tiposServicio);
      const estado = randomElement(estados);
      
      const serviceData = {
        title: `${tipo.replace(/-/g, ' ')} - ${random(1000, 9999)}`,
        description: `Servicio de ${tipo} para cliente`,
        type: tipo,
        status: estado,
        priority: randomElement(['baja', 'media', 'alta']),
        
        // Financiero
        estimatedAmount: random(50000, 1000000),
        progress: estado === 'completado' ? 100 : random(0, 90),
        
        // Fechas
        createdAt: firebase.firestore.Timestamp.fromDate(randomDate(new Date(2023, 0, 1), new Date())),
        updatedAt: firebase.firestore.Timestamp.now(),
        dueDate: firebase.firestore.Timestamp.fromDate(randomDate(new Date(), new Date(2025, 11, 31))),
        
        // Metadatos
        createdBy: 'massive-generator',
        userId: `user_${random(1000, 9999)}`,
        attachments: random(0, 5),
        
        // Tags
        tags: [tipo, estado, randomElement(['2024', '2025'])],
        
        // Configuración
        isArchived: estado === 'cancelado' && Math.random() > 0.7,
        requiresApproval: Math.random() > 0.8
      };
      
      const serviceRef = firebase.firestore().collection('services').doc();
      batch.set(serviceRef, serviceData);
    }
    
    try {
      await batch.commit();
      created += (batchEnd - batchStart);
      console.log(`✅ Batch ${batchIndex + 1}/${totalBatches} - Creados ${created}/${cantidad} servicios`);
      
      if (batchIndex < totalBatches - 1) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    } catch (error) {
      console.error(`❌ Error en batch ${batchIndex + 1}:`, error);
    }
  }
  
  console.log(`🎉 ¡${created} servicios creados exitosamente!`);
}

// === GENERAR FORMULARIOS 21 ===
async function createForm21Records(cantidad = 50) {
  console.log(`🚀 Generando ${cantidad} formularios 21...`);
  
  const totalBatches = Math.ceil(cantidad / BATCH_SIZE);
  let created = 0;
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batch = firebase.firestore().batch();
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, cantidad);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const ingresos = random(8000000, 30000000);
      const deducciones = random(1000000, 5000000);
      const baseImponible = Math.max(0, ingresos - deducciones);
      
      const form21Data = {
        // Información personal
        rut: generateRUT(),
        nombres: randomElement(nombres),
        apellidoPaterno: randomElement(apellidos),
        apellidoMaterno: randomElement(apellidos),
        
        // Año tributario
        taxYear: randomElement([2022, 2023, 2024]),
        
        // Ingresos
        totalIngresosDependiente: ingresos * 0.8,
        totalIngresosIndependiente: ingresos * 0.2,
        totalIngresosBrutos: ingresos,
        
        // Deducciones
        totalDeduccionesPersonales: deducciones * 0.6,
        totalCotizacionesPrevisionales: deducciones * 0.4,
        totalDeducciones: deducciones,
        
        // Cálculos
        baseImponible: baseImponible,
        impuestoCalculado: Math.floor(baseImponible * 0.1), // Simplificado
        totalRetenciones: random(100000, 2000000),
        impuestoFinal: random(-500000, 1000000),
        
        // Estado
        status: randomElement(['borrador', 'enviado', 'procesado', 'aprobado']),
        
        // Fechas
        createdAt: firebase.firestore.Timestamp.fromDate(randomDate(new Date(2024, 2, 1), new Date())),
        updatedAt: firebase.firestore.Timestamp.now(),
        
        // Metadatos
        createdBy: 'massive-generator',
        version: '1.0',
        hasErrors: Math.random() > 0.9,
        attachments: random(2, 8)
      };
      
      const form21Ref = firebase.firestore().collection('form21').doc();
      batch.set(form21Ref, form21Data);
    }
    
    try {
      await batch.commit();
      created += (batchEnd - batchStart);
      console.log(`✅ Batch ${batchIndex + 1}/${totalBatches} - Creados ${created}/${cantidad} formularios`);
      
      if (batchIndex < totalBatches - 1) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    } catch (error) {
      console.error(`❌ Error en batch ${batchIndex + 1}:`, error);
    }
  }
  
  console.log(`🎉 ¡${created} formularios 21 creados exitosamente!`);
}

// === FUNCIÓN PRINCIPAL ===
async function generateAllMassiveData() {
  console.log('🎯 INICIANDO GENERACIÓN MASIVA DE DATOS');
  console.log('=====================================');
  
  try {
    // Generar usuarios
    await createMassiveUsers(500);
    await delay(2000);
    
    // Generar servicios
    await createMassiveServices(1000);
    await delay(2000);
    
    // Generar formularios 21
    await createForm21Records(200);
    
    console.log('\n🎉 GENERACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('=====================================');
    console.log('✅ 500 usuarios creados');
    console.log('✅ 1000 servicios creados');
    console.log('✅ 200 formularios 21 creados');
    console.log('📊 Total: 1700 registros');
    
  } catch (error) {
    console.error('❌ Error en la generación:', error);
  }
}

// === FUNCIONES DE LIMPIEZA ===
async function clearTestData() {
  console.log('🧹 Limpiando datos de prueba...');
  
  const collections = ['users', 'services', 'form21'];
  
  for (const collectionName of collections) {
    const query = firebase.firestore()
      .collection(collectionName)
      .where('createdBy', '==', 'massive-generator')
      .limit(500);
    
    let deleted = 0;
    let hasMore = true;
    
    while (hasMore) {
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        hasMore = false;
        break;
      }
      
      const batch = firebase.firestore().batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      deleted += snapshot.docs.length;
      
      console.log(`🗑️ Eliminados ${deleted} registros de ${collectionName}...`);
      await delay(1000);
    }
    
    console.log(`✅ ${collectionName}: ${deleted} registros eliminados`);
  }
  
  console.log('✅ Limpieza completada');
}

// === INSTRUCCIONES ===
console.log(`
🚀 GENERADOR DE DATOS MASIVOS PARA FIREBASE
==========================================

📋 INSTRUCCIONES:
1. Asegúrate de estar en Firebase Console
2. Ve a Firestore Database
3. Abre la consola del navegador (F12)
4. Ejecuta los comandos:

🔥 GENERAR TODOS LOS DATOS:
   generateAllMassiveData()

📊 GENERAR POR SEPARADO:
   createMassiveUsers(500)     // 500 usuarios
   createMassiveServices(1000) // 1000 servicios  
   createForm21Records(200)    // 200 formularios

🧹 LIMPIAR DATOS DE PRUEBA:
   clearTestData()

⚠️ NOTAS IMPORTANTES:
- Los datos se crean en lotes de 500 para optimizar rendimiento
- Hay delays entre lotes para evitar rate limiting
- Todos los datos tienen createdBy: 'massive-generator' para fácil limpieza
- El proceso puede tomar varios minutos dependiendo de la cantidad

🎯 ¡EJECUTA generateAllMassiveData() PARA COMENZAR!
`);
