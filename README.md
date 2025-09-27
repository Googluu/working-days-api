# Working Days API

**API para calcular fechas hábiles en Colombia desarrollada con NestJS y TypeScript.**

## Características

- ✅ **Serverless**: Desplegada en AWS Lambda + API Gateway
- ✅ **TypeScript**: Completamente tipada con interfaces explícitas
- ✅ **NestJS**: Framework enterprise-grade con arquitectura modular
- ✅ **Días festivos**: Colombianos actualizados automáticamente
- ✅ **Horario laboral**: 8:00 AM - 5:00 PM (almuerzo 12:00-1:00 PM)
- ✅ **Zona horaria**: Colombia (America/Bogota) con conversión a UTC
- ✅ **Tests**: Suite completa de pruebas E2E
- ✅ **Documentación**: Swagger/OpenAPI integrado
- ✅ **AWS CDK**: Infrastructure as Code
- ✅ **CI/CD Ready**: Preparado para pipelines de deployment

## 🔗 Endpoints en Producción

- **Cálculo**: https://gebfafc6ok.execute-api.us-west-2.amazonaws.com/prod/api/working-days
- **Documentación**: https://gebfafc6ok.execute-api.us-west-2.amazonaws.com/prod/docs

## 🚀 Uso Rápido

```bash
# Ejemplo básico - Sumar 1 hora hábil
curl "https://gebfafc6ok.execute-api.us-west-2.amazonaws.com/prod/api/working-days?hours=1"

# Ejemplo avanzado - Sumar días y horas desde fecha específica
curl "https://gebfafc6ok.execute-api.us-west-2.amazonaws.com/prod/api/working-days?days=1&hours=4&date=2025-04-10T15:00:00.000Z"
```

## 📋 Casos de Uso

| Entrada | Resultado |
|---------|-----------|
| `?hours=1` (viernes 5 PM) | Lunes 9:00 AM Colombia |
| `?days=1` (desde cualquier día) | Siguiente día hábil |
| `?days=5&hours=4` | 5 días + 4 horas hábiles |
| Automáticamente salta fines de semana y festivos |

## 🏗️ Arquitectura

```
┌─────────────────┐     ┌──────────────┐      ┌─────────────────┐
│   API Gateway   │───▶│ AWS Lambda   │───▶ │ External APIs   │
│                 │     │              │      │ (Holidays)      │
│ - CORS          │     │ - NestJS     │      └─────────────────┘
│ - Rate Limiting │     │ - Express    │
│ - Validation    │     │ - handler.ts │
└─────────────────┘     └──────────────┘
```

## Instalación en local

### Prerrequisitos

- Node.js 18+
- AWS CLI configurado
- AWS CDK instalado globalmente

```bash
npm install -g aws-cdk
```

```bash
# 1. Clonar repo
git clone git@github.com:Googluu/working-days-api.git && cd working-days-api

# 2. Instalar dependencias
npm install

# 3. Ejecutar tests
npm run test:e2e

# 4. Desarrollo local
npm run start:dev
```

### Variables de entorno local
```bash
PORT=3000
HOLIDAYS_URL=https://content.capta.co/Recruitment/WorkingDays.json
```

### Variables de entorno producción
```bash
PORT=3000
HOLIDAYS_URL=https://content.capta.co/Recruitment/WorkingDays.json
NODE_ENV=production
CDK_DEFAULT_ACCOUNT=
CDK_DEFAULT_REGION=us-west-2
```

### Casos de Prueba Validados ✅

- ✅ Viernes 5:00 PM + 1 hora = Lunes 9:00 AM
- ✅ Sábado 2:00 PM + 1 hora = Lunes 9:00 AM  
- ✅ Martes 3:00 PM + 1 día + 4 horas = Jueves 10:00 AM
- ✅ Manejo de días festivos colombianos
- ✅ Salto de horario de almuerzo (12-1 PM)
- ✅ Validación de parámetros y errores

## 📡 API Specification

### Endpoint
```
GET http://localhost:3000/api/working-days?days=1&hours=2&date=2025-08-01T14:00:00.000Z
```

### GET /api/working-days

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

### Reglas de Negocio

1. **Horario laboral**: Lunes a Viernes, 8:00 AM - 5:00 PM (Colombia)
2. **Almuerzo**: 12:00 PM - 1:00 PM no cuenta como tiempo hábil
3. **Festivos**: Se excluyen automáticamente los días festivos colombianos
4. **Ajuste automático**: Fechas fuera de horario se ajustan al más cercano
5. **Orden de suma**: Primero días, luego horas
6. **Zona horaria**: Cálculos en Colombia, respuesta en UTC

## 🚀 Deployment

### Desarrollo Local
```bash
npm run start:dev
# http://localhost:3000/api/working-days
```

### AWS Lambda (Producción)
```bash
# Deploy completo
npm run deploy:complete

# Ver logs en tiempo real
aws logs tail /aws/lambda/working-days-api --follow
```

## 🏛️ Estructura del Proyecto

```
working-days-api/
├── src/                   # Código fuente NestJS
│   ├── app.module.ts      # Módulo principal
│   ├── common/            # DTOs, interfaces, filtros
│   ├── working-days/      # Lógica de fechas hábiles
│   └── holidays/          # Servicio de días festivos
├── cdk/                   # AWS CDK Infrastructure
│   ├── bin/app.ts        # CDK App
│   ├── lib/lambda-stack.ts # Stack definition
│   └── lambda/handler.ts  # Lambda handler
├── test/                  # Tests E2E
├── package.json
├── tsconfig.json
└── README.md
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