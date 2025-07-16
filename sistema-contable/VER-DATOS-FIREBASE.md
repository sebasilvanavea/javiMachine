# 📊 Cómo Ver los Datos en Firebase Console

## 🔗 **Acceso Directo a tu Proyecto**

**TU PROYECTO**: `javimachine-5d70e`

👉 **LINK DIRECTO**: https://console.firebase.google.com/project/javimachine-5d70e/firestore/data

---

## 📋 **Pasos para Ver los Datos**

### 1. **Acceder a Firebase Console**
1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto: **`javimachine-5d70e`**

### 2. **Ver Datos de Firestore**
1. En el menú lateral izquierdo, haz clic en **"Firestore Database"**
2. Verás la pestaña **"Data"** (datos)
3. Aquí aparecerán todas tus colecciones:
   - 📂 **users** - Todos los usuarios creados
   - 📂 **services** - Servicios del sistema
   - 📂 Otras colecciones que se creen

### 3. **Explorar la Colección "users"**
- Haz clic en la colección **"users"**
- Verás una lista de documentos (cada usuario)
- Cada documento tiene un ID único generado automáticamente
- Haz clic en cualquier documento para ver todos sus campos:
  - `name` (nombre)
  - `lastName` (apellido)
  - `email` (correo)
  - `rut` (RUT)
  - `phone` (teléfono)
  - `address` (dirección)
  - `createdAt` (fecha de creación)
  - `updatedAt` (fecha de actualización)
  - etc.

---

## 🧪 **Probar Ahora Mismo**

### **Paso 1: Abrir la aplicación**
Tu aplicación ya está corriendo en: http://localhost:4200/

### **Paso 2: Crear un usuario de prueba**
1. Ve a la sección **"Usuarios"** en tu app
2. Haz clic en **"Agregar Usuario"**
3. Completa los datos:
   - Nombre: `Test`
   - Apellido: `Usuario`
   - Email: `test@ejemplo.com`
   - RUT: `11111111-1`
   - Teléfono: `+56912345678`
4. Guarda el usuario

### **Paso 3: Ver en Firebase Console**
1. Ve inmediatamente a: https://console.firebase.google.com/project/javimachine-5d70e/firestore/data
2. Verás la colección **"users"**
3. ¡Debería aparecer tu usuario recién creado!

---

## 🔍 **Panel de Diagnóstico en tu App**

En el Dashboard de tu aplicación ahora tienes un **Panel de Diagnóstico** que te permite:
- ✅ Ver el estado de la conexión
- 🧪 Probar Firestore directamente
- 📊 Ver estadísticas en tiempo real

---

## ⚠️ **Si No Ves Datos**

Si no aparecen datos o ves errores, probablemente necesitas configurar las reglas de Firestore:

### **Configurar Reglas (1 minuto)**
1. Ve a: https://console.firebase.google.com/project/javimachine-5d70e/firestore/rules
2. Reemplaza las reglas actuales con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // DESARROLLO: Permitir todo temporalmente
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Haz clic en **"Publicar"**
4. Espera unos segundos y prueba de nuevo

---

## 📱 **Vista en Tiempo Real**

Una vez configurado, verás que:
- ✅ Los datos aparecen **instantáneamente** en Firebase Console
- ✅ Los cambios se **sincronizan** en tiempo real
- ✅ Puedes **editar datos** directamente desde Firebase Console
- ✅ Los cambios se reflejan inmediatamente en tu aplicación

---

**🎯 ¡Prueba ahora! Ve a tu app y crea un usuario, luego verifica en Firebase Console!**
