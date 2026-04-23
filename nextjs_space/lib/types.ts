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
  options?: string[];        // For type: 'select' (static)
  optionsFrom?: string;      // For type: 'select' (dynamic): key of capturedVariable holding a list
  defaultValue?: string;
}

export interface CapturedVariables {
  [key: string]: string | string[];
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
    estimatedTime?: string;             // Human-readable duration ("45m", "1h30m", "4h")
    variables?: ProcessVariableYAML[];  // Global process variables
    phases: PhaseYAML[];
    subprocesses?: SubprocessYAML[];    // External process references (optional)
    export?: ProcessExportConfig;       // Declarative Excel export configuration
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

export type CompletionAlertSeverity = 'info' | 'warning' | 'critical';

// ============================================
// Task Output Variables
// ============================================

/**
 * Declares that a task produces a named output variable upon completion.
 * The output is written to `capturedVariables` so other tasks/variables can consume it.
 */
export interface TaskOutputVar {
  name: string;                       // Variable name in capturedVariables
  type: 'text' | 'list' | 'object';   // Output shape
  source: string;                     // TaskState field path: "listData", "evidence.text", "formData", etc.
  mapTo?: string;                     // For list type: property to extract from each item (e.g., "value" from ListItem)
}

/**
 * Optional confirmation dialog shown before a task is finalized.
 * When a task declares `completionAlert`, clicking to complete opens a modal
 * asking the user to confirm. Cancel keeps the task in its previous state.
 * The severity drives the icon, color palette and visual emphasis.
 * See docs/features/completion-alerts-and-decision-tasks.md.
 */
export interface CompletionAlertConfig {
  severity?: CompletionAlertSeverity;   // Default: 'info'
  title?: string;                       // Default: `Confirmar: ${task.name}`
  description: string;                  // REQUIRED: main alert body
  confirmLabel?: string;                // Default: i18n 'common.confirm'
  cancelLabel?: string;                 // Default: i18n 'common.cancel'
}

export interface TaskYAML {
  id: string;
  name: string;
  description?: string;                 // Optional for check/multicheck (checkItems have descriptions)
  order: number;
  type?: 'standard' | 'check' | 'multicheck' | 'export-excel' | 'dynamic-list' | 'detail-list' | 'detail-table' | 'form';  // Default: 'standard'
  checkItem?: CheckItemYAML;            // For type='check' (single checkbox)
  checkItems?: CheckItemYAML[];         // For type='multicheck' (multiple checkboxes)
  references?: Reference[];
  evidence: EvidenceConfig;
  dependencies?: string[];
  dynamicLinks?: DynamicLinkYAML[];     // Task-level dynamic links
  exportConfig?: ExportExcelConfig;     // For type='export-excel'
  listConfig?: DynamicListConfig;       // For type='dynamic-list'
  detailConfig?: DetailListConfig;      // For type='detail-list'
  detailTableConfig?: DetailTableConfig; // For type='detail-table'
  formConfig?: FormConfig;              // For type='form'
  completionAlert?: CompletionAlertConfig;  // Optional confirmation dialog before finalize
  outputVars?: TaskOutputVar[];             // Optional: task produces named output variables
}

export interface ExportExcelConfig {
  templatePath?: string;                // Path to Excel template (optional if process.export is defined)
  outputFilename?: string;              // Custom filename pattern (supports {today:FMT}, {process.name}, {vars.xxx})
  autoDownload?: boolean;               // Auto-download on task completion (default: true)
  mappings?: ProcessExportMappings;     // Optional task-level override of declarative mappings
  inherit?: boolean;                    // If true, inherit from process.export (default: true when process.export exists)
}

// ============================================
// Declarative Export Engine (process.export)
// ============================================

// Generic cell reference (e.g., "F85", "AA10")
export type CellRef = string;

export interface ExportTaskListSource {
  kind: 'list';
  sourceTaskId: string;               // id of a dynamic-list task
  column: string;                     // e.g., "F"
  startRow: number;
  endRow?: number;                    // optional; if omitted uses maxItems
  maxItems?: number;
}

export interface ExportTaskDetailSource {
  kind: 'detail';
  sourceTaskId: string;               // id of a detail-list task
  sections: Array<{
    column: string;
    startRow: number;
    endRow?: number;
    maxItems?: number;
  }>;
}

export interface ExportTaskFormSource {
  kind: 'form';
  sourceTaskId: string;               // id of a form task; uses each field.valueCell
}

export interface ExportTaskChecklistSource {
  kind: 'checklist';
  sourceTaskId?: string;              // if omitted, collects all tasks in process
  startRow: number;
  maxRows?: number;
  columns: {
    aplica?: string;
    validado?: string;
    url?: string;
    nombre?: string;
  };
}

export interface ExportTaskDetailTableSource {
  kind: 'detail-table';
  sourceTaskId: string;               // id of a detail-table task
  startRow: number;                   // first row in Excel where data starts
  columns: Record<string, string>;    // column id -> Excel column letter (e.g., { integracionMaster: "L" })
  maxRows?: number;                  // optional cap
}

export interface ExportTaskCellFieldMapping {
  field: string;                      // dot-notation path: "evidence.text", "checkItems.<id>.checked", "completedAt"
  cell: CellRef;                      // target cell: "B100", "J50"
}

export interface ExportTaskCellSource {
  kind: 'cell';
  sourceTaskId: string;               // id of any task type
  fields: ExportTaskCellFieldMapping[]; // field-to-cell mappings
}

export type ExportTaskSource =
  | ExportTaskListSource
  | ExportTaskDetailSource
  | ExportTaskFormSource
  | ExportTaskChecklistSource
  | ExportTaskDetailTableSource
  | ExportTaskCellSource;

// --- Sheet-level source kinds (non-task) ---

export interface ExportVariablesSource {
  kind: 'variables';
  mapping: Record<string, CellRef>;    // { torre: "F3", nombreProyecto: "F4" }
}

export interface ExportStaticSource {
  kind: 'static';
  cells: Record<CellRef, string | number | boolean>;  // { "A1": "Reporte", "B1": 42 }
}

export interface ExportTimeSource {
  kind: 'time';
  today?: CellRef;
  startedAt?: CellRef;
  completedAt?: CellRef;
  totalElapsedMinutes?: CellRef;
  totalElapsedHours?: CellRef;
}

export interface ExportProcessSource {
  kind: 'process';
  id?: CellRef;
  name?: CellRef;
  version?: CellRef;
}

export interface ExportCommentsSource {
  kind: 'comments';
  cell: CellRef;
  template?: string;                  // supports tokens like {process.name}, {vars.xxx}
}

export interface ExportRangeSource {
  kind: 'range';
  range: string;                      // Excel range notation: "H46:L46", "A1:A10"
  outputVar: string;                  // Variable name in capturedVariables to store result
  flatten?: boolean;                  // true = string[] (single row), false = string[][] (matrix)
}

// Union of all source kinds (sheet-level + task-driven)
export type ExportSource =
  | ExportVariablesSource
  | ExportStaticSource
  | ExportTimeSource
  | ExportProcessSource
  | ExportCommentsSource
  | ExportRangeSource
  | ExportTaskListSource
  | ExportTaskDetailSource
  | ExportTaskFormSource
  | ExportTaskChecklistSource
  | ExportTaskDetailTableSource
  | ExportTaskCellSource;

// A sheet section: groups sources that write to the same worksheet
export interface ExportSheetSection {
  sheet: string;                       // Worksheet name in the template
  sources?: ExportSource[];            // Data sources for this sheet
  // Log-mode fields (for sheets that record completed tasks)
  startRow?: number;
  timestampColumn?: string;
  nameColumn?: string;
  maxRows?: number;
}

export interface ProcessExportMappings {
  sheets: ExportSheetSection[];
}

export interface ProcessExportConfig {
  templatePath: string;               // URL to template (e.g. "/templates/foo.xlsx")
  templateVersion?: string;
  templateSha256?: string;            // optional integrity hash
  outputFilename?: string;            // token-interpolated pattern
  autoDownload?: boolean;             // default true
  mappings?: ProcessExportMappings;
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
// Detail Table Types (structured per-item table)
// ============================================

export type DetailTableColumnType = 'boolean' | 'date' | 'list' | 'text' | 'computed-text';

export interface DetailTableColumn {
  id: string;                           // Unique column identifier
  label: string;                        // Column header label
  type: DetailTableColumnType;          // Cell type
  required?: boolean;                   // Whether the field is mandatory
  placeholder?: string;                 // Placeholder for text fields
  options?: string[];                   // Options for type='list'
  template?: string;                    // Template for type='computed-text' (supports {vars.xxx}, {item})
  maxLength?: number;                   // Max length for text fields
}

export interface DetailTableConfig {
  sourceTaskId?: string;                // ID of the dynamic-list task to reference
  sourceVar?: string;                   // Alternative: key of capturedVariable holding a list
  columns: DetailTableColumn[];         // Column definitions
}

export interface DetailTableRow {
  sourceItem: string;                   // The item from the source task (e.g., repo name)
  values: Record<string, any>;          // Column values keyed by column id
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
  export?: ProcessExportConfig;                 // Declarative Excel export configuration
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
  type: 'standard' | 'check' | 'multicheck' | 'export-excel' | 'dynamic-list' | 'detail-list' | 'detail-table' | 'form';  // Task type
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
  detailTableConfig?: DetailTableConfig; // For type='detail-table'
  detailTableData?: DetailTableRow[];    // Captured table rows for 'detail-table'
  formConfig?: FormConfig;          // For type='form'
  formData?: FormFieldValue[];      // Captured form field values for 'form'
  completionAlert?: CompletionAlertConfig;  // Optional confirmation dialog before finalize
  outputVars?: TaskOutputVar[];             // Optional: task produces named output variables
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
  type: 'standard' | 'check' | 'multicheck' | 'export-excel' | 'dynamic-list' | 'detail-list' | 'detail-table' | 'form';
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
  detailTableConfig?: DetailTableConfig;
  detailTableData?: DetailTableRow[];
  formConfig?: FormConfig;
  formData?: FormFieldValue[];
  outputVars?: TaskOutputVar[];
}
