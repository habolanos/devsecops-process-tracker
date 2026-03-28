// Tipos para configuración DevOps
// Permite cargar configuración desde archivo JSON para auto-fill de variables

export interface DevOpsEngineer {
  name: string;
  email: string;
}

export interface AzureDevOpsConfig {
  organization: string;
  pat: string;
  projects: string[];
  repositories: string[];
  environments: string[];
  pipelines: string[];
}

export interface CloudCluster {
  name: string;
  region: string;
  environment: string;
  resourceGroup?: string; // Azure
  project?: string; // GCP
}

export interface AWSConfig {
  accountId: string;
  regions: string[];
  clusters: CloudCluster[];
  ecrRepositories: string[];
  s3Buckets: string[];
}

export interface GCPProject {
  id: string;
  name: string;
}

export interface GCPConfig {
  projects: GCPProject[];
  regions: string[];
  clusters: CloudCluster[];
  gcrRepositories: string[];
  gcsBuckets: string[];
}

export interface AzureConfig {
  subscriptionId: string;
  resourceGroups: string[];
  regions: string[];
  clusters: CloudCluster[];
  acrRepositories: string[];
}

export interface JiraConfig {
  baseUrl: string;
  projectKeys: string[];
}

export interface DevOpsDefaults {
  project: string;
  repository: string;
  environment: string;
  targetBranch: string;
  cloudProvider: 'azure' | 'aws' | 'gcp';
  cluster: string;
  namespace: string;
  artifactRegistry: string;
}

export interface DevOpsConfig {
  version: string;
  engineer: DevOpsEngineer;
  azureDevOps: AzureDevOpsConfig;
  aws: AWSConfig;
  gcp: GCPConfig;
  azure: AzureConfig;
  namespaces: string[];
  artifactRegistries: string[];
  jira: JiraConfig;
  defaults: DevOpsDefaults;
}

// Tipo para las opciones de select generadas desde la config
export interface ConfigSelectOptions {
  projects: string[];
  repositories: string[];
  environments: string[];
  pipelines: string[];
  clusters: string[];
  namespaces: string[];
  regions: string[];
  artifactRegistries: string[];
  jiraProjectKeys: string[];
  resourceGroups: string[];
  s3Buckets: string[];
  gcsBuckets: string[];
}

// Tipo para valores auto-fill desde la config
export interface ConfigAutoFillValues {
  organization: string;
  engineerName: string;
  engineerEmail: string;
  project: string;
  repository: string;
  environment: string;
  targetBranch: string;
  cluster: string;
  namespace: string;
  artifactRegistry: string;
}

// Estado de la configuración en el store
export interface DevOpsConfigState {
  config: DevOpsConfig | null;
  isLoaded: boolean;
  loadedAt: string | null;
  fileName: string | null;
}
