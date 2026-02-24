# Guía para Levantar el Proyecto - Tienda Virtual

**Proyecto:** Tienda Virtual
**Fecha:** 24 de enero de 2026

---

## Frontend (Angular)

### Requisitos Previos
- Node.js 22 LTS instalado
- Dependencias instaladas (`npm install` ejecutado)

### Comandos para Levantar

```bash
# 1. Navegar a la carpeta del frontend
cd c:\Users\works\Projects\tienda-virtual\frontend

# 2. Instalar dependencias (solo la primera vez o si hay cambios en package.json)
npm install

# 3. Levantar servidor de desarrollo  (cd c:\Users\works\Projects\tienda-virtual\frontend; npm start)
npm start
```

### URL de Acceso
```
http://localhost:4200
```

### Comando Alternativo
```bash
# Usando Angular CLI directamente
ng serve
```

### Opciones Útiles

```bash
# Abrir navegador automáticamente
npm start -- --open

# Especificar puerto diferente
npm start -- --port 4300

# Modo producción local
npm run build
```

---

## Comandos Rápidos de Referencia

| Acción | Comando |
|--------|---------|
| Levantar frontend | `cd frontend && npm start` |
| Compilar producción | `cd frontend && npm run build` |
| Ejecutar tests | `cd frontend && npm test` |
| Ver dependencias | `cd frontend && npm list --depth=0` |

---

## Verificar que Funciona

1. Ejecutar `npm start` en la carpeta frontend
2. Esperar mensaje: `Local: http://localhost:4200`
3. Abrir navegador en `http://localhost:4200`
4. Debería verse la página de inicio de Angular

---

## Solución de Problemas

### Error: "Port 4200 is already in use"
```bash
# Usar otro puerto
npm start -- --port 4300
```

### Error: "Cannot find module"
```bash
# Reinstalar dependencias
rm -rf node_modules
npm install
```

### Error: "ng is not recognized"
```bash
# Usar npx en lugar de ng
npx ng serve
```

---

**Documento creado el:** 24 de enero de 2026
**Versión:** 1.0
