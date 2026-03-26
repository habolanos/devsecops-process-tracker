import { ProcessState, ProcessExportJSON, TaskExport, PhaseExport } from './types';

export async function exportProcessToJSON(process: ProcessState): Promise<ProcessExportJSON> {
  const exportData: ProcessExportJSON = {
    process: {
      id: process.id,
      name: process.name,
      description: process.description,
      version: process.version,
      exportedAt: new Date().toISOString(),
      completedAt: process.completedAt,
      progress: process.progress,
      phases: await Promise.all(
        process.phases.map(async (phase) => {
          const phaseExport: PhaseExport = {
            id: phase.id,
            name: phase.name,
            description: phase.description,
            order: phase.order,
            progress: phase.progress,
            tasks: await Promise.all(
              phase.tasks.map(async (task) => {
                const taskExport: TaskExport = {
                  id: task.id,
                  name: task.name,
                  description: task.description,
                  order: task.order,
                  completed: task.completed,
                  completedAt: task.completedAt,
                  evidence: {
                    text: task.evidence.text,
                    images: await Promise.all(
                      task.evidence.images.map(async (img) => {
                        // Fetch image and convert to base64
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
                return taskExport;
              })
            )
          };
          return phaseExport;
        })
      )
    }
  };

  return exportData;
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
      phases: process.phases.map((phase) => ({
        id: phase.id,
        name: phase.name,
        description: phase.description || '',
        order: phase.order || 0,
        progress: phase.progress || 0,
        tasks: phase.tasks.map((task) => ({
          id: task.id,
          name: task.name,
          description: task.description || '',
          order: task.order || 0,
          references: [],
          evidenceConfig: { type: 'both' as const, required: false },
          dependencies: [],
          completed: task.completed || false,
          completedAt: task.completedAt,
          evidence: {
            text: task.evidence?.text,
            images: task.evidence?.images?.map((img, idx) => ({
              id: `imported-${task.id}-${idx}`,
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
        }))
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
