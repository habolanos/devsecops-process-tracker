# Arquitectura del Sistema

Este diagrama representa la arquitectura completa de la aplicación, mostrando las diferentes capas, componentes y sus interacciones.

## Descripción

La aplicación está construida con una arquitectura en capas que separa claramente las responsabilidades:

### Capas Principales

1. **Frontend Layer**: Interfaz de usuario construida con Next.js 15, React y Tailwind CSS
2. **State Management**: Gestión de estado global con Zustand y persistencia en localStorage
3. **Business Logic**: Lógica de negocio modular en la carpeta `lib/`
4. **API Routes**: Endpoints REST para operaciones del servidor
5. **Data Sources**: Plantillas YAML y configuraciones DevOps
6. **External Services**: Servicios opcionales (S3, NextAuth, Prisma)
7. **Testing**: Suite de pruebas con Vitest y Playwright

### Características Arquitectónicas

- **Separación de responsabilidades**: Cada capa tiene un propósito específico
- **Modularidad**: Componentes reutilizables y desacoplados
- **Persistencia dual**: localStorage para estado + opcional DB con Prisma
- **Storage flexible**: S3 para producción, Base64 local para desarrollo
- **Testing completo**: 51 tests unitarios + E2E con Playwright

## Diagrama

```mermaid
graph TB
    subgraph "Frontend - Next.js 15 App Router"
        UI["🎨 UI Layer<br/>(React + Tailwind + shadcn/ui)"]
        Pages["📄 Pages<br/>app/page.tsx<br/>app/process/page.tsx"]
        Components["🧩 Components<br/>TaskCard, Sidebar, Modals"]
    end
    
    subgraph "State Management"
        Zustand["💾 Zustand Store<br/>+ localStorage persistence"]
        ConfigStore["⚙️ Config Store<br/>DevOps Configuration"]
    end
    
    subgraph "Business Logic - lib/"
        Parser["📝 YAML Parser<br/>yaml-parser.ts"]
        Helpers["🔧 Helpers<br/>Progress, Dependencies, Validation"]
        JSONUtils["📦 JSON Utils<br/>Import/Export"]
        WordGen["📄 Word Generator<br/>docx generation"]
        S3Utils["☁️ S3 Utils<br/>Upload/Download"]
        I18n["🌐 i18n Context<br/>ES/EN"]
    end
    
    subgraph "API Routes - app/api/"
        ProcessAPI["🔌 /api/processes<br/>GET templates"]
        UploadAPI["📤 /api/upload/*<br/>presigned, complete, delete"]
    end
    
    subgraph "Data Sources"
        Templates["📁 data/processes/<br/>5 YAML templates"]
        DevOpsConfig["⚙️ devops-config.json<br/>Environment configs"]
    end
    
    subgraph "External Services (Optional)"
        S3["☁️ AWS S3<br/>Image storage"]
        Auth["🔐 NextAuth<br/>Authentication"]
        DB["🗄️ Prisma + DB<br/>Persistence"]
    end
    
    subgraph "Testing"
        Vitest["🧪 Vitest<br/>51 unit tests"]
        Playwright["🎭 Playwright<br/>E2E tests"]
    end
    
    UI --> Pages
    Pages --> Components
    Components --> Zustand
    Components --> ConfigStore
    
    Pages --> Parser
    Pages --> Helpers
    Pages --> JSONUtils
    Pages --> WordGen
    Pages --> I18n
    
    Components --> S3Utils
    S3Utils -.->|Optional| S3
    S3Utils -.->|Fallback| LocalBase64["💾 Base64 Local Storage"]
    
    Pages --> ProcessAPI
    Pages --> UploadAPI
    
    ProcessAPI --> Templates
    ConfigStore --> DevOpsConfig
    
    UploadAPI --> S3Utils
    
    Pages -.->|Optional| Auth
    Zustand -.->|Optional| DB
    
    Vitest -.-> Helpers
    Vitest -.-> Parser
    Vitest -.-> JSONUtils
    
    Playwright -.-> Pages
    Playwright -.-> Components
    
    style UI fill:#60a5fa
    style Zustand fill:#a78bfa
    style Parser fill:#fbbf24
    style S3 fill:#34d399
    style Vitest fill:#f472b6
    style Playwright fill:#f472b6
```

## Componentes Detallados

### Frontend Layer
- **UI Components**: TaskCard, ProcessSidebar, EvidenceModal, VariablesForm, ConfigUpload, ProgressBar
- **Pages**: HomePage (selección de templates), ProcessPage (ejecución de proceso)
- **Layouts**: RootLayout con providers y configuración global

### State Management
- **Zustand Store**: Estado global del proceso activo con persistencia automática
- **Config Store**: Configuración DevOps para auto-completado de variables

### Business Logic
- **YAML Parser**: Convierte definiciones YAML a objetos ProcessState
- **Helpers**: Cálculo de progreso, validación de dependencias, validación de evidencias
- **JSON Utils**: Importación/exportación de procesos completos
- **Word Generator**: Generación de documentos Word con resultados
- **S3 Utils**: Gestión de uploads a S3 con presigned URLs
- **i18n Context**: Soporte multiidioma (ES/EN)

### API Routes
- **Process API**: `GET /api/processes` (lista templates), `GET /api/processes/[id]` (obtener YAML)
- **Upload API**: `POST /api/upload/presigned`, `POST /api/upload/complete`, `POST /api/upload/delete`

### Data Sources
- **Templates**: 5 procesos YAML predefinidos (IT Security, DevOps Release, Incident Response, etc.)
- **DevOps Config**: Archivo JSON con configuraciones de entornos

### External Services (Opcionales)
- **AWS S3**: Almacenamiento de imágenes en producción
- **NextAuth**: Sistema de autenticación
- **Prisma + DB**: Persistencia en base de datos

### Testing
- **Vitest**: 51 tests unitarios cubriendo helpers, parsers y utils
- **Playwright**: Tests E2E para flujos completos de usuario

## Patrones de Diseño

- **Repository Pattern**: Separación de lógica de datos (API Routes)
- **Service Layer**: Business logic encapsulada en `lib/`
- **Component Composition**: UI construida con componentes reutilizables
- **State Management Pattern**: Zustand para estado global reactivo
- **Adapter Pattern**: S3Utils con fallback a Base64 local
