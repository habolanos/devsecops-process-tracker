'use client';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import { ProcessState } from './types';
import { formatDurationLong } from './helpers';
import { replaceFormConfigTokens } from './excel-template-helper';

// Constants for image sizing
const MAX_IMAGE_WIDTH = 500;  // Max width in pixels for Word doc
const MAX_IMAGE_HEIGHT = 400; // Max height in pixels for Word doc

// Helper to get image dimensions from base64 and calculate scaled size
async function getScaledImageDimensions(base64Data: string, mimeType: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    // Default dimensions if we can't determine actual size
    const defaultDimensions = { width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_HEIGHT };
    
    try {
      // Create an image element to get natural dimensions
      if (typeof window !== 'undefined') {
        const img = new Image();
        img.onload = () => {
          const naturalWidth = img.naturalWidth;
          const naturalHeight = img.naturalHeight;
          
          // Calculate scale to fit within max bounds while maintaining aspect ratio
          const widthRatio = MAX_IMAGE_WIDTH / naturalWidth;
          const heightRatio = MAX_IMAGE_HEIGHT / naturalHeight;
          const scale = Math.min(widthRatio, heightRatio, 1); // Don't upscale
          
          resolve({
            width: Math.round(naturalWidth * scale),
            height: Math.round(naturalHeight * scale)
          });
        };
        img.onerror = () => resolve(defaultDimensions);
        img.src = `data:image/${mimeType};base64,${base64Data}`;
      } else {
        resolve(defaultDimensions);
      }
    } catch {
      resolve(defaultDimensions);
    }
  });
}

export async function generateWordDocument(process: ProcessState): Promise<Blob> {
  const sections: Paragraph[] = [];

  // Title
  sections.push(
    new Paragraph({
      text: process?.name ?? 'Proceso',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Metadata
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Versión: ', bold: true }),
        new TextRun(process?.version ?? '')
      ],
      spacing: { after: 200 }
    })
  );

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Descripción: ', bold: true }),
        new TextRun(process?.description ?? '')
      ],
      spacing: { after: 200 }
    })
  );

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Progreso: ', bold: true }),
        new TextRun(`${Math.round((process?.progress ?? 0) * 100)}%`)
      ],
      spacing: { after: 400 }
    })
  );

  if (process?.completedAt) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Completado el: ', bold: true }),
          new TextRun(new Date(process.completedAt).toLocaleString('es-ES'))
        ],
        spacing: { after: 400 }
      })
    );
  }

  // Author Information Section
  if (process?.author) {
    sections.push(
      new Paragraph({
        text: 'Información del Ejecutor',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      })
    );

    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Nombre: ', bold: true }),
          new TextRun(process.author.name),
          ...(process.author.isCustom
            ? []
            : [new TextRun({ text: ' (asignado automáticamente)', italics: true, color: '666666' })])
        ],
        spacing: { after: 100 }
      })
    );

    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Fecha de registro: ', bold: true }),
          new TextRun(new Date(process.author.capturedAt).toLocaleString('es-ES'))
        ],
        spacing: { after: 300 }
      })
    );
  }

  // Time Tracking Section
  if (process?.timeTracking) {
    const { timeTracking } = process;
    
    sections.push(
      new Paragraph({
        text: '📊 Registro de Tiempo',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    // First started
    if (timeTracking.firstStartedAt) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Fecha de inicio: ', bold: true }),
            new TextRun(new Date(timeTracking.firstStartedAt).toLocaleString('es-ES'))
          ],
          spacing: { after: 100 }
        })
      );
    }

    // Total active time
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Tiempo activo total: ', bold: true }),
          new TextRun({ 
            text: formatDurationLong(timeTracking.totalActiveTime),
            color: '2563EB'
          })
        ],
        spacing: { after: 100 }
      })
    );

    // Number of sessions
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Sesiones de trabajo: ', bold: true }),
          new TextRun(`${timeTracking.sessions?.length || 0}`)
        ],
        spacing: { after: 200 }
      })
    );

    // Session details
    if (timeTracking.sessions && timeTracking.sessions.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Detalle de sesiones:',
          spacing: { after: 100 }
        })
      );

      timeTracking.sessions.forEach((session, idx) => {
        const startTime = new Date(session.startedAt).toLocaleString('es-ES');
        const endTime = session.endedAt 
          ? new Date(session.endedAt).toLocaleString('es-ES')
          : 'En progreso';
        const duration = formatDurationLong(session.duration);

        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `  • Sesión ${idx + 1}: `, bold: true }),
              new TextRun(`${startTime} → ${endTime} `),
              new TextRun({ text: `(${duration})`, italics: true, color: '059669' })
            ],
            spacing: { after: 50 }
          })
        );
      });
    }

    // Separator
    sections.push(
      new Paragraph({
        text: '─'.repeat(50),
        spacing: { before: 200, after: 400 }
      })
    );
  }

  // Phases and Tasks
  for (const phase of process?.phases ?? []) {
    sections.push(
      new Paragraph({
        text: phase?.name ?? '',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    if (phase?.description) {
      sections.push(
        new Paragraph({
          text: phase.description,
          spacing: { after: 200 }
        })
      );
    }

    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Progreso de Fase: ', bold: true }),
          new TextRun(`${Math.round((phase?.progress ?? 0) * 100)}%`)
        ],
        spacing: { after: 300 }
      })
    );

    // Tasks
    const allTasks = [...(phase?.tasks ?? []), ...(phase?.activities?.flatMap(a => a.tasks) ?? [])];
    
    // Get templatePath from export-excel task for token replacement
    const exportTask = allTasks.find(t => t.type === 'export-excel' && t.exportConfig);
    const templatePath = exportTask?.exportConfig?.templatePath;

    for (let i = 0; i < allTasks.length; i++) {
      const task = allTasks[i];
      sections.push(
        new Paragraph({
          text: task?.name ?? '',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        })
      );

      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Estado: ', bold: true }),
            new TextRun({
              text: task?.completed ? '✓ Completada' : '○ Pendiente',
              color: task?.completed ? '22C55E' : '94A3B8'
            })
          ],
          spacing: { after: 200 }
        })
      );

      if (task?.description) {
        sections.push(
          new Paragraph({
            text: task.description,
            spacing: { after: 200 }
          })
        );
      }

      if (task?.completedAt) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Completada el: ', bold: true }),
              new TextRun(new Date(task.completedAt).toLocaleString('es-ES'))
            ],
            spacing: { after: 200 }
          })
        );
      }

      // Evidence
      if (task?.completed) {
        sections.push(
          new Paragraph({
            text: 'Evidencia:',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 200 }
          })
        );

        if (task?.evidence?.text) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Texto: ', bold: true }),
                new TextRun(task.evidence.text)
              ],
              spacing: { after: 200 }
            })
          );
        }

        if (task?.evidence?.images && task.evidence.images.length > 0) {
          sections.push(
            new Paragraph({
              text: `Imágenes adjuntas (${task.evidence.images.length}):`,
              spacing: { after: 200 }
            })
          );

          // Add image information
          for (const img of task.evidence.images) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: '• ', bold: true }),
                  new TextRun(`${img?.name ?? 'imagen'}`),
                  img?.originalUrl
                    ? new TextRun({ text: ` (URL: ${img.originalUrl})`, italics: true })
                    : new TextRun('')
                ],
                spacing: { after: 100 }
              })
            );

            // Try to embed image if it's from base64
            if (img?.url && img.url.startsWith('data:image')) {
              try {
                const base64Data = img.url.split(',')[1];
                if (base64Data) {
                  const imageBuffer = Buffer.from(base64Data, 'base64');
                  
                  // Detect image type from data URL
                  const mimeMatch = img.url.match(/data:image\/(.*?);base64/);
                  const imageType = mimeMatch?.[1] || 'png';
                  
                  // Get scaled dimensions maintaining aspect ratio
                  const dimensions = await getScaledImageDimensions(base64Data, imageType);
                  
                  sections.push(
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: imageBuffer,
                          transformation: {
                            width: dimensions.width,
                            height: dimensions.height
                          },
                          type: imageType as any
                        })
                      ],
                      spacing: { after: 200 }
                    })
                  );
                }
              } catch (error) {
                console.error('Error embedding image:', error);
              }
            }
          }
        }

        // Dynamic List Evidence
        if (task?.type === 'dynamic-list') {
          if (task?.listData && task.listData.length > 0) {
            sections.push(
              new Paragraph({
                text: `Lista (${task.listData.length} items):`,
                spacing: { after: 200 }
              })
            );

            task.listData.forEach((item, idx) => {
              sections.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: `${idx + 1}. `, bold: true }),
                    new TextRun(item.value || '')
                  ],
                  spacing: { after: 100 }
                })
              );
            });
          } else {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'No hay items en la lista',
                    italics: true,
                    color: '94A3B8'
                  })
                ],
                spacing: { after: 200 }
              })
            );
          }
        }

        // Detail List Evidence
        if (task?.type === 'detail-list') {
          if (task?.detailData && task.detailData.length > 0) {
            sections.push(
              new Paragraph({
                text: `Detalles (${task.detailData.length} items):`,
                spacing: { after: 200 }
              })
            );

            task.detailData.forEach((item, idx) => {
              sections.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: `${idx + 1}. `, bold: true }),
                    new TextRun(item.sourceItem || ''),
                    new TextRun({ text: ': ', bold: true }),
                    new TextRun(item.capturedText || '')
                  ],
                  spacing: { after: 100 }
                })
              );
            });
          } else {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'No hay detalles capturados',
                    italics: true,
                    color: '94A3B8'
                  })
                ],
                spacing: { after: 200 }
              })
            );
          }
        }

        // Form Evidence
        if (task?.type === 'form') {
          let formConfig = task.formConfig;
          
          // Replace tokens in form labels if templatePath is available
          if (templatePath && formConfig) {
            try {
              formConfig = await replaceFormConfigTokens(formConfig, templatePath);
            } catch (error) {
              console.error('Error replacing form tokens in Word report:', error);
              // Fallback to original config
            }
          }
          
          if (task?.formData && task.formData.length > 0) {
            sections.push(
              new Paragraph({
                text: `Datos del Formulario (${task.formData.length} campos):`,
                spacing: { after: 200 }
              })
            );

            task.formData.forEach((field) => {
              const fieldConfig = formConfig?.fields.find(f => f.id === field.fieldId);
              const label = fieldConfig?.label || field.fieldId;
              const value = field.value ?? '';

              sections.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: `${label}: `, bold: true }),
                    new TextRun(String(value))
                  ],
                  spacing: { after: 100 }
                })
              );
            });
          } else {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'No hay datos del formulario',
                    italics: true,
                    color: '94A3B8'
                  })
                ],
                spacing: { after: 200 }
              })
            );
          }
        }

        // If no evidence at all for completed task
        if (task?.completed && !task?.evidence?.text && (!task?.evidence?.images || task.evidence.images.length === 0) && task?.type !== 'dynamic-list' && task?.type !== 'detail-list' && task?.type !== 'form') {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Sin evidencia',
                  italics: true,
                  color: '94A3B8'
                })
              ],
              spacing: { after: 200 }
            })
          );
        }
      }
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections
      }
    ]
  });

  // Generate blob
  const blob = await Packer.toBlob(doc);
  return blob;
}

export function downloadWordDocument(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
