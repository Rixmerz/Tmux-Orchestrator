# BMad Medicina Backend

Sistema de Adherencia de Medicamentos MVP - Backend API con Deno 2.0 + DenoKV

## 🏥 Características Principales

- **Runtime**: Deno 2.0 con TypeScript nativo
- **Base de Datos**: DenoKV para almacenamiento distribuido
- **APIs**: REST + WebSocket para real-time
- **Seguridad**: JWT + OAuth2 + MFA compliance Ley 19.628
- **Arquitectura**: Hexagonal con separación de capas
- **Performance**: <200ms API responses, 99.9% uptime target

## 🚀 Inicio Rápido

### Prerrequisitos

- Deno 2.0+ instalado
- Puerto 8080 disponible (configurable)

### Instalación y Ejecución

```bash
# Clonar el proyecto
cd bmad-medicina-backend

# Ejecutar en modo desarrollo
deno task dev

# O ejecutar directamente
deno run -A --watch src/main.ts
```

### Variables de Entorno

Crear archivo `.env` (opcional, usa defaults):

```bash
# Servidor
PORT=8080
ENVIRONMENT=development

# Seguridad
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
ENCRYPTION_KEY=your-aes-256-encryption-key-32-chars

# CORS
CORS_ORIGINS=http://localhost:8000,http://localhost:3000

# APIs Externas Chile
CHILEAN_PHARMACY_API_URL=https://api.farmacias.cl
CHILEAN_PHARMACY_API_KEY=your-api-key

# Notificaciones
SMS_API_URL=https://api.sms.cl
SMS_API_KEY=your-sms-key
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 📋 API Endpoints

### Base URL

```
http://localhost:8080/api/v1
```

### Medicamentos

#### Crear Medicamento

```bash
POST /api/v1/medications
Content-Type: application/json

{
  "code": "ISP123456",
  "name": "Paracetamol 500mg",
  "genericName": "Paracetamol",
  "activeIngredient": "Paracetamol",
  "concentration": "500mg",
  "pharmaceuticalForm": "tablet",
  "manufacturer": "Laboratorio Chile",
  "category": "analgesic",
  "prescriptionRequired": false,
  "controlledSubstance": false,
  "refrigerationRequired": false,
  "instructions": "Tomar cada 8 horas con comida",
  "sideEffects": ["Náuseas", "Dolor de cabeza"],
  "contraindications": ["Alergia al paracetamol"],
  "warnings": ["No exceder 4g diarios"]
}
```

#### Buscar Medicamentos

```bash
GET /api/v1/medications/search?q=paracetamol&limit=20
GET /api/v1/medications/search?q=diabetes&category=diabetes
```

#### Obtener por ID/Código

```bash
GET /api/v1/medications/{id}
GET /api/v1/medications/code/{isp-code}
```

#### Listar Medicamentos

```bash
GET /api/v1/medications?limit=50&offset=0
GET /api/v1/medications?category=cardiovascular&isActive=true
```

#### Verificar Interacciones

```bash
POST /api/v1/medications/interactions/check
Content-Type: application/json

{
  "medicationIds": [
    "medication-id-1",
    "medication-id-2",
    "medication-id-3"
  ]
}
```

### Respuesta de Interacciones

```json
{
  "success": true,
  "data": {
    "interactions": [
      {
        "id": "interaction-id",
        "medicationId1": "med-1",
        "medicationId2": "med-2",
        "severity": "major",
        "description": "Puede causar sangrado",
        "clinicalEffect": "Aumento del riesgo de hemorragia",
        "managementRecommendation": "Monitorear INR"
      }
    ],
    "summary": {
      "totalInteractions": 1,
      "hasContraindicated": false,
      "hasMajor": true,
      "riskLevel": "high"
    }
  }
}
```

## 🏗️ Arquitectura

### Estructura Hexagonal

```
src/
├── domain/                 # Entidades y lógica de negocio
│   └── entities/          # User, Medication, Adherence
├── infrastructure/        # Adaptadores y frameworks
│   ├── database/         # DenoKV connection y utilidades
│   ├── repositories/     # Implementaciones de persistencia
│   ├── web/             # Controllers y routes
│   ├── auth/            # JWT y autenticación
│   ├── security/        # Crypto y encriptación
│   ├── config/          # Configuración
│   └── logging/         # Sistema de logs
└── main.ts              # Entry point
```

### Capas

1. **Domain**: Entidades de negocio puras
2. **Infrastructure**: Adaptadores para frameworks externos
3. **Application**: Casos de uso y servicios (próximamente)
4. **Presentation**: Controllers REST y WebSocket

## 🔐 Seguridad y Compliance

### Ley 19.628 - Protección de Datos Chile

- **Encriptación**: AES-256 en reposo, TLS 1.3 en tránsito
- **Consentimiento**: Registro explícito de consentimiento
- **Retención**: Políticas configurables de retención
- **Auditoría**: Logs completos de acceso a datos médicos
- **Anonimización**: Hash de IDs para logs de privacidad

### Autenticación

- JWT con refresh tokens
- Multi-factor authentication (próximamente)
- OAuth2 integration (próximamente)
- Rate limiting por IP

### Validaciones

- Sanitización de entrada
- Validación de tipos con Zod
- SQL injection prevention (N/A con DenoKV)
- CORS configurado

## 📊 Performance y Monitoring

### Métricas Target

- **Response Time**: <200ms para APIs críticas
- **Uptime**: 99.9% disponibilidad
- **Throughput**: 1000+ requests/segundo
- **Error Rate**: <0.1% en operaciones críticas

### Logging

```bash
# Ver logs en tiempo real
deno task dev

# Logs incluyen:
{
  "timestamp": "2024-01-20T10:30:45.123Z",
  "level": "INFO",
  "message": "API GET /api/v1/medications - 200 - 45ms"
}
```

## 🧪 Testing

```bash
# Ejecutar tests
deno task test

# Con coverage
deno task coverage

# Linting
deno task lint

# Formateo
deno task fmt
```

## 🔄 Próximas Implementaciones

### Priority High

- [ ] Authentication controllers y middleware
- [ ] User management APIs
- [ ] Adherence tracking system
- [ ] WebSocket notifications

### Priority Medium

- [ ] Chilean pharmacy API integration
- [ ] SMS/Email notification service
- [ ] MFA implementation
- [ ] Role-based access control

### Priority Low

- [ ] API rate limiting
- [ ] Metrics collection
- [ ] Docker containerization
- [ ] CI/CD pipeline

## 📞 API Status

### ✅ Implementado

- Medications CRUD completo
- Medication interactions checker
- DenoKV integration
- Logging system
- Error handling
- CORS configuration

### 🚧 En Progreso

- Authentication system
- User management
- Session handling

### ⏳ Pendiente

- Adherence tracking
- Notifications
- External integrations

## 🤝 Integración Frontend

El frontend debe conectarse a:

```typescript
// Configuración base
const API_BASE_URL = "http://localhost:8080/api/v1";

// Headers requeridos
const headers = {
  "Content-Type": "application/json",
  "Authorization": "Bearer {jwt-token}", // cuando esté implementado
};
```

## 📝 Notas de Desarrollo

- DenoKV se inicializa automáticamente al arrancar
- Todas las respuestas siguen formato estándar:
  ```json
  {
    "success": true|false,
    "data": {},
    "error": "mensaje si hay error",
    "meta": {} // metadatos opcionales
  }
  ```
- Los logs médicos se hashean por privacidad
- Las fechas se retornan en formato ISO 8601

---

**Frontend Developer**: Las APIs de medicamentos están listas. Trabajando en
autenticación next.
