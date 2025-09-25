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
Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        4.897 s, estimated 5 s
```
**NOTA: apareceran algunos types errors pero es simplemente por el tipo de dato que les estoy pasando los parámetros ya que se están enviando como strings y la validación de class-validator los está rechazando**