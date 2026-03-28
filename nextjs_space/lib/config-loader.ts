import { 
  DevOpsConfig, 
  ConfigSelectOptions, 
  ConfigAutoFillValues,
  CloudCluster 
} from './devops-config-types';

/**
 * Parsea y valida un archivo JSON de configuración DevOps
 */
export function parseDevOpsConfig(content: string): DevOpsConfig {
  const config = JSON.parse(content) as DevOpsConfig;
  
  // Validación básica
  if (!config.version) {
    throw new Error('El archivo de configuración debe tener una versión');
  }
  
  if (!config.azureDevOps?.organization) {
    throw new Error('La configuración debe incluir azureDevOps.organization');
  }
  
  return config;
}

/**
 * Extrae todas las opciones de select disponibles desde la configuración
 */
export function getSelectOptionsFromConfig(config: DevOpsConfig): ConfigSelectOptions {
  // Combinar clusters de todos los proveedores
  const allClusters: string[] = [
    ...(config.aws?.clusters?.map((c: CloudCluster) => c.name) || []),
    ...(config.gcp?.clusters?.map((c: CloudCluster) => c.name) || []),
    ...(config.azure?.clusters?.map((c: CloudCluster) => c.name) || []),
  ];

  // Combinar regiones de todos los proveedores
  const allRegions: string[] = [
    ...(config.aws?.regions || []),
    ...(config.gcp?.regions || []),
    ...(config.azure?.regions || []),
  ];

  return {
    projects: config.azureDevOps?.projects || [],
    repositories: config.azureDevOps?.repositories || [],
    environments: config.azureDevOps?.environments || [],
    pipelines: config.azureDevOps?.pipelines || [],
    clusters: [...new Set(allClusters)], // Eliminar duplicados
    namespaces: config.namespaces || [],
    regions: [...new Set(allRegions)],
    artifactRegistries: config.artifactRegistries || [],
    jiraProjectKeys: config.jira?.projectKeys || [],
    resourceGroups: config.azure?.resourceGroups || [],
    s3Buckets: config.aws?.s3Buckets || [],
    gcsBuckets: config.gcp?.gcsBuckets || [],
  };
}

/**
 * Extrae los valores por defecto para auto-fill
 */
export function getAutoFillValuesFromConfig(config: DevOpsConfig): ConfigAutoFillValues {
  return {
    organization: config.azureDevOps?.organization || '',
    engineerName: config.engineer?.name || '',
    engineerEmail: config.engineer?.email || '',
    project: config.defaults?.project || '',
    repository: config.defaults?.repository || '',
    environment: config.defaults?.environment || '',
    targetBranch: config.defaults?.targetBranch || '',
    cluster: config.defaults?.cluster || '',
    namespace: config.defaults?.namespace || '',
    artifactRegistry: config.defaults?.artifactRegistry || '',
  };
}

/**
 * Mapea una variable de proceso a su valor desde la configuración
 * Retorna el valor si existe, o undefined si no se puede mapear
 */
export function mapVariableToConfigValue(
  variableKey: string,
  config: DevOpsConfig
): string | undefined {
  const autoFill = getAutoFillValuesFromConfig(config);
  
  const mappings: Record<string, string | undefined> = {
    // Variables comunes
    'organization': autoFill.organization,
    'org': autoFill.organization,
    'engineerName': autoFill.engineerName,
    'engineer': autoFill.engineerName,
    'email': autoFill.engineerEmail,
    
    // Proyecto y repositorio
    'project': autoFill.project,
    'projectId': autoFill.project,
    'repository': autoFill.repository,
    'repo': autoFill.repository,
    
    // Ambiente y branch
    'environment': autoFill.environment,
    'env': autoFill.environment,
    'targetBranch': autoFill.targetBranch,
    'branch': autoFill.targetBranch,
    
    // Infraestructura
    'cluster': autoFill.cluster,
    'clusterName': autoFill.cluster,
    'namespace': autoFill.namespace,
    'artifactRegistry': autoFill.artifactRegistry,
    'registry': autoFill.artifactRegistry,
  };
  
  return mappings[variableKey];
}

/**
 * Obtiene las opciones de select para una variable específica
 * Retorna un array de opciones si la variable puede usar select desde config
 */
export function getSelectOptionsForVariable(
  variableKey: string,
  config: DevOpsConfig
): string[] | undefined {
  const options = getSelectOptionsFromConfig(config);
  
  const mappings: Record<string, string[] | undefined> = {
    // Proyectos y repos
    'project': options.projects,
    'projectId': options.projects,
    'repository': options.repositories,
    'repo': options.repositories,
    
    // Ambientes
    'environment': options.environments,
    'env': options.environments,
    
    // Pipelines
    'pipeline': options.pipelines,
    'pipelineName': options.pipelines,
    
    // Clusters y namespaces
    'cluster': options.clusters,
    'clusterName': options.clusters,
    'namespace': options.namespaces,
    
    // Regiones
    'region': options.regions,
    
    // Registries
    'artifactRegistry': options.artifactRegistries,
    'registry': options.artifactRegistries,
    
    // Jira
    'jiraProjectKey': options.jiraProjectKeys,
    'jiraProject': options.jiraProjectKeys,
    
    // Azure
    'resourceGroup': options.resourceGroups,
    
    // AWS
    's3Bucket': options.s3Buckets,
    
    // GCP
    'gcsBucket': options.gcsBuckets,
  };
  
  return mappings[variableKey];
}

/**
 * Valida que la configuración tenga los campos mínimos requeridos
 */
export function validateConfig(config: DevOpsConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.version) {
    errors.push('Falta el campo "version"');
  }
  
  if (!config.engineer?.name) {
    errors.push('Falta el campo "engineer.name"');
  }
  
  if (!config.azureDevOps?.organization) {
    errors.push('Falta el campo "azureDevOps.organization"');
  }
  
  if (!config.azureDevOps?.projects?.length) {
    errors.push('Falta el campo "azureDevOps.projects" o está vacío');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Tipo parcial para el template generado (sin campos obligatorios)
 */
type ConfigTemplate = {
  version: string;
  engineer: { name: string; email: string };
  azureDevOps: {
    organization: string;
    pat?: string;
    projects: string[];
    repositories: string[];
    environments: string[];
    pipelines: string[];
  };
  aws?: {
    accountId: string;
    regions: string[];
    clusters: { name: string; region: string; environment: string }[];
    ecrRepositories: string[];
    s3Buckets: string[];
  };
  gcp?: {
    projects: { id: string; name: string }[];
    regions: string[];
    clusters: { name: string; project: string; region: string; environment: string }[];
    gcrRepositories: string[];
    gcsBuckets: string[];
  };
  azure?: {
    subscriptionId: string;
    resourceGroups: string[];
    regions: string[];
    clusters: { name: string; resourceGroup: string; region: string; environment: string }[];
    acrRepositories: string[];
  };
  jira?: {
    baseUrl: string;
    projectKeys: string[];
  };
  namespaces: string[];
  artifactRegistries: string[];
  defaults: {
    project?: string;
    repository?: string;
    environment?: string;
    targetBranch?: string;
    cluster?: string;
    namespace?: string;
  };
};

/**
 * Genera un template de configuración basado en las variables del proceso
 */
export function generateConfigTemplate(
  variables: { key: string; label: string; type: string; options?: string[] }[],
  processName: string
): ConfigTemplate {
  const variableKeys = variables.map(v => v.key.toLowerCase());
  
  // Determinar qué secciones incluir basándose en las variables
  const needsProjects = variableKeys.some(k => ['project', 'projectid'].includes(k));
  const needsRepos = variableKeys.some(k => ['repository', 'repo'].includes(k));
  const needsEnvironments = variableKeys.some(k => ['environment', 'env'].includes(k));
  const needsPipelines = variableKeys.some(k => ['pipeline', 'pipelinename'].includes(k));
  const needsClusters = variableKeys.some(k => ['cluster', 'clustername'].includes(k));
  const needsNamespaces = variableKeys.some(k => ['namespace'].includes(k));
  const needsRegistries = variableKeys.some(k => ['artifactregistry', 'registry'].includes(k));
  const needsRegions = variableKeys.some(k => ['region'].includes(k));
  const needsJira = variableKeys.some(k => ['jiraprojectkey', 'jiraproject'].includes(k));
  const needsBranch = variableKeys.some(k => ['targetbranch', 'branch', 'sourcebranch'].includes(k));
  
  const template: ConfigTemplate = {
    version: "1.0.0",
    engineer: {
      name: "<TU_NOMBRE>",
      email: "<TU_EMAIL>@empresa.com"
    },
    azureDevOps: {
      organization: "<TU_ORGANIZACION>",
      pat: "<TU_PAT_OPCIONAL>",
      projects: needsProjects ? ["proyecto-principal", "proyecto-secundario"] : [],
      repositories: needsRepos ? ["backend-api", "frontend-app", "infrastructure"] : [],
      environments: needsEnvironments ? ["development", "staging", "uat", "production"] : [],
      pipelines: needsPipelines ? ["CI-Build", "CD-Deploy", "Security-Scan"] : []
    },
    namespaces: needsNamespaces ? ["default", "backend", "frontend", "monitoring"] : [],
    artifactRegistries: needsRegistries ? ["acr-production", "ecr-main"] : [],
    defaults: {
      project: needsProjects ? "proyecto-principal" : undefined,
      repository: needsRepos ? "backend-api" : undefined,
      environment: needsEnvironments ? "staging" : undefined,
      cluster: needsClusters ? "aks-production" : undefined,
      namespace: needsNamespaces ? "default" : undefined,
      targetBranch: needsBranch ? "main" : undefined
    }
  };
  
  // Agregar secciones de cloud si se necesitan clusters o regiones
  if (needsClusters || needsRegions) {
    template.aws = {
      accountId: "<AWS_ACCOUNT_ID>",
      regions: ["us-east-1", "us-west-2"],
      clusters: [
        { name: "eks-production", region: "us-east-1", environment: "production" },
        { name: "eks-staging", region: "us-west-2", environment: "staging" }
      ],
      ecrRepositories: ["ecr-apps", "ecr-base-images"],
      s3Buckets: ["artifacts-bucket", "logs-bucket"]
    };
    
    template.gcp = {
      projects: [
        { id: "gcp-project-prod", name: "Producción" },
        { id: "gcp-project-dev", name: "Desarrollo" }
      ],
      regions: ["us-central1", "us-east1"],
      clusters: [
        { name: "gke-production", project: "gcp-project-prod", region: "us-central1", environment: "production" }
      ],
      gcrRepositories: ["gcr-apps"],
      gcsBuckets: ["gcs-artifacts", "gcs-backups"]
    };
    
    template.azure = {
      subscriptionId: "<AZURE_SUBSCRIPTION_ID>",
      resourceGroups: ["rg-production", "rg-staging", "rg-development"],
      regions: ["eastus", "westus2"],
      clusters: [
        { name: "aks-production", resourceGroup: "rg-production", region: "eastus", environment: "production" },
        { name: "aks-staging", resourceGroup: "rg-staging", region: "eastus", environment: "staging" }
      ],
      acrRepositories: ["acr-production", "acr-staging"]
    };
  }
  
  // Agregar Jira si se necesita
  if (needsJira) {
    template.jira = {
      baseUrl: "https://tu-empresa.atlassian.net",
      projectKeys: ["PROJ", "DEV", "OPS"]
    };
  }
  
  return template;
}

/**
 * Descarga el template de configuración como archivo JSON
 */
export function downloadConfigTemplate(
  variables: { key: string; label: string; type: string; options?: string[] }[],
  processName: string
): void {
  const template = generateConfigTemplate(variables, processName);
  const jsonString = JSON.stringify(template, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `devops-config-${processName.toLowerCase().replace(/\s+/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
