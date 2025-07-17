# 🚀 Generador de Datos Masivos para Firebase

Este conjunto de scripts te permite generar datos de prueba masivos para tu sistema contable en Firebase Firestore.

## 📋 Contenido

- **usuarios** (1000+ registros)
- **servicios** (2000+ registros) 
- **formularios 21** (500+ registros)
- **notificaciones** (opcional)

## 🛠️ Métodos de Uso

### 1. Script para Consola de Firebase (Más Fácil)

**Archivo:** `firebase-massive-data.js`

#### Pasos:
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Firestore Database**
4. Abre la consola del navegador (F12)
5. Copia y pega el contenido de `firebase-massive-data.js`
6. Ejecuta: `generateAllMassiveData()`

#### Comandos disponibles:
```javascript
// Generar todos los datos
generateAllMassiveData()

// Generar por tipo
createMassiveUsers(500)     // 500 usuarios
createMassiveServices(1000) // 1000 servicios  
createForm21Records(200)    // 200 formularios

// Limpiar datos de prueba
clearTestData()
```

### 2. Script Node.js (Más Potente)

**Archivo:** `generate-data.js`

#### Configuración inicial:
```bash
cd src/scripts
npm install
```

#### Configurar Firebase:
1. Ve a Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Descarga el archivo JSON
4. Copia `.env.example` a `.env`
5. Llena las variables con los datos del JSON descargado

#### Ejecutar:
```bash
# Generar todos los datos
npm run generate

# Generar por tipo específico
npm run generate-users      # 1000 usuarios
npm run generate-services   # 2000 servicios
npm run generate-forms      # 500 formularios

# Comandos personalizados
node generate-data.js --type=users --count=2000
node generate-data.js --type=services --count=5000

# Limpiar datos de prueba
npm run clear-test-data
```

### 3. Script Complejo (Desarrollo Avanzado)

**Archivo:** `generate-massive-data.js`

Script más completo con funciones avanzadas para desarrollo.

## 📊 Datos Generados

### 👥 Usuarios
- Información personal completa (RUT, nombre, apellidos, email, teléfono)
- Dirección y ubicación (ciudad, región, comuna)
- Información profesional (profesión, empresa, experiencia)
- Configuraciones de cuenta
- Metadatos y estadísticas

### 🔧 Servicios
- Diferentes tipos (declaración renta, contabilidad, auditoría, etc.)
- Estados realistas (pendiente, en-proceso, completado)
- Información financiera (montos estimados y reales)
- Fechas de creación, vencimiento y completación
- Progreso y evaluaciones de clientes

### 📋 Formularios 21
- Años tributarios (2021-2024)
- Ingresos por diferentes fuentes
- Deducciones y cálculos tributarios
- Estados de procesamiento
- Validaciones y observaciones

## 🎯 Características

### ✅ Optimización
- **Batches de 500 registros** para optimizar rendimiento
- **Delays entre lotes** para evitar rate limiting
- **Barras de progreso** en tiempo real
- **Manejo de errores** robusto

### ✅ Datos Realistas
- **RUTs válidos** con dígito verificador correcto
- **Emails únicos** generados dinámicamente
- **Fechas coherentes** basadas en lógica de negocio
- **Montos financieros** dentro de rangos reales

### ✅ Limpieza Fácil
- Todos los registros tienen `createdBy: 'massive-generator'`
- Función de limpieza automática
- Identificación clara de datos de prueba

## 🚨 Recomendaciones

### Antes de Ejecutar:
1. **Haz backup** de tu base de datos
2. **Usa un proyecto de prueba** primero
3. **Verifica límites** de Firestore de tu plan
4. **Monitorea costos** especialmente en producción

### Límites de Firestore:
- **Gratis**: 50,000 lecturas/escrituras por día
- **Blaze**: Consulta la calculadora de precios
- **Concurrent writes**: Máximo 500 por segundo

### Mejores Prácticas:
- Ejecuta en horarios de bajo tráfico
- Usa índices compuestos si necesitas queries complejas
- Considera usar Cloud Functions para automatización

## 🔧 Personalización

### Modificar Datos Base:
Edita los arrays en la sección `DATOS BASE`:
```javascript
const nombres = ['Juan', 'María', ...]; // Agrega más nombres
const ciudades = ['Santiago', ...];     // Personaliza ciudades
const profesiones = ['Contador', ...];  // Ajusta profesiones
```

### Cambiar Cantidades:
```javascript
// En firebase-massive-data.js
createMassiveUsers(2000)    // Cambia cantidad
createMassiveServices(5000) // Ajusta según necesidad

// En Node.js
node generate-data.js --type=users --count=5000
```

### Personalizar Campos:
Modifica las estructuras de datos en cada función generadora según tus necesidades específicas.

## 📈 Monitoreo

### Durante la Ejecución:
- Verifica la consola para errores
- Monitorea el progreso con las barras
- Observa el uso de Firestore en Firebase Console

### Después de la Ejecución:
- Revisa Firestore para confirmar datos
- Verifica que las cantidades sean correctas
- Prueba queries básicos para validar estructura

## 🆘 Resolución de Problemas

### Error de Permisos:
```
Error: Missing or insufficient permissions
```
**Solución:** Configura las reglas de Firestore o usa Firebase Admin SDK

### Rate Limiting:
```
Error: Quota exceeded
```
**Solución:** Aumenta los delays entre batches o reduce el tamaño del batch

### Memoria Insuficiente:
```
Error: JavaScript heap out of memory
```
**Solución:** Usa Node.js con más memoria: `node --max-old-space-size=4096 generate-data.js`

### Configuración Firebase:
```
Error: Service account object must contain a string "project_id"
```
**Solución:** Verifica el archivo `.env` y las credenciales de Firebase

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de error completos
2. Verifica la configuración de Firebase
3. Confirma que tengas permisos suficientes
4. Prueba con cantidades más pequeñas primero

---

## 🎉 ¡Listo para Generar Datos Masivos!

Elige el método que mejor se adapte a tu caso:
- **Firebase Console**: Rápido y fácil
- **Node.js**: Más control y funcionalidades
- **Script Avanzado**: Desarrollo y personalización

¡Feliz generación de datos! 🚀
