'use client';

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import { ProcessState } from './types';

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
    for (const task of phase?.tasks ?? []) {
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
                  
                  sections.push(
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: imageBuffer,
                          transformation: {
                            width: 400,
                            height: 300
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
