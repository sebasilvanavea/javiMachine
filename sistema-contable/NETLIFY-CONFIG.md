# Sistema Contable - Deployment Guide

## 🚀 Configuración completada para Netlify

### Archivos configurados:
- ✅ `netlify.toml` - Configuración principal de Netlify
- ✅ `public/_redirects` - Redirecciones para SPA
- ✅ `package.json` - Script de build para Netlify

### Configuración de Netlify:
```toml
[build]
  publish = "dist/sistema-contable/browser"
  command = "npm run build:netlify"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### URL del sitio:
🌐 **https://javimachine.netlify.app**

### Próximos pasos:
1. El sitio se desplegará automáticamente con cada push a main
2. Verificar que el routing funcione correctamente
3. Configurar variables de entorno si es necesario

## 🔧 Comandos útiles:
- `npm run build:netlify` - Build para producción
- `git push` - Desplegar cambios
