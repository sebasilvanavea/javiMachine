# Configuración de Firebase para el Sistema Contable

## Pasos para configurar Firebase

### 1. Crear Proyecto en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto" 
3. Nombre del proyecto: `sistema-contable-angular`
4. Habilita Google Analytics (opcional)
5. Selecciona la cuenta de Google Analytics (opcional)

### 2. Configurar Authentication

1. En el menú lateral, ve a **Authentication**
2. Haz clic en **Comenzar**
3. Ve a la pestaña **Sign-in method**
4. Habilita **Google** como proveedor:
   - Haz clic en Google
   - Activa el toggle "Habilitar"
   - Ingresa un email de soporte del proyecto
   - Guarda los cambios

### 3. Configurar Firestore Database

1. En el menú lateral, ve a **Firestore Database**
2. Haz clic en **Crear base de datos**
3. Selecciona **Modo de prueba** (para desarrollo)
4. Selecciona la ubicación (recomendado: us-central)

### 4. Obtener Configuración de Firebase

1. Ve a **Configuración del proyecto** (ícono de engranaje)
2. Baja hasta **Tus aplicaciones**
3. Haz clic en **Agregar aplicación web** (ícono `</>`)
4. Nombre de la aplicación: `Sistema Contable Angular`
5. **NO** marcar "También configurar Firebase Hosting"
6. Haz clic en **Registrar aplicación**
7. **COPIA** el objeto de configuración que aparece

### 5. Actualizar environment.ts

Reemplaza el contenido de `src/environments/environment.ts` con tu configuración real:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "TU_API_KEY_REAL",
    authDomain: "sistema-contable-angular.firebaseapp.com",
    projectId: "sistema-contable-angular",
    storageBucket: "sistema-contable-angular.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
  }
};
```

### 6. Configurar Reglas de Firestore (Opcional)

En Firestore Database > Reglas, puedes usar estas reglas básicas para desarrollo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura a usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Solución Temporal para Desarrollo

Si no quieres configurar Firebase ahora mismo, puedes usar el modo offline con estas configuraciones temporales.
