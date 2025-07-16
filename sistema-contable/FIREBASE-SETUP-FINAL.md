# Configuración Completa de Firebase

## 🎯 Estado Actual
✅ Firebase configurado con credenciales reales  
✅ Authentication habilitado  
✅ Firestore Database configurado  
✅ Sistema Angular conectado correctamente  

## 🔧 Pasos Pendientes en Firebase Console

### 1. Habilitar Authentication con Google

1. Ve a [Firebase Console](https://console.firebase.google.com/project/javimachine-5d70e)
2. Ve a **Authentication** → **Sign-in method**
3. Habilita **Google** como proveedor:
   - Activa el toggle
   - Email de soporte: tu email de proyecto
   - Guarda los cambios

### 2. Configurar Reglas de Firestore

Ve a **Firestore Database** → **Reglas** y usa estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios: solo pueden leer/escribir usuarios autenticados
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    // Servicios: solo pueden leer/escribir usuarios autenticados
    match /services/{serviceId} {
      allow read, write: if request.auth != null;
    }
    
    // Configuraciones del sistema: solo lectura para autenticados
    match /settings/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email_verified == true;
    }
  }
}
```

### 3. Configurar Dominios Autorizados

En **Authentication** → **Settings** → **Authorized domains**:
- Asegúrate de que `localhost` esté en la lista (para desarrollo)
- Agrega tu dominio de producción cuando hagas deploy

### 4. Opcional: Crear Datos Iniciales

Si quieres datos de prueba, puedes ejecutar este script en la consola del navegador (F12) cuando estés logueado:

```javascript
// Crear usuario de prueba
firebase.firestore().collection('users').add({
  name: 'Juan',
  lastName: 'Pérez',
  email: 'juan.perez@email.com',
  rut: '12345678-9',
  phone: '+56912345678',
  address: 'Las Condes 123',
  city: 'Santiago',
  region: 'Metropolitana',
  profession: 'Contador',
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  services: []
});
```

## 🚀 Testing del Sistema

Una vez configurado todo:

1. **Prueba Authentication**:
   - Login con Google debe funcionar
   - Login con email/password debe funcionar
   - Logout debe funcionar

2. **Prueba CRUD de Usuarios**:
   - Crear usuarios desde la interfaz
   - Editar usuarios existentes
   - Listar usuarios

3. **Prueba Dashboard**:
   - Ver estadísticas
   - Verificar servicios pendientes

## 🐛 Solución de Problemas

### Error de CORS
Si ves errores de CORS, verifica que el dominio esté autorizado en Firebase.

### Error de Authentication
Verifica que el método de Google esté habilitado en Firebase Console.

### Error de Firestore
Verifica que las reglas de Firestore permitan lectura/escritura a usuarios autenticados.

## 📈 Próximos Pasos

1. ✅ Firebase configurado  
2. 🔄 Configurar reglas de Firestore  
3. 🔄 Habilitar Google Auth  
4. ⏳ Implementar módulos adicionales (Form21, etc.)  
5. ⏳ Deploy a producción  
