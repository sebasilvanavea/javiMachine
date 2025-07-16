# Configuración de Reglas de Firestore

## Problema Actual
Los errores 400 (Bad Request) en las peticiones a Firestore indican que las reglas de seguridad están bloqueando el acceso.

## Solución: Configurar Reglas de Firestore

### 1. Acceder a Firebase Console
1. Ve a https://console.firebase.google.com/
2. Selecciona el proyecto "javimachine-5d70e"
3. En el menú lateral, click en "Firestore Database"
4. Ve a la pestaña "Rules"

### 2. Reglas Temporales para Desarrollo
Reemplaza las reglas actuales con estas (SOLO PARA DESARROLLO):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso completo durante desarrollo
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Reglas de Producción (Más Seguras)
Para producción, usa estas reglas más restrictivas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios autenticados pueden leer/escribir sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Datos públicos de solo lectura
    match /public/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Otras colecciones requieren autenticación
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Configurar Autenticación Google
1. En Firebase Console, ve a "Authentication"
2. Click en "Sign-in method"
3. Habilita "Google"
4. Configura el dominio autorizado si es necesario

### 5. Verificar la Configuración
Una vez aplicadas las reglas, las peticiones de Firestore deberían funcionar correctamente.

### 6. Monitorear Errores
Los errores en la consola deberían desaparecer:
- ✅ Sin más errores 400 (Bad Request)
- ✅ Las consultas a Firestore funcionan
- ✅ El UserService puede cargar datos
- ✅ El Dashboard muestra información

## Notas Importantes
- Las reglas de desarrollo (allow if true) son INSEGURAS para producción
- Siempre usa reglas restrictivas en producción
- Verifica que los dominios estén autorizados para OAuth
