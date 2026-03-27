// Core TypeScript types for Process Tracker

export interface ProcessYAML {
  process: {
    id: string;
    name: string;
    description: string;
    version: string;
    phases: PhaseYAML[];
  };
}

export interface PhaseYAML {
  id: string;
  name: string;
  description: string;
  order: number;
  tasks: TaskYAML[];
}

export interface TaskYAML {
  id: string;
  name: string;
  description: string;
  order: number;
  references?: Reference[];
  evidence: EvidenceConfig;
  dependencies?: string[];
}

export interface Reference {
  label: string;
  url: string;
}

export interface EvidenceConfig {
  type: 'text' | 'image' | 'both';
  required: boolean;
  description?: string;
}

// Runtime state types
export interface ProcessState {
  id: string;
  name: string;
  description: string;
  version: string;
  loadedAt: string;
  exportedAt?: string;
  completedAt?: string;
  progress: number;
  phases: PhaseState[];
}

export interface PhaseState {
  id: string;
  name: string;
  description: string;
  order: number;
  progress: number;
  tasks: TaskState[];
}

export interface TaskState {
  id: string;
  name: string;
  description: string;
  order: number;
  references: Reference[];
  evidenceConfig: EvidenceConfig;
  dependencies: string[];
  completed: boolean;
  completedAt?: string;
  evidence: TaskEvidence;
  isBlocked: boolean;
}

export interface TaskEvidence {
  text?: string;
  images: EvidenceImage[];
}

export interface EvidenceImage {
  id: string;
  name: string;
  cloudStoragePath: string;
  isPublic: boolean;
  url?: string;
  source: 'file' | 'url';
  originalUrl?: string;
  uploadedAt: string;
}

// Export JSON format
export interface ProcessExportJSON {
  process: {
    id: string;
    name: string;
    description: string;
    version: string;
    exportedAt: string;
    completedAt?: string;
    progress: number;
    phases: PhaseExport[];
  };
}

export interface PhaseExport {
  id: string;
  name: string;
  description: string;
  order: number;
  progress: number;
  tasks: TaskExport[];
}

export interface TaskExport {
  id: string;
  name: string;
  description: string;
  order: number;
  completed: boolean;
  completedAt?: string;
  evidence: {
    text?: string;
    images: {
      name: string;
      data: string; // base64
      source: 'file' | 'url';
      originalUrl?: string;
    }[];
  };
}
