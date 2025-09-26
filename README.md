# Working Days API

**API para calcular fechas hábiles en Colombia desarrollada con NestJS y TypeScript.**

## Características

- ✅ Cálculo preciso de días y horas hábiles
- ✅ Manejo de días festivos colombianos
- ✅ Zona horaria de Colombia (America/Bogota)
- ✅ Horario laboral: 8:00 AM - 5:00 PM (almuerzo 12:00 PM - 1:00 PM)
- ✅ Validación de parámetros con class-validator y class-transformer
- ✅ Manejo de errores consistente
- ✅ Arquitectura modular con NestJS

## Instalación en local

```bash
# Clonar repo
git clone git@github.com:Googluu/working-days-api.git && cd working-days-api

# Instalar dependencias
npm install

# Desarrollo
npm run start:dev
```

## Uso local

### Endpoint
```
GET http://localhost:3000//api/working-days?days=1&hours=2&date=2025-08-01T14:00:00.000Z
```

### Parámetros
- `days` (opcional): Número de días hábiles a sumar
- `hours` (opcional): Número de horas hábiles a sumar  
- `date` (opcional): Fecha inicial en UTC (ISO 8601 con Z)

### Respuesta Exitosa (200)
```json
{
  "date": "2025-08-01T14:00:00.000Z"
}
```

### Respuesta de Error (400)
```json
{
  "error": "InvalidParameters",
  "message": "At least one parameter (days or hours) must be provided"
}
```

## Ejemplos

```bash
# Sumar 1 día hábil
curl "http://localhost:3000/api/working-days?days=1"

# Sumar 2 horas hábiles
curl "http://localhost:3000/api/working-days?hours=2"

# Sumar 1 día y 4 horas desde fecha específica
curl "http://localhost:3000/api/working-days?days=1&hours=4&date=2025-04-10T15:00:00.000Z"
```

## Doc con Swagger
**Ir a la siguiente ruta `http://localhost:3000/api/docs`**

## Test con jest
**Usando los tres ejemplo de la prueba**
📌 Ejemplos

1. Petición un viernes a las 5:00 p.m. con "hours=1"
Resultado esperado: lunes a las 9:00 a.m. (hora Colombia) → "2025-XX-XXT14:00:00Z" (UTC)

2. Petición un sábado a las 2:00 p.m. con "hours=1"
Resultado esperado: lunes a las 9:00 a.m. (hora Colombia) → "2025-XX-XXT14:00:00Z" (UTC)

3. Petición con "days=1" y "hours=4" desde un martes a las 3:00 p.m.
Resultado esperado: jueves a las 10:00 a.m. (hora Colombia) → "2025-XX-XXT15:00:00Z" (UTC)
```bash
# ejecutar
npm run test:e2e

# output esperada
 PASS  test/working-days.e2e-spec.ts
  Working Days API (e2e)
    🔧 Debug Tests - Verificar fechas y festivos
      ✓ Debe verificar que festivos están cargados correctamente (37 ms)
      ✓ Debe verificar ajuste por Reyes Magos (6 enero) (6 ms)
    ❌ Casos de Error (verificados)
      ✓ Debe fallar si no se proporciona days ni hours (24 ms)
      ✓ Debe fallar con formato de fecha inválido (8 ms)
      ✓ Debe fallar con días negativos (5 ms)
      ✓ Debe fallar con horas no numéricas (12 ms)
    ✅ Casos Básicos - Fechas sin festivos
      ✓ Debe sumar 1 hora desde fecha específica válida (sin festivos) (8 ms)
      ✓ Debe usar fecha actual si no se proporciona date (8 ms)
    📌 Casos Específicos - CORREGIDOS con fechas reales
      ✓ Caso 1: Viernes 5:00 PM + 1 hora = Siguiente día laboral 9:00 AM (8 ms)
      ✓ Caso 2: Sábado 2:00 PM + 1 hora = Siguiente día laboral 9:00 AM (8 ms)
      ✓ Caso 3: Martes 3:00 PM + 1 día + 4 horas = Jueves 10:00 AM (6 ms)
    ⏰ Casos de Horario Laboral
      ✓ Debe ajustar fecha antes de 8:00 AM a las 8:00 AM (6 ms)
      ✓ Debe saltar el horario de almuerzo (12:00-1:00 PM) (6 ms)
      ✓ Debe mover a siguiente día laboral si se pasa de 5:00 PM (5 ms)
    📅 Casos de Días Hábiles
      ✓ Debe sumar días hábiles saltando fin de semana (7 ms)
      ✓ Debe sumar 8 horas hábiles = 1 día laboral completo (5 ms)
    🎄 Casos con Días Festivos
      ✓ Debe saltar Reyes Magos (6 enero) (4 ms)
    🏥 Health Check
      ✓ GET / debe retornar mensaje de bienvenida (5 ms)

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Snapshots:   0 total
Time:        5.148 s
```