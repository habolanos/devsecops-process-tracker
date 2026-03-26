'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'es' | 'en';

interface Translations {
  [key: string]: {
    es: string;
    en: string;
  };
}

const translations: Translations = {
  // Home page
  'app.title': { es: 'Process Tracker', en: 'Process Tracker' },
  'app.subtitle': { es: 'Gestiona y ejecuta procesos paso a paso con evidencia completa', en: 'Manage and execute processes step-by-step with full evidence' },
  'upload.yaml': { es: 'Cargar Proceso YAML', en: 'Upload YAML Process' },
  'upload.json': { es: 'Importar JSON', en: 'Import JSON' },
  'upload.drag': { es: 'Arrastra tu archivo aquí o haz clic para seleccionar', en: 'Drag your file here or click to select' },
  'upload.loading': { es: 'Cargando...', en: 'Loading...' },
  'upload.error': { es: 'Error al cargar el archivo', en: 'Error loading file' },
  
  // Process execution
  'process.name': { es: 'Proceso', en: 'Process' },
  'process.version': { es: 'Versión', en: 'Version' },
  'process.progress': { es: 'Progreso Global', en: 'Overall Progress' },
  'process.complete': { es: 'Finalizar Proceso', en: 'Complete Process' },
  'process.export': { es: 'Exportar Progreso', en: 'Export Progress' },
  'process.back': { es: 'Volver al Inicio', en: 'Back to Home' },
  
  // Phases
  'phase.progress': { es: 'Progreso de Fase', en: 'Phase Progress' },
  'phase.tasks': { es: 'tareas', en: 'tasks' },
  
  // Tasks
  'task.completed': { es: 'Completada', en: 'Completed' },
  'task.pending': { es: 'Pendiente', en: 'Pending' },
  'task.blocked': { es: 'Bloqueada', en: 'Blocked' },
  'task.complete': { es: 'Marcar como Completada', en: 'Mark as Complete' },
  'task.uncomplete': { es: 'Desmarcar', en: 'Unmark' },
  'task.view': { es: 'Ver Detalles', en: 'View Details' },
  'task.dependencies': { es: 'Dependencias', en: 'Dependencies' },
  'task.references': { es: 'Referencias', en: 'References' },
  
  // Evidence
  'evidence.title': { es: 'Adjuntar Evidencia', en: 'Attach Evidence' },
  'evidence.text': { es: 'Evidencia de Texto', en: 'Text Evidence' },
  'evidence.text.placeholder': { es: 'Describe la evidencia...', en: 'Describe the evidence...' },
  'evidence.images': { es: 'Imágenes', en: 'Images' },
  'evidence.upload': { es: 'Subir desde Archivo', en: 'Upload from File' },
  'evidence.url': { es: 'Desde URL', en: 'From URL' },
  'evidence.url.placeholder': { es: 'https://i.ytimg.com/vi/_HgsrO1DgkA/maxresdefault.jpg', en: 'https://i.ytimg.com/vi/hHXRyr0WOhA/mqdefault.jpg' },
  'evidence.add.url': { es: 'Agregar desde URL', en: 'Add from URL' },
  'evidence.required': { es: 'Evidencia requerida', en: 'Evidence required' },
  'evidence.save': { es: 'Guardar Evidencia', en: 'Save Evidence' },
  'evidence.close': { es: 'Cerrar', en: 'Close' },
  'evidence.delete': { es: 'Eliminar', en: 'Delete' },
  
  // Export
  'export.json': { es: 'Exportar JSON', en: 'Export JSON' },
  'export.word': { es: 'Exportar Word', en: 'Export Word' },
  'export.success': { es: 'Exportado exitosamente', en: 'Exported successfully' },
  'export.generating': { es: 'Generando documento...', en: 'Generating document...' },
  
  // Common
  'common.cancel': { es: 'Cancelar', en: 'Cancel' },
  'common.save': { es: 'Guardar', en: 'Save' },
  'common.close': { es: 'Cerrar', en: 'Close' },
  'common.loading': { es: 'Cargando...', en: 'Loading...' },
  'common.error': { es: 'Error', en: 'Error' },
  'common.success': { es: 'Éxito', en: 'Success' },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('es');

  const t = (key: string): string => {
    return translations[key]?.[language] ?? key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
