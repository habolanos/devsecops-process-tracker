// Core TypeScript types for Process Tracker

// ============================================
// Process Variables (User Input at Runtime)
// ============================================

export interface ProcessVariableYAML {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[];        // For type: 'select'
  defaultValue?: string;
}

export interface CapturedVariables {
  [key: string]: string;
}

// ============================================
// Dynamic Links
// ============================================

export interface DynamicLinkYAML {
  label: string;
  urlTemplate: string;        // Template with {variable} placeholders
  behavior: 'auto' | 'click'; // auto-opens or requires click
  delay?: number;             // Seconds before auto-open (default: 0)
  newTab?: boolean;           // Open in new tab (default: true)
  requiresVariables?: string[]; // Variables needed to activate link
}

// ============================================
// YAML Structure
// ============================================

export interface ProcessYAML {
  process: {
    id: string;
    name: string;
    description: string;
    version: string;
    variables?: ProcessVariableYAML[];  // Global process variables
    phases: PhaseYAML[];
  };
}

export interface PhaseYAML {
  id: string;
  name: string;
  description: string;
  order: number;
  tasks: TaskYAML[];
  dynamicLinks?: DynamicLinkYAML[];  // Phase-level dynamic links
}

export interface TaskYAML {
  id: string;
  name: string;
  description: string;
  order: number;
  references?: Reference[];
  evidence: EvidenceConfig;
  dependencies?: string[];
  dynamicLinks?: DynamicLinkYAML[];  // Task-level dynamic links
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

// ============================================
// Runtime State Types
// ============================================

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
  variableDefinitions: ProcessVariableYAML[];  // Variable definitions from YAML
  capturedVariables: CapturedVariables;        // User-captured values
}

export interface PhaseState {
  id: string;
  name: string;
  description: string;
  order: number;
  progress: number;
  tasks: TaskState[];
  dynamicLinks: DynamicLinkYAML[];  // Phase-level dynamic links
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
  dynamicLinks: DynamicLinkYAML[];  // Task-level dynamic links
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
