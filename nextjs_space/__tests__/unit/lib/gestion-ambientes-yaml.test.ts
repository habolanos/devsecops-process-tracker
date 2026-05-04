/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('gestion-ambientes.yaml Process Definition', () => {
  const yamlPath = path.join(process.cwd(), 'data/processes/gestion-ambientes.yaml');
  let processData: any;

  beforeAll(() => {
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    processData = yaml.load(yamlContent) as any;
  });

  describe('Process Metadata', () => {
    it('should have required process fields', () => {
      expect(processData.process).toBeDefined();
      expect(processData.process.id).toBe('gestion-ambientes-2026');
      expect(processData.process.name).toBe('Gestión de Ambientes');
      expect(processData.process.version).toBe('1.0.0');
    });

    it('should not have estimatedTime (multi-day process, timer not applicable)', () => {
      expect(processData.process.estimatedTime).toBeUndefined();
    });

    it('should have description containing expected keywords', () => {
      expect(processData.process.description).toContain('ambientes cloud');
    });
  });

  describe('Variables', () => {
    it('should have 7 variables defined', () => {
      const variables = processData.process.variables;
      expect(variables).toBeDefined();
      expect(Array.isArray(variables)).toBe(true);
      expect(variables.length).toBe(7);
    });

    it('should have id_presupuesto variable', () => {
      const v = processData.process.variables.find((v: any) => v.key === 'id_presupuesto');
      expect(v).toBeDefined();
      expect(v.type).toBe('text');
      expect(v.required).toBe(true);
    });

    it('should have centro_costo variable', () => {
      const v = processData.process.variables.find((v: any) => v.key === 'centro_costo');
      expect(v).toBeDefined();
      expect(v.type).toBe('text');
      expect(v.required).toBe(true);
    });

    it('should have sponsor variable', () => {
      const v = processData.process.variables.find((v: any) => v.key === 'sponsor');
      expect(v).toBeDefined();
      expect(v.required).toBe(true);
    });

    it('should have id_iniciativa variable', () => {
      const v = processData.process.variables.find((v: any) => v.key === 'id_iniciativa');
      expect(v).toBeDefined();
      expect(v.required).toBe(true);
    });

    it('should have nombre_division variable', () => {
      const v = processData.process.variables.find((v: any) => v.key === 'nombre_division');
      expect(v).toBeDefined();
      expect(v.required).toBe(true);
    });

    it('should have arq_industria variable', () => {
      const v = processData.process.variables.find((v: any) => v.key === 'arq_industria');
      expect(v).toBeDefined();
      expect(v.required).toBe(true);
    });

    it('should have arq_cloud variable', () => {
      const v = processData.process.variables.find((v: any) => v.key === 'arq_cloud');
      expect(v).toBeDefined();
      expect(v.required).toBe(true);
    });
  });

  describe('Phases', () => {
    it('should have exactly 11 phases', () => {
      expect(processData.process.phases).toBeDefined();
      expect(processData.process.phases.length).toBe(11);
    });

    it('should have phases with sequential order (1-11)', () => {
      const phases = processData.process.phases;
      for (let i = 0; i < phases.length; i++) {
        expect(phases[i].order).toBe(i + 1);
      }
    });

    it('should have Phase 1: Análisis y Definición de Solicitud', () => {
      const p = processData.process.phases[0];
      expect(p.id).toBe('phase-1-analisis');
      expect(p.name).toContain('Análisis');
      expect(p.tasks.length).toBeGreaterThan(0);
    });

    it('should have Phase 2: Certificación de Arquitectura', () => {
      const p = processData.process.phases[1];
      expect(p.id).toBe('phase-2-certificacion');
      expect(p.name).toContain('Certificación');
    });

    it('should have Phase 3: Gestión de Arquitectura Nube', () => {
      const p = processData.process.phases[2];
      expect(p.id).toBe('phase-3-arq-nube');
      expect(p.name).toContain('Arquitectura Nube');
    });

    it('should have Phase 4: Solicitud de Infraestructura', () => {
      const p = processData.process.phases[3];
      expect(p.id).toBe('phase-4-solicitud-infra');
      expect(p.name).toContain('Solicitud de Infraestructura');
    });

    it('should have Phase 5: Validación de la Documentación', () => {
      const p = processData.process.phases[4];
      expect(p.id).toBe('phase-5-validacion-doc');
      expect(p.name).toContain('Validación');
    });

    it('should have Phase 6: Validación ID Presupuesto', () => {
      const p = processData.process.phases[5];
      expect(p.id).toBe('phase-6-validacion-presupuesto');
      expect(p.name).toContain('Presupuesto');
    });

    it('should have Phase 7: Gestionar Kickoff', () => {
      const p = processData.process.phases[6];
      expect(p.id).toBe('phase-7-kickoff');
      expect(p.name).toContain('Kickoff');
    });

    it('should have Phase 8: Solicitud de Despliegue', () => {
      const p = processData.process.phases[7];
      expect(p.id).toBe('phase-8-solicitud-despliegue');
      expect(p.name).toContain('Despliegue de Infraestructura');
    });

    it('should have Phase 9: Implementación y Despliegue', () => {
      const p = processData.process.phases[8];
      expect(p.id).toBe('phase-9-implementacion');
      expect(p.name).toContain('Implementación');
    });

    it('should have Phase 10: Validación de Despliegue', () => {
      const p = processData.process.phases[9];
      expect(p.id).toBe('phase-10-validacion-despliegue');
      expect(p.name).toContain('Validación de Despliegue');
    });

    it('should have Phase 11: Gestión de Configuración as last phase', () => {
      const p = processData.process.phases[10];
      expect(p.id).toBe('phase-11-configuracion');
      expect(p.name).toContain('Configuración');
    });
  });

  describe('Task Types', () => {
    it('should have standard type tasks', () => {
      const allTasks = processData.process.phases.flatMap((p: any) => p.tasks || []);
      const standardTasks = allTasks.filter((t: any) => t.type === 'standard' || !t.type);
      expect(standardTasks.length).toBeGreaterThan(0);
    });

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

    it('should have form type task in phase 3', () => {
      const phase3 = processData.process.phases[2];
      const formTask = phase3.tasks.find((t: any) => t.type === 'form');
      expect(formTask).toBeDefined();
      expect(formTask.formConfig).toBeDefined();
      expect(formTask.formConfig.fields.length).toBeGreaterThan(0);
    });

    it('should have dynamic-list type task in phase 9', () => {
      const phase9 = processData.process.phases[8];
      const listTask = phase9.tasks.find((t: any) => t.type === 'dynamic-list');
      expect(listTask).toBeDefined();
      expect(listTask.listConfig).toBeDefined();
      expect(listTask.listConfig.minItems).toBe(1);
    });
  });

  describe('Completion Alerts', () => {
    it('should have completionAlert in phase 2 (certification)', () => {
      const phase2 = processData.process.phases[1];
      const taskWithAlert = phase2.tasks.find((t: any) => t.completionAlert);
      expect(taskWithAlert).toBeDefined();
      expect(taskWithAlert.completionAlert.severity).toBe('warning');
    });

    it('should have critical completionAlert in phase 6 (budget authorization)', () => {
      const phase6 = processData.process.phases[5];
      const taskWithAlert = phase6.tasks.find((t: any) => t.completionAlert);
      expect(taskWithAlert).toBeDefined();
      expect(taskWithAlert.completionAlert.severity).toBe('critical');
    });

    it('should have warning completionAlert in phase 5 (doc validation)', () => {
      const phase5 = processData.process.phases[4];
      const taskWithAlert = phase5.tasks.find((t: any) => t.completionAlert);
      expect(taskWithAlert).toBeDefined();
      expect(taskWithAlert.completionAlert.severity).toBe('warning');
    });

    it('should have warning completionAlert in phase 10 (deployment validation)', () => {
      const phase10 = processData.process.phases[9];
      const taskWithAlert = phase10.tasks.find((t: any) => t.completionAlert);
      expect(taskWithAlert).toBeDefined();
      expect(taskWithAlert.completionAlert.severity).toBe('warning');
    });

    it('should have info completionAlert in phase 11 (closure)', () => {
      const phase11 = processData.process.phases[10];
      const taskWithAlert = phase11.tasks.find((t: any) => t.completionAlert);
      expect(taskWithAlert).toBeDefined();
      expect(taskWithAlert.completionAlert.severity).toBe('info');
    });
  });

  describe('Task Dependencies', () => {
    it('should have valid task dependencies referencing existing task IDs', () => {
      const phases = processData.process.phases;
      const allTaskIds = phases.flatMap((p: any) => p.tasks.map((t: any) => t.id));

      phases.forEach((phase: any) => {
        phase.tasks.forEach((task: any) => {
          if (task.dependencies) {
            task.dependencies.forEach((dep: string) => {
              expect(allTaskIds).toContain(dep);
            });
          }
        });
      });
    });

    it('should have cross-phase dependency from phase 2 to phase 1', () => {
      const phase2 = processData.process.phases[1];
      const firstTask = phase2.tasks[0];
      expect(firstTask.dependencies).toContain('task-1-2-prerrequisitos');
    });

    it('should have last phase start depending on phase 10 validation task', () => {
      const phase11 = processData.process.phases[10];
      const firstTask = phase11.tasks[0];
      expect(firstTask.dependencies).toContain('task-10-2-confirmar-validacion');
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

    it('should require image evidence in phase 9 verification task', () => {
      const phase9 = processData.process.phases[8];
      const verifyTask = phase9.tasks.find((t: any) => t.id === 'task-9-3-verificar-entrega');
      expect(verifyTask.evidence.type).toBe('image');
      expect(verifyTask.evidence.required).toBe(true);
    });
  });

  describe('Check Items', () => {
    it('should have checkItems for all multicheck tasks', () => {
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

    it('should have checkItem for all check tasks', () => {
      const allTasks = processData.process.phases.flatMap((p: any) => p.tasks || []);
      const checkTasks = allTasks.filter((t: any) => t.type === 'check');

      checkTasks.forEach((task: any) => {
        expect(task.checkItem).toBeDefined();
        expect(task.checkItem.description).toBeDefined();
        expect(typeof task.checkItem.required).toBe('boolean');
      });
    });

    it('should have 9 checkItems in phase 1 prerequisite task', () => {
      const phase1 = processData.process.phases[0];
      const prereqTask = phase1.tasks.find((t: any) => t.id === 'task-1-2-prerrequisitos');
      expect(prereqTask.checkItems.length).toBe(9);
    });
  });

  describe('Output Variables', () => {
    it('should have outputVars in phase 3 estimation task', () => {
      const phase3 = processData.process.phases[2];
      const formTask = phase3.tasks.find((t: any) => t.outputVars);
      expect(formTask).toBeDefined();
      expect(formTask.outputVars.length).toBe(3);
    });

    it('should have outputVars in phase 9 dynamic-list task', () => {
      const phase9 = processData.process.phases[8];
      const listTask = phase9.tasks.find((t: any) => t.type === 'dynamic-list');
      expect(listTask.outputVars).toBeDefined();
      expect(listTask.outputVars[0].name).toBe('componentesDespliegue');
      expect(listTask.outputVars[0].type).toBe('list');
    });
  });
});
