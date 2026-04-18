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
    subprocesses?: SubprocessYAML[];    // External process references (optional)
  };
}

export interface PhaseYAML {
  id: string;
  name: string;
  description: string;
  order: number;
  activities?: ActivityYAML[];          // Intermediate level (optional)
  tasks?: TaskYAML[];                   // Direct tasks (legacy, optional if activities exist)
  dynamicLinks?: DynamicLinkYAML[];     // Phase-level dynamic links
}

export interface ActivityYAML {
  id: string;
  name: string;
  description?: string;
  order: number;
  tasks: TaskYAML[];                    // Minimum 1 task required
  dynamicLinks?: DynamicLinkYAML[];     // Activity-level dynamic links
  images?: ActivityImageYAML[];         // Illustrations/diagrams (optional)
}

export interface ActivityImageYAML {
  id: string;
  name: string;
  url: string;                          // Image URL
  caption?: string;                     // Optional caption/description
}

export interface SubprocessYAML {
  id: string;
  name: string;
  order: number;
  source: SubprocessSource;
  variables?: Record<string, string>;   // Variables to pass to subprocess
  optional?: boolean;                   // If subprocess can be skipped
}

export interface SubprocessSource {
  type: 'github' | 'url' | 'local';
  url?: string;                         // For github/url types
  path?: string;                        // For local type
  ref?: string;                         // Tag/branch for github
}

export interface TaskYAML {
  id: string;
  name: string;
  description?: string;                 // Optional for check/multicheck (checkItems have descriptions)
  order: number;
  type?: 'standard' | 'check' | 'multicheck' | 'export-excel' | 'dynamic-list' | 'detail-list' | 'form';  // Default: 'standard'
  checkItem?: CheckItemYAML;            // For type='check' (single checkbox)
  checkItems?: CheckItemYAML[];         // For type='multicheck' (multiple checkboxes)
  references?: Reference[];
  evidence: EvidenceConfig;
  dependencies?: string[];
  dynamicLinks?: DynamicLinkYAML[];     // Task-level dynamic links
  exportConfig?: ExportExcelConfig;     // For type='export-excel'
  listConfig?: DynamicListConfig;       // For type='dynamic-list'
  detailConfig?: DetailListConfig;      // For type='detail-list'
  formConfig?: FormConfig;              // For type='form'
}

export interface ExportExcelConfig {
  templatePath: string;                 // Path to Excel template
  outputFilename?: string;              // Custom filename pattern
  autoDownload?: boolean;               // Auto-download on task completion (default: true)
}

export interface DynamicListConfig {
  label: string;                        // Label for each item (e.g., "Repositorio", "Componente")
  placeholder?: string;                 // Placeholder text for input
  minItems?: number;                    // Minimum required items (default: 1)
  maxItems?: number;                    // Maximum allowed items (default: unlimited)
  allowDuplicates?: boolean;            // Allow duplicate values (default: false)
  separators?: string[];                // Separators for parsing (default: [",", ";", "\n"])
  trimItems?: boolean;                  // Trim whitespace from items (default: true)
}

export interface DetailListConfig {
  sourceTaskId: string;                 // ID of the dynamic-list task to reference
  placeholder?: string;                 // Placeholder text for detail input (supports {item} variable)
  maxLength?: number;                   // Max length for each detail text
}

export interface ListItem {
  id: string;
  value: string;
  addedAt: string;                      // ISO timestamp
}

export interface DetailItem {
  sourceItem: string;                   // The item from the source task
  capturedText: string;                 // The captured detail text
  addedAt: string;                      // ISO timestamp
}

// ============================================
// Form Task Types
// ============================================

export type FieldType = 'text' | 'number' | 'email' | 'date' | 'time' | 'datetime' | 'boolean' | 'textarea' | 'image' | 'select';

export type FormLayoutType = 'vertical' | 'grid';
export type FormGapSize = 'small' | 'medium' | 'large';

export interface FormLayoutConfig {
  type: FormLayoutType;
  columns?: number;  // 1-4 for grid
  gap?: FormGapSize;
}

export interface FormFieldConfig {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  defaultValue?: any;
  options?: string[];
  maxImages?: number;
  colSpan?: number;  // 1-4, how many columns the field occupies
  description?: string;
  descriptionCell?: string;  // Excel cell reference for label (e.g., "F85-1" for F85 row offset -1)
  valueCell?: string;      // Excel cell reference for value (e.g., "F85")
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface FormConfig {
  layout: FormLayoutConfig;
  fields: FormFieldConfig[];
}

export interface FormFieldValue {
  fieldId: string;
  value: any;
  filledAt: string;
}

export interface CheckItemYAML {
  id?: string;                          // Optional for 'check', required for 'multicheck'
  description: string;                  // Always required
  required: boolean;                    // true = mandatory, false = optional
}

export interface Reference {
  label: string;
  url: string;
}

export interface EvidenceConfig {
  type: 'text' | 'image' | 'both' | 'form' | 'none';
  required: boolean;
  description?: string;
}

// ============================================
// Time Tracking Types
// ============================================

export interface WorkSession {
  id: string;
  startedAt: string;           // ISO timestamp
  endedAt?: string;            // ISO timestamp (when paused or completed)
  duration: number;            // Duration in ms for this session
}

export interface ProcessTimeTracking {
  status: 'idle' | 'running' | 'paused' | 'completed';
  firstStartedAt?: string;     // First time process was started
  sessions: WorkSession[];     // History of work sessions
  totalActiveTime: number;     // Total accumulated active time (ms)
  currentSessionStart?: string; // Start of current running session
}

// ============================================
// Process Author (User Identity)
// ============================================

export interface ProcessAuthor {
  name: string;           // Hero name or custom name
  avatarId: string;      // Marvel hero ID (e.g. 'iron-man')
  isCustom: boolean;     // true = user entered custom name, false = random hero
  capturedAt: string;    // ISO timestamp when author was captured
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
  estimatedTime?: number;                        // Estimated time in milliseconds
  phases: PhaseState[];
  subprocesses: SubprocessState[];             // External process references
  variableDefinitions: ProcessVariableYAML[];  // Variable definitions from YAML
  capturedVariables: CapturedVariables;        // User-captured values
  timeTracking: ProcessTimeTracking;           // Process time tracking
  author?: ProcessAuthor;                       // Optional: who executed the process
}

export interface PhaseState {
  id: string;
  name: string;
  description: string;
  order: number;
  progress: number;
  activities: ActivityState[];        // Intermediate level
  tasks: TaskState[];                 // Direct tasks (legacy support)
  dynamicLinks: DynamicLinkYAML[];    // Phase-level dynamic links
}

export interface ActivityState {
  id: string;
  name: string;
  description: string;
  order: number;
  progress: number;
  tasks: TaskState[];
  dynamicLinks: DynamicLinkYAML[];    // Activity-level dynamic links
  images: ActivityImageYAML[];        // Illustrations/diagrams
}

export interface SubprocessState {
  id: string;
  name: string;
  order: number;
  source: SubprocessSource;
  variables: Record<string, string>;
  optional: boolean;
  status: 'pending' | 'loading' | 'loaded' | 'error' | 'skipped';
  loadedProcess?: ProcessState;       // Loaded external process
  error?: string;
}

export interface TaskState {
  id: string;
  name: string;
  description: string;
  order: number;
  type: 'standard' | 'check' | 'multicheck' | 'export-excel' | 'dynamic-list' | 'detail-list' | 'form';  // Task type
  checkItems: CheckItemState[];       // Empty for 'standard', 1 for 'check', N for 'multicheck'
  references: Reference[];
  evidenceConfig: EvidenceConfig;
  dependencies: string[];
  completed: boolean;
  completedAt?: string;
  evidence: TaskEvidence;
  isBlocked: boolean;
  dynamicLinks: DynamicLinkYAML[];  // Task-level dynamic links
  exportConfig?: ExportExcelConfig; // For type='export-excel'
  listConfig?: DynamicListConfig;   // For type='dynamic-list'
  listData?: ListItem[];            // Captured list items for 'dynamic-list'
  detailConfig?: DetailListConfig;  // For type='detail-list'
  detailData?: DetailItem[];        // Captured detail items for 'detail-list'
  formConfig?: FormConfig;          // For type='form'
  formData?: FormFieldValue[];      // Captured form field values for 'form'
}

export interface CheckItemState {
  id: string;
  description: string;
  required: boolean;
  checked: boolean;
  checkedAt?: string;
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
  source: 'file' | 'url' | 'clipboard';  // Added clipboard support
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
    author?: ProcessAuthor;      // Optional: who executed the process
    phases: PhaseExport[];
  };
}

export interface PhaseExport {
  id: string;
  name: string;
  description: string;
  order: number;
  progress: number;
  activities: ActivityExport[];       // Intermediate level
  tasks: TaskExport[];                // Direct tasks (legacy)
}

export interface ActivityExport {
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
  type: 'standard' | 'check' | 'multicheck' | 'export-excel' | 'dynamic-list' | 'detail-list' | 'form';
  checkItems: CheckItemState[];
  completed: boolean;
  completedAt?: string;
  evidence: {
    text?: string;
    images: {
      name: string;
      data: string; // base64
      source: 'file' | 'url' | 'clipboard';
      originalUrl?: string;
    }[];
  };
  references: Reference[];
  dependencies: string[];
  dynamicLinks: DynamicLinkYAML[];
  evidenceConfig: EvidenceConfig;
  exportConfig?: ExportExcelConfig;
  listConfig?: DynamicListConfig;
  listData?: ListItem[];
  detailConfig?: DetailListConfig;
  detailData?: DetailItem[];
  formConfig?: FormConfig;
  formData?: FormFieldValue[];
}
