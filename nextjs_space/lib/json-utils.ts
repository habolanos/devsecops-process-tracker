import { ProcessState, ProcessExportJSON, TaskExport, PhaseExport, ActivityExport, TaskState, ProcessAuthor } from './types';
import { useUserProfileStore } from './user-profile-store';

// Helper function to export a single task
async function exportTask(task: TaskState): Promise<TaskExport> {
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    order: task.order,
    completed: task.completed,
    completedAt: task.completedAt,
    type: task.type,
    checkItems: task.checkItems,
    references: task.references || [],
    dependencies: task.dependencies || [],
    dynamicLinks: task.dynamicLinks || [],
    evidenceConfig: task.evidenceConfig || { type: 'text', required: false },
    exportConfig: task.exportConfig,
    listConfig: task.listConfig,
    listData: task.listData || [],
    detailConfig: task.detailConfig,
    detailData: task.detailData || [],
    formConfig: task.formConfig,
    formData: task.formData || [],
    evidence: {
      text: task.evidence.text,
      images: await Promise.all(
        task.evidence.images.map(async (img) => {
          let base64Data = '';
          try {
            if (img.url) {
              const response = await fetch(img.url);
              const blob = await response.blob();
              base64Data = await blobToBase64(blob);
            }
          } catch (error) {
            console.error(`Failed to fetch image ${img.name}:`, error);
          }
          return {
            name: img.name,
            data: base64Data,
            source: img.source,
            originalUrl: img.originalUrl
          };
        })
      )
    }
  };
}

export async function exportProcessToJSON(process: ProcessState): Promise<ProcessExportJSON> {
  // Capture author: prefer existing, fallback to current user profile
  const author: ProcessAuthor | undefined = process.author || (() => {
    const userProfile = useUserProfileStore.getState().profile;
    if (userProfile) {
      return {
        name: userProfile.name,
        avatarId: userProfile.avatarId,
        isCustom: userProfile.isCustom,
        capturedAt: new Date().toISOString(),
      };
    }
    return undefined;
  })();

  const exportData: ProcessExportJSON = {
    process: {
      id: process.id,
      name: process.name,
      description: process.description,
      version: process.version,
      exportedAt: new Date().toISOString(),
      completedAt: process.completedAt,
      progress: process.progress,
      author,
      phases: await Promise.all(
        process.phases.map(async (phase) => {
          // Export activities
          const activitiesExport: ActivityExport[] = await Promise.all(
            (phase.activities ?? []).map(async (activity) => ({
              id: activity.id,
              name: activity.name,
              description: activity.description,
              order: activity.order,
              progress: activity.progress,
              tasks: await Promise.all(activity.tasks.map(exportTask))
            }))
          );

          // Export direct tasks
          const tasksExport: TaskExport[] = await Promise.all(
            (phase.tasks ?? []).map(exportTask)
          );

          const phaseExport: PhaseExport = {
            id: phase.id,
            name: phase.name,
            description: phase.description,
            order: phase.order,
            progress: phase.progress,
            activities: activitiesExport,
            tasks: tasksExport
          };
          return phaseExport;
        })
      )
    }
  };

  return exportData;
}

// Helper function to import a single task
function importTask(task: TaskExport, prefix: string): TaskState {
  return {
    id: task.id,
    name: task.name,
    description: task.description || '',
    order: task.order || 0,
    type: task.type || 'standard',
    checkItems: task.checkItems || [],
    references: task.references || [],
    dependencies: task.dependencies || [],
    dynamicLinks: task.dynamicLinks || [],
    evidenceConfig: task.evidenceConfig || { type: 'both' as const, required: false },
    exportConfig: task.exportConfig,
    listConfig: task.listConfig,
    listData: task.listData || [],
    detailConfig: task.detailConfig,
    detailData: task.detailData || [],
    formConfig: task.formConfig,
    formData: task.formData || [],
    completed: task.completed || false,
    completedAt: task.completedAt,
    evidence: {
      text: task.evidence?.text,
      images: task.evidence?.images?.map((img, idx) => ({
        id: `${prefix}-${task.id}-${idx}`,
        name: img.name,
        cloudStoragePath: '',
        isPublic: false,
        url: img.data ? `data:image/png;base64,${img.data}` : undefined,
        source: img.source || 'file' as const,
        originalUrl: img.originalUrl,
        uploadedAt: new Date().toISOString()
      })) || []
    },
    isBlocked: false
  };
}

export function importProcessFromJSON(jsonData: ProcessExportJSON): ProcessState {
  try {
    const { process } = jsonData;
    
    if (!process?.id || !process?.name || !process?.phases) {
      throw new Error('Invalid JSON structure');
    }

    const processState: ProcessState = {
      id: process.id,
      name: process.name,
      description: process.description || '',
      version: process.version || '1.0.0',
      loadedAt: new Date().toISOString(),
      exportedAt: process.exportedAt,
      completedAt: process.completedAt,
      progress: process.progress || 0,
      variableDefinitions: [],
      capturedVariables: {},
      subprocesses: [],
      timeTracking: {
        status: 'idle',
        sessions: [],
        totalActiveTime: 0
      },
      // Preserve original author from imported JSON
      author: process.author || undefined,
      phases: process.phases.map((phase) => ({
        id: phase.id,
        name: phase.name,
        description: phase.description || '',
        order: phase.order || 0,
        progress: phase.progress || 0,
        dynamicLinks: [],
        activities: (phase.activities ?? []).map((activity) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description || '',
          order: activity.order || 0,
          progress: activity.progress || 0,
          dynamicLinks: [],
          images: [],
          tasks: activity.tasks.map((task) => importTask(task, 'imported-activity'))
        })),
        tasks: (phase.tasks ?? []).map((task) => importTask(task, 'imported'))
      }))
    };

    return processState;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to import JSON: ${errorMessage}`);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function downloadJSON(data: ProcessExportJSON, filename: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
