# Ver la App en tu Teléfono (Paso a Paso)

## Requisitos Previos

- Tu computadora y tu teléfono deben estar conectados a la **misma red Wi-Fi**
- Tener Node.js instalado en tu computadora
- Tener el proyecto descargado
- Tener MySQL corriendo con la base de datos configurada

---

## Paso 1: Obtener tu Dirección IP

1. Abre **Visual Studio Code**
2. Ve al menú superior: **Terminal** → **Nueva Terminal**
3. Escribe el siguiente comando y presiona **Enter**:

```bash
ipconfig
```

4. Busca la línea que dice **Dirección IPv4**. Se verá algo como:

```
Dirección IPv4. . . . . . . . . . . . . . : 192.168.20.147
```

5. **Anota ese número** (esa es tu IP local)

---

## Paso 2: Configurar el Frontend para usar tu IP

1. En VS Code, abre el archivo:
   ```
   frontend/src/environments/environment.ts
   ```

2. Cambia `localhost` por tu IP en la línea de `apiUrl`:

   **Antes:**
   ```typescript
   apiUrl: 'http://localhost:3000/api/v1',
   ```

   **Después (usa TU IP):**
   ```typescript
   apiUrl: 'http://192.168.20.147:3000/api/v1',
   ```

3. Guarda el archivo (**Ctrl + S**)

> **IMPORTANTE:** Cuando termines de probar en el teléfono, regresa este cambio a `localhost`

---

## Paso 3: Iniciar el Backend

1. Abre una terminal en VS Code (**Terminal** → **Nueva Terminal**)
2. Escribe estos comandos uno por uno:

```bash
cd backend
```

```bash
npm run start:dev
```

3. Espera hasta que veas un mensaje como:

```
🚀 Servidor iniciado en: http://localhost:3000
```

> **No cierres esta terminal**

---

## Paso 4: Iniciar el Frontend

1. Abre **otra terminal nueva** (**Terminal** → **Nueva Terminal** o clic en el botón **+**)
2. Escribe estos comandos:

```bash
cd frontend
```

```bash
ng serve --host 0.0.0.0 --port 4200
```

3. Espera hasta que veas:

```
✔ Compiled successfully.
```

> **No cierres esta terminal tampoco**

---

## Paso 5: Abrir en tu Teléfono

1. Asegúrate de que tu teléfono esté conectado a la **misma red Wi-Fi** que tu computadora
2. Abre el navegador de tu teléfono (Chrome, Safari, etc.)
3. En la barra de direcciones escribe:

```
http://192.168.20.147:4200
```

> Reemplaza `192.168.20.147` con la IP que obtuviste en el Paso 1

4. Presiona **Ir** o **Enter**
5. Deberías ver tu aplicación cargando en el teléfono

---

## Paso 6: Cuando Termines de Probar

**MUY IMPORTANTE:** Regresa el archivo `environment.ts` a su valor original:

```typescript
apiUrl: 'http://localhost:3000/api/v1',
```

Esto es para que tu app siga funcionando normal en tu PC.

---

## Solución de Problemas

### "Error con conexión con el servidor"

Esto significa que el teléfono no puede conectarse al **backend** (no al frontend). Verifica:

1. **¿Está corriendo el backend?** → Revisa que la terminal del Paso 3 diga "Servidor iniciado"
2. **¿Cambiaste el `environment.ts`?** → Debe tener tu IP, no `localhost` (Paso 2)
3. **¿El Firewall bloquea?** → Ve la sección de Firewall abajo

### No carga ni la página (ni siquiera el frontend)

**Causa más común: Firewall de Windows**

1. Cuando ejecutes `ng serve --host 0.0.0.0`, Windows puede mostrar una ventana preguntando si quieres permitir el acceso → Dale clic en **Permitir acceso**
2. Si no apareció esa ventana o le diste en denegar:
   - Abre el **Panel de Control**
   - Ve a **Sistema y Seguridad** → **Firewall de Windows Defender**
   - Clic en **Permitir una aplicación a través del Firewall**
   - Busca **Node.js** en la lista y marca ambas casillas (Privada y Pública)
   - Clic en **Aceptar**

### La terminal dice que el puerto está en uso

Significa que ya hay algo corriendo en ese puerto. Opciones:

- Cierra la otra terminal que tiene `ng serve` o el backend corriendo
- O usa otro puerto: `ng serve --host 0.0.0.0 --port 4300` (y en el teléfono escribe `:4300` en vez de `:4200`)

### No encuentro mi IP

- Asegúrate de estar conectado a Wi-Fi (no con cable) si tu teléfono está en Wi-Fi
- Si usas cable de red, busca la IPv4 del adaptador Ethernet

---

## Para Detener los Servidores

En cada terminal donde está corriendo un servidor, presiona:

```
Ctrl + C
```

---

## Resumen Rápido

| Paso | Qué hacer | Dónde |
|------|-----------|-------|
| 1 | `ipconfig` → anotar tu IP | Terminal |
| 2 | Cambiar `localhost` por tu IP en `environment.ts` | VS Code |
| 3 | `cd backend` → `npm run start:dev` | Terminal 1 |
| 4 | `cd frontend` → `ng serve --host 0.0.0.0` | Terminal 2 |
| 5 | Abrir `http://TU_IP:4200` | Navegador del teléfono |
| 6 | Regresar `environment.ts` a `localhost` | VS Code (al terminar) |

---

Tu IP actual es: **192.168.20.147**

Entonces en tu teléfono abre: **http://192.168.20.147:4200**
