# Process Tracker MVP

## 📊 Descripción

**Process Tracker** es una aplicación web desarrollada en Next.js que permite gestionar y ejecutar procesos complejos paso a paso, adjuntando evidencia completa (texto e imágenes) para cada tarea. Ideal para auditorías, procesos de calidad, onboarding, proyectos estructurados y cualquier flujo de trabajo que requiera documentación y trazabilidad.

## ✨ Características Principales

- 📂 **Procesos Precargados**: Selecciona entre plantillas predefinidas (Auditoría IT, Release DevOps, Respuesta a Incidentes)
- 🔗 **Links Dinámicos**: Links parametrizables con variables que el usuario captura en runtime
- ⚙️ **Variables de Proceso**: Define variables (organization, projectId, repository) que activan links dinámicos
- 📄 **Carga de Procesos YAML**: Define procesos con fases y tareas en formato YAML
- 👣 **Ejecución Paso a Paso**: Navega por fases, visualiza tareas y márcalas como completadas
- 📸 **Evidencia Completa**: Adjunta texto libre e imágenes (desde archivos locales o URLs)
- 🔗 **Dependencias entre Tareas**: Las tareas se bloquean automáticamente hasta que sus dependencias estén completadas
- 📊 **Progreso en Tiempo Real**: Barras de progreso global y por fase
- 📥 **Exportación Profesional**: 
  - **JSON** con evidencia en base64 (para continuar procesos incompletos)
  - **Word (.docx)** con toda la evidencia organizada por fases y tareas
- 💾 **Persistencia Local**: Auto-guardado en `localStorage` con Zustand
- 🌐 **Multiidioma**: Español e Inglés (toggle en la interfaz)
- 📦 **Almacenamiento en la Nube**: Imágenes subidas a AWS S3 (requiere configuración)

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS
- **Estado Global**: Zustand con persistencia
- **Parseo YAML**: js-yaml
- **Generación de Word**: docx
- **Almacenamiento**: AWS S3 (AWS SDK v3)
- **Iconos**: Lucide React

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 20+ y Yarn
- (Opcional) Docker y Docker Compose para despliegue

### Instalación
```bash
# Clonar el repositorio
git clone <repo-url>
cd process_tracker

# Instalar dependencias
cd nextjs_space
yarn install

# Ejecutar en modo desarrollo
yarn dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Configuración de AWS S3 (Opcional)

Para habilitar la subida de imágenes a la nube, crea un archivo `.env.local` en `nextjs_space/`:

```env
AWS_BUCKET_NAME=tu-bucket-s3
AWS_FOLDER_PREFIX=process-tracker/
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
```

**Nota**: Si no configuras S3, la aplicación seguirá funcionando pero las imágenes se guardarán en memoria durante la sesión.

## 📝 Uso de la Aplicación
### 1. Cargar un Proceso

En la pantalla de inicio, tienes tres opciones:

- **Procesos Disponibles**: Selecciona una plantilla precargada:
  - 🛡️ **Auditoría de Seguridad IT** - Proceso completo de auditoría (3 fases, 13 tareas)
  - 🚀 **Release DevOps** - Liberación de software con validaciones (3 fases, 10 tareas)
  - ⚠️ **Respuesta a Incidentes** - Procedimiento ante incidentes de seguridad (4 fases, 12 tareas)
- **Cargar YAML**: Sube un archivo `.yaml` personalizado
- **Importar JSON**: Carga un JSON previamente exportado para continuar un proceso incompleto

**Ejemplo**: También puedes usar el archivo `example-process.yaml` incluido en la raíz del proyecto.

### 2. Ejecutar el Proceso

- **Navega por Fases**: Usa el sidebar izquierdo para cambiar entre fases
- **Visualiza Tareas**: Cada tarea muestra su estado (Completada, Pendiente, Bloqueada)
- **Adjunta Evidencia**: Haz clic en "Ver Detalles" para abrir el modal de evidencia
  - Adjunta texto libre
  - Sube imágenes desde tu dispositivo o pega URLs
- **Marca como Completada**: La tarea solo se puede completar si la evidencia requerida está adjunta

### 3. Exportar Resultados

- **Exportar JSON**: Guarda el progreso actual (incluye evidencia en base64)
- **Exportar Word**: Genera un documento `.docx` profesional con toda la evidencia
- **Finalizar Proceso**: Marca el proceso como completado y exporta ambos formatos automáticamente

## 📁 Estructura de un Proceso YAML

```yaml
process:
  id: "unique-id"
  name: "Nombre del Proceso"
  description: "Descripción general"
  version: "1.0.0"
  
  # Variables capturables por el usuario (opcional)
  variables:
    - key: "organization"
      label: "Organización"
      type: "text"           # text | select | number
      required: true
      placeholder: "ej: mi-empresa"
    - key: "environment"
      label: "Ambiente"
      type: "select"
      required: true
      options: ["development", "staging", "production"]
  
  phases:
    - id: "phase-1"
      name: "Fase 1"
      description: "Descripción de la fase"
      order: 1
      # Links dinámicos a nivel de fase (opcional)
      dynamicLinks:
        - label: "Dashboard"
          urlTemplate: "https://dashboard.com/{organization}"
          behavior: "auto"   # auto | click
          delay: 2           # segundos (solo para auto)
          requiresVariables: ["organization"]
      tasks:
        - id: "task-1-1"
          name: "Tarea 1"
          description: "Descripción de la tarea"
          order: 1
          references:
            - label: "Documentación"
              url: "https://example.com"
          # Links dinámicos a nivel de tarea (opcional)
          dynamicLinks:
            - label: "GitHub Repo"
              urlTemplate: "https://github.com/{organization}/{repository}"
              behavior: "click"
              newTab: true
              requiresVariables: ["organization", "repository"]
          evidence:
            type: "text"     # text | image | both
            required: true
            description: "Qué evidencia se necesita"
          dependencies: []   # IDs de tareas que deben completarse antes
```

### Variables y Links Dinámicos

Los procesos pueden definir **variables** que el usuario captura al inicio:
- Los **links dinámicos** usan estas variables para construir URLs parametrizadas
- Los links permanecen **bloqueados** hasta que se completen las variables requeridas
- Comportamiento `auto`: el link se abre automáticamente al activarse
- Comportamiento `click`: requiere que el usuario haga clic

**Ejemplo**: Ver `data/processes/devops-pipeline.yaml` para un proceso completo con variables y links dinámicos.

## 🐳 Despliegue con Docker

```bash
# Construir y ejecutar con Docker Compose
docker-compose up --build

# La aplicación estará disponible en http://localhost:3000
```

## 📚 Estructura del Proyecto

```
process_tracker/
├── nextjs_space/              # Aplicación Next.js
│   ├── app/                   # Rutas y páginas (App Router)
│   │   ├── page.tsx           # Página de inicio (templates + carga YAML/JSON)
│   │   ├── process/           # Página de ejecución del proceso
│   │   │   ├── page.tsx
│   │   │   └── _components/   # Componentes (sidebar, task-card, evidence-modal, etc.)
│   │   └── api/               # API routes
│   │       ├── upload/        # Upload de archivos
│   │       └── processes/     # API de procesos precargados
│   ├── data/                  # Datos estáticos
│   │   └── processes/         # Plantillas YAML precargadas
│   │       ├── index.json     # Índice de procesos disponibles
│   │       ├── it-security-audit.yaml
│   │       ├── devops-release.yaml
│   │       ├── incident-response.yaml
│   │       └── devops-pipeline.yaml  # Con variables y links dinámicos
│   ├── lib/                   # Lógica de negocio y utilidades
│   │   ├── types.ts           # Tipos TypeScript
│   │   ├── store.ts           # Zustand store con persistencia
│   │   ├── yaml-parser.ts     # Parseo de YAML
│   │   ├── json-utils.ts      # Exportación/importación JSON
│   │   ├── word-generator.ts  # Generación de Word con docx
│   │   ├── helpers.ts         # Helpers (progreso, dependencias, validación)
│   │   ├── i18n-context.tsx   # Contexto de traducción (ES/EN)
│   │   ├── aws-config.ts      # Configuración de AWS S3
│   │   └── s3.ts              # Utilidades S3 (upload, download, delete)
│   └── ...
├── example-process.yaml   # Proceso de ejemplo (Auditoría IT)
├── Dockerfile              # Imagen Docker multi-stage
├── docker-compose.yml      # Orquestación Docker
└── README.md               # Este archivo
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto DevSecOps' MVP de demostración. Libre para uso educativo y comercial.

## 📧 Contacto

Para preguntas o soporte, abre un issue en el repositorio.

## 📋 Historial de Cambios

| Fecha | Versión | Descripción |
|-------|---------|-------------|
| 2026-03-27 | 1.2.0 | Variables de proceso y links dinámicos parametrizables, nuevo template `devops-pipeline.yaml` |
| 2026-03-27 | 1.1.0 | Procesos precargados (3 plantillas), API `/api/processes`, actualización a Next.js 15.1.3 |
| 2026-03-01 | 1.0.0 | Versión inicial con carga YAML/JSON, evidencias, exportación Word |

---

**Process Tracker MVP** © 2026 - Desarrollado con ❤️ usando Next.js y TypeScript
