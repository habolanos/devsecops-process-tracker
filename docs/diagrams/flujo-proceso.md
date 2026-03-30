# Flujo del Proceso de la Aplicación

Este diagrama muestra el flujo completo de interacción del usuario con la aplicación, desde la selección inicial del proceso hasta la exportación de resultados.

## Descripción

El flujo comienza cuando el usuario accede a la aplicación y selecciona una de tres opciones:
- **Plantilla predefinida**: Selecciona uno de los 5 templates YAML disponibles
- **Archivo YAML personalizado**: Sube su propio archivo de definición de proceso
- **JSON exportado**: Importa un proceso previamente guardado

Una vez cargado el proceso, el usuario puede:
- Navegar entre fases y tareas
- Completar tareas respetando dependencias
- Adjuntar evidencias (imágenes con S3 o modo local Base64)
- Gestionar variables dinámicas
- Auto-completar configuraciones desde archivos DevOps
- Exportar resultados en JSON o Word

## Diagrama

```mermaid
flowchart TD
    Start([Usuario Inicia App]) --> HomePage[Página Principal]
    HomePage --> Choice{Seleccionar Origen}
    
    Choice -->|Plantilla| Template[Seleccionar Template]
    Choice -->|YAML| UploadYAML[Upload Archivo YAML]
    Choice -->|JSON| UploadJSON[Upload JSON Exportado]
    
    Template --> Parse[Parser YAML]
    UploadYAML --> Parse
    UploadJSON --> ImportJSON[Importar Estado JSON]
    
    Parse --> Store[Zustand Store]
    ImportJSON --> Store
    
    Store --> ProcessPage[Página de Proceso]
    
    ProcessPage --> Sidebar[Sidebar: Navegación Fases]
    ProcessPage --> TaskCards[Task Cards]
    ProcessPage --> ProgressBar[Barra de Progreso]
    
    TaskCards --> CheckDeps{Tiene Dependencias?}
    CheckDeps -->|Sí| Blocked[Tarea Bloqueada]
    CheckDeps -->|No| Available[Tarea Disponible]
    
    Blocked --> WaitDeps[Esperar Completar Dependencias]
    WaitDeps --> Available
    
    Available --> Complete{Completar Tarea?}
    Complete -->|Sí| Evidence{Requiere Evidencia?}
    
    Evidence -->|Sí| EvidenceModal[Modal de Evidencias]
    Evidence -->|No| MarkComplete[Marcar Completada]
    
    EvidenceModal --> UploadType{Tipo de Upload}
    UploadType -->|S3 Configurado| S3Upload[Upload a S3]
    UploadType -->|Modo Local| Base64[Convertir a Base64]
    
    S3Upload --> SaveEvidence[Guardar Evidencia]
    Base64 --> SaveEvidence
    
    SaveEvidence --> MarkComplete
    MarkComplete --> UpdateProgress[Actualizar Progreso]
    
    UpdateProgress --> UnblockTasks[Desbloquear Tareas Dependientes]
    UnblockTasks --> ProcessPage
    
    ProcessPage --> Variables{Usar Variables?}
    Variables -->|Sí| VarModal[Modal de Variables]
    VarModal --> ConfigUpload{Cargar Config DevOps?}
    ConfigUpload -->|Sí| AutoFill[Auto-fill Variables]
    ConfigUpload -->|No| ManualInput[Input Manual]
    AutoFill --> DynamicLinks[Links Dinámicos Activos]
    ManualInput --> DynamicLinks
    DynamicLinks --> ProcessPage
    
    ProcessPage --> Export{Exportar?}
    Export -->|JSON| ExportJSON[Exportar a JSON]
    Export -->|Word| ExportWord[Generar Documento Word]
    
    ExportJSON --> Download[Descargar Archivo]
    ExportWord --> Download
    Download --> End([Fin])
    
    Complete -->|No| ProcessPage
    Variables -->|No| ProcessPage
    Export -->|No| ProcessPage
    
    style Start fill:#4ade80
    style End fill:#f87171
    style Store fill:#60a5fa
    style ProcessPage fill:#fbbf24
    style EvidenceModal fill:#a78bfa
    style ExportJSON fill:#34d399
    style ExportWord fill:#34d399
```

## Elementos Clave

### Nodos de Inicio/Fin
- **Verde**: Punto de entrada de la aplicación
- **Rojo**: Finalización del flujo

### Nodos de Proceso
- **Azul**: Almacenamiento en Zustand Store
- **Amarillo**: Página principal de proceso
- **Morado**: Modal de evidencias
- **Verde claro**: Opciones de exportación

### Decisiones Principales
1. **Selección de origen**: Template, YAML o JSON
2. **Dependencias**: Verifica si la tarea está bloqueada
3. **Evidencias**: Determina si se requiere adjuntar pruebas
4. **Tipo de upload**: S3 configurado vs modo local
5. **Variables**: Uso de configuración dinámica
6. **Exportación**: JSON vs Word
