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
  'task.uncompleted': { es: 'Tarea desmarcada', en: 'Task unmarked' },
  'task.pending': { es: 'Pendiente', en: 'Pending' },
  'task.blocked': { es: 'Bloqueada', en: 'Blocked' },
  'task.complete': { es: 'Marcar como Completada', en: 'Mark as Complete' },
  'task.uncomplete': { es: 'Desmarcar', en: 'Unmark' },
  'task.mark': { es: 'Completar tarea', en: 'Complete task' },
  'task.unmark': { es: 'Desmarcar tarea', en: 'Unmark task' },
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
  'evidence.required.description': { es: 'Debes adjuntar la evidencia antes de completar esta tarea', en: 'You must attach evidence before completing this task' },
  'evidence.save': { es: 'Guardar Evidencia', en: 'Save Evidence' },
  'evidence.close': { es: 'Cerrar', en: 'Close' },
  'evidence.delete': { es: 'Eliminar', en: 'Delete' },
  
  // Export
  'export.json': { es: 'Exportar JSON', en: 'Export JSON' },
  'export.word': { es: 'Exportar Word', en: 'Export Word' },
  'export.success': { es: 'Exportado exitosamente', en: 'Exported successfully' },
  'export.generating': { es: 'Generando documento...', en: 'Generating document...' },
  
  // Timer
  'timer.start': { es: 'Iniciar', en: 'Start' },
  'timer.pause': { es: 'Pausar', en: 'Pause' },
  'timer.resume': { es: 'Reanudar', en: 'Resume' },
  'timer.stop': { es: 'Detener', en: 'Stop' },
  'timer.reset': { es: 'Reiniciar', en: 'Reset' },
  'timer.running': { es: 'En progreso', en: 'Running' },
  'timer.paused': { es: 'Pausado', en: 'Paused' },
  'timer.idle': { es: 'Sin iniciar', en: 'Not started' },
  'timer.completed': { es: 'Completado', en: 'Completed' },
  'timer.totalTime': { es: 'Tiempo total', en: 'Total time' },
  'timer.activeTime': { es: 'Tiempo activo', en: 'Active time' },
  'timer.sessions': { es: 'Sesiones', en: 'Sessions' },
  
  // Common
  'common.cancel': { es: 'Cancelar', en: 'Cancel' },
  'common.save': { es: 'Guardar', en: 'Save' },
  'common.close': { es: 'Cerrar', en: 'Close' },
  'common.loading': { es: 'Cargando...', en: 'Loading...' },
  'common.error': { es: 'Error', en: 'Error' },
  'common.success': { es: 'Éxito', en: 'Success' },

  // Process Tray / Tabs / Command Palette
  'tray.title': { es: 'Procesos de Sesión', en: 'Session Processes' },
  'tray.button': { es: 'Procesos', en: 'Processes' },
  'tray.empty': { es: 'No hay procesos en esta sesión', en: 'No processes in this session' },
  'tray.status.active': { es: 'Activo', en: 'Active' },
  'tray.status.paused': { es: 'En Pausa', en: 'Paused' },
  'tray.status.completed': { es: 'Completado', en: 'Completed' },
  'tray.status.cancelled': { es: 'Cancelado', en: 'Cancelled' },
  'tray.action.resume': { es: 'Reanudar', en: 'Resume' },
  'tray.action.cancel': { es: 'Cancelar', en: 'Cancel' },
  'tray.action.remove': { es: 'Eliminar', en: 'Remove' },
  'tray.action.export': { es: 'Exportar', en: 'Export' },
  'tray.action.resumeProcess': { es: 'Reanudar Proceso', en: 'Resume Process' },
  'tray.resumed': { es: 'Proceso reanudado', en: 'Process resumed' },
  'tray.exported': { es: 'Exportado exitosamente', en: 'Exported successfully' },
  'tray.removed': { es: 'Proceso removido', en: 'Process removed' },
  'tray.close': { es: 'Cerrar', en: 'Close' },
  
  // Command Palette
  'palette.search': { es: 'Buscar procesos...', en: 'Search processes...' },
  'palette.noResults': { es: 'Sin resultados', en: 'No results' },
  'palette.noProcesses': { es: 'No hay procesos en la sesión', en: 'No processes in session' },
  'palette.hint': { es: 'Usa ↑↓ para navegar, Enter para seleccionar, Esc para cerrar', en: 'Use ↑↓ to navigate, Enter to select, Esc to close' },
  'palette.goHome': { es: 'Ir al inicio', en: 'Go to home' },
  'palette.current': { es: 'actual', en: 'current' },
  
  // Theme
  'theme.light': { es: 'Modo Claro', en: 'Light Mode' },
  'theme.dark': { es: 'Modo Oscuro', en: 'Dark Mode' },
  'theme.system': { es: 'Sistema', en: 'System' },
  
  // Activities
  'activity.title': { es: 'Actividad', en: 'Activity' },
  'activity.progress': { es: 'Progreso de Actividad', en: 'Activity Progress' },
  'activity.tasks': { es: 'tareas', en: 'tasks' },
  'activity.expand': { es: 'Expandir actividades', en: 'Expand activities' },
  'activity.collapse': { es: 'Colapsar actividades', en: 'Collapse activities' },
  
  // Subprocesses
  'subprocess.title': { es: 'Subproceso', en: 'Subprocess' },
  'subprocess.external': { es: 'Proceso externo', en: 'External process' },
  'subprocess.loading': { es: 'Cargando subproceso...', en: 'Loading subprocess...' },
  'subprocess.loaded': { es: 'Cargado', en: 'Loaded' },
  'subprocess.error': { es: 'Error al cargar', en: 'Load error' },
  'subprocess.pending': { es: 'Pendiente', en: 'Pending' },
  'subprocess.skipped': { es: 'Omitido', en: 'Skipped' },
  'subprocess.optional': { es: 'Opcional', en: 'Optional' },
  'subprocess.required': { es: 'Requerido', en: 'Required' },
  'subprocess.source.github': { es: 'GitHub', en: 'GitHub' },
  'subprocess.source.url': { es: 'URL', en: 'URL' },
  'subprocess.source.local': { es: 'Local', en: 'Local' },
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
