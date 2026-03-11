Analiza la carpeta adjunta y evalúa si su estructura actual es correcta o necesita reorganizarse.

## Contexto del proyecto
- Tienda virtual empresarial con múltiples portales: Administrativo, Colaboradores, Público (futuro), y otros por definir
- Stack: NestJS + Prisma + MySQL (backend), Angular 17+ (frontend)
- El proyecto es de escala empresarial: debe ser escalable, mantenible y comprensible para un equipo de desarrollo
- Patrón de organización establecido en common/: separar por secciones global/, admin/, colaboradores/ cuando aplica

## Lo que necesito que hagas

1. **Lee cada archivo completo** — entiende qué hace, a quién pertenece (¿admin? ¿colab? ¿ambos?) y quién lo consume

2. **Identifica problemas** ordenados por severidad:
   - Código muerto (archivos sin importar/usar en ningún lado)
   - Dependencias circulares o acoplamiento entre portales
   - Lógica mezclada entre portales en un mismo archivo
   - Inconsistencias con el patrón del resto del proyecto
   - Faltas de buenas prácticas o seguridad

3. **Propón la estructura destino** en formato árbol, explicando por qué cada archivo va donde va

4. **Implementa los cambios:**
   - Crea las carpetas por sección (global/, admin/, colaboradores/) si aplica
   - Mueve los archivos y actualiza TODOS los imports relativos internos (dentro de common/)
   - Actualiza los barrels (index.ts) en cada nivel
   - Los consumidores externos importan desde el barrel principal — no deben romperse
   - Si un archivo contiene lógica de múltiples portales, sepáralo

5. **Verifica compilación limpia** con `npx tsc --noEmit`

## Reglas
- Todo en español (variables, funciones, comentarios)
- No crear archivos de documentación ni markdown de resumen
- El barrel principal (index.ts) debe re-exportar todo para que los consumidores existentes no se rompan
- Si encuentras código muerto, elimínalo
- Si encuentras brechas de seguridad, corrígelas
- Muestra tabla resumen de problemas encontrados y soluciones aplicadas