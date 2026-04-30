import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('release-checklist.yaml Process Definition', () => {
  const yamlPath = path.join(process.cwd(), 'data/processes/release-checklist.yaml');
  let processData: any;

  beforeAll(() => {
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    processData = yaml.load(yamlContent) as any;
  });

  describe('Process Metadata', () => {
    it('should have required process fields', () => {
      expect(processData.process).toBeDefined();
      expect(processData.process.id).toBe('release-checklist-2026');
      expect(processData.process.name).toBe('Checklist de Liberación');
      expect(processData.process.version).toBe('1.1.0');
    });

    it('should have estimatedTime defined', () => {
      expect(processData.process.estimatedTime).toBeDefined();
      expect(processData.process.estimatedTime).toBe('45m');
    });

    it('should have description', () => {
      expect(processData.process.description).toContain('liberaciones a producción');
    });
  });

  describe('Variables', () => {
    it('should have required variables defined', () => {
      const variables = processData.process.variables;
      expect(variables).toBeDefined();
      expect(Array.isArray(variables)).toBe(true);
      expect(variables.length).toBeGreaterThan(0);
    });

    it('should have torre variable with select type', () => {
      const torre = processData.process.variables.find((v: any) => v.key === 'torre');
      expect(torre).toBeDefined();
      expect(torre.type).toBe('select');
      expect(torre.required).toBe(true);
      expect(torre.options).toContain('Tienda');
      expect(torre.options).toContain('Cds');
    });

    it('should have nombreProyecto variable', () => {
      const nombreProyecto = processData.process.variables.find((v: any) => v.key === 'nombreProyecto');
      expect(nombreProyecto).toBeDefined();
      expect(nombreProyecto.type).toBe('text');
      expect(nombreProyecto.required).toBe(true);
    });

    it('should have rfc variable', () => {
      const rfc = processData.process.variables.find((v: any) => v.key === 'rfc');
      expect(rfc).toBeDefined();
      expect(rfc.type).toBe('text');
      expect(rfc.required).toBe(true);
    });

    it('should have tipoLiberacion variable with options', () => {
      const tipoLiberacion = processData.process.variables.find((v: any) => v.key === 'tipoLiberacion');
      expect(tipoLiberacion).toBeDefined();
      expect(tipoLiberacion.type).toBe('select');
      expect(tipoLiberacion.options).toContain('Staging');
      expect(tipoLiberacion.options).toContain('Produccion');
    });

    it('should have tiempoGuardia variable', () => {
      const tiempoGuardia = processData.process.variables.find((v: any) => v.key === 'tiempoGuardia');
      expect(tiempoGuardia).toBeDefined();
      expect(tiempoGuardia.type).toBe('select');
      expect(tiempoGuardia.options.length).toBeGreaterThan(5);
    });
  });

  describe('Phases', () => {
    it('should have 7 phases', () => {
      expect(processData.process.phases).toBeDefined();
      expect(processData.process.phases.length).toBe(7);
    });

    it('should have phases in correct order', () => {
      const phases = processData.process.phases;
      for (let i = 0; i < phases.length; i++) {
        expect(phases[i].order).toBe(i + 1);
      }
    });

    it('should have Phase 1: Información General', () => {
      const phase1 = processData.process.phases[0];
      expect(phase1.id).toBe('phase-1');
      expect(phase1.name).toBe('Información General');
      expect(phase1.tasks.length).toBeGreaterThan(0);
    });

    it('should have Phase 2: Validaciones Pre-Liberación', () => {
      const phase2 = processData.process.phases[1];
      expect(phase2.id).toBe('phase-2');
      expect(phase2.name).toBe('Validaciones Pre-Liberación');
    });

    it('should have Phase 7: Generación de Reporte as last phase', () => {
      const lastPhase = processData.process.phases[6];
      expect(lastPhase.id).toBe('phase-7');
      expect(lastPhase.name).toBe('Generación de Reporte');
    });
  });

  describe('Export Excel Task', () => {
    it('should have export-excel task in last phase', () => {
      const lastPhase = processData.process.phases[6];
      const exportTask = lastPhase.tasks.find((t: any) => t.type === 'export-excel');
      
      expect(exportTask).toBeDefined();
      expect(exportTask.id).toBe('task-7-2');
      expect(exportTask.name).toBe('Generar Reporte Excel');
    });

    it('should have exportConfig in export-excel task', () => {
      const lastPhase = processData.process.phases[6];
      const exportTask = lastPhase.tasks.find((t: any) => t.type === 'export-excel');
      
      expect(exportTask.exportConfig).toBeDefined();
      expect(exportTask.exportConfig.templatePath).toContain('TEMPLATE_Checklist_Liberacion.xlsx');
      expect(exportTask.exportConfig.autoDownload).toBe(true);
    });

    it('should have export-excel task as last task with dependency', () => {
      const lastPhase = processData.process.phases[6];
      const tasks = lastPhase.tasks;
      const exportTask = tasks[tasks.length - 1];
      
      expect(exportTask.type).toBe('export-excel');
      expect(exportTask.dependencies).toContain('task-7-1');
    });
  });

  describe('Task Types', () => {
    it('should have check type tasks', () => {
      const allTasks = processData.process.phases.flatMap((p: any) => p.tasks || []);
      const checkTasks = allTasks.filter((t: any) => t.type === 'check');
      
      expect(checkTasks.length).toBeGreaterThan(0);
    });

    it('should have multicheck type tasks', () => {
      const allTasks = processData.process.phases.flatMap((p: any) => p.tasks || []);
      const multicheckTasks = allTasks.filter((t: any) => t.type === 'multicheck');
      
      expect(multicheckTasks.length).toBeGreaterThan(0);
    });

    it('should have standard type tasks', () => {
      const allTasks = processData.process.phases.flatMap((p: any) => p.tasks || []);
      const standardTasks = allTasks.filter((t: any) => t.type === 'standard' || !t.type);
      
      expect(standardTasks.length).toBeGreaterThan(0);
    });

    it('should have exactly one export-excel task', () => {
      const allTasks = processData.process.phases.flatMap((p: any) => p.tasks || []);
      const exportTasks = allTasks.filter((t: any) => t.type === 'export-excel');
      
      expect(exportTasks.length).toBe(1);
    });
  });

  describe('Task Dependencies', () => {
    it('should have valid task dependencies within phases', () => {
      const phases = processData.process.phases;
      
      phases.forEach((phase: any) => {
        const taskIds = phase.tasks.map((t: any) => t.id);
        
        phase.tasks.forEach((task: any) => {
          if (task.dependencies) {
            task.dependencies.forEach((dep: string) => {
              // Dependencies should reference existing tasks (in same phase or earlier)
              const allTaskIds = phases
                .filter((p: any) => p.order <= phase.order)
                .flatMap((p: any) => p.tasks.map((t: any) => t.id));
              
              expect(allTaskIds).toContain(dep);
            });
          }
        });
      });
    });
  });

  describe('Evidence Configuration', () => {
    it('should have evidence config for all tasks', () => {
      const allTasks = processData.process.phases.flatMap((p: any) => p.tasks || []);
      
      allTasks.forEach((task: any) => {
        expect(task.evidence).toBeDefined();
        expect(['text', 'image', 'both', 'form']).toContain(task.evidence.type);
        expect(typeof task.evidence.required).toBe('boolean');
      });
    });

    it('should have image evidence required for Harbor validation', () => {
      const phase2 = processData.process.phases[1];
      const harborTask = phase2.tasks.find((t: any) => t.name.includes('Harbor'));
      
      expect(harborTask).toBeDefined();
      expect(harborTask.evidence.type).toBe('image');
      expect(harborTask.evidence.required).toBe(true);
    });
  });

  describe('Check Items', () => {
    it('should have checkItems for multicheck tasks', () => {
      const allTasks = processData.process.phases.flatMap((p: any) => p.tasks || []);
      const multicheckTasks = allTasks.filter((t: any) => t.type === 'multicheck');
      
      multicheckTasks.forEach((task: any) => {
        expect(task.checkItems).toBeDefined();
        expect(Array.isArray(task.checkItems)).toBe(true);
        expect(task.checkItems.length).toBeGreaterThan(0);
        
        task.checkItems.forEach((item: any) => {
          expect(item.id).toBeDefined();
          expect(item.description).toBeDefined();
          expect(typeof item.required).toBe('boolean');
        });
      });
    });

    it('should have checkItem for check tasks', () => {
      const allTasks = processData.process.phases.flatMap((p: any) => p.tasks || []);
      const checkTasks = allTasks.filter((t: any) => t.type === 'check');
      
      checkTasks.forEach((task: any) => {
        expect(task.checkItem).toBeDefined();
        expect(task.checkItem.description).toBeDefined();
        expect(typeof task.checkItem.required).toBe('boolean');
      });
    });
  });
});
